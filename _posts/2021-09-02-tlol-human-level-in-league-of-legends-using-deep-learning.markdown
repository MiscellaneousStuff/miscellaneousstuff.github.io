---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 2 - Problem
Analysis)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-02 14:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post reviews existing approaches to creating game playing AIs which
have evolved in complexity over time as the complexity of the games which
have been tackled has increased. The approaches are than analysed and
the key strengths and weaknesses, as they apply to creating a human-level
League of Legends AI, are outlined. Then previous approaches are analysed,
with regards to how they can inform the development of a League of
Legends AI.

## Problem Analysis


### History of Game Playing AI
In the last few decades, there have been many successful examples of
artificial intelligence being used to produce human level gameplay in
a variety of different games with the most prominent ones outlined below.


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
This model allowed the agent to explore potential game states more efficiently than
a vanilla MCTS. The network was initialised using human professional go data and
was then further refined by optimising the policy and value network by using
a large distributed reinforcement learning approach.

Afterwards, Deepmind created an improved version of the system called AlphaGo Zero
where the Zero denotes zero-human knowledge. This system was trained using pure
reinforcement learning and wasn't pre-trained human knowledge and achieved superior
results to the original AlphaGo system.

This marked a significant shift from the previous approach as artificial neural networks
were now being used to approximate the next action to take instead of the more traditional
approach used by IBM Deep Blue.

#### AlphaStar
AlphaStar was the first AI agent to beat professional StarCraft 2 players without any
in-game advantages and represented a major milestone for game playing AI systems.
Starcraft 2 is a real-time strategy game widely considered by many people to be one of the
hardest real-time video games which humans play and has even been used by the US military as
training for their officers for strategic response planning under pressure.

The first version of the agent was trained to use a simplied zoomed out version of the game
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

#### OpenAI Five
OpenAI Five was a deep learning agent produced by OpenAI which successfully beat
the world champions at Dota 2. Dota 2 is widely considered to be one of the hardest
co-operative and competitive multiplayer, partially observable games with a long
term strategy horizon which humans play competitively.

Dota 2 is also one of the world's most competitive e-sports games with a prize pool
in 2019 of over $34 million dollars making it by far the largest prize pool for an
e-sports competition.

Dota 2 is a MOBA (multiplayer online battle arena) which is a type of real-time
strategy game where players assume the role of one of five players and against
5 enemy players and each player assumes the role of one hero.

The difficulty in the game comes from the fog-of-war present in the game, the complexity
of managing resources against the other team, prioristing short-term against long-term
strategies and many other tactical and strategic considerations. An additional complexity
in the game is that each player plays one of 121 heroes (as of 02/09/2021).

OpenAI Five utilized a separate LSTM network to learn each possible hero in the game. It
trained using a reinforcement learning technique known as Proximal Policy Optimization (PPO)
which was invented by OpenAI and ran on a system containing 256 GPUs and 128,000 CPUs. The
GPUs were used to infer the next action based on an in-game observation and the large number
of CPUs was used to simulate multiple games simultaneously. The system trained for five months,
accumulating 180 years of game experience each day, before facing professional players.
Eventually the system was able to beat the world champions in 2019.

## Observations on Previous Approaches
Recent machine learning approaches for game playing AIs revolve around using reinforcement
learning to run simulations or actual games in a massively distributed and parallel setup
which allows gathering a large amount of data. This data is then supplied to a machine
learning model which most often uses a policy optimization method such as PPO to train
a machine learning model based on in-game trajectories. In-game trajectories consist of
a combination of (state, action, reward) or (s, a, r) tuples which denote the state of the
game at the timestep which is being observed, the action which the agent decided to take
and the reward which was received for performing that action.

Before this large scale reinforcement learning approach is applied, many approaches also
use supervised learning to pre-train the machine learning models, as exploration for
some games would take too long to converge on basic concepts of the game, such as the
case for AlphaStar.

## Relevance to Human-level League of Legends AI
The previous approaches highlights several major points about current AI game playing systems
which have achieved human, or even in some cases, super human performance.

### Co-Operation with Game Developers

For complex modern games, it is unfeasible to create a simulator for each game which
AI researchers would like to tackle. This means that a main priority when deciding
which projects to undergo are either an existing API for the game, or the co-operation
and willingness of the game developers to create this for the researchers. In the case
of Dota 2, Valve already had created a Dota Bot Scripting API which was originally intended
to allow people to create better in-game bots. This also had the side-effect of making it
easier to create AI systems which can play the game. In the case of AlphaStar, Deepmind
entered an arragement with Blizzard (the developers of Starcraft 2) to create an interface
into the game using the Google Protobuf API which provided a remote procedure call (RPC)
interface which allowed the development ofthe PySC2 library.

