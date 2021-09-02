---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 2 - Problem
Analysis)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-02 14:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning"]
---

## Table of Contents

* TOC
{:toc}

## Problem Analysis


### History of Game Playing AI
In the last few decades, there have been many successful examples of
artificial intelligence being used to produce human level gameplay in
a variety of different games.


#### IBM Deep Blue
The most prominent example which came to
the publics attention was the IBM Deep Blue computer
which beat the reigning world
champion Garry Kasparov at Chess. This was considered a plausable, but
nonetheless remarkable achievement as Chess had long been considered a
grand challenge for the artificial intelligence community as Chess has
long been considered a game which represented the height of intellectual
prowess among many communities around the world. IBM Deep Blue achieved
this remarkable feat by using customised hardware which was very well
optimized for running in parallel to execute the alpha-beta search
algorithm in parallel as Chess as a game is easily divisible. This
achievement was mainly thanks to the brute force capability of the computer
which was able to search 200 million chess positions per second, whereas
Kasparov when asked how many moves he evaluated into the future is quoted
as saying "Normally, I would calculate three to five moves",
"You don't need more... But I can go much deeper if it is required.".
So despite IBM Deep Blue being a remarkable achievement, clearly smarter
algorithms could produce more efficient results.

#### AlphaGo
The next prominent example of game playing AI would be the AlphaGo system 
which was created by Google Deepmind and went on to beat the world champion
Lee Sedol in 2016. Prior to this accomplishment, the best computer Go engines
were unable to take even a single game from a professional Go player due to
the greater complexity of Go where the state space is estimated to be
$$
10^170
$$


## References
- [Wikipedia: IBM Deep Blue](https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer))
- [Wikipedia: Alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [Wikipedia: Go Complexity](https://en.wikipedia.org/wiki/Machine_learning_in_video_games#Deep_learning_agents)