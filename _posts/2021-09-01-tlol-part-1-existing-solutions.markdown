---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 1 - Existing Solutions)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-01 14:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL"]
leagueAiYoutubeId: iB4PoNJuXzc
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post reviews existing League of Legends AI systems from different games
which have been released by Riot Games themselves, to bots and scripts which
have been ever present since the initial release of the game and finally to
recent academic approaches which have used cutting-edge AI techniques to
create AI systems which can play League of Legends.

## Existing Solutions


### League of Legends: Wild Rift inbuilt AI
The League of Legends mobile spin-off game, Wild Rift, is a game developed in Unity
and released as a game on the iOS App Store and Google Play Store. Reverse engineering
the game using [Il2CppInspector](https://github.com/djkaty/Il2CppInspector), which converts the Unity source code of the game into an intermediate representation along with the original meta-data, allows the function labels, data types and parameters to be recovered.

From this, we can determine how the app
is made and even inject code using the metadata which associates function labels with
their addresses in the final game binaries (at least for Android). The benefits of this
for creating a human level League of Legends AI is that it may be possible to reverse
engineer how the AI, which is included with the game, works and even setup a reinforcement
learning environment using the mobile game.

This may be possible as the practice tool
mode of the mobile game is still functional even when the player is disconnected from
the internet. Also the source code is relatively easy to reverse engineer compared to
the main desktop game.

<div style="text-align: center;">
   <img
      src="/assets/wild_rift/wild_rift_replay_source.PNG"
      style="width: 100%; max-width: 640px;"
   />
</div>

Example source code for the replay system of Wild Rift. Could potentially be used
to extract information from Wild Rift replays in a future project.

### League of Legends: Beginner and Intermediate bot
League of Legends contains two main "co-op vs AI" game modes which stands for
co-operative vs AI which pins 5 players against a team of five AI controlled players
which the game server implements (this may be implemented using Lua based
on reviewing the games files).

For the purpose of creating a human level League of
Legends AI, the built-in bots are only useful as a way of testing that any AI agent
which has been trained can at least beat the built-in bots, as this is considered a
trivial task for any player which is at least within the top 50% of the playerbase
(which would be Silver I or above).


### LeagueAI

<div style="text-align: center;">
{% include youtubePlayer.html id=page.leagueAiYouTubeID %}
</div>

LeagueAI is a project created by a PhD student from Aalto University in Finland.
The project uses YOLOv3 to perform object detection from the games RGB output in
real time by generating a synthetic dataset of game objects of interest
including the following:
- Vayne (a champion within the game)
- Minions (important NPC characters within the game)
- etc.
and then training the system on the synthetic data.

The agent then uses the real-time object recognition model to determine which game
objects are within it's view, where they are and uses a simple neural network to determine 
which actions to perform.


### Deep Learning Bot for League of Legends
This paper describes another agent which, like the LeagueAI system, uses YOLOv3 for
object recognition to identity the type and location of different game objects within
the current RGB viewport of the game. However the paper is the first attempt at using
machine learning methods to improve the decision making of the agent.

The paper describes two main ways of training the agent.
The first method uses an LSTM model to clone the behaviour of human players whereas
the second method uses a combination of PPO for training and an LSTM network for the
policy network (PPO-LSTM).
Both methods could achieve the set objective which was to achieve first blood against
an in-built bot. However for the PPO+LSTM network, an additional reward of keeping a
certain distance away from enemy objects was also included to enable the agent to learn
the kiting mechanic (attacking an enemy unit and immediately retreating to make
retaliation more difficult). The resulting behaviour of the PPO-LSTM network
was superior to the purely behavioural cloning approach as the PPO-LSTM agent's behaviour
was smoother than the purely LSTM network.
Also the LSTM-only network exhibited strange patterns such as randomly clicking back and 
forth in the presence of enemies as the agent had not sufficiently mastered kiting from
the human demonstrations.

### Bots and Scripts
Since League of Legends was released in 2009, people have developed bots which are
programs which use hand-crafted rules to play the game. The purpose of these bots
are usually to level up League of Legends accounts from level 1 to level 30 (to allow
a player to play in League of Legends Ranked Solo/Duo mode which is the competitive ranked
mode of the game). Another use of these bots is for scripting which automatically
performs mechanical actions for the player based on handcrafted rules. These bots typically
use open or closed source scripting platforms.

One example of an open-source scripting platform is [LViewLoL](https://github.com/orkido/LViewLoL) which is an open-source
scripting platform which provides an interface to a running League of Legends game
process running on Windows. The interface runs as a compiled C++ console application
which runs while the game process is running and provides an interface for Python
scripts to receive observations from the game and perform actions as the user within
the game.

The scripting interface allows a python script access to observations which
the user is not able to see on the screen such as the positions of all game objects
on the map.

The C++ console application uses a system call called [ReadProcessMemory()](https://docs.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-readprocessmemory) which
allows a non-priviliged process to access the virtual memory space of another running
program to read it's memory. The system call relies on multiple context switches, i.e.
it needs to switch from user space to kernel space back to user space to transfer the
memory from the target processes memory space to the requesting process.

## Issues with Existing Solutions
The main issue with the existing solutions for creating a human level league of legends
agent are both perceptual and behavioural with both issues outlined below:

### Perceptual
The LeagueAI system solves the perceptual issue by using a mixture of synthetic and
real image data from within the game to generate a dataset to train YOLOv3, which is
a real-time object recognition system, to locate game objects from the RGB output
of the game. Real-time object recognition has been used for perception in game playing
AIs across different approaches such as [AlphaStar](https://www.nature.com/articles/s41586-019-1724-z), the original DQN paper and other game playing AIs.

The purpose of using image recognition techniques
in these systems was to prove that it was possible to use image recognition, specifically
CNN-based image recognition systems as the perceptual system within a larger game playing
AI for reinforcement learning systems which allows the systems to be fully trained end-to-end.

However, there is a major downside to this in that
this isn't as effective as using raw features from the game for perception as the system
must learn to how to recognise objects within the game, and then based on it's representation
of the game, which decisions to make. This adds additional complexity to the task which
is unnecessary if the goal is purely to make a system which can play the game as well as
possible. It also increases the compute cost of the system. This is the main reason
that [Open AI Five](https://cdn.openai.com/dota-2.pdf) uses raw features instead of image recognition for perception and is the
same reason this project will not use it as well.

### Behavioural
Aside from the Deep Learning Bot for League of Legends, all of the existing systems use
rule based behaviour to their respective bots. As for the Deep Learning Bot paper, the best
performing method within the paper uses a combination of PPO (Proximal Policy Optimization)
and an LSTM network for the policy model to control the bot and the bot is able to achieve
a first blood on an enemy opponent while keeping it's distance. This represents the first
successful example of reinforcement learning applied to League of Legends. However, this
method is limited as the number of samples of the environment which can be collected using
this method is limited by two main factors:

1. **Number of Simulations of the environment**

   Currently, Riot Games (the developers of League of Legends) provide no API for scripts or
   bots (unlike the Dota Bot Scripting API from Valve or PySC2 module released by Deepmind
   in conjunction with Blizzard). This means that not only is it not easy to quickly start
   games at the velocity requried to get PPO to work, it's also not easy to access raw
   observational information from the game or input actions into the game without the risk
   of the associated League of Legends account being banned for scripting. This is a problem
   for this project if we want to train our system using reinforcement learning because
   current reinforcement learning algorithsm (particularly online reinforcement algorithms)
   are relatively sample inefficient and require a lot of experience before they start
   converging towards human-level performance. [AlphaStar](https://www.nature.com/articles/s41586-019-1724-z)], [Open AI Five](https://cdn.openai.com/dota-2.pdf) and other systems
   are good evidence for this.

2. **Current Observation Methods**

   Current observation (i.e. perception) methods used for League of Legends AI's rely on using real-time
   object recognition models such as YOLOv3 to detect relevant game objects. The limitation
   of this method for creating a human level League of Legends AI is that, firstly the 
   method is limited based on the performance of the object recognition systems accuracy
   (how reliably it detects game objects) and secondly it is limited based on the fps (how quickly it can detect objects) of the system. This limits it's applicability
   as a powerful GPU would be required to run the object recognition system in real time and
   and to simulatenously run the agent model.


## Summary
In summary, the primary issue is the lack of API support for creating an machine learning agent from Riot Games. Specifically, there is no API for conveniently capturing
observations from the game engine, inputting actions into the game and running many games at large scale
with low friction. This is a problem because the main method used to achieve human-level
performance in RTS-style games is reinforcement learning. However we will see later in
the series that it is possible to use other AI training methods to reduce the amount
of data required to train a human-level League of Legends AI.


## References

### Game Playing AI's
- [Paper: Original DQN Paper](https://www.cs.toronto.edu/~vmnih/docs/dqn.pdf)
- [Deepmind: AlphaStar](https://deepmind.com/blog/article/alphastar-mastering-real-time-strategy-game-starcraft-ii)

### League of Legends AI Research Projects
- [Paper: Deep Learning Bot for League of Legends](https://ojs.aaai.org/index.php/AIIDE/article/view/7449/7348)
- [GitHub: LeagueAI](https://github.com/Oleffa/LeagueAI)

### League of Legends Hacking and Scripting
- [Scripting: LViewLoL](https://github.com/orkido/LViewLoL)
- [Forum: UnknownCheats League of Legends](https://www.unknowncheats.me/forum/league-of-legends/)
- [Software: HexRays IDA Pro](https://hex-rays.com/ida-pro/)
- [GitHub: Il2CppInspector](https://github.com/djkaty/Il2CppInspector)

### Real-Time Object Recognition
- [GitHub: YOLOv3](https://github.com/ultralytics/yolov3)