---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 3 - Initial Ideas)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-03 08:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL"]
leagueAiYoutubeId: yVUKi63WfDA
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post explores how to extract information from League of Legends replay files,
converting the extracted information into a format suitable for Jupyter Notebook,
exploring the data within the replays, visualising the data and intuitions about
the data. Recent approaches at creating human level MOBA deep learning agents
are also briefly explored with the key ideas being related to creating a human-level
League of Legends AI.

## Initial Ideas

### Acquiring Data

The previous posts highlighted the main difficulties with creating human level game
playing AIs. The central issue with all of these systems was having enough high
quality data to learn from. It is highly recommended to read [part 1](https://miscellaneousstuff.github.io/project/2021/09/01/tlol-human-level-in-league-of-legends-using-deep-learning.html)
and [part 2](https://miscellaneousstuff.github.io/project/2021/09/02/tlol-human-level-in-league-of-legends-using-deep-learning.html)
of this series for better context going forward if you are not already familiar
with the [history of League of Legends AI systems](https://miscellaneousstuff.github.io/project/2021/09/01/tlol-human-level-in-league-of-legends-using-deep-learning.html) or [game playing AI systems](https://miscellaneousstuff.github.io/project/2021/09/02/tlol-human-level-in-league-of-legends-using-deep-learning.html).

For instance, recent AI systems which were built to
play board games, could directly simulate the games as the rules governing board
games such as Chess and Go are very simple to implement on CPUs and those board
games only contain a limited number of overall moves per game. An average Chess
game only contains 40 moves per game whereas an average game of Go contains roughly
200 moves per game. On the other hand, MOBAs such as Dota 2, or League of Legends,
require a player to make 1000s of decisions over the course of a game. For a more
thorough examination of why MOBAs are a complicated problem for AI, refer to
["MOBA: A New Arena for Game AI"](https://arxiv.org/pdf/1705.10443.pdf).

As highlighted in previous posts, training a deep learning based AI agent
for League of Legends requires data, and potentially, quite a lot of data.
There are two main ways of acquiring data for this task:

#### Data Acquisition Methods

1. **Simulate many games to generate data**
   This approach would require an API for League of Legends which would allow
   a developer to automatically provision games, the players within the game,
   customise variables within the game and to integrate that into a more general
   machine learning framework. Not only would this require the support of Riot
   Games, as such an API doesn't currently exist (as of 03/09/2021), it would
   also be a large and complicated undergoing even if the API did exist. This
   is highlighted as a relevant issue by OpenAI within their blog posts, where
   they mention that a major issue, especially early on for their efforts, was
   managing the integration of the Dota Bot Scripting API in conjunction with
   their own software.

2. **Use human replays**
   On the other hand, it is also possible to train an AI system using human
   replays. The human replays serve as expert examples of how to play the
   game.
   
   A machine learning agent would then be trained to either, learn
   how human experts responded in similar situations and training the bot
   to copy the responses. This would be done using a supervised learning
   approach where the agent is provided an equivalent observation which
   humans were provided in-game, and is then trained to predict what action
   the human would have taken in the same situation.

   An alternative approach would be to use an offline reinforcement learning
   approach whereby an agent would also be provided with an in-game observation,
   the same as above. However, the agent would also be provided with a reward
   so the agent is provided with trajectories (state, action, reward) or
   (s, a, r) tuples (where the state is the observation). This constrasts
   with the supervised learning approach where the agent is only provided
   with the observation and the action and is only trained to repeat the 
   action. The benefit of using offline reinforcement learning, or in this 
   case, offline inverse reinforcement learning (offline IRL), is that the
   agent can learn to infer what was good about what the human experts did,
   and then copy that. But it is also possible for the agents to learn how
   to perform better than the examples provided as they are learning
   trajectories of responses, rather than merely copying them.

### Deciding on a Data Acquisition Method

Out of the two data acquisition methods listed above, the most feasible
one is to use human replay data. The main reasons are that the reason
that previous game playing AI approaches have used massively
scaled up, distributed and parallel simulations of the target games are
that this projects were undertaken by large AI research organisations which
had research goals in mind. For instance, the OpenAI Five system created by
OpenAI was created to prove that the Proximal Policy Optimization (PPO)
algorithm could learn to play a popular, complicated esports game which
would garner a lot of attention if they could achieve that goal, and
also for many of the reasons mentioned within
the ["MOBA: A New Arena for Game AI"](https://arxiv.org/pdf/1705.10443.pdf)
paper. OpenAI done this with the intention of applying the same algorithm
to more complex and real-world focused tasks as well and they were successful.

The PPO algorithm has been used everywhere from improving the dexterity
of [robot hand manipulation](https://matthiasplappert.com/publications/2018_OpenAI_Dexterous-Manipulation.pdf), to improving the locomotion of
[quadrupedal robots](https://www.researchgate.net/publication/339471102_Guided_Constrained_Policy_Optimization_for_Dynamic_Quadrupedal_Robot_Locomotion)
and even to my own work of training a basic League of Legends agent to
[avoid another agent](https://github.com/MiscellaneousStuff/pylol).

### LeagueAI
<div style="text-align: center;">
{% include youtubePlayer.html id=page.leagueAiYouTubeID %}
</div>

Deepmind also had similar reasons for using a similar system when creating AlphaStar,
and also because, in theory and in practice, reinforcement learning systems can
achieve superhuman performance as they learn for themselves how to play games.

For the purpose of this project, I do not have the budget nor the 
resources or the support of Riot Games to attempt such a massive undertaking.
So for these reasons, I have decided on using human replay data for the purposes
of cost, the fact that human replay data alone is sufficient for the task,
scale and infrastructure and simplicity.

## Summary


## References

- [GitHub: PyLoL](https://github.com/MiscellaneousStuff/pylol)
- [Paper: MOBA: A New Arena for Game AI](https://arxiv.org/pdf/1705.10443.pdf)
- [Paper: Learning Dexterous In-Hand Manipulation](https://matthiasplappert.com/publications/2018_OpenAI_Dexterous-Manipulation.pdf)