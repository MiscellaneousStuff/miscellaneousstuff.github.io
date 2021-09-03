---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 4 - Exploring the Literature)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-03 17:30:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post reviews successful MOBA playing AI agents within the literature, what they done
well, what could have done better and then concludes with what can be used in creating
a human-level League of Legends AI. Reviewing current literature is useful as it allows
us to utilise a variety of methods, with detailed explanations of each method, for
creating MOBA playing AI systems. This post won't the OpenAI Five (Dota 2), AlphaStar
(Starcraft 2), MuZero (Deepmind general game playing AI) or other related papers.
That will be explored in more detail later on if it's relevant to the project later.

## Exploring the Literature

### Honor of Kings
Honor of Kings is essentially a League of Legends mobile
rip-off created by Tencent when Riot Games didn't think it was feasable to create a
mobile version of League. Obviously they changed their minds later with Wild Rift. Honor
of Kings is the most widely played MOBA game in the world with a very large player base
in China. The game is estimated to have 119 million monthly active players in
[March 2019](https://www.statista.com/statistics/1004699/china-number-of-monthly-active-users-of-tencent-mobile-game-honour-of-kings/#:~:text=Premium%20statistics-,Number%20of%20monthly%20active%20users%20of,Honor%20of%20Kings%202018%2D2019&text=This%20statistic%20shows%20the%20number,dropped%20to%20around%20119%20million).



### Towards Playing Full MOBA Games with Deep Reinforcement Learning

#### Relevance

This paper presents a system which achieved superhuman performance in the Tencent mobile
MOBA game, Honor of Kings. 

### Supervised Learning Achieves Human-Level Performance in MOBA Games: A Case Study of Honor of Kings

- JueWu-SL
  - Replay Numbers (120,000 & 100 million scene/step samples -> 90/10 split, etc.)
  - Pure supervised learning approach
  - Achieved super human performance in Honor of Kings (albeit, simpler than LoL)
  - This paper gives context for the approach taken for this project
    (or at least the initial approach, we'll see...)

### Hierarchical Reinforcement Learning for Multi-agent MOBA Game

## Summary

- Summarise post

## References

### Honor of Kings
- [Statista: Active Users](https://www.statista.com/statistics/1004699/china-number-of-monthly-active-users-of-tencent-mobile-game-honour-of-kings/#:~:text=Premium%20statistics-,Number%20of%20monthly%20active%20users%20of,Honor%20of%20Kings%202018%2D2019&text=This%20statistic%20shows%20the%20number,dropped%20to%20around%20119%20million)

### Papers

- [Towards Playing Full MOBA Games with Deep Reinforcement Learning](https://arxiv.org/pdf/2011.12692.pdf)
- [Hierarchical Reinforcement Learning for Multi-agent MOBA Game](https://arxiv.org/pdf/1901.08004.pdf)
- [Supervised Learning Achieves Human-Level Performance in MOBA Games: A Case Study of Honor of Kings](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=9248616)

- JueWu-SL
- OpenAI Five
- PyLoL (act spec, obs spec)
- GCP (Pre-Emptible)
- etc.