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
to create a simulator with enough fidelity to be able to train agents which could faithfully play the game. Even with the source code access we encountered fidelity issues when actually running agents back in the live game environment.

Clearly Riot Games does not provide the source code for the modern game, anything resembling the Bot API for Dota 2
or `pysc2` for Starcraft II.

This leaves us with a few options:
1. [Acquire](https://miscellaneousstuff.github.io/project/2023/12/23/tlol-part-7-dataset-transformation.html) *.rofl files (League of Legends replay files) to build out a dataset of game server behaviour to faithfully re-implement the server with a ground truth source of its behaviour
2. Use neural network based world simulators (similar to [Genie 4](https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/)) to simulate the game
3. Use online game replays with computer vision methods to extract game rules (similar methods have been used by the [League Wiki](https://wiki.leagueoflegends.com/en-us/) authors at times to infer precise timing information for champions)

The main issue with option 2 and 3 is the fidelity gap between its produced world models and the target game, which then
also changes every patch (~2 weeks).

This only leaves option 1 but confers separate problems. League of Legends `*.rofl` files are encrypted, with their
encryption changing every patch, however, the game client is able to play replays every patch (which inherently requires
decrypting the data).

## Memory Reading

This means that [memory reading methods](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html#replay-scraping) are robust to patch changes (or at least only require re-discovering
the memory offset locations for specific game objects and their fields which is relatively trivial using signature based
detection every patch).

However memory reading methods are simulatenously slow and fall victim to sampling noise (*when* you read memory, results
in inconsistent data output unless you run it at very slow speeds). The other option is capturing the functions which
the game client itself uses to decode replays.

## Packet Capturing

<div class="key-findings" markdown="1">
For some context, `*.rofl* files contain amongst many things the stream of S2C (server-to-client or in other words
the authoratative commands sent from the League of Legends game server to a player). However they do not contain
C2S (client-to-server) packets but these are recoverable from the League client itself as they are inherently
client-side.
</div>

Henry Zhu wrote this [great blog post](https://maknee.github.io/blog/2025/League-Data-Scraping/) last year and directly
contrasted the TLoL projects memory reading approach with the affordmentioned method.

His post outlines how not only is this method faster, but also recovers the exact data within the `*.rofl` replay file.

Our replay scraper took:
26 mins / 16 replay multiier + 0.25 mins loading speed ~= 1.6 minutes per game = 96 seconds for a 26 minute replay.

His approach instead took 5 seconds per game (although the completeness of the data is also dependent on understanding
what the decoded packets mean, otherwise you just have seemingly random data).

## Appendix

<!-- add section explaining openai five comparison training throughput wise -->