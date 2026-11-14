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

<div class="key-findings" markdown="1">
In short

- **A 5v5 game at 566× real time on one core.** The Rust port of fastsim runs about 50× more decisions a second than the real server on the same GH200, and trains at 1.2M agent-steps a second.
- **One network, ten heroes, about 50 hours of training.** It passes the game's own scripted bots within the first four hours.
- **The agents learned what we paid for**: a draw in fights, farming paid three times over, and Recall only once the environment held the channel for them.
- **The endless games were the simulator's fault.** Four bugs, two of them copied faithfully from the 2011 server, that a bit-identical diff on short traces could never catch.
- **Rated on wins in games that end, the run never plateaued**: from 1,251 Elo at rollout 2,400 to 2,966.
</div>

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

This journey led to three distinct phases, over one week:

<figure class="fig">
<ol class="timeline" style="--n: 6">
  <li><span class="when">Sat 7 Nov</span><b>The port</b>38 champions run clean; ten are picked and a 24-hour port plan is written.</li>
  <li><span class="when">Sun 8 Nov</span><b>First games</b>The fight task collapses into a draw. Full games, and the first nexus kill at 22:32.</li>
  <li><span class="when">Mon 9 Nov</span><b>The clock</b>An 18-minute cap and a 67-second horizon break the first plateau.</li>
  <li><span class="when">Tue 10 Nov</span><b>Rust</b>Training goes from 0.33M to 1.17M agent-steps a second.</li>
  <li><span class="when">Wed 11 Nov</span><b>Items and Recall</b>Four attempts before the agents learn to go home.</li>
  <li class="now"><span class="when">Thu 12 Nov</span><b>The turn</b>Four engine bugs found and fixed; every game ends.</li>
</ol>
<figcaption>The week of 7 November. Phase 1 is the first two days, Phase 2 the middle of the week, and Phase 3 the last.</figcaption>
</figure>

## Phase 1: Making 5v5 fast

This stage involved making the 5v5 fastsim version of Brokenwings as fast as our GH200 hardware could possibly run.
In the end, here is how much each method improved environment throughput, measured in years of game experience
simulated per day:

<figure class="fig">
<div class="viz" data-viz="throughput-5v5"></div>
<figcaption>Game-years of experience simulated per day, log scale, for every way we ran the 5v5 game on one 64-core GH200. Each step is roughly an order of magnitude. The Rust row includes building observations and runs the later, heavier game with items; like for like it is 4.3× Numba. OpenAI Five's 2018 figure of 180 game-years a day used about 128,000 CPU cores.</figcaption>
</figure>

<script src="/assets/part4/figures.js" defer></script>

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

<figure class="fig">
<div class="viz" data-viz="numba-profile"></div>
<figcaption>Where one environment step of the Numba simulator spent its time. The engine is almost all of it, and inside the engine more than half went to reference counting: bookkeeping on arrays that live for the whole run and are never freed. Vision, the next largest, is mostly the turrets' sight bubbles.</figcaption>
</figure>

One major step stands out, reference counting. This is used to track if arrays are still in use for garbage
collection. The issue with our fastsim is that the  whole game state lives in one
state object holding many arrays. Every time a function reads an array out of that object,
Numba increments a counter, and decrements it
when the function returns. Our hot helpers are tiny and called thousands of times a tick, so
the counting cost more than the work. And nothing was ever freed: the arrays live for the whole run.

### Rewrite it in Rust

<dl class="lesson"><dt>Bottleneck</dt><dd>the compiler's bookkeeping</dd><dt class="l">Lesson</dt><dd>profile first; the rewrite was the conclusion, not the plan.</dd></dl>

"Rewrite it in Rust" is usually a punchline. Here the profile made the case for us as 59% of the engine was spent counting references to arrays that were never freed, and every attempt to fix that inside Numba cost a half-hour compile.

The Rust port re-used the Numba arrays for development speed and also reads and writes the same state arrays as the Numba engine and exposes one step function to Python, so everything around it stayed as it was, and Numba became the oracle. A lead agent spent 25 minutes on the groundwork: a generated description of the state layout, a rulebook for numerics (the same float32 operation order, no fused multiply-add, no fast-math), and a harness that steps both engines from the same recorded state and reports the first array, index and tick where they differ.

