---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 2 - Brokenwings)"
excerpt: "This post focuses on the initial attempts to discover what reinforcement learning methods are required to train superhuman level League of Legends agents."
date:   2026-11-03 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Simulator Enhancement", "fastsim"]
tags: [""]
leagueAiYoutubeId: yVUKi63WfDA
---

## Table of Contents

* TOC
{:toc}

## Overview

Following on from part 1, we now move towards our first step. Implementing our methodology for creating superhuman League of Legends AI agents by simulating the game server at orders of magnitude faster than realtime to then dedicate all of
our compute away from simulation and towards the actor/trainer.

## History

First it would be good to introduce the entire history of my attempts at RL agents and League of Legends before arriving at how it was implemented for the
brokenwings project. If you want to understand other peoples methods then refer to [part 1](https://miscellaneousstuff.github.io/project/2021/09/01/tlol-part-1-existing-solutions.html)
which still remains a good starting point.

### OpenAI Five

In late 2019, I saw OpenAI Five beat the world champions at Dota 2 and I was awestruck. How is it possible that by just having an AI system play against itself it was possible
for it to beat the world champions at arguably the most complex e-sports title ever made? Simply by playing against itself and *self-discovering* how to achieve this?

The first thing I did was investigate how it was achieved and I learned about reinforcement learning, imitation learning and game playing AI in general.
Then I realised that Riot Games allows players to download replay files (\*.rofl) and that it *must* somehow contain data useful for imitation learning. After viewing
the ROFL files in a visualiser I realised that it looked really *random*? I figured that this must mean it had high entropy, which means the data was encrypted.
I then investigated how to get data out of the replay files using scripting engines on the live running replay client which culminate in the TLoL series on this blog.

### Pylol

However I also discovered the reinforcement learning and simulation approach. In late 2020 I forked my own version of [LeagueSandbox](https://github.com/MiscellaneousStuff/LeagueSandbox-RL-Learning) and haphazardly adapted it for reinforcement learning using a duct-taped architecture (redis as the IPC, copied [pysc2](https://github.com/google-deepmind/pysc2) into [pylol](http://github.com/MiscellaneousStuff/pylol)), and even streamed a working version of the system to Twitch.tv where viewers could choose the champ by using chat commands.

I copied enough of the pysc2 lib (Starcraft II lib from Deepmind x Blizzard) which communicated with the LeagueSandbox server and used the real patch 4.20 client and had a fully
working training loop!

<div style="text-align: center;">
{% include youtubePlayer.html id=page.leagueAiYouTubeID %}
</div>

I even got it fully working inside of a sharable Google Colab [here](https://colab.research.google.com/github/MiscellaneousStuff/pylol-demo/blob/68e9f8dbdd54b822d710c879fcfe1e249b55c620/demonstration.ipynb#scrollTo=gA0n7C6sOms2).

Although at this stage I stopped as I felt that continuing required expanding on LeagueSandbox itself and at the time I thought that I didn't have the raw
compute to achieve intersting results.

I was actually more interested in getting the source code for the infamous [Chronoshift project](https://www.youtube.com/watch?v=8Q5B4pWKFSI) and was active on their discord server
shortly before the infamous [Riot Zed incident](https://www.businessinsider.com/league-of-legends-developer-riot-games-threatens-chronoshift-project-2021-4).

After this the RL-based efforts die down and I switch over to imitation learning for years afterwards as I felt that I'd never be able to use the simulator approach due to the sheer
engineering and harsh fidelity requirements.

[### Voyager](https://github.com/MiscellaneousStuff/pylol-demo/tree/latest)

Many years later, in early 2025, I had more spare time and decided to re-ignite the League RL-style approach based on a different fundamental understanding. Perhaps the RL approach
is inefficient not because of our simulator, but the sample efficiency of our learning method? What if we could use LLMs with their strong pre-existing world knowledge to learn
how to play League of Legends?

The main basis of this idea were several RL / game playing LLM based projects from 2023 and my research into agentic coding systems in 2024.
- Voyager (NVIDIA et al., May 2023): a GPT-4 era agent that played Minecraft open-endedly by proposing its own tasks, writing JavaScript skills against the game’s API, and keeping the ones that worked in a retrievable library with no gradient updates at all. It reached diamond tools 15× faster than ReAct/AutoGPT-style baselines. But it saw the world as text and spent an LLM call per decision.
- Eureka (NVIDIA et al., October 2023): GPT-4 given an environment’s source code writes reward functions, which are trained in parallel and refined from their own training statistics. It beat human-written rewards on 83% of 29 tasks and taught a simulated hand to spin a pen. It only works because Isaac Gym makes training sixteen candidates at once cheap - using the LLM designs, a fast simulator does the learning.

#### How it works

<!-- So for a hackathon in March 2026 I built LoLBench: an Ezreal mirror match on the Brokenwings server, cooldowns off,
250 ms ticks, pitched as a contamination-resistant benchmark for agentic reasoning: same champion, symmetric start,
an opponent that adapts, so memorisation can’t saturate it.

The agent was Voyager and Eureka in one loop: a hand-written
Python if/else policy played the game; after each episode Claude Opus read the compressed observations, reasoned about
HP timelines, dodging and DPS, and wrote a new policy; every reasoning trace and policy checkpoint went into persistent
memory so later iterations could build on earlier ones. In five iterations it went from “both champions take symmetric
damage” to deriving the tick rate from game_time // 250, blinking to a flank instead of onto the enemy, and dodging
perpendicular to each projectile’s velocity vector.

That was the result and the limitation in one. The model is a strong reasoner about the game when handed a text
summary of it — and each of those five steps cost a frontier-model call and one episode. It was writing heuristics,
faster than I had in 2020, but still heuristics, and no amount of iteration turns a script into a policy that acts at
133 ms. What the hackathon settled was the division of labour: the model reasons, designs and builds around the environment;
a small network does the playing. Which is Eureka’s lesson, not Voyager’s, and it’s how Brokenwings is built. -->

Voyager's loop has three parts: an *iterative prompting mechanism* (run the skill, feed back what happened, rewrite), a *skill library* (keep what worked, retrievable), and a *curriculum* (pick the next task). I kept the first two and fixed the task — an Ezreal mirror on Old Summoner's Rift, cooldowns off, four decisions a second, 25-second episodes — so the only thing the loop had to learn was how to win a duel. Below is each part as it exists in the repo.

**The policy is code.** One Python function, `act(self, observation) → (action_id, args)`, over three actions: `no_op`, `move (y, x)`, `spell (slot, (y, x))`. Movement is clamped to ±400 units at 100-unit resolution — a 9×9 grid. The starting policy was 43 lines: walk at the enemy and cast Q on alternate ticks.

```python
# checkpoints/0.py — the whole strategy
if int(observation["game_time"]/250) % 2 == 0:
    return (1, [enemy_champ_x, enemy_champ_y])          # move at them
else:
    return (2, [[0], [enemy_champ_x, enemy_champ_y]])   # Q at them
```

**The experience is a notation, not JSON.** Voyager fed GPT-4 a text description of the Minecraft state; I fed Claude one line per tick in a format I thought of as PGN for League — compact, human-readable, and complete enough to replay the fight in your head, the way a chess game fits in a text file:

```
T1279|ME100,100,(6801,7096),L1,G35,K0D0|Q0W0E0R0|ENY100,100,(395,-193),L1|PROJ[1073741853,0,0,2000,EzrealArcaneShift][1073741854,60,-234,2000,EzrealMysticShot]|ACT[move,auto,spell_0,...]
```

Time; my HP%, mana%, position, level, gold, K/D; my four cooldowns; the enemy's HP%, mana%, **offset from me**, level; every projectile as `[owner, dx, dy, speed, name]`; the legal-action mask. A 25-second episode is a hundred of these lines. The relative offsets are the point — `(395,-193)` and a projectile at `(60,-234)` is enough to see that something is about to land, and the model worked out perpendicular dodging from `dx, dy` on its own.

**The prompt is a fixed template.** Every iteration sends the same six blocks — the only things that change are the current policy, the latest episode, and the growing history:

```
You are T1 Faker, the best League of Legends player in the world.
You are observing an autonomous scripting bot acting on a hand-crafted Python policy...
You must improve the policy based on its gathered experience...

<game_context>     cooldowns are disabled                      </game_context>
<observation-spec> the notation above, explained               </observation-spec>
<action-spec>      no_op / move / spell                        </action-spec>
<current-policy>   {the act() the bot just played}             </current-policy>
<experience>       {100 lines of notation}                     </experience>
<history>          {every previous <thinking>, concatenated}   </history>

Return: <thinking>…</thinking><policy>…</policy>
```

plus two guardrails: thinking capped at 4,000 words ("we want fast iteration"), and an AST validator on the returned code — must define `act(self, observation)`, no `eval`/`exec`/`open`/`getattr`/`setattr` — before it is hot-swapped into the running agent.

**The skill library is the checkpoint directory.** Every accepted iteration writes three timestamped files: the policy, the model's reasoning, and the full prompt that produced it. The policy is Voyager's executable skill; the reasoning is the part Voyager didn't keep.

**The experience buffer is what stops it forgetting.** Each prompt's `<history>` is every previous `_thinking.txt` concatenated, with this instruction:

> You *MUST* use this information to avoid cyclically updating your policy and forgetting parts of the policy which have already been learned.

Without it, an LLM rewriting a policy from one episode's evidence oscillates — fix the dodging, lose the aggression, fix the aggression, lose the dodging. With it, the traces show the model citing itself. Iteration two:

> From history: "spam E (Arcane Shift) directly on the enemy — it's a targeted blink that deals damage" — but E range is only ~475, we need to close the gap first.

and by iteration five it opens with a digest of everything learned so far before touching the code:

> From history: previous iterations showed — don't just spam R from long range; need to close distance; need to dodge between casts; E blink is great for repositioning AND damage; orbit enemy at ~500 range; interleave dodge and cast.

That is the whole mechanism: Reflexion-style verbal memory, persisted to disk, prepended to every call.

**Five iterations, one a minute.** The 8 March run, 04:08 to 04:13:

| # | lines | what it read in the notation | what it changed |
|---|---|---|---|
| 0 | 43 | — | walk + Q on alternate ticks |
| 1 | 86 | HP falls symmetrically 100→88→72→59→32→19→5; "we walk in a straight line, every enemy Q comes from the same diagonal, we never dodge"; projectiles carry `dx,dy` | dodge perpendicular to the projectile vector; use all four spells; with no cooldowns, spam E |
| 2 | 135 | bot didn't move for 4 s; both R's land at T2265 and HP drops to 64% for both; "R has a long travel time and both hit each other equally" | approach at an angle while casting; don't poke with R from max range |
| 3 | 124 | distance never closes below ~5,000; "game_time increments by ~250 each step, so `game_time // 250` gives a tick counter" | tick-based action cycling; always move or cast, never idle |
| 4 | 160 | we're at 4%, enemy at 31%; "the E blink puts us right on top of the enemy where we eat all their abilities" | E to a flank, not onto the target; dodge between every cast |
| 5 | 141 | enemy at 29%, us at 61% — ahead; movement still predictable; `ACT` lists `auto` and we never use it | interleave auto-attacks; only dodge projectiles actually closing; E for damage, never escape |

The last policy is the demo build — commit message: "latest policies, far better for demo, more aggro."

**What the loop could and couldn't do.** It could read a fight from text and reason about it correctly — the tick-rate derivation, the geometry, the "both R's hit each other" diagnosis are all right. It kept its lessons. And it was still writing `if/else` with a frontier-model call per episode, which is a fine way to discover a strategy and no way at all to execute one at 250 ms. That was the division of labour I took forward.

I thought about scaling this up and then realised, training an RL agent is just more efficient. However, this taught me that LLMs can be highly efficient for diagnosing agent behaviour
which becomes crucial for the work in brokenwings.

## Brokenwings

Ok so we now have the history, years of attempts at creating agents in half-baked simulators without any real results to show for it aside from LLM-based python scripts which can
sort of dodge and agents which maximise their distance from each other.
So whats different now? Well firstly we have LLMs which heavily automate the programming aspect of experiments and then I saw [Brokenwings](https://gitgud.io/skelsoft/brokenwings)
released.

Brokenwings is a patch 1.0.0.126 (season 1) game server simulator which uses the same framework as LeagueSandbox (C# style project skeleton) and for the most part, faithfully
reimplements the game as it was back then (sans a few bugs here and there). This was essentially feature matched as close as possible to Chronoshift which I had wanted to get
years ago!

### Initial Attempts

