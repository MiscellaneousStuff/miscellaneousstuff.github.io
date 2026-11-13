---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 4 - Brokenwings: 5v5)"
excerpt: "Now we train 5v5 agents Brokenwings"
date:   2026-11-13 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "fastsim", "mech interp"]
first5v5youtubeid: gVDy2AMqbe4
---

## Table of Contents

* TOC
{:toc}

## Overview

In the [last](https://miscellaneousstuff.github.io/2026/11/04/superhuman-league-of-legends-part-3-live.html) post,
we focused on porting our findings from Brokenwings to modern League of Legends (patch 26.19). We managed to create
a faster than real-time simulator for League of Legends which had similar throughput to OpenAI Five.

Now we want to graduate up to full 5v5 games. However before porting over more of modern League of Legends to our
gameserver, we instead want to validate two things:
1. Scaling up fastsim to the full 5v5 game mode
2. Determining if our current RL methods can handle the full 5v5 game mode given that its game-tree complexity
is far higher than a simple mid lane Ezreal 1v1

## Why are we going back to Brokenwings?

At this stage we're confident we can train 1v1 agents, it's just a matter of compute and time. However, have
we actually tested our core hypothesis yet? Do we have any idea how much compute is required to train 5v5 agents
for League of Legends and do we know if our fastsim throughput gains hold for the full game, not just a 1v1
minigame involving a few minion waves, two champions and two towers?

To answer this, we're going back to brokenwings as it is a *faithful enough* implementation of the 2011 game server (patch 1.0.0.126)
and helps us answer our fundamental questions. Unlike the modern game server where we don't have the source
code, brokenwings is open source which means we don't have to worry about the additional overhead of validating
the fidelity of our game servers implementation. We only have to ensure that we've transpiled the existing game
server faithfully into a more efficient implementation.

This journey lead to three distinct phases...

## Phase 1: Making 5v5 fast

This stage involved making the 5v5 fastsim version of Brokenwings as fast as our GH200 hardware could possibly run.
In the end, here is how much each method improved environment throughput.

| Setup | Ticks/s | Decisions/s | Agent-steps/s | Game-years per day |
|---|---:|---:|---:|---:|
| Real time, 30 Hz, one game | 30 | 7.5 | 75 | 0.003 |
| C# server, step mode, one game | 735 | 184 | 1.8k | 0.07 |
| C# server, step mode, 64 games | 18.8k | 4.7k | 47k | 1.7 |
| Numba simulator (64 threads), 4,096 games | 313k | 78k | 783k | 29 |
| Rust engine (60 threads), 2,048 games | 560k | 140k | 1.4 M | 51 |

Note: The Rust row includes building observations and runs the later, heavier
game with items; like for like it is 4.3x Numba, as in the core table.

Per core (the simulators step 64 games on that core; the server runs one):

| One core, one 5v5 game | Ticks/s | Versus real time |
|---|---:|---:|
| Real time | 30 | 1× |
| C# server, step mode | 735 | 24× |
| Numba | 4.3k | 144× |
| Rust | 17.0k | 566× |

To start with, our fully working Brokenwings game server with our custom RL bridge could already run full games.
Using the same approach as OpenAI Five we were able to simulate games and hook them. However
this means our only speedup was running the game on more CPU cores, which to reach the same throughput as OpenAI
Five or AlphaStar would be incredibly expensive.

Earlier in September, we focused on speeding up the game server by stepping each game tick instead of running at 30hz.
This involved finding every line of code in the C# engine which relied on wall-clock time and instead setting it
to use the game server's per step provided time.

In the [last](https://miscellaneousstuff.github.io/2026/11/04/superhuman-league-of-legends-part-3-live.html) post
we ported enough of the game engine for an Ezreal 1v1 and when combined with our training infrastructure managed
to achieve up to 1.95M agent decisions per second.

Now we wanted to do this for the full 5v5 game and set a target of 24 hours for the initial port. With Brokenwings
original source code, we had a perfect oracle to validate behaviour exactly.

Our first approach
involved porting the game server to a python reference and creating the Numba implementation in parallel - by
directly transpiling functions from the C# game server and validating behaviour.

For context, Numba is a Python package which wraps Python source code and compiles it just-in-time (JIT)
into machine code using [LLVM](https://en.wikipedia.org/wiki/LLVM). This allows you to greatly improve
the performance of your Python code without fully translating it into another language.
Now the box simulates 10,400 seconds (~2:53 hrs) for one wall-clock second.

<!-- check refs and update appendix -->
In total we simulate 12 years worth of game play per day (during training) in contrast to OpenAI
Five's 180 years a day which means that we're ~15x off. However, they use 128,000 CPU cores
(likely vCPUs) whereas we use 64 GH200 neoverse v2 CPU cores.

### Profiling Numba and long compilation times

At this stage our simulator already achieved high throughput but we ran into new problems. Every time
we wanted to add new functionality to our Numba simulator, we were forced to re-compile the *entire* simulator
because recursion broke our cache. We fixed the cache by breaking recursion, which took a restart from 30 minutes
to 11 seconds but any big engine change still cost a full recompile.
Cold compilation took between 20-40 minutes per each change. During this
we also profiled the bottlenecks within the Numba fastsim itself:

| Level | Component | Share |
|---|---|---:|
| Environment | Engine | 94.8% |
| | Building observations | 4.8% |
| | Decoding actions | 0.4% |
| | Python glue | 0.15% |
| Inside the engine | **Numba reference counting** | **58.7%** |
| | Vision (turret bubbles the largest part) | 12.6% |
| | Collision and movement | 7.8% |
| | Pathfinding | 3.3% |
| | Spell scripts and buffs | 3.1% |
| | Minion AI | 2.6% |

One major step stands out, reference counting. This is used to track if arrays are still in use for garbage
collection. The issue with our fastsim is that the  whole game state lives in one
state object holding many arrays. Every time a function reads an array out of that object,
Numba increments a counter, and decrements it
when the function returns. Our hot helpers are tiny and called thousands of times a tick, so
the counting cost more than the work. And nothing was ever freed: the arrays live for the whole run.

### Rewrite it in Rust

Bottleneck: the compiler's bookkeeping. Lesson: *profile first; the rewrite was the conclusion, not the plan.*

"Rewrite it in Rust" is usually a punchline. Here the profile made the case for us as 59% of the engine was spent counting references to arrays that were never freed, and every attempt to fix that inside Numba cost a half-hour compile.

The Rust port re-used the Numba arrays for development speed and also reads and writes the same state arrays as the Numba engine and exposes one step function to Python, so everything around it stayed as it was, and Numba became the oracle. A lead agent spent 25 minutes on the groundwork: a generated description of the state layout, a rulebook for numerics (the same float32 operation order, no fused multiply-add, no fast-math), and a harness that steps both engines from the same recorded state and reports the first array, index and tick where they differ.

Then the engine was cut into nine families (navigation and vision, movement, casting, AI, rules, damage, the kit core, the scripting API, jungle and kits) with one translator agent each.

| | |
|---|---:|
| Functions translated | 871 |
| Lines of Rust | 16,300 |
| Time for the nine translators | ~35 minutes |
| Result | bit-identical to Numba on a 4,000-decision replay of the live policy |
| Speed on one core, same game | 4.3× Numba |

The speedup is larger than the 2.3× that removing reference counting alone would have given. With the counter updates gone,
the compiler could finally optimise the code around them. A rebuild after a change takes minutes rather than half an hour,
and an overnight tuning pass on the trainer took end-to-end training from 0.33M to about 1.2M agent-steps a second.
Now we could run 40–44 game-years a day on one box, against roughly 80 for OpenAI Five's Rerun on 51,200 cores.

### Why the simulator is fast

On the same 64-core GH200, the real C# game server manages about 2,500 decisions a second across the whole box, while fastsim, the Rust engine, sustains about 125,000 in training. Most of that gap is not faster arithmetic: the server gives every game its own process and talks to the policy in text, while fastsim keeps every game as rows in shared arrays and makes one call and one forward pass per decision for all of them.

<figure class="fig">
<div class="arch">
<div class="arch-server">
<div class="arch-name">Game server<span>one process per game, one conversation per decision</span></div>
<div class="arch-row">
<div class="arch-card many"><span class="tag">× 55 processes</span><b>C# game server</b>Every unit, buff and script is a heap object. Runs 4 ticks, then blocks.</div>
<div class="arch-link"><span>JSON text over TCP</span></div>
<div class="arch-card many"><span class="tag">× 55 clients</span><b>Python client</b>Parses the text into an observation, writes the actions back as text.</div>
<div class="arch-link"></div>
<div class="arch-card many"><span class="tag">CPU · 10 rows</span><b>Forward pass</b>One per game: the ten heroes of that game and nothing else.</div>
</div>
<div class="arch-foot"><span><b>≈ 22 ms</b> per decision, per game</span><span>≈ 2,500 decisions/s for the box</span></div>
</div>
<div class="arch-fast">
<div class="arch-name">Fastsim<span>every game is a row, one call steps them all</span></div>
<div class="arch-row">
<div class="arch-card"><span class="tag">× 4,096 games</span><b>Shared arrays</b>Games × units × fields, allocated once. Nothing allocated per tick.</div>
<div class="arch-link"><span>written in place</span></div>
<div class="arch-card"><span class="tag">× 60 threads</span><b>One Rust call</b>Per thread, per decision: decode actions, 4 ticks, write observations.</div>
<div class="arch-link"><span>one copy, 470 MB</span></div>
<div class="arch-card"><span class="tag">GPU · 40,960 rows</span><b>One forward pass</b>Every hero in every game at once, half precision, CUDA graph.</div>
</div>
<div class="arch-foot"><span><b>0.43 ms</b> engine time per decision, per game</span><span>≈ 125,000 decisions/s for the box</span></div>
</div>
</div>
<figcaption>One decision (four 33 ms engine ticks, all ten heroes acting) in each architecture, on the same 64-core GH200. <b>Game server:</b> each game is its own C# process, 55 of which fill the box; it allocates 0.7–2.1 MB of new objects a tick for the garbage collector and takes 3.1 ms a tick with the box full, 12.3 ms a decision. The state then goes as JSON text over a socket to one Python client per game, which spends 2.1 ms parsing it into an observation, 6.6 ms running the policy for ten heroes on a CPU core and 0.4 ms writing the actions back. Measured on 384 bot-benchmark games on 13 November. <b>Fastsim:</b> 4,096 games live as rows in flat arrays with fixed-size pools for minions and buffs, and each of 60 threads owns about 70 of them, so no game is shared. Observations land directly in one pinned buffer of 40,960 heroes × 2,914 values, go to the GPU in one copy, and come back as one action array of games × 10 × 4; the PPO update overlaps with the next rollout.</figcaption>
</figure>
<figure class="fig">
<div class="stat-row">
<div><span class="num">12.3 ms</span><span class="lbl">server engine time per decision, per game; 22 ms with the Python client</span></div>
<div><span class="num">0.43 ms</span><span class="lbl">fastsim engine time per decision, per game, all threads busy</span></div>
<div><span class="num">~50×</span><span class="lbl">decisions a second on the same box: 2,500 for the server, 125,000 for fastsim</span></div>
<div><span class="num">40,960</span><span class="lbl">rows in fastsim's one forward pass, against 10 per game on the server</span></div>
</div>
<figcaption>The same box, both ways. Server numbers are from 384 bot-benchmark games on 13 November with the policy on a CPU core; fastsim's are from training, where a rollout of 4,096 games × 64 decisions (262,144 decisions) takes about 2.1 s and the trainer logs 1.27M agent-steps a second. On an idle core fastsim's engine time drops to 0.24 ms.</figcaption>
</figure>
<figure class="fig">
<div class="barlist">
<div class="name">Real time<span>one game, 7.5 decisions/s</span></div>
<div class="track"><div class="bar" style="--w: 0.18%; --c: #a8a69e"></div><span class="val" style="--w: 0.18%">1×</span></div>
<div class="name">C# game server<span>one core</span></div>
<div class="track"><div class="bar" style="--w: 4.24%; --c: #eb6834"></div><span class="val" style="--w: 4.24%">24×</span></div>
<div class="name">numba simulator<span>one core</span></div>
<div class="track"><div class="bar" style="--w: 25.44%; --c: #86b6ef"></div><span class="val" style="--w: 25.44%">144×</span></div>
<div class="name">Rust fastsim<span>one core</span></div>
<div class="track"><div class="bar" style="--w: 100%"></div><span class="val" style="--w: 100%">566×</span></div>
</div>
<figcaption>Simulation speed on one core, as a multiple of real time for one game. Engine only, no policy. Measured whole-box numbers are wider apart, because the server's figure also pays for its Python client and text round trip: about 2,500 decisions a second with the policy in the loop, against 78,000 for the numba simulator (engine only; 64 threads, 4,096 games, an earlier version of the game without items) and 125,000 for the Rust engine in training (140,000 engine only, measured at 2,048 games).</figcaption>
</figure>

## Phase 2: Training 5v5 agents

<!--
Add context on selecting champs
-->

The setup is deliberately close to OpenAI Five's in June 2018, restrictions included.
Two fixed teams of five
(Ezreal, Garen, Ashe, Veigar, Malphite against Caitlyn, Warwick, Nunu, Master Yi, Ryze - [full reasoning here](https://miscellaneousstuff.github.io/2026/11/13/superhuman-league-of-legends-part-4-brokenwings-5v5.html#roster-selection)), no summoner spells, no
wards. One network drives all ten heroes, told apart by a champion one-hot.
Each hero sees about 2,900 numbers per
decision under fog of war and acts every 133 ms - 7.5 Hz. Training is PPO with an LSTM: 4,096 games at once, 64 decisions
per rollout, 2.6 million agent-steps per update, the two teams swapping sides every 1,200 rollouts.

<!-- ### Model and Training Setup -->

### It won't fight

<dl class="lesson"><dt>Bottleneck</dt><dd>what ends an episode</dd><dt class="l">Lesson</dt><dd>if doing nothing pays zero and fighting can pay less, self-play will do nothing.</dd></dl>

The first thing we ran on the new simulator was a smoke test. Both teams dropped next to each other in mid lane,
levels 6 to 11, with a 40-second cap. If ten heroes sharing one network could learn anything together, a team fight
seemed the fastest way to find out.

They learned something within the hour. At rollout 50 the games look like a team fight should as one side is wiped in
under 20 seconds, every round. By rollout 100 nearly half the games were running out the clock, and by rollout 150
all of them were. Kills per game went from six to zero, and the value loss fell to 0.001, because there was nothing
left to predict. A recording from rollout 375 shows one straggler being picked off and then ten heroes standing
apart in mid lane until time runs out.

<!-- FIGURE: the two clips side by side, rollout 50 (wipe in 14–19 s) and rollout 375 (standing apart) -->

<!-- CHART: share of games reaching the cap, and kills per game, against rollout 0–525. Two panels, shared x-axis. -->

Nothing was broken. The reward was zero-sum with shaping for health, so running out the clock paid exactly zero to
both teams. A fight paid about −1.3 per hero to whichever side had the weaker composition, and the two rosters are
far from equal: playing random actions, one of them wins 83% of the time. It takes two to fight, and in an open
lane the weaker side can always walk away. Not fighting is a Nash equilibrium of the reward we wrote, and PPO found
it in about 100 rollouts.

| | Weaker team engages | Weaker team avoids |
|---|---|---|
| **Stronger team engages** | fight: about −1.3 per hero for the weaker side | no fight: 0 for both |
| **Stronger team avoids** | no fight: 0 for both | no fight: 0 for both |

We tried to price the draw. A penalty of 1.0 for hitting the cap moved the draw rate from 100% to 88%. Doubling it
moved it back to 93%. A penalty only works on the weaker team once it exceeds what that team expects to lose by
fighting, and at that point we would be paying it to die.

This is the third time the series has met this equilibrium. In Part 2 the mirror match settled into a standoff with
both sides ending every episode on 188 HP. In Part 3, two equal Ezreals could always walk away, and the fix was a
wall around the arena. With ten heroes the fix is the game itself. We put minions in the lanes and towers behind them,
and standing still starts to lose. At 18:02 the same evening we stopped tuning the fight and switched to full games.

### It won't end

<dl class="lesson"><dt>Bottleneck</dt><dd>the clock: a 12-minute cap and a 27-second horizon</dd><dt class="l">Lesson</dt><dd>an agent can only learn to finish a game if the finish fits inside its episodes and its discount.</dd></dl>

Full games were supposed to make avoidance expensive. First they had to run. The game task trained at 0.04M
agent-steps a second, twenty times slower than the benchmark, and the cause was not the engine: a path across the
map costs about 100 times a local one, and an untrained policy orders them constantly. Limiting move targets to
1,500 units on the agent's side, with no change to any rule, took it to 0.2M, and three bit-identical engine fixes
took it to 0.33M.

Then they had to matter. Six-minute games from level 1 never saw a turret fall: at the first cap, all 4,096 games
ended with zero turrets down. So most games now start in the middle: 5 to 20 minutes in, heroes pre-levelled and
in lane, outer turrets already damaged. With the cap raised to 12 minutes, the first games in the project ended
with a nexus kill at 22:32 that night.

Almost none of the others did. 98% of games still hit the cap, and a reward audit showed what that meant:

| Share of the return | |
|---|---:|
| Economy (gold, XP, last hits) | 43% |
| Structures | 32% |
| Fights | 12% |
| Health and mana shaping | 12% |
| **Winning** | **0.5%** |

The policy was being paid to farm and push, and almost never to win. We tried paying capped games by structure
lead. At half the win reward the policy stopped fighting and sat on its leads: kills per game fell from 24 to 18
and the nexus rate halved. At 0.3 it fought again and kept most of the gain.

Two measurements then put the result in proportion. With idle heroes, the minion waves alone take 6.8 turrets a
game, so about 92% of the turrets we were crediting to the policy were falling anyway. And against heroes that do
nothing, the policy took the nexus in 98% of games given 30 minutes, and in 0% given the 12 it trained on. It could
finish. Its episodes never lasted long enough for it to be paid for finishing, and with γ = 0.995 at 7.5 decisions
a second, anything more than about 27 seconds away was worth nearly nothing to it anyway.

By rollout 6,750 the ladder had been flat for four hours. So we changed the clock: an 18-minute cap, a 67-second
horizon (γ = 0.998), a quarter of games starting as a siege with the base already open, damage to the nexus paid
directly, and the win reward doubled. The plateau broke within the hour. Nexus kills from a normal start went from
1–3% of games to 8%, and in a 24-minute matchup 30% of games were decided, against about 5% at 12 minutes.

More time, more finished games. It looked like a problem we could keep solving the same way.

### It farms, just as it was asked to...

### Recalling

### So how good are they?

## Phase 3: Why won't they end the game?

### The suspects

### Peering inside the agents

### The turn

### The culprits

### Before and after

### The payoff

## So where do we go from here?

As we're now able to train 5v5 agents on modest hardware, in the next part we will work on fully porting
10 champions on modern League of Legends for patch 26.19 and training 5v5 agents on the full game.

## Appendix

### Roster Selection

Brokenwings isn't a perfect implementation of the game, some existing champs are buggy or incomplete. We filtered down to 38 champions
that had their abilities implemented correctly and and associated behavioural tree script sourced from Riot's original season 1 lua files.
For our project we use the intermediate bot difficulty. Most League players will be familiar with these bots as you start learning the game
by playing against them. Virtually all experienced League players learn to consistently beat intermediate bots. We already implemented
Ezreal and Garen during the 1v1 phase and then selected 8 further champions based on champion kit diversity:
- Two ranged attackers: Ashe + Caitlyn
- Two mages: Veigar + Ryze
- Two melee tanks/fighters: Malphite + Warwick
- Two melee junglers: Nunu + Master Yi

They were then randomly composed into teams:
- Ezreal, Garen, Malphite, Veigar, Ashe
- Caitlyn, Warwick, Nunu, Master Yi, Ryze

For context we run the same roster against each other for simplicity throughout training by switch which side the roster is playing on.
We analysed which roster was stronger based on executing random legal actions for ~1400 games and found the roster with
`Caitlyn, Warwick, Nunu, Master Yi, Ryze` wins about 83% on either side. This motivated the need to swap the rosters throughout training.
However fixing the buff leak in the Rust fastsim moved the Ezreal side from 22% to 58% (Thu 12 Nov 15:56), so part of it was the simulator.

<!--
Short version: the record pins down how the pool was built and why Ezreal/Garen are in it, but I could not find a written sentence saying why the *other eight* were chosen. The planning turn where the roster was fixed (Sat 7 Nov, 16:36–16:46) isn't surfaced by search, bw_master's conversation dump for that window is too large for me to read here, and that session isn't in the transcript archive. What follows is what the record does support.
1. The 38-champion "clean pool" (Sat 7 Nov, 02:20–04:14)
Your memory is right: it was a stability test on the real server, before anything was ported.
-
tools/bots_5v5_fleet.py: 64 bots-only 5v5 games at once on the C# server, forced fights, 45-minute cap, three runs. From the November log (7 Nov section, written from the worker's record):
  > "Champion pool: 38 champions ran clean across all three runs (Morgana excluded after 4 script exceptions); 51 excluded (20 script exceptions, 3 silent bot trees, Olaf, 27 with no bot tree)."
-
Joe, 04:14: *"we have 38 champs we'll use for our 5v5 experiments"*. Committed as docs/5v5/champion_pool.json in d8e55a28 (the orchestrator thread, turn 1, 06:32: "d8e55a28 has a list of 38 champions that ran with no bugs").
-
Context for the exclusions, from the 09:10 "which base" analysis: brokenwings is a fan reimplementation with "22 stubbed primitives, 20 champions that throw, Olaf never dies, item hooks never exercised". So "clean" meant: the champion's scripts run a whole 45-minute bot game without a script exception, and it has a behaviour tree that actually acts.
-
A consequence that mattered later: because the pool was built from champions that *ran as bots*, every one of the ten has a real behaviour tree. bw_master confirmed this on Mon 9 Nov 09:41 (correcting its own 09:19 claim that only Garen/Malphite/Yi/Ryze had trees): all ten are in "the advanced set from the 1.0.0.141 leak, namespace 'all', about 60 champions… each with its own attack, threat, kill-champion, push-lane, level-up and item-purchase subtrees." That is what made the bot benchmark possible without changing champions.
2. Ezreal and Garen: already ported
They weren't chosen on 7 Nov; they were inherited. The September brokenwings 1v1 fastsim (archived session 7993d974, 22–23 Sep) built fastsim/champions.py with Ezreal (43 probes bit-identical) and Garen's kit ("melee AA, Q Decisive Strike…", 8 probes frame-exact, commit 160cc03d). In the 5v5 port they're described as "native" ("Ezreal and Garen are native", 8 Nov 10:29) — no K-agent wrote them; K5 only added 112 probes for them at 23:15 on the night, and the 7 Nov 23:12 reply notes they had "no per-spell probe set recorded on the frozen 5v5 server, unlike the other eight" until then.
3. The other eight: what the record shows
-
Fixed at 16:46 Sat 7 Nov in docs/5v5/port/PLAN_24H.md, as four kit lanes of two: K1 Ashe + Caitlyn, K2 Veigar + Ryze, K3 Malphite + Warwick, K4 Nunu + Master Yi. The pairs are by kit type (two ranged auto-attackers, two mages, two melee tank/fighters, two melee junglers), each a Python kit plus a numba kernel on its own probe set. GameInfo-5v5-port.json (S, 17:40) and CHAMP_NAMES in E's engine (18:30) carry the same ten.
-
All eight are in the 38 pool (the pool is the only champion list that existed before 16:36, so the roster was drawn from it).
-
Nothing I can find states the per-champion reasoning (e.g. kit simplicity, cast-type coverage, 2011 meta). I'm not going to invent one.
4. Two facts worth having in the paragraph
-
Composition imbalance was discovered, not designed (Sun 8 Nov 09:16, V's side-asymmetry test, random legal actions, ~1,400 games): normal rosters ORDER 0.140 / CHAOS 0.835; swapped ORDER 0.826 / CHAOS 0.144. "The Caitlyn/Warwick/Nunu/MasterYi/Ryze team wins about 83% on either side." That's why the roster swap every segment exists. It persisted in trained play: Thu 13 Nov 04:19 win-ladder, set B wins ~64% with either roster (v038400: 9% vs 67%); and the buff-leak fix moved the Ezreal side from 22% to 58% (Thu 12 Nov 15:56), so part of it was the simulator.
-
Lineage of the roster list: docs/5v5/champion_pool.json (38) → PLAN_24H.md (10) → GameInfo-5v5-port.json → CHAMP_NAMES. The 10 Nov #28 text keeps the door open: "Champions beyond the ten in the roster: the clean pool is 38, and each needs a kit port."
-->

### Training Log

Training used the same model weights from the start until the last checkpoint. The model architecture was extended to provide
the agents with additional inputs relating to items and allowing them to recall.

Neural network surgery used zero-padding to extend observations and action heads using the same method from [OpenAI Five](https://arxiv.org/pdf/1912.06719).

<!--
add surgery context
-->

| # | When (GMT) | From ckpt | Change | Why | Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | Sun 8 Nov 11:26 | v000000 | Fight task: both teams mid, levels 6–11, 40 s cap | smoke the port | Cap rate 2% (r50) → 47% (r100) → 100% (r150); kills 6 → 0; value loss → 0.001. Not fighting = Nash equilibrium of zero-sum + HP shaping (fight ≈ −1.3/hero). Also: 3 h 50 min idle gap (segment 2 never launched), OOM at nseq 4096 |
| 0b | 17:40 / 17:5x | v000375 / v000475 | Draw penalty 1.0, then 2.0 | price the draw | 100% → 88% → 93%. Abandoned |
| 1 | 18:02 | v000525 | **Random-start full game**, cap 2,700, γ 0.995 | make avoidance costly by construction | 0.04–0.09M agent-steps/s (cross-map A* ~100× a local path) |
| 1b | 18:54 | v000575 | env v1.1 1,500-unit target radius, actor CUDA graph, OMP=1 | speed | 0.15–0.21M |
| 1c | ~21:46 | — | v1.2 **tower-pressure starts** (age U(5,20) min, pre-levelled, outer turret HP 0.4–1), stagger | "6-min games from age 0 never let a turret fall": 0 turrets at the cap | — |
| 1d | 22:32 | pool ckpt | engine F1–F3 (2× on minion phase), **cap 5,400** | speed/length | 0.33M; **first nexus kills in the project** |
| 2 | Mon 9 Nov 04:00 | v003800 | **Cap settlement by structure lead** F=0.5 (v1.3; dead damage term removed) | reward audit: economy 43% / structures 32% / **win 0.5%** of return (98% of games capped) | Objectives recovered but policy went passive (kills 24 → 18.4, nexus 3.6 → 2%) |
| 2b | 05:47 | v004525 | settle 0.3 | — | v004950 best on every reference (+2.04 turrets vs v001350). ~92% of turret kills are the minion floor (idle heroes: 6.83 turrets/game) |
| 2c | ~09:20 | r5875 | env v1.4: CHAOS mirror centre fixed (6998, 7236) | real obs bug | Ladder dipped on CHAOS side, recovered by v006450 |
| — | 10:59 | r6053 | **NaN** (loss nan, kl 101); found at 11:45 | fp16 overflow in update, probably | Restart from v006050 with finite guards, clamp counters; ClipLSTM built, left off |
| — | 09:17–16:52 | v005550–v007350 | Plateau (4 h sideways on the 12-min ladder); **idle-opponent test**: nexus falls 0% within 12 min from spawn, 98% within 30 | "most draws are a time limit" | Paused 16:52 for behaviour analysis: no jungle (blue buff 0.07/game), 38% last-hit share, 93% of deaths to heroes, all five grouped 1.9% of time |
| 3 | 17:26 / 17:58 | v007350 / v007550 | **cap 8,100 (18 min), γ 0.998 (67 s horizon)**; env **v1.5**: 25% siege starts, tiered turrets (1.5/2.5), nexus damage paid, **win 5 → 10**, settle 0.15 | put the last fight in front of the policy | Plateau broken: normal-start nexus 1–3% → 7.9%, siege 39%; v007650 best on every reference, wins > losses for the first time; 24-min matchup: 30% decided vs ~5% at 12 min |
| — | 22:15 Mon → Tue 10 Nov 10:46 | v009175 | Pause for Rust benchmarks, then 7 h campaign | — | Resumed at 1.17M (was 0.33M); r6053 NaN lineage quarantined |
| — | Tue 10 Nov 13:41 | v013225 | (resume after ladder) | — | v013000 beats v009175 18.0 W / 4.7 L (77% draws); retreat-to-fountain behaviour seen in v010050 |
| 4 | Wed 11 Nov 02:36 (go) | v015625 (surgery) | **Items (26 stat + 22 scripted) + Recall action**, scripted buyer | #28 | Beats bots on real client (Yi game, nexus 29:48); **Recall spam**: 10,309 started, 0 completed in a live game |
| 5 | 06:16 | v018000 → sr_p1_items | Recall-channel-progress input (obs 2,858 → 2,914), bias −4, Tabi fix | learnability | Input ignored: spam 14.5% → 17.8% of decisions, ≤0.01% complete |
| 6 | 13:00 | v027600 | 8 s lockout after a cancelled recall (env mask, v1.8) | Three options (reward item value, hold the channel, a lockout after a cancel). Picked the lockout: the cheapest change, no engine edit, env mask only. Restarted at 13:00. | Spam 1.4%, **0 completions** (v036000: 0/19,178) |
| 7 | 21:08 | v036000 | **Env holds the channel** (--sr-recall-hold) | The lockout cut the spam and taught nothing: 0 of 19,178 recalls completed at v036000. The environment holds the channel once it starts. | Recalls complete, but policy stops pressing it (~0.00%); purchases while dead |
| 8 | 23:31 | v043200 | **Gold-spent reward 0.0015** (alive only), recall bias reset −1.5, counters in log | Held recall worked and the policy stopped using it. OpenAI Five's 'no courier' trick -  and a second, milder recall bias reset.  | Recall works (81–88% complete, 83% gold spent alive, ~1 trip per 1.8 hero-min); nexus endings 49% → 27–30%; **stronger on the ladder** (v044400 0.62 vs v043200) |
| — | Thu 12 Nov 01:46–03:11 | v046575 | Pause: first lineage **tiebreak Elo ladder** (22 ckpts, 43,264 games, 94.5% capped) | — | 1249 (v009600) → plateau → 1370 → dip 1300 (v043200) → **1465 ± 55 (v046575)**; jungling 0.4 → 67 monster kills/game |

<!-- ### OpenAI Five game-years per day -->

<!-- https://news.ycombinator.com/item?id=17392455 - openai five primary source costing -->