Then the engine was cut into nine families (navigation and vision, movement, casting, AI, rules, damage, the kit core, the scripting API, jungle and kits) with one translator agent each.

<figure class="fig">
<ol class="method-steps">
  <li><b>Groundwork</b>One lead agent, 25 minutes: a generated map of the state layout, a numerics rulebook (same float32 order, no FMA, no fast-math) and a diff harness.</li>
  <li><b>Nine translators</b>One agent per engine family, in parallel, about 35 minutes: 871 functions, 16,300 lines of Rust.</li>
  <li><b>Diff against Numba</b>Step both engines from the same recorded state; report the first array, index and tick that differ.</li>
  <li><b>Bit-identical</b>On a 4,000-decision replay of the live policy, at 4.3× Numba's speed on one core.</li>
</ol>
<figcaption>How the Rust engine was written. Numba became the oracle: the Rust port reads and writes the same state arrays and exposes one step function to Python, so nothing around it changed.</figcaption>
</figure>

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

<figure class="fig">
<div class="stat-row">
<div><span class="num">1 network</span><span class="lbl">drives all ten heroes, told apart by a champion one-hot</span></div>
<div><span class="num">2,914</span><span class="lbl">numbers per hero per decision, under fog of war</span></div>
<div><span class="num">7.5 Hz</span><span class="lbl">one decision every 133 ms</span></div>
<div><span class="num">2.6M</span><span class="lbl">agent-steps per PPO update: 4,096 games × 64 decisions × 10 heroes</span></div>
</div>
<figcaption>The training setup, close to OpenAI Five's in June 2018: fixed rosters, no summoner spells, no wards.</figcaption>
</figure>

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

<figure class="fig">
<div class="payoff">
<div class="ph corner">Payoff to the weaker team</div><div class="ph">Weaker team engages</div><div class="ph">Weaker team walks away</div>
<div class="ph row">Stronger team engages</div><div class="fight"><b>Fight</b><span>about −1.3 per hero for the weaker side</span></div><div><b>No fight</b><span>0 for both</span></div>
<div class="ph row">Stronger team walks away</div><div><b>No fight</b><span>0 for both</span></div><div class="eq"><b>No fight</b><span>0 for both</span></div>
</div>
<figcaption>The fight task as a game. Running out the clock pays both teams exactly zero, and only one cell pays anything else, to the weaker team's loss. It takes two to fight, so the weaker side never has a reason to, and walking away is stable for both. PPO found that in about 100 rollouts.</figcaption>
</figure>

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

<figure class="fig">
<div class="viz" data-viz="reward-audit"></div>
<figcaption>What the agents' return was made of in the 12-minute games, with 98% of games hitting the cap. Winning was half a percent of it.</figcaption>
</figure>

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

<dl class="lesson"><dt>Bottleneck</dt><dd>the reward pays for farming three times over</dd><dt class="l">Lesson</dt><dd>you get what you pay for, including the parts you forgot you were paying for.</dd></dl>

When we paused at rollout 7,350 the agents barely farmed. They took 38% of the available last hits, touched the
blue buff in 7 games out of 100, and spent 1.9% of their time grouped as five. Forty thousand rollouts later they
were different animals:

<figure class="fig">
<div class="viz" data-viz="farm-shift"></div>
<figcaption>Per hero, per 10 minutes, early in the run and at the end. Jungle farming went from almost nothing to ten monsters each.</figcaption>
</figure>

The jungle is the striking one. By the end a game has about 67 monster kills in it, with the first camp taken
around two and a half minutes in. Nobody told the agents who should jungle or when, and their answer is not the
one a player would give. The two champions we picked as junglers mostly stay in lane. The camps go to the ranged
and caster heroes, who step out of an empty lane to the nearest one and step back:

