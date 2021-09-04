---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 4 - Exploring the Literature)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-04 10:00:00
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

Honor of Kings is relevant to this literature review as the majority of the research
concerning MOBAs, aside from OpenAI Five, comes from Tencent's AI Lab.
To summarise, Tencent have copied and improved upon the techniques which Open AI originally 
used in their Open AI Five system.
However, they have also explored other techniques such as using purely supervised
learning approaches on human expert data, hierarchical learning approaches and others
which are useful for building a human-level League of Legends AI.

<!--
### Towards Playing Full MOBA Games with Deep Reinforcement Learning

#### Relevance

This paper presents SOTA results for Honor of Kings and has been massively deployed on Honor of Kings for over 600,000 games against High King level players, which
is the equivalent of about grandmaster or challenger in League of Legends.

#### Summary

The paper proposes a curriculum self-play learning environment, similar to the one used
in AlphaStar by Deepmind, off-policy adaptation, multi-head value estimation (similar to
the attention layer in transformer networks), MCTS for assigning training and playing a large
number of heroes.

#### Useful Ideas

The majority of these techniques are useful in the context of building a reinforcement
learning system to train an agent which won't be useful for creating a human-level League AI
using replay data. However, there are many smaller techniques used by the paper which can
be applied to training the human-level League AI. For instance, the paper suggests using
action masks over actions which can not be performed at a certain timestep to prevent
exploration of actions which are not possible (invalid actions can still be selected in the
OpenAI Five paper as far as I can tell. I think the way they avoid performing the action is
by picking the next available action which the policy network thinks is good).

Another interesting idea the paper proposes is that the order in which certain concepts are
presented to a deep learning agent affect training. The paper explains how disordered hero
lineups affect performance. What this means, in the reinforcement learning context of the 
paper, is that training using a large variety of situations causes the agent to forget
strategies which it has learned and also slows convergence as the agent is being trained on
and evaluated against a wider variety of situations.

The paper trains agents to perform easy tasks by using fixed lineups. This is done as follows.
Divide the lineup of 40-heroes into 4 groups of 10 heroes. For each 10-hero grouping,
find lineups which have a 50%-win rate based on human playing statistics. 50% is chosen
as this indicates the matchups are even, so the drafts which are being played against
each other don't have an advantage over each other. Having drafts with even win-rates
are the most stable training regime for policy improvement.
-->

### Supervised Learning Achieves Human-Level Performance in MOBA Games: A Case Study of Honor of Kings

#### Overview

This paper is by far the most relevant to this project. The key contribution
of this paper is to use a supervised learning approach to classify observations
based on what action an expert performed next in the same situation. The system
which is introduced by the paper is known as JueWu-SL.

The key principle behind the approach is that decision making within MOBA games
can be split into two main parts at any timestep, 1) Where to go on the map for
a single hero, this is known as macro, and 2) what to do where you the hero
reaches the location, this is known as micro.

There are multiple motivations for using a supervised learning approach to create
a MOBA playing AI. For starters, a policy network can be pre-trained using a
supervised learning approach which can then be used to train the agent further
using reinforcement learning. This was crucial to the success of AlphaStar, whereby
the authors said that using a purely RL approach would have taken the system too
long to converge on the fundamentals of the game, such as how to utilise units
to perform basic actions, basic macro and other fundamental skills which Starcraft
players use to play the game. Further motivation comes from how a pure supervised
learning approach <!-- Fill in with reference to Super Smash Bros SL system--> was
able to produce a human level Super Smash Bro's AI system.

The paper suggests modeling the problem of which action the agent should take next
as a hierarchical multi-class classification problem. This is done by modelling
each observation as a multi-view intent label to model the players macro strategy
and hierarchical action labels are used for modeling micromanagement.

<!-- put in example image here of the macro and micro hierarchical labelling-->

#### Main Contributions

The main contributions of the paper, and the reason why it's so useful to this
project, are the following two reasons.

1. Supervised learning method which can apply to any MOBA game which allows
   efficient incorporation of expert knowledge. Scene-based sampling method
   to divide whole MOBA gameplay into easily tuned game snippets.
2. Supervised learning method performs comparatively against High King (roughly
   Grandmaster or Challenger in League of Legends).

- JueWu-SL
  - Replay Numbers (120,000 & 100 million scene/step samples -> 90/10 split, etc.)
  - Pure supervised learning approach
  - Achieved super human performance in Honor of Kings (albeit, simpler than LoL)
  - This paper gives context for the approach taken for this project
    (or at least the initial approach, we'll see...)

#### Method

The paper uses two main types of features throughout the system. The first type
of feature which the paper uses is a vector feature. Vector features are used to
store the game states such as number of kills, creep score, XP, and other scalar
features at each timestep. The other type of feature which is used are image-like
features which are used for representing map like images. The map like images
are 2d images from the game such as the minimap and other spatial features.

The paper also uses labels in different ways. The first type of label are "intent
labels" which are used to infer what human expert players were attempting to do
within the replay files. These intent labels are multi-viewed, as in they are
separated hierarchically, and there are separate intent labels for global and local
intents.

The next type of label are action labels which are arranged in a hierarchical
multiclass structure which contains two parts.

1. **Action to take at a high level**

   This is the overall action to take at a high level. Examples would include,
   movement action, attack action, spell action, and other general high level
   actions. This is the level 1 prediction.

2. **Discretized action parameters**

   The next level is the level 2 prediction which are the parameters for the
   level 1 action prediction. This changes dependent on the level 1 action
   prediction. For example, if the level 1 prediction is movement, then the
   level 2 prediction are the x and y offset parameters. If the action was
   an autoattack instead, then the parameter would be the unit to attack.

The action labels are the main outputs for the model and the intent labels
are used as an auxiliary task during training to improve the model performance.
The intent label is not used as an output during inference.

<!--
### Hierarchical Reinforcement Learning for Multi-agent MOBA Game
-->

## Summary

- Summarise post

## References

<!--
### Game Theory
- [Wikipedia: Nash Equilibrium](https://en.wikipedia.org/wiki/Nash_equilibrium)
-->

### Honor of Kings
- [Statista: Active Users](https://www.statista.com/statistics/1004699/china-number-of-monthly-active-users-of-tencent-mobile-game-honour-of-kings/#:~:text=Premium%20statistics-,Number%20of%20monthly%20active%20users%20of,Honor%20of%20Kings%202018%2D2019&text=This%20statistic%20shows%20the%20number,dropped%20to%20around%20119%20million)

### Papers

- [Towards Playing Full MOBA Games with Deep Reinforcement Learning](https://arxiv.org/pdf/2011.12692.pdf)
- [Hierarchical Reinforcement Learning for Multi-agent MOBA Game](https://arxiv.org/pdf/1901.08004.pdf)
- [Supervised Learning Achieves Human-Level Performance in MOBA Games: A Case Study of Honor of Kings](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=9248616)

<!--
- JueWu-SL
- OpenAI Five
- PyLoL (act spec, obs spec)
- GCP (Pre-Emptible)
- etc.
-->