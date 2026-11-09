---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 4 - Brokenwings: Initial 5v5)"
excerpt: "Now we train 5v5 agents on a restricted version of Brokenwings - no items or summoner spells"
date:   2026-11-09 00:00:00
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

## So where do we go from here?

As we're now able to train 5v5 agents on modest hardware, in the next part we will work on fully porting
10 champions on modern League of Legends for patch 26.19 and training 5v5 agents on the full game.