<figure class="fig">
<div class="barlist">
  <div class="name">Ryze<span>mage</span></div>
  <div class="track"><div class="bar" style="--w: 100%"></div><span class="val" style="--w: 100%">25.7</span></div>
  <div class="name">Caitlyn<span>ranged attacker</span></div>
  <div class="track"><div class="bar" style="--w: 78.6%"></div><span class="val" style="--w: 78.6%">20.2</span></div>
  <div class="name">Ezreal<span>ranged attacker</span></div>
  <div class="track"><div class="bar" style="--w: 77%"></div><span class="val" style="--w: 77%">19.8</span></div>
  <div class="name">Garen<span>melee fighter</span></div>
  <div class="track"><div class="bar" style="--w: 37.4%; --c: #86b6ef"></div><span class="val" style="--w: 37.4%">9.6</span></div>
  <div class="name">Warwick<span>melee fighter</span></div>
  <div class="track"><div class="bar" style="--w: 25.3%; --c: #86b6ef"></div><span class="val" style="--w: 25.3%">6.5</span></div>
</div>
<figcaption>Jungle monster last hits per 10 minutes alive, for the heroes that jungle most. The camps go to the ranged and caster heroes, who step out of an empty lane to the nearest one and step back.</figcaption>
</figure>

Lanes are just as unorthodox. There is no one-one-two split: in the first four minutes Ezreal, Ashe, Veigar,
Caitlyn and Ryze each spend about half their time mid, while Malphite goes top and Warwick goes bottom.

It would be nice to call this emergent, but it is closer to obedience. The reward pays 0.16 for a last hit on a
lane minion and the same for a jungle monster, and has done since the first run. It also pays for gold and for XP,
and a last hit gives both. So one minion is paid three times. A kill is paid the same way: +1, plus its gold, plus
its XP. OpenAI Five's reward has the same terms with the opposite sign, −0.16 for a last hit and −0.6 for a kill,
precisely to cancel the gold and XP that come with them. Ours stacks where theirs subtracts.

Watching the long games, the result looks like low-ranked human play: ten players who have learned that farming
is safe and fighting is risky, who do attempt to group, and who rarely turn a lead into a win.

### Recalling

<dl class="lesson"><dt>Bottleneck</dt><dd>an action that only pays if you keep choosing it</dd><dt class="l">Lesson</dt><dd>when a behaviour cannot be explored, change the environment before you change the reward.</dd></dl>

On Wednesday we added items and the Recall spell. Items were easy: a scripted buyer spends each hero's gold
whenever it stands in the fountain, so there is no new action and nothing to learn. Recall was a new action, added
to the trained network by surgery (one new output with zero weights, so the policy behaved exactly as before until
training moved it).

Recall is hard for a sampling policy for a simple reason. It is a channel, and any move order cancels it. An agent
that picks an action every 133 ms has to pick "do nothing" dozens of times in a row to get home, and the pay-off
(a full health bar, new items, and whatever those are worth over the next ten minutes) arrives long after the
decision. It took four attempts.

<figure class="fig">
<ol class="method-steps attempts">
  <li><b>Recall as an action</b>A new output, added by surgery. <span class="out"><em>Spam.</em> In one live game: 10,309 recalls started, none completed.</span></li>
  <li><b>Show the channel</b>The channel's progress added to the observation. <span class="out"><em>Ignored.</em> Recall rose to 17.8% of decisions; under 0.01% completed.</span></li>
  <li><b>An 8-second lockout</b>Recall masked after a cancelled channel. <span class="out"><em>Quieter, still nothing.</em> 0 of 19,178 completed.</span></li>
  <li class="ok"><b>Hold the channel</b>Once started, the environment keeps it going. <span class="out"><em>Recalls complete.</em> Then the policy stopped pressing the button.</span></li>
</ol>
<figcaption>Four attempts at teaching Recall. The first three changed what the agent could see or do and taught nothing; the fourth made the commitment on the agent's behalf.</figcaption>
</figure>

The fourth attempt made Recall possible. It did not make it worth anything the agent could see, because with a
67-second horizon the benefit of an item is mostly out of view. The OpenAI Five paper warns about exactly this when
handing a new action to the model: "the agent might quickly learn never to take a new action". Its reward table
also has a term we had skipped: 0.0006 per unit of gold "spent on items without using courier", which pays a hero
for shopping in person. We borrowed it at 0.0015, and only for gold spent while alive, so that dying and shopping
at the respawn earns nothing. We also reset the Recall output so the policy would explore it afresh.

