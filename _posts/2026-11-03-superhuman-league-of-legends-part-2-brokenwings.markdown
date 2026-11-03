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