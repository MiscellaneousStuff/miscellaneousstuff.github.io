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

### Voyager

Many years later, in early 2025, I had more spare time and decided to re-ignite the League RL-style approach based on a different fundamental understanding. Perhaps the RL approach
is inefficient not because of our simulator, but the sample efficiency of our learning method? What if we could use LLMs with their strong pre-existing world knowledge to learn
how to play League of Legends?

The main basis of this idea were several RL / game playing LLM based projects from 2023 and my research into agentic coding systems in 2024.
- Voyager (NVIDIA et al., May 2023): a GPT-4 era agent that played Minecraft open-endedly by proposing its own tasks, writing JavaScript skills against the game’s API, and keeping the ones that worked in a retrievable library with no gradient updates at all. It reached diamond tools 15× faster than ReAct/AutoGPT-style baselines. But it saw the world as text and spent an LLM call per decision.
- Eureka (NVIDIA et al., October 2023): GPT-4 given an environment’s source code writes reward functions, which are trained in parallel and refined from their own training statistics. It beat human-written rewards on 83% of 29 tasks and taught a simulated hand to spin a pen. It only works because Isaac Gym makes training sixteen candidates at once cheap - using the LLM designs, a fast simulator does the learning.