That worked. Agents now go home about every two minutes, complete 81–88% of the recalls they start, and spend 83%
of their gold on trips they chose to make. On the real server, in a 45-minute game, 90 of 117 recalls completed.
The checkpoint a thousand rollouts after the change beat the one before it 62% of the time.

Three of the four attempts changed what the agent could see or was allowed to do, and only the last touched the
reward. The lockout and the observation were both cheaper than the fix that worked, which is why we tried them
first, and both taught nothing. What the agent needed was for the commitment to be made on its behalf.

<!-- CHECK: the Recall channel length in this patch, to replace "dozens of times in a row" with the exact count. -->

### So how good are they?

<dl class="lesson"><dt>Bottleneck</dt><dd>a ladder can only rank what its games decide</dd><dt class="l">Lesson</dt><dd>when 95% of your games are draws, the number you are tracking is not the one you care about.</dd></dl>

There are three ways to ask, and by Thursday morning they gave three different answers.

**Against the game's own bots: very.** On Monday, at rollout 5,875 and before it had ever bought an item, the
policy played 64 games against the server's scripted bots and won 55, drew 8 and lost 1, with 45 kills to 3. Two
days later, with items, a checkpoint played a full game on the real client and took the nexus in under half an hour.
This was the first time the agents met anything from outside their own lineage, and it was not close.

**Against their earlier selves: it depends how you count.** On Thursday we paused training and played 22
checkpoints from across the run against each other: 43,264 games, each from the start, with the 18-minute cap the
agents trained under. 94.5% of those games hit the cap. Count a capped game as a draw, and the whole run from
rollout 2,400 to rollout 46,575, about 115 billion agent-steps, is worth 66 Elo. Break the ties by structures
destroyed and then net worth, and the same games show a steady climb to 1,465. Both are true. One says the agents
kept getting better at being ahead after 18 minutes. The other says they almost never beat each other.

<!-- CHART: the two Elo curves against rollout, same games: draws-as-half (flat) and tiebreak (rising). -->

**Watching them: they do not finish.** We took the best checkpoint and let ten games run to an hour. Six were
still undecided at 60:00. The earliest ended at 29:08. In one, a team killed inhibitors eleven times and never took
the nexus. On the real server, a 45-minute game ended with both nexuses at full health. It looks like low-ranked
human play: farming is safe, fighting is risky, and nobody knows how to group and close.

So we removed the cap altogether and ran 1,024 games to see how long they would go.

<figure class="fig">
<div class="stat-row">
<div><span class="num">64 min</span><span class="lbl">median game, against itself, no cap</span></div>
<div><span class="num">23%</span><span class="lbl">still running after two hours</span></div>
<div><span class="num">11%</span><span class="lbl">still running after ten hours, when we stopped them</span></div>
<div><span class="num">36 min</span><span class="lbl">median game with ten heroes that never move</span></div>
</div>
<figcaption>1,024 games of the best checkpoint against itself with the cap removed, and the same with idle heroes for comparison.</figcaption>
</figure>

For comparison, we ran the same thing with ten heroes that never move. The minion waves alone end that game in
36 minutes. Our agents, after 128 billion agent-steps of practice, take nearly twice as long as nobody at all, and
one game in ten they prevent it from ending.

That is not a weak agent. A weak agent loses. This is something else, and Phase 3 is the story of finding out what.

## Phase 3: Why won't they end the game?

### The suspects

<dl class="lesson"><dt>Bottleneck</dt><dd>too many good explanations</dd><dt class="l">Lesson</dt><dd>when every hypothesis is plausible, none of them has been tested.</dd></dl>

We had agents that farm, fight, push and go home to shop, and games that do not end. There was no shortage of
reasons, and each came with a precedent in the OpenAI Five paper.

**The horizon.** With γ = 0.998 at 7.5 decisions a second, the agent discounts the future with a horizon of 67
seconds. A win five minutes away is worth 1% of its value today: 0.11 out of 10. An inhibitor that has just
respawned is worth 2, right now, every time. Five trained with a horizon of 180 seconds and later 360.

<figure class="fig">
<div class="viz" data-viz="horizon"></div>
<figcaption>What a win worth 10 is worth to the agent now, if it is N minutes away. Drag the slider or the chart. At our 67-second horizon a win five minutes out is worth about a tenth of a point, less than one inhibitor kill; at OpenAI Five's 360 seconds it is still worth 4.3.</figcaption>
</figure>

