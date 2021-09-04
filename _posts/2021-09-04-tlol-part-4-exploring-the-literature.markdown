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

The rest of this article will cover key papers which have covered creating human level
MOBA playing AI systems.

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

## Supervised Learning Achieves Human-Level Performance in MOBA Games: A Case Study of Honor of Kings

### Overview

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

### Main Contributions

The main contributions of the paper, and the reason why it's so useful to this
project, are the following two reasons.

1. Supervised learning method which can apply to any MOBA game which allows
   efficient incorporation of expert knowledge. Scene-based sampling method
   to divide whole MOBA gameplay into easily tuned game snippets.
2. Supervised learning method performs comparatively against High King (roughly
   Grandmaster or Challenger in League of Legends).

<!--
- JueWu-SL
  - Replay Numbers (120,000 & 100 million scene/step samples -> 90/10 split, etc.)
  - Pure supervised learning approach
  - Achieved super human performance in Honor of Kings (albeit, simpler than LoL)
  - This paper gives context for the approach taken for this project
    (or at least the initial approach, we'll see...)
-->

### Method

#### Overview

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

#### Multiview Intents for Macro-strategy

The paper describes ground-truth regions which are regions where players
conduct their next attack.

However, one issue is that the occasional attacking behaviour in a given
spot might not be the goal of hte player, such as encoutering an enemy
while moving somewhere.

Therefore, only regions with continuous attacking behaviours are considered
and so multi-view intent labels, including global intent and local intent,
are used to model macro-strategy.

<div style="text-align: center;">
   <img
      src="/assets/juewu_sl/multiview_intent_label_design.png"
      style="width: 100%; max-width: 640px;"
   />
</div>

The first level of intent labels are global intent labels. The global intent
labels encode the global intent which is the next target or region where players
may attack creeps to gain gold, attack turrets for experience and others.
The global intent label is defined by dividing map into course-grained N x N
regions (for Honor of Kings, N = 24 so 576 intent classes defined for game).
Therefore, the global intent label is the numbered regin on the map where the next
seris of attacks happen. For instance, if the next global intent region is at
position 1 x 1, that would be equal to Y * N + X := 1 * 24 + 1 = 26 so the label
would be 26 out of 576.

The next level of intent labels are local intent labels. The local intent label
is short term planning in local combat (e.g., hiding in a bush, retreating to a turret,
waiting for target heroes before attacking a target).
A local intent region is defined by dividing a local map region into fine-grained
M x M regions (for Honor of Kings, M = 12), where each local region edge is roughly
the size of the edge of a heroes length (e.g. if the edge of a heroes collision box
is 100 units, then a local regions size would be 100x100).

<div style="text-align: center;">
   <img
      src="/assets/juewu_sl/global_and_local_intent_breakdown.png"
      style="width: 100%; max-width: 640px;"
   />
</div>

Example of global intent label and micro-decision making.

#### Multimodal Features

The JueWu-SL model uses multimodal features throughout the model. As described before,
it uses vector features and image features.
The models vector features are made of observable hero attributes and information relating
to the state of the game.
Examples include:

- **Hero attributes**

   Examples of hero attributes include: current HP, previous HP (HP in the last timestep),
   ability cooldowns, damage attributes, armor, magic resistance, level, experience, current
   position on the map, position in the last time step and others.

- **Game states**

   Examples here include: team kill difference, gold difference, experience difference,
   game time, turret difference, epic monsters killed (League equivalent of baron and
   dragon) and others.

### Data Preprocessing

One major contribution of the paper is how it divides events which happen within expert
replays into scenes. The paper also uses a host of other techniques to get the most out
of expert replays, and fortunately for us, these techniques are generic across MOBA games,
and RTS games in general.

#### Scene Identification

Scene identification classifies a scene based on the most prominent actions which a player
was performing within a certain timeframe. Unfortunately, the paper is vague on how this
process is actually performed. However, the paper describes the method is enough detail
to be re-implemented, if we adapt it for League of Legends. The main scenes which the paper
identifies as being relevant, to Honor of Kings at least, are listed below:

- **Push-turret:** Attack enemy turret
- **Combat:** Find an enemy hero and prepare to fight them
- **Lane-farm:** Kill minions to get gold and experience
- **Jungle-farm:** Kill jungle camps to gain gold and experience
- **Return:** Go back before dying / to defend the base
- **Navigation:** Go to another region for macro-strategy intents


#### Data Tuning Under Each Scene

Depending on the scene, certain types of action intents should occur more (e.g. during
Navigation, moving action intent should be the occur the most, whereas when attacking
lane farm, attacking action intent should occur more).

Certain situations involve more than one scene. For example push-turret can be combat
and push-turret scenes combined. Priority under that situation is the order of scenes
under the scene identification section above.

#### Data Tuning Across Scenes

After segmenting individual frames into scenes, the data is imbalanced across scenes
as certain scenes occur more often than others. This is because things like turret
pushing occur less than combat.

Distributions of scenes are different in terms of roles of the hero. For example, the
support role is going to use movement to detection opponents and support teammates, therefore,
most of its game scenes will fall under Navigation (and this is what the authors of
the paper found during exploration). However, the performance of all scenes are equally
important as everything that happens in a game is important to winning the game overall.
To remedy this, the paper uniformly balances scene data by downsampling to enable the
AI to be adequately trained in every scene. What downsampling means in this context is that,
some scenes for certain champions may be trained on more than what would be for other 
champions. For instance, you may train agents trained to play a support champion with
more navigation scenes. However, if you was training an agent to play a carry role champion
(e.g. attack damage carry), then you would try it on disproportionately more combat scenes.
The downsampling ratio is tuned hero-by-hero.

An important thing to note here is that, scenes are only segmented during training,
during inference, the only thing the model is provided with is an observation at timestep
t with the same information a human would be provided with. There is no difference in
training between scenes.

#### Move Sample Enhancement

Movement samples are taken by taking the different between a current and future frame,
i.e., after N frames, depending on whether the hero is in combat. In a Combat scene,
N is set as a fine-grained step as every move is important during a fight. In other scenes,
it can be a coarse-grained step, since the player usually executes meaningless moves.
In Honor of Kings, N = 5 (0.33 seconds) during Combat, and N = 15 (1 second) for non-combat
scenes. To put this into concrete terms, the below image shows the movement vectors within
League of Legends at the start of the game when players are leaving the their spawn location.

<div style="text-align: center;">
   <img
      src="/assets/tlol_visualisations/11.10-local_intent_region (quiver) (red-side-spawn).png.png"
      style="width: 100%; max-width: 640px;"
   />
</div>

The image above shows the movement vectors from the start of a League of Legends game,
zoomed into the red side spawn location. As you can see from the image above, the vectors
have a high magnitude as players are given the "home-base" buff at the start of the game
which is a temporary increase in movement speed at the start of the game which allows
players move to their respective locations to get the game started quickly.

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
- [(JueWu-SL) Supervised Learning Achieves Human-Level Performance in MOBA Games: A Case Study of Honor of Kings](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=9248616)

<!--
- JueWu-SL
- OpenAI Five
- PyLoL (act spec, obs spec)
- GCP (Pre-Emptible)
- etc.
-->