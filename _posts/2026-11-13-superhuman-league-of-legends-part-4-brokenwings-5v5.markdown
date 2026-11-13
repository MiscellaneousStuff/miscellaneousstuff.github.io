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

<dl class="lesson"><dt>Bottleneck</dt><dd>what ends an episode, and what pays</dd><dt class="l">Lesson</dt><dd>self-play finds the cheapest equilibrium in your reward, not the game you had in mind.</dd></dl>

The setup is deliberately close to OpenAI Five's in June 2018, restrictions included. Two fixed teams of five
(Ezreal, Garen, Ashe, Veigar, Malphite against Caitlyn, Warwick, Nunu, Master Yi, Ryze), no summoner spells, no
wards. One network drives all ten heroes, told apart by a champion one-hot. Each hero sees about 2,900 numbers per
decision under fog of war and acts every 133 ms - 7.5 Hz. Training is PPO with an LSTM: 4,096 games at once, 64 decisions
per rollout, 2.6 million agent-steps per update, the two teams swapping sides every 1,200 rollouts.

<!--
### The first thing they learned was not to fight

We started small: both teams dropped near each other in mid lane with a 40-second cap. Within about 100 rollouts
every game was a draw. Games reaching the cap went from 2% to 47% to 100% by rollout 150, and kills per game from
six to zero. Early recordings show a team wiped inside 20 seconds, every round. Later ones show one straggler picked
off, then ten heroes standing apart until the clock runs out.

Running out the clock is worth exactly zero to both sides. A fight is worth about −1.3 per hero to the weaker
composition. Not fighting is a Nash equilibrium of that reward, and PPO found it. A draw penalty moved the draw rate
from 100% to 88%; doubling the penalty moved it back to 93%. So we stopped trying to price the draw and switched to
the thing that makes avoidance expensive by construction: the full game, with minions, towers and farm.

### Full games

Full games ran ten times slower than the benchmark, for a reason that had nothing to do with the engine. A path
across the map costs about 100 times a local one, and an untrained policy orders them constantly. Limiting move
targets to 1,500 units, on the agent's side, fixed it without touching a rule.

Six-minute games from level 1 never saw a turret fall, so most games start mid-game instead: heroes pre-levelled
and in lane, towers already damaged. On the evening of 8 November the first games ended with a nexus kill.

### What 128 billion agent-steps bought

Four days later the run was at rollout 49,200: 128 billion agent-steps, about 54 game-years, on one rented box at
$2.29 an hour.

- **A jungle nobody asked for.** OpenAI's 2v2 bot found creep blocking by itself after four weeks. Ours found the
  jungle. Monster kills went from almost none to about ten per hero every ten minutes, and lane last hits roughly
  doubled. Nothing in the reward mentions camps.
- **Recall, on the fourth attempt.** Going home to shop only worked once the environment held the channel and a
  small reward paid for gold spent while alive. After that, agents went home about every two minutes and spent 84%
  of their gold on live trips.
- **The scripted bots, early.** By rollout 5,875 the policy took 55 of 64 games from the server's own bots.

And one thing it did not buy. On our ladder, 94.5% of games between trained checkpoints hit the 18-minute cap. With
the cap removed, the median game ran over an hour, and one in five never ended at all.
-->

## So where do we go from here?

As we're now able to train 5v5 agents on modest hardware, in the next part we will work on fully porting
10 champions on modern League of Legends for patch 26.19 and training 5v5 agents on the full game.

## Appendix

### Training Log

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
| 6 | 13:00 | v027600 | 8 s lockout after a cancelled recall (env mask, v1.8) | your call 12:23 | Spam 1.4%, **0 completions** (v036000: 0/19,178) |
| 7 | 21:08 | v036000 | **Env holds the channel** (--sr-recall-hold) | your call 19:43 | Recalls complete, but policy stops pressing it (~0.00%); purchases while dead |
| 8 | 23:31 | v043200 | **Gold-spent reward 0.0015** (alive only), recall bias reset −1.5, counters in log | your "do 1 and 2" | Recall works (81–88% complete, 83% gold spent alive, ~1 trip per 1.8 hero-min); nexus endings 49% → 27–30%; **stronger on the ladder** (v044400 0.62 vs v043200) |
| — | Thu 12 Nov 01:46–03:11 | v046575 | Pause: first lineage **tiebreak Elo ladder** (22 ckpts, 43,264 games, 94.5% capped) | — | 1249 (v009600) → plateau → 1370 → dip 1300 (v043200) → **1465 ± 55 (v046575)**; jungling 0.4 → 67 monster kills/game |
| 9? | 04:07 decision | v048000 | γ 0.999 + team spirit 0.5 | your "do 2 first" | **Unclear it ever ran**: the log's chain reads v043200 → v046575 → v049225 (~04:54, stop) with no mention of it; a relaunch at γ 0.99926 from v049225 was denied by the permission system at ~04:52 |

### OpenAI Five game-years per day