**The cap.** Every training episode ends by minute 18, and starts somewhere between minute 5 and 32 of a game.
Nearly all the real endings the critic ever saw came from the quarter of games that start as a siege. An even game
played through to a finish was not in the data. Five had no cap at all.

**The reward.** Farming is paid three times over, as we saw. Fighting is too. A capped game is settled by structure
lead, so "ahead at 18 minutes" is itself a paid objective. Against all that, the win is worth 10. Five paid −0.16
for a last hit and −0.6 for a kill.

**Team spirit.** Each hero keeps 70% of its own reward and shares 30% with the team. Five started there and
annealed towards sharing everything, because closing a game is a team action and farming is not.

**The model.** The LSTM is trained on windows of 64 decisions, eight and a half seconds. Perhaps it cannot hold a
plan for longer than that, and a siege is a long plan.

<figure class="fig">
<div class="suspects">
<div><h4>Reward horizon</h4><dl><dt>Ours</dt><dd>67 s</dd><dt>Five</dt><dd class="five">180 s → 360 s</dd></dl><div class="plan">180 s</div></div>
<div><h4>Episode cap</h4><dl><dt>Ours</dt><dd>18 min</dd><dt>Five</dt><dd class="five">none</dd></dl><div class="plan">2 hours</div></div>
<div><h4>Last hit / kill</h4><dl><dt>Ours</dt><dd>+0.16 / +1</dd><dt>Five</dt><dd class="five">−0.16 / −0.6</dd></dl><div class="plan">negative for both</div></div>
<div><h4>Win reward</h4><dl><dt>Ours</dt><dd>10</dd><dt>Five</dt><dd class="five">5</dd></dl><div class="plan">20, with larger objective rewards</div></div>
<div><h4>Team spirit</h4><dl><dt>Ours</dt><dd>0.3</dd><dt>Five</dt><dd class="five">0.3 → 0.8</dd></dl><div class="plan">0.5</div></div>
<div><h4>LSTM size and memory</h4><dl><dt>Ours</dt><dd>512 units, 8.5 s</dd><dt>Five</dt><dd class="five">4,096 units, 2.1 s</dd></dl><div class="plan open">undecided</div></div>
</div>
<figcaption>The suspects against OpenAI Five's settings (the reward appears twice: what it pays per event, and what it pays for the win), and the change we had planned for each. Memory windows are the length of the sequences the LSTM is trained on.</figcaption>
</figure>

All of these were plausible reasons why our agents were constantly running the clock, but we
decided to take a step back.

Before launching, we stopped to look inside the agents we already had.

### Peering inside the agents

<dl class="lesson"><dt>Bottleneck</dt><dd>we knew what they did, not why</dd><dt class="l">Lesson</dt><dd>ask the network before you change it.</dd></dl>

Then four studies ran in parallel on the latest checkpoint, each with one question and each ending, as in
Part 3, in a decision.

**How much memory does it use?** We wiped one team's actor memory every N seconds and let it play the other team,
about 590 games per setting. Wiped every decision, it loses 94% of games. Wiped every second it scores 0.21; every
five seconds, 0.41; every ten seconds, 0.46, which is the same as never. The actor uses the last five to ten
seconds and nothing more, and 97 of its 512 memory units never fire. The critic is different: wiping it every two
minutes nearly halves how well it predicts returns.

<p class="decision"><em>Decision:</em> a bigger LSTM is not worth doing. Memory length, not size, is what the actor lacks.</p>

**What does it know that it cannot see?** Very little. We trained probes to read a hidden enemy's position from
the LSTM state. Adding the state to a plain record of "last seen here, this long ago" makes the guess worse. It
does not track enemy cooldowns in the fog, and it does not know its own previous action. Worse, it loses what it
can see: an enemy hero's position can be read from that unit's encoding with R² 0.92, from the pooled heroes with
0.70, and from the LSTM state with 0.37. The max-pool that makes the network indifferent to unit order also makes
it forget which hero was which.

<p class="decision"><em>Decision:</em> pass the nine other heroes to the LSTM unpooled, feed back the previous action, and stop capping the "last seen" timer at ten seconds.</p>

