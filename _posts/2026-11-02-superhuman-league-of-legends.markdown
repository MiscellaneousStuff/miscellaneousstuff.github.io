---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027"
excerpt: ""
date:   2026-11-02 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Data Scraping"]
tags: [""]
---

## Table of Contents

* TOC
{:toc}

## Overview

We are guaranteed to have super human League of Legends AI game playing agents by the end of
2027, here is why and what this means for one of the oldest and most enduring e-sports
franchises in the world.

League of Legends is a MOBA franchise developed and published by Riot Games. In 2021, Riot
reported [180M players](https://www.techspot.com/community/topics/league-of-legends-franchise-hits-180-million-monthly-active-players.272013/) across its five games (LoL, Wild Rift, Legends of Runeterra, TFT and Fight for the Golden Spatula).

For the last 15 years players have competed against each other to be crowned the best
team in the world with one team, and one particular player often winning the crown:
SKT (T1) and Faker.

Faker is considered by many to be the greatest player to have ever played the game, mainly
for having won more than any other player (6 world championship titles to date, possibly
7 after this month) across different eras (spanning from 2013 to 2025), with a variety
of players.

In South Korea and across Asia (and amongst much of Gen Z in the west as well) Faker is
to e-sports what Michael Jordan, or Messi/Ronaldo are to traditional sports.

Its no exaggeration to say that beating T1/Faker would capture the publics imagination
similar to [IBM Deep Blue beating Garry Kasparov](https://en.wikipedia.org/wiki/Deep_Blue_versus_Garry_Kasparov) or [AlphaGo beating Lee Sedol](https://en.wikipedia.org/wiki/AlphaGo_versus_Lee_Sedol).

Before OpenAI became world famous for releasing ChatGPT to the public
in late 2022, they were originally known for beating the two-time world champions (OG) at
Dota 2 in 2019 (albeit it was under restricted game conditions).

However, why does any of this matter?

AlphaGo's show match against Le Sedol pushed the frontier of what learning systems were
able to achieve in a dramatic fashion. Go is a game played by hundreds of millions of people
all across Asia and was thought to be 10 years away in 2016 from being solved.

IBM Deep Blue showed that the greatest human chess player could now be beaten by, an
admittedly cruder and more narrow form, of artificial intelligence.

Whereas OpenAI Five showed that the learning algorithm itself not need be embued with
finnicky human assumptions on *how* to play the game, rather it was provided the environment
and rewarded for actions which *lead* to winning the game. Eventually the model was simply
just rewarded for winning the game and this was enough for the learning algorithm to improve
so a superhuman level as well.

Ok so thats all well and good, but again this is just beating humans at video games, why
does this matter?

Each one of these achievements lead to more profound impact.

AlphaGo was part of DeepMind's RL lineage spanning back to DQN (and arguably going even
further back to the individual contributors reach backgrounds). DQN (Deep Q-Networks) were
a breakthrough application by DeepMind which showed how to combine deep neural networks (DNNs)
with reinforcement learning (RL) and computer vision (CNNs specifically). This allowed
systems to simply observe games (Atari games), try different actions, and improve at the game
simply by playing the game and without having to hand-craft rules around *how* to play the game.
This RL lineage arguably spurred on OpenAI Five's PPO (Proximal Policy Optimisation) lineage
which allowed them to beat the world champions, without any human training data or forcing how
the agent should play. PPO goes on to be combined with GPT-3 in 2021 in the InstructGPT paper,
specifically to tune their "amazing next word predictor" towards tasks using RLHF. That system
became known as "ChatGPT".

## Appendix

### League of Legends Playerbase Count

It's difficult to determine exact player base numbers for League of Legends but we do know
certain things for sure.

u.gg (who source their information directly from Riot's official API) report (all ranks
and all regions where data is available which is everywhere outside of China which is
instead administered by Tencent):

| Game Mode | Champions Analysed per patch (estimate) |
| Ranked Solo/Duo | ~200M per month |
| Ranked Flex | ~20M per month |

However many Ranked Solo/Duo players also play flex and many players play more than one
game per patch, these are the upper bounds per game mode.