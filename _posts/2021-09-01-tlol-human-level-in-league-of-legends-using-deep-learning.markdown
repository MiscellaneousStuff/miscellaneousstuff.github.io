---
layout: post
comments: true
title:  "Initial Human level League of Legends Deep Learning Agent ideas"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions,initial ideas, problem analysis, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-01 14:00:00
categories: League of Legends
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

### Bots
Since League of Legends was released in 2009, people have developed bots which are
programs which use hand-crafted rules to play the game. The purpose of these bots
are usually to level up League of Legends accounts from level 1 to level 30 (to allow
a player to play in League of Legends Ranked Solo mode which is the competitive ranked
mode of the game).

One example of an open-source botting platform is LViewLoL which is an open-source
scripting platform with additional information about the scripting platform provided
on the Unknown Cheats forum which has been active since 2000.

## Issues with Existing Solutions

## References

- [LeagueAI](https://github.com/Oleffa/LeagueAI)
- [LViewLoL](https://github.com/orkido/LViewLoL)
- [UnknownCheats League of Legends](https://www.unknowncheats.me/forum/league-of-legends/)