**What does the critic believe?** At its own 67-second horizon it explains 44% of the variance in returns. It is
a poor judge of who is winning: the sign of its value predicts the winner with AUC 0.71–0.78, while the two
team line-ups alone give 0.80. But a linear readout of its state predicts 180-second returns as well as it
predicts 67-second ones, so the information for a longer horizon is already there. Returns at 180 seconds have
nearly twice the spread.

<p class="decision"><em>Decision:</em> the 180-second horizon is safe to switch on, with return normalisation added alongside it.</p>

**What triggers what?** Roles come from the champion label. Give a hero its own abilities but another champion's
one-hot, and its jungle farming moves 93% of the way to the other champion's habits. The game clock matters in one
odd way: past the range seen in training, it switches Recall off. Clamping the clock changes nothing about how
long games last.

<p class="decision"><em>Decision:</em> rescale the clock input before lifting the cap, or the agents will stop going home in long games (by minute 60 the chance of a Recall is a hundredth of what it is early on).</p>

The picture is the one from Parts 2 and 3 at larger scale. These are reactive agents with a few seconds of memory
and a local view, and the things they lack (a plan, a map, a sense of the enemy) are the things neither the
network nor the reward ever gave them. It explained a lot. It did not explain a game that lasts ten hours.

The fourth study had a second question: why do some games never end? To answer it, it built a viewer.

### The turn

The fourth study had taken 256 games, found the 50 that were still running after two hours, and sorted them into
two kinds. In 23, one team was camped in the enemy base, killing inhibitors as they respawned and never touching
the nexus. In the other 27, nothing was happening at all: both teams had most of their turrets, nobody died, and
the ten heroes spent three quarters of their time in the jungle with the nearest enemy 5,000 units away. The
write-up called the second kind a standoff and described it as an equilibrium: two teams that had each decided the
other was not worth attacking.

It was a good story. It matched everything we had just learned about agents that farm because farming is paid, and
it was the fight task's stalemate again at full scale. We had the launch script open.

The study came with a viewer, so we opened one of the standoff games and scrubbed to the two-hour mark, to watch
what an equilibrium looks like.

There were no minions on the map.

Not few. None, in any lane, for either team. Ten heroes on an empty Summoner's Rift, clearing jungle camps because
the camps were the only things left that respawned. This meant either our visualiser was broken or fastsim itself
was broken.

### The culprits

<dl class="lesson"><dt>Bottleneck</dt><dd>fidelity past the seventh minute</dd><dt class="l">Lesson</dt><dd>a diff against the oracle cannot find a bug the oracle shares, or one that needs longer than your traces.</dd></dl>

There were four, and between them they explain every game that would not end.

<figure class="fig">
<div class="culprits">
<div class="server"><span class="who">Server bug, copied</span><b>The nexus that never re-opens</b><span class="saw">a policy that prefers a repeatable reward to a risky one</span><span class="was">once both nexus turrets fall and all three inhibitors respawn, the nexus is locked for good</span></div>
<div class="server"><span class="who">Server bug, copied</span><b>The pile</b><span class="saw">a standoff in empty lanes</span><span class="was">150 minions stuck in a heap beside their own inhibitor</span></div>
<div class="ours"><span class="who">Ours</span><b>The pool</b><span class="saw">the same standoff: no new waves for either team</span><span class="was">the pile filled all 192 minion slots and new spawns were silently dropped</span></div>
<div class="ours"><span class="who">Ours</span><b>The leak</b><span class="saw">one roster winning 80% of long games</span><span class="was">after about 15 minutes, new buffs stopped being applied</span></div>
</div>
<figcaption>Four bugs, and between them every game that would not end. The two grey ones are in the 2011 server and we copied them faithfully; the two orange ones are ours, in the fast engine.</figcaption>
</figure>

**The nexus that never re-opens.** The original map script has a branch to re-open the nexus when an inhibitor
dies again. It can never run, because it looks up the nexus turrets in a list that dead turrets are never removed
from. In 24 games that ended with one side locked, the locked side won all 24. When we emulated the intended rule,
11 of 11 locked games ended within seconds.

