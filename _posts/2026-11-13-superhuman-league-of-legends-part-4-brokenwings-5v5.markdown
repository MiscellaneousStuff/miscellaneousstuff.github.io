---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 4 - Brokenwings: Initial 5v5)"
excerpt: "Now we train 5v5 agents on a restricted version of Brokenwings"
date:   2026-11-13 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "fastsim", "mech interp"]
---

## Table of Contents

* TOC
{:toc}

## Overview

In the [last](https://miscellaneousstuff.github.io/2026/11/04/superhuman-league-of-legends-part-3-live.html) post,
we focused on porting our findings from Brokenwings to modern League of Legends (patch 26.19). We managed to create
a faster than real-time simulator for League of Legends which had similar throughput to OpenAI Five.

Now we want to graduate up to full 5v5 games. However before porting over more of modern League of Legends to our
gameserver, we instead want to validate two things: \
1. Scaling up fastsim to the full 5v5 game mode \
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
| Numba simulator, 4,096 games | 313k | 78k | 783k | 29 |
| Rust engine, 2,048 games | 560k | 140k | 1.4 M | 51 |

Along with the single-core counts:

| One core, one 5v5 game | Ticks/s | Versus real time |
|---|---:|---:|
| Real time | 30 | 1× |
| C# server, step mode | 735 | 24× |
| Numba | 4.3k | 144× |
| Rust | 17.0k | 566× |

To start with, our fully working Brokenwings game server with our custom RL bridge could already run full games.
At that stage we were already at parity with OpenAI Five for being able to simulate games and hook them, however
this means our only speedup was running the game on more CPU cores, which to reach the same throughput as OpenAI
Five or AlphaStar would be incredibly expensive.

Earlier in April, we focused on speeding up the game server by stepping each game tick instead of running at 30hz.
This involved finding every line of code in the C# engine which relied on wall-clock time and instead setting it
to use the game server's per step provided time.

In the [last](https://miscellaneousstuff.github.io/2026/11/04/superhuman-league-of-legends-part-3-live.html) post
we ported enough of the game engine for an Ezreal 1v1 and when combined with our training infrastructure managed
to achieve up to 1.95M agent decisions per second.

Now we wanted to do this for the full 5v5 game and set a target of 24 hours for the initial port. Seeing as we
had the original source code for the game server we can validate behaviour exactly.

Our first approach
involved porting the game server to a python reference and creating the Numba implementation in parallel - by
directly transpiling functions from the C# game server and validating behaviour.

For context, Numba is a Python package which wraps Python source code and compiles it just-in-time (JIT)
into machine code using [LLVM](https://en.wikipedia.org/wiki/LLVM). This allows you to greatly improve
the performance of your Python code without fully translating it into another language. We finally achieved
a 10,400x speedup vs running a single-game in realtime.

<!-- check refs and update appendix -->
In total we simulate 12 years worth of game play per day (during training) in contrast to OpenAI
Five's 180 years a day which means that we're ~15x off. However, they use 128,000 CPU cores
(likely vCPUs) whereas we use 64 GH200 neoverse v2 CPU cores.

### Profiling Numba and long compilation times

At this stage our simulator already achieved high throughput but we ran into new problems. Every time
we wanted to add new functionality to our Numba simulator, we were forced to re-compile the *entire* simulator
because recursion broke our cache. Cold compilation took between 20-40 minutes per each change. During this
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
collection. The issue with our fastsim is that the entire game state lives within a single state object which
contains many array.
Individual functions then get a hold of the array which blocks further optimisation techniques. Admittedly
this may not be the best way of implementing this within Numba but the aggregating issues of slow compilation
times and obvious optimisation targets motivated the port to Rust.

### Rewrite it in Rust



## So where do we go from here?

As we're now able to train 5v5 agents on modest hardware, in the next part we will work on fully porting
10 champions on modern League of Legends for patch 26.19 and training 5v5 agents on the full game.

## Appendix

### OpenAI Five game-years per day