Therefore the options for creating a Human-level League of Legends AI would involve either,
contacting Riot Games and getting their co-operation for the task, or creating a custom API
around the game which fulfills the same objectives but would be limited as it would be impossible
to scale the system to the number of games required to train a reinforcement learning agent,
or to create a simulation of the game which would be an intractable problem.

In summary, the best solution to this approach would be to use the supervised learning
approach which has already been demonstrated to achieve impressive results in the AlphaStar
system. After training their initial model using purely supervised learning on 971,000 replays,
the system was able to perform as well as the top 16% of players.

### Cost and Infrastructure

The estimated cost of training the OpenAI Five system (which is the most similar to this
project), was $14 million dollars, or around $25,000 dollars a day.
That is a substantial amount of money to throw at a research project.
A large bulk of the cost comes from the 128,000 CPUs which were used to simulate the game.
The reason so many CPUs were used to simulate games is because PPO is a model-free, online
reinforcement learning algorithm. The model-free approach means that, as the system doesn't
inherently have a model of the environment or any inherent hierarchical structure to it's
decision making, the only way the process can improve is by randomly varying it's behaviour
at each timestep during training. Because this process is relatively random and only very
gradually improves over-time, along with the massive state space and observation space at
each timestep, this makes training using model-free reinforcement learning approaches very
gradual.

The summary to this point is that, using a supervised learning approach on high level
human data is a far cheaper option as it only involves recovering a large number of
human replays, storing those files, processing them, training on them and testing them on
the real game. In comparison, that requires far far less hardware as an estimated 90% of
the cost of the Open AI Five system comes from simulating the massive number of games
required to train the system to a superhuman level within a reasonable time frame. This
would only require GPUs to be used as you'd only need to process the data within the replays
which would dramatically reduce the cost of the system.

### Training Data
  
Related to the prior point, a large amount of training data is required to train game
playing AI systems which are able to achieve human-level performance in games, especially
complex real-time strategy games such as Starcraft 2, Dota 2 or even League of Legends.
Acquiring training data is a difficult task which requires either, generating a large
amount of data by running many games in parallel which also requires a complicated
software engineering effort to co-ordinate the gathering of this data. Alternatively,
you can use a supervised learning approach, or offline reinforcement learning approach
which samples expert data and learns to play the game from this data. The benefits of
using expert data is that for many of these games, there are a large number of replays
of highly skilled human players available.

In summary, the most likely way of gathering the data which is required to create a
human-level League of Legends AI would be to use existing replays from Riot Games,
convert the replay information into a format which is suitable for a machine learning
model, and then use either supervised learning or an offline reinforcement learning
approach to train the agent on how to play the game.

## Summary
In summary, the best approach to creating a human-level League of Legends AI would most
likely be to create a custom API which can process League of Legends replays and extract
(state, action) pairs at each timestep. These extracted features would then be used to
train a machine learning model using either supervised learning or an offline reinforcement
learning approach (such as dual-clip PPO), on the top 10 to 20% of players with further
refinement from the very best players winning game replays.


## References

### AI Algorithms
- [Wikipedia: Alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [Wikipedia: Monte Carlo tree search (MCTS)](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search)
- [Paper: Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347)

### Game Playing AI's
- [Wikipedia: IBM Deep Blue](https://en.wikipedia.org/wiki/Deep_Blue_(chess_computer))
- [Wikipedia: AlphaGo](https://en.wikipedia.org/wiki/AlphaGo)
- [Paper: AlphaStar](https://www.nature.com/articles/s41586-019-1724-z)
- [Paper: Open AI Five Paper](https://cdn.openai.com/dota-2.pdf)

### Dota 2 / OpenAI Five Training Details
- [Wiki: Dota 2 Hero Count](https://dota.fandom.com/wiki/DOTA_2_Heroes#:~:text=DOTA%202%20currently%20features%20121,the%20original%20version%20of%20DotA.)
- [Blog: Estimated OpenAI Five Training Costs](https://www.yuzeh.com/data/openai-five.html)
- [Wikipedia: The International 2019 (Dota 2 World Championship)](https://en.wikipedia.org/wiki/The_International_2019)

### Miscellaneous
- [Wikipedia: Go Complexity](https://en.wikipedia.org/wiki/Machine_learning_in_video_games#Deep_learning_agents)
- [GitHub: PySC2](https://github.com/deepmind/pysc2)