**The pile.** One corner of the minion path, next to the inhibitor, is walkable but too narrow for a minion's body.
If anything is standing there, usually a hero, minions collide, get pushed back out, walk back in, and repeat for
ever, while every later wave joins them. Put a hero on that corner and 82 minions are stuck within eight minutes.
The original server does the same, and the proof was in our own files: the recorded server traces we had certified
against contain the same loop, up to 475 times in a row.

<figure class="fig">
<div class="viz" data-viz="turn-viewer" data-src="/assets/part4/turn/"></div>
<figcaption>Two of the games that were still running after two hours, as fastsim played them: checkpoint v049200 against itself, six minutes of each from the 2:00:00 mark. The policy plays under fog; the replay shows every unit. Press play or click the map, drag the timeline (ticks are kills and structures), or click an event to jump to it. Each game is about 2.5 MB and loads when you reach it.</figcaption>
</figure>

<script src="/assets/part4/turn-viewer.js" defer></script>

**The pool.** This one we added. The fast engine keeps minions in a fixed pool of 192. A pile fills it, and from
then on no wave spawns anywhere. By minute 60 that had happened in a quarter of games, and by minute 90 in nearly
nine out of ten.

**The leak.** We found the last one while checking the fixes, in a counter that had been ticking the whole time
and that nobody read. When a minion dies its slot is reused, but the Rust port never released the dead unit's
buffs. The buff pool filled about fifteen minutes into every game, and after that new buffs were dropped: item
auras, shields, slows, silences, jungle buffs, even the one that lets damage interrupt a Recall. It was not
symmetric. Veigar alone held 41 dead copies of one buff. It was happening in 64% of training games.

None of this could have been caught the way we catch everything else. The simulator was bit-identical to the
server on 354 traces out of 354, and the longest was under seven minutes. Two of the four bugs are in the server,
so the diff was clean by construction. The other two need a long game.

Part 2 told this story once already, about a lane simulator that "matched the server on every trace we had" and
hid two bugs "the short clean traces never exercised". We wrote that down in September and walked into it again in
November, with ten heroes and sixty-minute games.

### Before and after

<dl class="lesson"><dt>Bottleneck</dt><dd>none, for once</dd><dt class="l">Lesson</dt><dd>fix the world before you retrain the agent: the same weights, on a correct game, were a different result.</dd></dl>

The fixes were small. The nexus re-opens when an inhibitor dies again. A minion that has tried to escape the same
spot twenty times stops trying and walks on. A full minion pool evicts its oldest minion, which no longer happens
now that nothing piles up. A reused slot releases what the last unit left behind. The first two went into the C#
server as well, in two files, so that the simulator and the game it copies agree again.

We changed nothing about the agents. Same checkpoint, same weights, played again:

<figure class="fig">
<div class="stat-row">
<div><span class="num">23% → 0</span><span class="lbl">games still running after two hours</span></div>
<div><span class="num">10 h → 89 min</span><span class="lbl">longest game, of 1,024 before and 512 after</span></div>
<div><span class="num">22% → 58%</span><span class="lbl">win rate of the Ezreal, Garen, Ashe, Veigar, Malphite side</span></div>
<div><span class="num">64% → 0</span><span class="lbl">training games in which buffs were being dropped</span></div>
</div>
<figcaption>Checkpoint v049200 against itself from a fresh start with no cap, before and after the engine fixes. The first three tiles are full games; the last is measured on training-style episodes.</figcaption>
</figure>

Every game ends. Against ten heroes that never move, the policy used to win nine games in ten and spend three
hours on the tenth; now it wins all ten in 14 to 18 minutes. The lock still happens, as it should, and now it
opens: in one recorded game a nexus opens, locks again when the last inhibitor respawns at 1:10, opens when an
inhibitor falls, and dies at 1:16.

<figure class="fig">
<div class="viz" data-viz="turn-pair" data-src="/assets/part4/turn/"></div>
<figcaption>The same checkpoint and the same seed, before and after the fixes. Left: the engine as it was on 12 November, recorded from the two-hour mark. Right: the fixed engine, the whole game. The fixes change the game within its first ten minutes, so this is not one game splitting at a single moment, only two very different endings from the same start. Each side has its own timeline; the speed buttons drive both. About 5 MB per seed, loaded when you reach it.</figcaption>
</figure>

