---
layout: post
comments: true
title:  "Initial Human level League of Legends Deep Learning Agent ideas"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions,initial ideas, problem analysis, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-01 14:00:00
categories: [League of Legends]
leagueAiYoutubeId: iB4PoNJuXzc
---

# TLoL: Human level in League of Legends using Deep Learning

## Existing Solutions

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
agent using deep learning.

## References

- [LeagueAI](https://github.com/Oleffa/LeagueAI)
- [LViewLoL](https://github.com/orkido/LViewLoL)
- [UnknownCheats League of Legends](https://www.unknowncheats.me/forum/league-of-legends/)
- [HexRays IDA Pro](https://hex-rays.com/ida-pro/)