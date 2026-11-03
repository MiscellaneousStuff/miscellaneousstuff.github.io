---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 1 - The Background)"
excerpt: ""
date:   2026-11-02 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Data Scraping"]
tags: [""]
---

## Table of Contents

* TOC
{:toc}

## Overview

We are guaranteed to have superhuman League of Legends AI game playing agents by the end of
2027.
Here is why and what this means for one of the oldest and most enduring e-sports
franchises in the world.

League of Legends is a MOBA franchise developed and published by Riot Games. In 2021, Riot
reported [180M players](https://www.techspot.com/community/topics/league-of-legends-franchise-hits-180-million-monthly-active-players.272013/) across its five games (LoL, Wild Rift, Legends of Runeterra, TFT and Fight for the Golden Spatula).

For the last 15 years players have competed against each other to be crowned the best
team in the world with one team, and one particular player often winning the crown:
SKT (T1) and Faker.

Faker is considered by many to be the greatest player to have ever played the game, mainly
for having won more than any other player (6 world championship titles to date, possibly
7 after this month) across different eras (spanning from 2013 to 2025), with a variety
of players.

In South Korea and across Asia (and amongst much of Gen Z in the west as well) Faker is
to e-sports what Michael Jordan, or Messi/Ronaldo are to traditional sports.

Its no exaggeration to say that beating T1/Faker would capture the publics imagination
similar to [IBM Deep Blue beating Garry Kasparov](https://en.wikipedia.org/wiki/Deep_Blue_versus_Garry_Kasparov) or [AlphaGo beating Lee Sedol](https://en.wikipedia.org/wiki/AlphaGo_versus_Lee_Sedol).

Before OpenAI became world famous for releasing ChatGPT to the public
in late 2022, they were originally known for beating the two-time world champions (OG) at
Dota 2 in 2019 (albeit it was under restricted game conditions).

However, why does any of this matter?

AlphaGo's show match against Lee Sedol pushed the frontier of what learning systems were
able to achieve in a dramatic fashion. Go is a game played by hundreds of millions of people
all across Asia and was thought to be 10 years away in 2016 from being solved.

IBM Deep Blue showed that the greatest human chess player could now be beaten by, an
admittedly cruder and more narrow form, of artificial intelligence.
Showcases such as IBM Deep Blue established the major cultural motif of "man vs machine"
which demonstrates the moment when human inventions best the human mind, of which AlphaGo sort
to prove that more "intelligent" methods than IBM Deep Blue now work for more complex domains (i.e.
Go).

Whereas OpenAI Five showed that the learning algorithm itself not need be embued with
finnicky human assumptions on *how* to play the game, rather it was provided the environment
and rewarded for actions which *lead* to winning the game. Eventually the model was simply
just rewarded for winning the game and this was enough for the learning algorithm to improve
so a superhuman level as well.

Ok so thats all well and good, but again, are we just beating humans at video games?

Each one of these achievements lead to a more profound impact.

AlphaGo was part of DeepMind's RL lineage spanning back to DQN (and arguably going even
further back to the individual contributors reach backgrounds). DQN (Deep Q-Networks) were
a breakthrough application by DeepMind which showed how to combine deep neural networks (DNNs)
with reinforcement learning (RL) and computer vision (CNNs specifically). This allowed
systems to simply observe games (Atari games), try different actions, and improve at the game
simply by playing the game and without having to hand-craft rules around *how* to play the game.
This RL lineage arguably spurred on OpenAI Five's PPO (Proximal Policy Optimisation) lineage
which allowed them to beat the world champions, without any human training data or forcing how
the agent should play. PPO goes on to be combined with GPT-3 in 2021 in the InstructGPT paper,
specifically to tune their "amazing next word predictor" towards tasks using RLHF. That system
became known as "ChatGPT".

Ok so we've seen how game playing AI pursuits can eventually lead to changing public perception,
re-allocating focus towards newer more promising methods and eventually allowing us to tackle
entirely different classes of problems. Where does League of Legends come into play and are
any major players tackling it?

## xAI's League of Legends Challenge

This [earlier](https://miscellaneousstuff.github.io/project/2025/11/28/lol.html) blog post
touches on the "how" to achieve such a feat and pays particular attention on Elon Musk's
announcement that xAI will train Grok 5 to beat the world champions at League
of Legends by the end of 2026, under fair conditions (only seeing what a person can
see and fair mechanical restraints vs what a human being can realisticly do).

<div style="text-align: center;">
    <blockquote class="twitter-tweet"><p lang="en" dir="ltr">Let’s see if <a href="https://twitter.com/grok?ref_src=twsrc%5Etfw">@Grok</a> 5 can beat the best human team <a href="https://twitter.com/LeagueOfLegends?ref_src=twsrc%5Etfw">@LeagueOfLegends</a> in 2026 with these important constraints:<br><br>1. Can only look at the monitor with a camera, seeing no more than what a person with 20/20 vision would see. <br><br>2. Reaction latency and click rate no faster than human.…</p>&mdash; Elon Musk (@elonmusk) <a href="https://twitter.com/elonmusk/status/1993208505486979327?ref_src=twsrc%5Etfw">November 25, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    <div style="margin-top: 10px; font-size: 0.9em; color: #777;">
        Elon Musk announcement of League of Legends challenge for Grok 5
    </div>
</div>

During 2026 Elon has also posted about the Digital Optimus project which aims to give LLMs real-time complex visual-based control:

<div style="text-align: center;">
    <blockquote class="twitter-tweet"><p lang="en" dir="ltr">Macrohard or Digital Optimus is a joint xAI-Tesla project, coming as part of Tesla’s investment agreement with xAI. <br><br>Grok is the master conductor/navigator with deep understanding of the world to direct digital Optimus, which is processing and actioning the past 5 secs of real-time computer screen video and keyboard/mouse actions. Grok is like a much more advanced and sophisticated version of turn-by-turn navigation software. <br><br>You can think of it as Digital Optimus AI being System 1 (instinctive part of the mind) and Grok being System 2. (thinking part of the mind).…</p>&mdash; Elon Musk (@elonmusk) <a href="https://twitter.com/elonmusk/status/2031751255060885911?ref_src=twsrc%5Etfw">March 11, 2026</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    <div style="margin-top: 10px; font-size: 0.9em; color: #777;">
        Elon Musk announces Digital Optimus / Macrohard (5-second real-time horizon, System 1/2 architecture)
    </div>
</div>

And also announced that (most likely) Grok 5 / Digital Optimus is continuing to train on League:

<div style="text-align: center;">
    <blockquote class="twitter-tweet"><p lang="en" dir="ltr">We’re making interesting progress here. <br><br>Digital Optimus can play about halfway through the Diablo campaign so far just by looking at the screen like a human. <br><br>Skill at Counter-Strike and other fast games is good too. <br><br>League is also in training. <br><br>Goal is to generalize across all games.</p>&mdash; Elon Musk (@elonmusk) <a href="https://twitter.com/elonmusk/status/2108823477071303109?ref_src=twsrc%5Etfw">October 10, 2026</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    <div style="margin-top: 10px; font-size: 0.9em; color: #777;">
        Elon Musk update: Digital Optimus progress on Diablo, Counter-Strike, and League of Legends training
    </div>
</div>

This may mean that they're nowhere near to performing at superhuman level or Elon is storing us up a treat towards the end of the Worlds 2026 championship?
I don't believe so just yet which we will get to throughout this post.

Suffice to say, there is now growing interest in League of Legends from at least one frontier lab and more may follow.
However we haven't seen multiple frontier labs go after the same game at the same time so it is most likely xAI
who have a relationship with Riot Games to pull this feat off.

So why are xAI focusing on League of Legends, as well as many other current games? Games are
a useful microcosm of reality. They allow us to train systems to predict into the future, reason,
perform precise actions, optimise across multiple objectives simulataneously as well as being
intuitively interpretable compared to other complex domains (esp. due to our ability to fully
measure what is happening within them compared to many complex real world problems).

So what does League of Legends uniquely offer which is useful for the progress of game playing AI
and AI in general?

## Relevance of League of Legends to the progress of AI

League of Legends is a complex co-operative and competitive, partially observable, long-horizon
game played in real-time with rich strategic and motor execution.

To boil it down to one comparison, the full estimated game-tree complexity of League of Legends
vs games like Chess or Go would roughly be:

| Game | Estimated Complexity |
| - | - |
| League of Legends | **10^219,000** |
| Go | ~10^360 |
| Chess | ~10^120 |

For a full breakdown of League's game-tree complexity, refer to its [appendix section](#estimating-the-observation-and-action-space-of-league-of-legends).

If you wrote these numbers out digit by digit, chess’s game tree fits on one line, Go’s fills a paragraph, and League’s fills a 100-page book.

Each revolution used different machinery, but they all trace the same lesson.

IBM Deep Blue required hardware accelerated traditional search and pruning algorithms.
AlphaGo required TPU's (Google's custom AI training and inference chip) and a combination of MCTS, deep learning and other methods.
OpenAI Five required on-policy optimisation and 100,000s of CPUs and 100s of GPUs running for months.

These breakthroughs trace perhaps the most insightful lesson of the history of AI, [The Bitter Lesson](https://www.cs.utexas.edu/~eunsol/courses/data/bitter_lesson.pdf).
Without doing it injustice, it is simply to say that general purpose methods that scale with computation are ultimately the most
effective and by a large margin. Each successive generation has consumed more and more computation to tackle more
and more complex problems. Can we predict *how much* computation?

In 2023, OpenAI (Hilton, Tang and Schulman — the OpenAI Five / PPO lineage) [published](https://arxiv.org/abs/2301.13442) scaling laws for reinforcement learning,
showing that on 1v1 Dota 2 an agent’s skill rating improves as a smooth power law in compute, just as loss does for language models. The same
paper shows that the cost of a long-horizon task grows linearly with the horizon, not with the size of the game tree.
The 10^219,000 figure above is a measure of how much League can surprise you, not of how much compute it takes to beat it.
This means that compute is a number a frontier lab can write down and buy.

We now understand that compute is a crucial component to achieving superhuman performance in complex games, however,
does this mean that only frontier labs can achieve that level of performance?
It's a reasonable assumption given the history but scientific and engineering limitations aren't gleamed from history
alone but rather from first principles.

So what is *fundamentally* required to achieve superhuman performance in League of Legends?

## Reinforcement Learning and Imitation Learning

I have spent years asking myself this question, what is required to achieve, at least human level,
if not superhuman level performance in League of Legends?
For years I believed that imitation learning on League of legends replays could produce competent enough agents.

However I have since questioned these fundamental assumptions, did I truly believe this was the *best*
way, or was I limited by the technology of my time and making a pragmatic compromise?

Lets analyse what the Bitter Lesson gives us *and* costs us.
The prevailing notion is that reinforcement learning, given a reward function which fundamentally
signals how to optimise for some given task can teach agents how to perform that task in some
given environment.

The other method we have available is imitation learning. Instead this involves training a system
to respond with certain actions given certain observations.

One signals alignment with the tasks underlying reward structure, another aligns with similarity
to expert decisions.

Reinforcement allows us to teach agents to operate in environments where the best policy may not
be known or have data recorded extensively enough to be able to perform at the level required
to succeed. However reinforcement learning has historically been highly sample inefficient due
to much of the explorative budget being spent on acquiring the basic "world-model" like intuition
of interacting with the environment before spending compute on "solving" the underlying problem.

Contrastively, Imitation Learning allows us to train directly on the expert policies which is far
more sample efficient due to avoiding spending compute on exploration. However, exploration can
also make agents far more robust by experiencing more of the state-tree for some given task.

RL also allows for something which imitation learning doesn't, which is discovering "novel"
solutions to problems.

We have seen this in Move 37 from AlphaGo vs Lee Sedol, and we see it far more often now:
in 2026 alone, a general-purpose OpenAI model disproved an 80-year-old Erdős conjecture
via number theory nobody expected to apply, Claude found a construction for an open problem
Donald Knuth had been stuck on for weeks (he titled the write-up “Claude’s Cycles”), and
DeepMind’s AlphaEvolve beat a 56-year-old matrix multiplication record, what Hassabis
calls its own “Move 37 moment”.

So given the right constraints agents *can* learn novel solutions, and League of Legends
certainly qualifies as such.

There are two main components:
- Simulation
- Action / Training

### Simulation and Training

Simulation has always been considered impossible as it would require faithfully re-implementing
the League of Legends game server to *practically* perfect fidelity. Historically this would
have been impossible due to being unable to cover the *entire* distribution of the game. You
would of had to have accepted restrictions such as less champions, less items, less buffs, etc.

On the other side we have action and training, which really amounts to the deep learning techniques
used to drive the agents and train them from feedback. The main limitations here fundamentally
relate to the scaling laws discovered throughout the deep learning field from RL, to LLMs to others.

It turns out those two components are not equal. OpenAI Five ran on roughly 128,000 CPU cores
simulating Dota against only 256 GPUs training the network — the game, not the model, was the bill.
The scaling-laws paper explains why that’s structural: the compute-optimal RL model is tiny (their
Dota frontier tops out around two million parameters, versus hundreds of millions for a language
model at the same budget), and the cost of a game is dominated by the ~15,000 decisions per agent
the environment has to simulate. They even write the total as (N + Nₑ)·E, with Nₑ the cost of the
environment per step, and show it’s inefficient to train a model much cheaper than your simulator.

When Nₑ is that large the only affordable move is to reuse every expensive sample as many times
as possible — which is exactly what imitation learning on replays is. I wasn’t wrong about the
method; I was right about the simulator I didn’t have. A real League client is real-time, rendered,
one instance per machine, and behind anti-cheat. That is an Nₑ nobody outside a lab with a publisher
deal could afford, and Riot has never offered what Valve and Blizzard offered.

A faithful headless reimplementation that runs faster than real time on commodity CPUs collapses
that number by orders of magnitude. So the only thing standing between an individual and OpenAI
Five–scale training is a fast, faithful League simulator.

Looking back, reinforcement learning was the right choice all along; what’s changed is that it’s
now affordable, and the scaling laws tell us it improves predictably with compute rather than by luck.

Which brings us to the modern era.

## A Brave New World

During late 2026, there has been a cambrian explosion of software engineering, particularly
those focused on reverse engineering games. For a full exhaustive list look [here](https://github.com/Carter54git/Greates-Games-Decompilations-List).

This has been spurred on by agentic coding LLMs such as Claude Opus 5.5 + Fable 5.1 and GPT Astra
gaining rapidly improving reverse enginering abilities.

However, this mostly applies to games where the full game binary is present locally on someones
computer. Or is it? There have been historical game server reverse engineering attempts by
dedicated fanbases to preserve game servers (some of which have spanned decades).

A few examples include:
- Ultima Online — UOX / RunUO / ServUO (1998–present). Emulators appeared within a year of the 1997 launch; RunUO (2002) became the standard and is still maintained as ServUO. The original fan-server scene.
- EverQuest — EQEmu (~2001–present). Classic-era EQ servers run entirely on reverse-engineered code; Project 1999 has had thousands of concurrent players for over a decade.
- World of Warcraft — MaNGOS (2005), TrinityCore (2008), CMaNGOS, AzerothCore. Twenty years of continuous development, multiple expansions reimplemented from packet captures and client data. The largest and best-engineered emulator lineage; Blizzard’s own Classic was arguably a response to it.
- Ragnarok Online — eAthena (2004) → rAthena / Hercules. Still updated to track official content.
- Lineage II — L2J (2004–present). A full Java reimplementation of a Korean MMO’s server.
- Star Wars Galaxies — SWGEmu (2006–present). Started while the game was still live, became the only way to play after Sony shut it down in 2011.
- Final Fantasy XI — DarkStar → LandSandBoat. Open-source server for a game that is still officially running.
- Warhammer Online — Return of Reckoning (2014–present). Shut down 2013, revived by fans the next year.
- Toontown Online — Toontown Rewritten (2013–present) and Club Penguin — CP Rewritten (2017). Disney shut both down; fans reimplemented the servers from the client and memory.
- Phantasy Star Online — Sylverant / Tethealla. Dreamcast-era online game, servers reverse-engineered and still up.
- Diablo II / StarCraft — PvPGN (bnetd lineage, 1998–). Battle.net reimplemented; Blizzard sued over bnetd in 2002 and the project outlived the lawsuit.
- RuneScape — 2003scape, 2009scape, and the RSPS scene. Hundreds of private servers.

League also has its historic fare-share of game servers which work with the officially launched clients of those patches:
- [Brokenwings](https://gitgud.io/skelsoft/brokenwings) - Patch 1.0.0.126 game server (a lot of code was implemented as Lua in the game client itself back then)
- [Riotzed.lol](https://riotzed.lol/progress/) - Patch 4.17 Mac Client de-comp and working game server
- [LeagueSandbox](https://github.com/leaguesandbox) - Patch 4.20 partially working game server
- [LeagueOfLegendsV2](https://github.com/Louisdelez/LeagueOfLegendsV2) - Patch 4.20, 7.13 and 16.6 game server attempts (these are the furthest attempts for modern league)

However, is it possible to use LLMs to aide in the process of creating a working
game server for modern League of Legends to run a simulator at faster than real time?

As it so happens this is entirely possible now!
But how would we go about proving this? Starting with the full modern game is quite an undertaking, 
perhaps we should start with an open-source project which has gotten the furthest in implementing the game
and validate this "fastsim" concept.

## Brokenwings

--

--

## Appendix

### League of Legends Playerbase Count

It's difficult to determine exact player base numbers for League of Legends but we do know
certain things for sure.

u.gg (who source their information directly from Riot's official API) report (all ranks
and all regions where data is available which is everywhere outside of China which is
instead administered by Tencent):

| Game Mode | Champions Analysed per patch (estimate) |
| Ranked Solo/Duo | ~200M per month |
| Ranked Flex | ~20M per month |

However many Ranked Solo/Duo players also play flex and many players play more than one
game per patch, these are the upper bounds per game mode.

### Estimating the Observation and Action Space of League of Legends

These are back-of-envelope estimates, discretising the 16,000 × 16,000 unit map at
100-unit resolution (~25k cells) and using typical mid-game unit counts rather than
theoretical maxima.

**Observation space (structured, per tick)**

| Entity group | Count | Features each | Total | Notes |
| - | - | - | - | - |
| Champions | 10 | ~200 | ~2,000 | pos, HP/mana/XP/gold, level, ~30 stats, ability/summoner/item cooldowns, 6 items (of 216), ~20 buffs (of 3,936) |
| Lane minions | 40–60 (max ~120) | ~10 | ~500 | type, pos, HP, target |
| Jungle monsters | ~40 | ~8 | ~300 | 18 camps + scuttles + epics |
| Structures | ~30 | ~5 | ~150 | turrets, plates, inhibs, nexus |
| Wards | ~20–30 | ~5 | ~150 | 6 types |
| Spell objects / missiles | ~20–50 | ~8 | ~300 | from a pool of ~4,740 spell objects |
| Global | 1 | ~50 | ~50 | clock, objective timers, souls, terrain variant |
| Map mask | 160 × 160 | 1–3 | ~25k–77k | walkable, bush, fog-of-war visibility |

Roughly **4k scalar features plus a ~25k-cell visibility mask** per tick — the same
order as OpenAI Five's ~16k inputs per hero. Under xAI's camera-only constraint this
becomes **1920 × 1080 × 3 ≈ 6.2M pixels per frame**, or ~1.9 GB of raw input across a
5-second window at 60 Hz. Only about half the champions and a minority of minions and
wards are visible at any moment, so the true input is a history, not a snapshot.

**Action space (per agent, per tick)**

| Action head | Params | Notes |
| - | - | - |
| Move | 81 | 9 × 9 offset grid |
| Stop / Recall | 2 | |
| Basic attack | ~17 | nearby valid units |
| Q/W/E/R | ~144 | ~36 skillshot bins each; ~430 with 3 range bins |
| Summoner spells | ~86 | Flash 81 + targeted ~5 |
| Item actives | ~40 | ~2 slots × ~20 |
| Level-up | 4 | |
| Ward placement | ~162 | 81 positions × 2 types |
| Shop | ~216 | fountain only |
| Pings (optional) | ~800 | ~10 types × 81 positions |

Roughly **600 discrete actions per agent per tick** (~1,000 with range bins), of which
~50–200 are valid at any moment after masking cooldowns, mana, range and shop
availability. Joint team action per tick: 600⁵ ≈ 8 × 10¹³.

**Per-game complexity**

Pro players sit at ~300–400 APM (5–7 actions/sec), so a 4–8 Hz decision tick is
"human-fair" (OpenAI Five used 7.5 Hz). A 35-minute game at 7.5 Hz is ~15,750 decisions
per player and ~79,000 per team, giving a game tree of roughly
(8 × 10¹³)^15,750 ≈ **10^219,000** — versus ~10^120 for chess and ~10^360 for Go.
The instantaneous state count is ~**10^1,000** reachable snapshots, dominated by
minion bookkeeping (~10^700), with items (~10^110), runes (~10^40) and draft (~10^22)
making up most of the rest.