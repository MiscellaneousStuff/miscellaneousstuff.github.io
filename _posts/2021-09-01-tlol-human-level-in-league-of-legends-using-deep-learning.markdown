---
layout: post
comments: true
title:  "Initial Human level League of Legends Deep Learning Agent ideas"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions,problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-01 14:00:00
categories: [League of Legends]
leagueAiYoutubeId: iB4PoNJuXzc
---

# TLoL: Human level in League of Legends using Deep Learning (Part 1 - Existing Solutions)

### League of Legends: Wild Rift inbuilt AI
The League of Legends mobile spin-off game, Wild Rift, is a game developed in Unity
and released as a game on the iOS App Store and Google Play Store. Reverse engineering
the game using IL2CPP which converts the Unity source code of the game into an intermediate representation along with the original meta-data allows the function labels ,data types and parameters to be recovered.

from this, we can determine how the app
is made and even inject code using the metadata which associates function labels with
their addresses in the final game binaries (at least for Android). The benefits of this
for creating a human level League of Legends AI is that it may be possible to reverse
engineer how the AI, which is included with the game works and even setup a reinforcement
learning environment using the mobile game.

This may be possible as the practice tool
mode of the mobile game is still functional even when the player is disconnected from
the internet, and the source code is relatively easy to reverse engineer compared to
the main desktop game.


### League of Legends: Beginner and Intermediate bot
League of Legends contains two main "co-op vs AI" game modes which stands for
co-operative vs AI which pins 5 players against a team of five AI controlled players
which the game server presumably implements (this may be implemented using lua based
on reviewing the games files).

For the purpose of creating a human level League of
Legends AI, the built-in bots are only useful as a way of testing that any AI agent
which has been trained can at least beat the built-in bots as this is considered a
trivial task by any player which is at least within the top 50% of the playerbase
(which would be roughly Silver I).

### LeagueAI
{% include youtubePlayer.html id=page.leagueAiYouTubeID %}

LeagueAI is a project created by a PhD student from Aalto University in Finland.
The project uses YOLOv3 to perform object detection from the games RGB output in
real time for perception by generating a synthetic dataset of game objects of interest
including the following:
- Vayne (a champion within the game)
- Minions (important NPC characters within the game)
- etc.

The agent then uses the real-time object recognition model to determine which game
objects are within it's view and uses a simple neural network to determine which actions
to perform.

### Bots and Scripts
Since League of Legends was released in 2009, people have developed bots which are
programs which use hand-crafted rules to play the game. The purpose of these bots
are usually to level up League of Legends accounts from level 1 to level 30 (to allow
a player to play in League of Legends Ranked Solo mode which is the competitive ranked
mode of the game). Another use of these bots is for scripting which automatically
performs mechanical actions for the player automatically which allows the player to
perfectly react to other players using hand-crafted rules. These bots typically
use either open or closed source scripting platforms.

One example of an open-source scripting platform is LViewLoL which is an open-source
scripting platform which provides an interface to a running League of Legends game
process running on Windows. The interface runs as a compiled C++ console application
which runs while the game process is running and provides an interface for Python
scripts to receive observations from the game and perform actions as the user within
the game. The scripting interface allows a python script access to observations which
the user is not able to see on the screen such as the positions of all gameobjects
on the map (not sure if that includes objects outside of the fog of war at this point
thought :/).

The C++ console application uses a system call called `ReadProcessMemory()` which
allows a non-priviliged process to access the virtual memory space of another running
program to read it's memory. The system call relies on multiple context switches, i.e.
it needs to switch from user space to kernel space back to user space to transfer the
memory from the target processes memory space to the requesting process. Because of this
context switching, this limits the amount of times this process can be called, which can
be alivated by requesting larger blocks of memory as the call takes roughly the same
amount of time regardless of the amount of memory requested.

## Issues with Existing Solutions
The main issue with the existing solutions for creating a human level league of legends
agent are both perceptual and behavioural with both issues outlined below:

### Perceptual
The LeagueAI system solves the perceptual issue by using a mixture of synthetic and
real image data from within the game to generate a dataset to train YOLOv3, which is
a real-time object recognition system, to locate gameobjects from the RGB rendering
of the game. Real-time object recognition has been used for perception in game playing
AIs across different approaches such as AlphaStar, the original DQN paper and subsequent
attempts and other game playing AIs. The purpose of using image recognition techniques
in these systems was to prove that it was possible to use image recognition, specifically
CNN-based image recognition systems as the perceptual system within a larger game playing
AI for reinforcement learning systems. However, there is a major downside to this in that
this isn't as effective as using raw features from the game for perception and it has
inherently less explainablility which means that it is harder to debug and diagnose issues,
and to verify how this specific part of the system is improving.

## References

- [Windows API - ReadProcessMemory()](https://docs.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-readprocessmemory)
- [Original DQN Paper](https://www.cs.toronto.edu/~vmnih/docs/dqn.pdf)
- [AlphaStar](https://deepmind.com/blog/article/alphastar-mastering-real-time-strategy-game-starcraft-ii)
- [LeagueAI](https://github.com/Oleffa/LeagueAI)
- [LViewLoL](https://github.com/orkido/LViewLoL)
- [UnknownCheats League of Legends](https://www.unknowncheats.me/forum/league-of-legends/)
- [HexRays IDA Pro](https://hex-rays.com/ida-pro/)