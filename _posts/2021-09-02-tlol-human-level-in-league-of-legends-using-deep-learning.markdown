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

\$$ 10^170 $$.
AlphaGo used a deep reinforcement learning model to train the weights of a
Monte Carlo tree search (MCTS). The deep learning model used 2 artificial
neural networks, a policy network to predict the probabilities of potential
moves by opponents, and a value network to predict the win chance of a given state.
This model allowed teh agent to explore potential game states more efficiently than
a vanilla MCTS. The network was initialised using human professional go data and
was then further refined by optimising the policy and value network by using
a large distributed reinforcement learning approach.

Afterwards, Deepmind created an improved version of the system called AlphaGo Zero
where the Zero denotes zero-human knowledge. This system was trained using pure
reinforcement learning and wasn't pre-trained human knowledge and achieved superior
results to the original AlphaGo system.

This marked a significant shift from the previous approach as artificial neural networks
were know being used to approximate the next action to take instead of the more traditional
approach used by IBM Deep Blue.

#### AlphaStar
AlphaStar was the first AI agent to beat professional StarCraft 2 players without any
in-game advantages and represented a major milestone for game playing AI systems.
The first version of the game was trained to use a simplied zoomed out version of the game
which was a pygame rendering of the actual game which was derived from the games raw features
which were extracted using the PySC2 library. The system was later adapted to play the game
from raw RGB features just as a human would.

The AlphaStar system was trained by bootstrapping a machine learning using a supervised
learning approach with 971,000 replays from players from the top 22% of players. The
supervised agent used the same model as the reinforcement learning (RL) agent so the RL agent
could be further trained on the same model. A separate model was trained for each race within
the game.

After initial training, the policy was further fine-tuned using only winning replays with MMR
above 6,200 MMR (16,000 games) which are players within the top 10 to 15 players. Further
fine-tuning the system on this data increased the win-rate of the bot against the built-in
elite bot from 87% to 96% in Protoss versus Protoss games. This aligns with other approaches
within the literature which show that fine-tuning a pre-trained system on the most skilled 
players winning replays can significantly improve the performance of the system.

The supervised learning approach produced an agent which performed within the top 16% of
players, which in itself was a remarkable achievement.

Further to this, the pre-trained bot was further refined using a reinforcement learning
approach which used a population training scheme where different versions of the agent
were trained to exploit the specific weaknesses of other agents to ensure that the best
overall agent was robust to a range of strategies.

The final agent was able to beat a professional Starcraft 2 player 10-1.

## References
- [Wikipedia: IBM Deep Blue](https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer))
- [Wikipedia: Alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [Wikipedia: Go Complexity](https://en.wikipedia.org/wiki/Machine_learning_in_video_games#Deep_learning_agents)
- [Wikipedia: AlphaGo](https://en.wikipedia.org/wiki/AlphaGo)
- [Paper: AlphaStar](https://www.nature.com/articles/s41586-019-1724-z)
- [GitHub: PySC2](https://github.com/deepmind/pysc2)