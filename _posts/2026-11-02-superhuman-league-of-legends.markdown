---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027"
excerpt: ""
date:   2026-11-02 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Data Scraping"]
tags: [""]
---

## Table of Contents

* TOC
{:toc}

## Overview

We are guaranteed to have super human League of Legends AI game playing agents by the end of
2027, here is why and what this means for one of the oldest and most enduring e-sports
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

AlphaGo's show match against Le Sedol pushed the frontier of what learning systems were
able to achieve in a dramatic fashion. Go is a game played by hundreds of millions of people
all across Asia and was thought to be 10 years away in 2016 from being solved.

IBM Deep Blue showed that the greatest human chess player could now be beaten by, an
admittedly cruder and more narrow form, of artificial intelligence.

Whereas OpenAI Five showed that the learning algorithm itself not need be embued with
finnicky human assumptions on *how* to play the game, rather it was provided the environment
and rewarded for actions which *lead* to winning the game. Eventually the model was simply
just rewarded for winning the game and this was enough for the learning algorithm to improve
so a superhuman level as well.

Ok so thats all well and good, but again this is just beating humans at video games, why
does this matter?

Each one of these achievements lead to more profound impact.

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

Arguably showcases such as IBM Deep Blue established the major cultural motif of "man vs machine"
which demonstrates the moment when human inventions best the human mind, of which AlphaGo sort
to prove that more "intelligent" methods than IBM Deep Blue now work for more complex domains (i.e.
Go).

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

This may mean that they're not where near to performing at superhuman level or Elon is storing us up a treat towards the end of the Worlds 2026 championship, who knows?

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

To boil it down to one comparison, the full estimated state-space complexity of League of Legends
vs games like Chess or Go would roughly be:

| Game | Estimated Complexity |
| - | - |
| League of Legends | **10^219,000** |
| Go | ~10^360 |
| Chess | ~10^120 |

For a full breakdown of League's state space complexity, refer to its (appendix section)[#estimating-the-observation-and-action-space-of-league-of-legends].
<!-- 

To really break this down we
ought to estimate the state-space complexity of League of Legends.

First lets state our assumptions:

Observations:

| Entity | Count | Notes |
| - | - | - |
| Champions | 173 | - |
| Champion Spells | ~865 | - |
| Spell Objects | ~4,740 | 865 roots, 1,145 children (missiles, recasts), 552 passive parts, 425 extra/transform, 498 attacks, 207 pet/clone spells, 1,008 other |
| Missile Specs | ~1,156 | These are spells with related in-game missiles |
| Summoner Spells | ~9 | - |
| Buffs | 3,936 BuffData records (1,958 champion + 547 skin variants, 1,164 global, 267 Map11) | These incl buffs, debuffs and virtually all modifiers in the game |
| Items | ~216 | - |
| Runes | 61 perks, 7 stat shards | 
| Lane minions | 4 types (melee, caster, siege, super) | - |
| Structures | 24 in total | per team: 12 turrets, 3 inhibitors, 1 nexus, 5 plates per turret |
| Jungle Camps | 18 in total | 9 per team, 14 unique camps |
| Epic Monsters | 10 | 7 dragon kinds (infernal, ocean, mountain, cloud, hextech, chemtech, elder, herald, baron, voidgrubs + mites) |
| Plants/Vision | 9 | 3 plants (health, vision, satchel), 6 ward types | 
| Terrain | 10 | ~7 elemental masks, 3 baron pit layouts |

Actions:

Assuming discretised action space for sanity...

| Action | Param Space | Notes |
| - | - | - |
| Movement | 9 * 9 = 81 | Assuming we discretise X offset to -4 to +4 (9) and Y, in 100s of in-game units. |
| Recall | 1 | - |
| Stop | 1 | We'd treat movement at (0, 0) as a no-op and this action specifically as stopping |
| Spell Usage (Skillshot) | 36 | Assuming 10 degree discrete bins |
| Spell Usage (Targetted) | 17 | Depends on number of nearby valid units. Rough ceiling at full minion wave + 5 enemy champs? |
| Summoner Spell (Flash) | 9 * 9 = 81 | Simplifying to same as movement |
| Summoner Spell (Targetted) | 5 | Exhaust, Ignite, lets say teleport has 5 targets ish to keep this sane, ghost and barrier are self-cast etc. |

There are more still for item actives and other things but this is most of it. -->


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