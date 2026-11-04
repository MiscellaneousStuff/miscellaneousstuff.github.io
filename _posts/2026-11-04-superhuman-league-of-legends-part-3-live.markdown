---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 3 - Patch 26.19: 1v1)"
excerpt: "This post discusses efforts to train agents on modern League of Legends"
date:   2026-11-04 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Behavioural Cloning", "fastsim"]
tags: [""]
---

## Table of Contents

* TOC
{:toc}

## Overview

[Previously](https://miscellaneousstuff.github.io/2026/11/03/superhuman-league-of-legends-part-2-brokenwings.html)
we covered using Brokenwings to validate creating a simulator for League of Legends which operates orders of magnitude
faster than realtime. This allowed us to simulate an Ezreal 1v1 with towers and minions at over 1 million simulation
steps per second on a single GH200 node.
If we convert that into real time experience, that means per 24 hours of training our agents were
experiencing ~342 years of gameplay per day. That is the on the same order of magnitude as OpenAI Five's training.
<!-- link to appendix section -->

However, that was an older version of the game spanning back to season 1 of League of Legends, is this applicable
to the modern game?

As a matter of fact yes, there is no fundamental engineering reason it would be any different in terms of fundamental
simulator complexity. However, `fastsim` required access to the source code of Brokenwings game server to be able
to create a simulator with enough fidelity to be able to train agents which could faithfully play the game.

Clearly Riot Games does not provide the source code for the modern game, anything resembling the Bot API for Dota 2
or pysc2 for Starcraft II.

This leaves us with a few options:
- [Acquire](https://miscellaneousstuff.github.io/project/2023/12/23/tlol-part-7-dataset-transformation.html) *.rofl files (League of Legends replay files) to build out a dataset of game server behaviour to faithfully re-implement the server with a ground truth source of its behaviour
- Use neural network based world simulators (similar to [Genie 4](https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/)) to simulate the game
- Use online game replays with computer vision methods to extract game rules (similar methods have been used by the [League Wiki](https://wiki.leagueoflegends.com/en-us/) authors at times to infer precise timing information for champions)

## Appendix

<!-- add section explaining openai five comparison training throughput wise -->