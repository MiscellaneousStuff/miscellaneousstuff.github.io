---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 5 - Download Scraping)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-08 18:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL", "Data Scraping"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

Following the conclusions of [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html), we will be implementing the first system out of the two
systems which need to be created to extract data from replays which we need. The first system
was the **Automated Replay Downloader**. The **Automated Replay Downloader** is responsible
for downloading replays matching a certain criteria. What we will find in this post, is that
the assumptions and evidence presented in [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html) are incorrect, and luckily for us,
were far too pessimistic.

## Downloading Scraping

### Overview

The basic idea behind the replay scraping is to find replays which match a certain criteria,
build a list of game IDs which match the criteria and download the list of replays. There are
many criterias which can be used to determine which replays need to be downloaded. From the
literature review, we found that the JueWu-SL system was largely successful because of their
data selection process within their method.

The rough criteria used in their system for deciding which replays to download include the
following:

#### Top 1% of Players

All of the replays came from the top 1% of players. For the League AI system, I will be
using replays from the Europe West (EUW) region which is widely considered to be the best 
region outside of the best region in China and the Korean (KR) region.

#### 100,000,000 Samples

The paper also describes how the final dataset is comprised of 100 million data samples.
The paper doesn't clearly indicate what a sample is, this could either be a frame
(a single observation of the game at a single point in time), or this could refer to
scenes. Scenes are collections of observations which relate to a single instance of
something happening in the game. For instance, the `Combat` scene refers to players
fighting against each other, the `Navigation` scene refers to players moving from
one global intent region to another. For further details, refer to [part 4](https://miscellaneousstuff.github.io/project/2021/09/04/tlol-part-4-exploring-the-literature.html).

For our system, we can calculate how many replays are required to get us 100,000,000
samples. In theory, if the average high elo game in EUW takes [26 minutes to complete](https://www.leagueofgraphs.com/rankings/game-durations),
including games which end in surrender, then:

```python
obs_per_sec  = 8  # Observations per second
secs_per_min = 60 # Seconds per minute
obs_per_min = secs_per_min * obs_per_sec
mins_per_game = 26 # Mins per Game
obs_per_game = mins_per_game * obs_per_min
obs_per_game := 12480
min_games = 100,000,000 / obs_per_game
min_games := 8012.820 # Minimum games required to get 100M frames for training
```

So from those calculations, we can see that it takes a minimum of 8,012 games to
reach our target frame count of 100,000,000 if we're recording 8 frames per second
during a game.

However, if we only download the minimum number of games which we may need, that
doesn't give us the flexibility to process more games if the quality of the games
which covers the 100M frames is poor in some of the games. For that reason, I will
download 10,000 games, as that gives an additional 2,000 games for this stage which
in theory means we have a maximum **124,810,000** frames available, so we can
disregard **24,810,000**, or roughly 25% of the dataset if it's not suitable.

### Selecting League Replays

Now we know that we want to download **10,000** replays, we need to select a champion
to download the replays for. The reason why we want to download replays of just a single
champion, is because trying to create a system which is general enough to learn from
observing multiple champions and roles is very complicated. OpenAI Five, AlphaStar and
other game playing AI systems all train models to play either one hero, or one race,
respectively. The question of how to create a model which can generally learn to play
as champions, which have different action spaces, is an open problem.

For that reason, I will be downloading **10,000** replays for a single champion. I will
also be downloading replays only where the player playing the selected champion won the game.
From the research this seems to be a standard procedure as, in theory, if a player won the game, they are more likely to have been playing better and contributed to winning the game.

### Selecting a Champion

I will be choosing Ezreal as the champion to scrape replays for, for several reasons.

The
first reason will be that Ezreal is a relatively simple champion mechanically as all of
his abilities are simple skillshots. Also, the attack damage carry (ADC) role should in theory be the easiest
role to learn macro (deciding where on the map an action should take place next).

This
can be seen from the provided Jupyter Notebook where you can see the activity heatmaps
in different global intent regions per role. The ADC role shows the least variety compared
to other roles and strongly clusters in the bot lane (bottom-right side of the map).

Another reason is that, the [LoLRLE](https://github.com/MiscellaneousStuff/pylol) project
contains an implementation of Ezreal (the LoLRLE uses a League Server emulation, and
has implemented Ezreal relatively well). This means that we can test what the model has
learned without having to rely on the game client.

### Method

## References

Summary

## References

<!--
https://www.leagueofgraphs.com/rankings/game-durations
-->

<!--
Papers
- JueWu-SL
>