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

### League of Legends Replays

League of Legends replays are stored as files with a ROFL (yes, really lol) file
format extension. The files are prepended with the region the game was played 
and the middle is the game id. A typical league of legends replay file looks
something like `EUW1-5237530168.rofl`. The replay file is split into two main parts,
with the first part containing metadata about the game in a JSON format, and the second
and main part of the file are the actual low level contents of the game themselves,
such as the position and stats of every game object at a point in time, the actions
which players took at each timestep, and other low level details.

This second part of the replay file is what is interesting from a machine learning
perspective. Riot Games doesn't provide official documentation as to how this
part of the file works, but unofficial attempts to understand the format overtime
shed some light on the format. The following two sections are taken from unofficial
sources from around the internet which have attempted to understand the ROFL file format.

#### Replay Metadata

The first relevant part of the replay file is a large JSON structure which contains metadata
about the replay. It contains many high level aggregated features such as damage dealt per
champion, champions and player ids within the game, number of objectives taken, gold acquired
over time, xp (experience) acquired over time and many other aggregated statistics.

Although each replay file contains a lot of high level, and potentially quite useful 
information, the data isn't granular or appropriate for creating an AI system to learn from.
The problem with the data is that the temporal resolution, in other words the amount of each
data point records, is too large. Each data point within the metadata is at most, every
60 seconds. This isn't sufficient to learn from for an AI agent.

This means that we need to investigate how to extract data from the second part of the
replay file.

#### General Binary Format

The second part of the replay file is split into keyframes and chunks. A keyframe contains
a set of packets which will recreate a League of Legends fame state at the time specified
within the keyframe. A chunk contains the server to client (S2C) packets of the game
during the timespan of a single chunk. Each keyframe and chunk is a sequence of blocks with
each block starting with a marker byte which determines its structure. A block encapsulates
a game packet.

The most important issue about this section of the data, is that it uses a custom encryption
scheme which is embedded inside of the League of Legends client. From patch 4.20 onwards,
Riot Games started encrypting their game packets to prevent tampering and cheating. As a
consequence of this, this means the game packets stored inside of rofl replay files are
also encrypted. The encryption scheme used to encrypt the game packets is stored locally
within the game *.exe client itself. This can be seen because it's possible to view 
League of Legends replays within the client when offline, presumably this is to simplify
the replay system and because it reduces the traffic and processing power which Riot Games
needs to dedicate to this service to only providing the replay files.

However, if someone was to create a method of decrypting rofl replay files, it would make
it very easy to process these replay files as the raw packet data would be available for
analysis. For the most comprehensive attempt to date for understanding the League of Legends
packet files, refer to the [LeaguePackets](https://github.com/LeagueSandbox/LeaguePackets)
project which is a part of the larger [LeagueSandbox](https://github.com/LeagueSandbox)
project. The LeagueSandbox project is an attempt to create an open-source, reverse-engineered
version of the League of Legends game server from patch 4.20, which was the last League of
Legends version to use unencrypted packets.

The main issue with the encryption scheme is that it changes every patch, for example,
replays for client version 11.15 cannot be read using client version 11.16 because the
encryption scheme changes between patches. Although it is possible to reverse-engineer
the method used to encrypt the replays every patch, this would require performing this
process every patch. The issue with this is that League of Legends is patched very
frequently compared to most games. The average patch cycle for League of Legends is
2 weeks. This means that whatever method was used to decrypt replay files for a single
patch, would need to be adapted every two weeks and on top of that, if the encryption
scheme was to change significantly between two patches, it may take even longer to
implement.

#### Downloaing Replay Files

Aside from processing the information stored within replay files, 

### Issues and Solutions Regarding ROFL Replays

The key issue regarding rofl replays are that the encr

## Summary


## References

- [GitHub: LeaguePackets](https://github.com/LeaguePackets)
- [GitHub: LeagueSandbox](https://github.com/LeagueSandbox)
- [GitHub: League Spec (League of Legends ROFL File Format Information)](https://github.com/loldevs/leaguespec/wiki/General-Binary-Format)
- [GitHub: PyLoL](https://github.com/MiscellaneousStuff/pylol)
- [Paper: MOBA: A New Arena for Game AI](https://arxiv.org/pdf/1705.10443.pdf)
- [Paper: Learning Dexterous In-Hand Manipulation](https://matthiasplappert.com/publications/2018_OpenAI_Dexterous-Manipulation.pdf)