The roster number is the one that stings. For four days one team had been losing its item auras, shields and crowd
control a quarter of an hour into most games, and the agents had learned to play around a handicap we did not know
was there. Everything we concluded about which champions are strong came from that.

And the agents are not acquitted of everything. The median game still takes 59 minutes. In two of ten recorded
games the winner killed eight and eleven inhibitors before finishing. They are slow to close, for the reasons the
suspects section gave. But it is a slow game now, not an endless one, and that is a problem training can fix.

### The payoff

<dl class="lesson"><dt>Bottleneck</dt><dd>finally, the agents</dd><dt class="l">Lesson</dt><dd>rate on wins, in games that end, against something from outside the lineage.</dd></dl>

With games that end, we could at last ask the question from Phase 2 properly. We took seventeen entrants: fourteen
checkpoints from across the run, the server's own scripted bots, a policy that acts at random and one that does
nothing. A win is a dead nexus. There is no tiebreak, because there is nothing to break: of 10,752 games, not one
reached the two-hour cap.

<figure class="fig">
<div class="stat-row">
<div><span class="num">10,752</span><span class="lbl">games, every one ended by a nexus kill</span></div>
<div><span class="num">2,966</span><span class="lbl">Elo of the best checkpoint, with an untrained network at 0</span></div>
<div><span class="num">725</span><span class="lbl">Elo of the game's scripted bots, on intermediate difficulty</span></div>
<div><span class="num">64–0</span><span class="lbl">the best checkpoint against the bots, median game 18 minutes</span></div>
</div>
</figure>

<figure class="fig">
<div class="viz" data-viz="elo-ladder"></div>
<figcaption>Elo of every checkpoint in the 5v5 lineage against how long it had trained, with the game's scripted bots as the orange dashed line. Seventeen entrants played 10,752 games; ratings come from wins alone, on the chess scale, with an untrained network fixed at 0, and the bars and the orange band are 95% bootstrap intervals. The bot games ran on the real C# server and the rest in the simulator. The two floor policies, one acting at random and one doing nothing, sit in their own column, and the shaded bands are the versions of the environment each checkpoint was trained under. The rollout axis is square-root by default so the early checkpoints, where the bots are passed, do not sit on top of each other; switch to linear to see training time in proportion, or to training hours to see it in time: the run took 88.9 hours on the clock, about 50 of them spent training, and the lineage passed the bots between 1.5 and 4.2 hours in. Absolute values depend on the prior used in the fit; the gaps between trained checkpoints do not.</figcaption>
</figure>

<script src="/assets/part4/elo-ladder.js" defer></script>

Two things in that chart were invisible a week ago.

**The run never plateaued.** The capped ladder had said the agents stopped improving around rollout 9,600 and
that the whole run was worth 66 Elo in wins. Counted properly, strength climbs all the way: 1,251 at rollout 2,400,
1,840 at 9,600, 2,625 at 32,400, 2,966 at 46,575. The plateau was the cap.

**The bots were passed almost at once.** They sit between rollout 600 and rollout 1,350, about two to three
billion agent-steps, or the first 3% of training. A checkpoint from the first evening beats them four games in
five. Everything since is a climb with no outside reference, which is its own problem for another post.

<figure class="fig">
<div class="viz" data-viz="vs-bots"></div>
<figcaption>Every entrant that played the scripted bots, on the real C# server. Rollout 600 never wins; rollout 1,350, from the first evening, wins four games in five; from rollout 2,400 on, the bots never win again, and the games get shorter.</figcaption>
</figure>

The bot games ran on the real C# server, the rest in the simulator, and the one pairing we played on both agreed:
98.4% on the server, 98.0% in fastsim. It also made the case for the whole exercise one more time. The 10,000
simulator games took 35 minutes. The 704 server games took an hour.

Not everything on the ladder flatters us. The checkpoint we had spent the week dissecting turns out to be 292 Elo
weaker than the one saved 25 rollouts later, and we do not yet know why. Every one of these agents was trained on
the broken game and is being rated on the fixed one. And the answer to Phase 3's question is both: the simulator
was stopping the games from ending, and the agents are slow to end them. We had the order of blame the wrong way
round.

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