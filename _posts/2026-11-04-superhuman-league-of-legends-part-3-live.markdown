---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 3 - Patch 26.19: 1v1)"
excerpt: "This post discusses efforts to train agents on modern League of Legends"
date:   2026-11-04 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Behavioural Cloning", "fastsim"]
tags: [""]
---

## Table of Contents

* TOC
{:toc}

## Overview

[Previously](https://miscellaneousstuff.github.io/2026/11/03/superhuman-league-of-legends-part-2-brokenwings.html)
we covered using Brokenwings to validate creating a simulator for League of Legends which operates orders of magnitude
faster than realtime. This allowed us to simulate an Ezreal 1v1 with towers and minions at over 1 million simulation
steps per second on a single GH200 node.
If we convert that into real time experience, that means per 24 hours of training our agents were
experiencing ~342 years of gameplay per day. That is the on the same order of magnitude as OpenAI Five's training.
<!-- link to appendix section -->

However, that was an older version of the game spanning back to season 1 of League of Legends, is this applicable
to the modern game?

As a matter of fact yes, there is no fundamental engineering reason it would be any different in terms of fundamental
simulator complexity. However, `fastsim` required access to the source code of Brokenwings game server to be able
to create a simulator with enough fidelity to be able to train agents which could faithfully play the game. Even with the source code access we encountered fidelity issues when actually running agents back in the live game environment.

Clearly Riot Games does not provide the source code for the modern game, anything resembling the Bot API for Dota 2
or `pysc2` for Starcraft II.

This leaves us with a few options:
1. [Acquire](https://miscellaneousstuff.github.io/project/2023/12/23/tlol-part-7-dataset-transformation.html) *.rofl files (League of Legends replay files) to build out a dataset of game server behaviour to faithfully re-implement the server with a ground truth source of its behaviour
2. Use neural network based world simulators (similar to [Genie 4](https://deepmind.google/blog/genie-4-a-new-generation-of-world-simulation/)) to simulate the game
3. Use online game replays with computer vision methods to extract game rules (similar methods have been used by the [League Wiki](https://wiki.leagueoflegends.com/en-us/) authors at times to infer precise timing information for champions)

The main issue with option 2 and 3 is the fidelity gap between its produced world models and the target game, which then
also changes every patch (~2 weeks).

This only leaves option 1 but confers separate problems. League of Legends `*.rofl` files are encrypted, with their
encryption changing every patch, however, the game client is able to play replays every patch (which inherently requires
decrypting the data).

## Memory Reading

This means that [memory reading methods](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html#replay-scraping) are robust to patch changes (or at least only require re-discovering
the memory offset locations for specific game objects and their fields which is relatively routine using signature based
detection every patch).

However memory reading methods are simulatenously slow and fall victim to sampling noise (*when* you read memory, results
in inconsistent data output unless you run it at very slow speeds). The other option is capturing the functions which
the game client itself uses to decode replays.

## Semantic Packet Decoding and Game Server Oracle

<div class="key-findings" markdown="1">
For some context, `*.rofl* files contain amongst many things the stream of S2C (server-to-client or in other words
the authoratative commands sent from the League of Legends game server to a player). However they do not contain
C2S (client-to-server) packets but these are recoverable from the League client itself as they are inherently
client-side.
</div>

Henry Zhu wrote this [great blog post](https://maknee.github.io/blog/2025/League-Data-Scraping/) last year and directly
contrasted the TLoL projects memory reading approach with the affordmentioned method.

His post outlines how not only is this method faster, but also recovers the exact data within the `*.rofl` replay file.

Our replay scraper took:
26 mins / 16 replay multiier + 0.25 mins loading speed ~= 1.6 minutes per game = 96 seconds for a 26 minute replay.

His approach instead took 5 seconds per game (although the completeness of the data is also dependent on understanding
what the decoded packets mean, otherwise you just have seemingly random data).

This means that memory reading is reliable for its exact snapshot in time but is far too slow to scale and Henry's
packet extraction method is highly efficient and parallelisable but has completeness limitations, so what is the
solution here?

The real answer is to combine them. You would use the ground truth data from the memory reading to automatically
discover the purpose of the packets where applicable. Then this can be combined with reading the clients packet
memory table to increase the coverage of the packets (and related fields) semantic meaning.

Ok so we now have a rough plan for acquiring replay files (based on our previous method), and extracting useful
data from the replays - which we can still use for imitation learning, and which crucially enables us to create
an oracle to check a reimplemented server against.

## Game Client

That's all well and good, but how do we *actually* play the game?

In Brokenwings the answer was easy: the server was ours, so we attached the bridge to it and the client was optional. On 26.19 the server is Riot's, the client is the only part we have, and the client is also the only thing in the world that can tell us whether a server is speaking League.

That makes it the first oracle and not for the *rules*, which it mostly just renders, but for the *protocol*.
If the client connects, loads a world and plays what it's sent, you have a server the game accepts.

The way in was replays. A replay is the server's half of a conversation, and the client already knows how to listen to it. Loading one into the client through our own process, rather than through Riot's replay mode, was the first thing that worked, and it worked in an afternoon.

Standing on the shoulders of everyone who'd decoded the format before us (Henry's write-up, the earlier ROFL projects, the 16.6-era attempt at loading one into the game). From there the question was whether the client would accept *new* messages, not just recorded ones. It would.

**The live duel.** By 3 October our Python server was running an Ezreal-versus-Ezreal in the installed client: server-owned movement and pathing on the map's real navigation grid, auto-attacks with windup, release and impact as separate stages, all four spells with their costs, cast locks, missiles and interactions (W marks detonated by Q, autos, E and R; E's blink and homing bolt; R's piercing wave), Flash and Barrier, regen, gold and XP, kills with the kill feed and scoreboard, death and a ten-second respawn that returns both champions to mid. Both start at level 6 with Q3/W1/E1/R1 and the level's real base stats. The opponent was a scripted Ezreal. The client played all of it: health bars, damage text, first blood, the 1v1 ace announcement.

**What that proves and what it doesn't.** It proves the client accepts and presents our simulation. It does not prove our simulation reproduces every rule of Riot's server; the client is not checking the arithmetic, it's displaying it. That gap is the subject of the rest of the post.

**Bugs found by playing it**, because the client is also the fastest bug report there is:

| What I saw | What it was |
|---|---|
| Orb-walking showed the missile but the hit never landed | windup cancellation and released-projectile lifetime were one flag |
| Gold appeared on screen for kills that weren't mine | private economy messages sent to whichever connection was listening |
| The enemy's hit effects played on the enemy | effect templates still carried the recorded victim from the bootstrap replay |
| The bot walked through walls | movement used straight lines, not the navgrid |
| Kills happened and the client said nothing | rewards existed; the death notification and KDA packets didn't |

**How it was checked.** 137 unit tests on the live rules; native-decoder checks on every kill, effect and ownership message; captures of several thousand datagrams validated field by field across both kill directions, three deaths and revivals, and 965 bot positions that all stay walkable and reach their routed endpoint. Screenshots of the kill feed, score and KDA reviewed by hand. That's integration evidence: strong evidence that the game accepts us, and none at all that we're right.

**Timing.** A League server runs at 30 Hz. Ours answers the client's clock and keeps cast completion, movement locks, missile release and collision on one server timeline: Q is a 0.25 s cast and a 2,000 u/s projectile, as it should be — but the event loop is a 10 ms socket timeout, not a guaranteed tick, and the server-to-client offset is set once at startup with no drift correction. A prototype, in the honest sense.

Two things worth saying plainly. All of this ran against our own server on our own machines; nothing in this post connects to Riot's live service, and the client was read only for interoperability with a server we wrote. And the entire thing — the client, the protocol knowledge, the replay format — sits on a decade of public work by other people, from LeagueSandbox through to the projects that decoded 16.x. We added a server that plays.

## Replays as the second oracle

The client tells you whether the game accepts you. It cannot tell you whether you're right. For that you need a record of what Riot's server actually did, and that is exactly what a replay is: the server's output stream, every message it sent to a spectator, at tick resolution, for the whole game.

There's a trap in that, and it's worth naming before using the data for anything. If you take a replay and stream it through your own server to the client, the client plays the game back, and nothing has been tested except your transport. *Replaying server outputs verifies playback. Reconstruction means predicting the outputs from an earlier state and the inputs you can establish.* The oracle is only an oracle if the simulator is made to guess what comes next and is marked against the stream afterwards.

**What a replay rebuilds to.** The first thing was to establish what the stream contains, with no client running. Each keyframe of a ranked game was rebuilt from the previous keyframe plus the packets between them, and compared to the keyframe the server actually sent:

| Object class | Bit-exact |
|---|---|
| Turrets | 99.8% |
| Minions | 97.4% |
| Heroes, replicated block | 91.9% as recorded; 99%+ allowing for the server's own transmission lag |
| Buffs | 92.8% |

Hold-out games give the same numbers. The misses that remain are server timer phases that never appear in the stream: regeneration ticks, rune ticks. So about 92% on those classes is the ceiling by construction, not a decoder gap. At roughly two CPU-minutes a game, the whole corpus is recoverable to that standard in days on one box. A reader who followed TLoL will recognise this as the thing we were doing by hand in 2021, now exact and three orders of magnitude cheaper.

**What a replay doesn't contain.**

Two absences shape everything after this point.

The first is inputs. A replay is server-to-client only. It holds the server's *response* to every click — a waypoint group after a move order, a cast answer after a cast request — and not the click. For imitation learning that means action labels are inferred from responses, with a tick of uncertainty and no record of the rejected or redundant inputs a human actually issued. For reconstruction it means the harness has to tolerate that same tick.

The second is the rules themselves. The client ships the numbers: base damage, ratios, cast times, missile speeds, collision radii, the navigation grid — in its data files, and the replay shows those numbers being applied. But the logic that applies them lives on the server. Buff lifecycles, stack caps, internal cooldowns, spell control flow, minion aggro and retargeting, camp timers, turret priority: none of that is in the client's data, and the replay records only its *effects*. We counted 4,316 distinct buff names across 66 games, still arriving at about six new ones per game, against 3,936 buff records in the client. The client's records say what a buff is called, not what it does.

So the stream will mark the simulator's answers, and the client will display them, and neither will hand over the function that produces them. The rules have to be fitted.

## Fitting the rules

If the rules can't be read, they can be fitted: propose a rule, run it against what the server did in thousands of recorded situations, and keep the version that agrees most often. Minions were the first subsystem to go through this, because they're the thing a laning agent interacts with most and the thing the client's data says least about.

**The scoreboard.** At every real minion decision in a held-out replay — a target chosen, a retarget, a call for help answered — the simulator is reset to the replay's exact state, asked what it would do, and compared with what the server did. That gives a per-decision accuracy per rule, on data the rule was never fitted to. By 11 October target choice was 77–80% exact (from 58–61% on the hand-written spec), caster first hit 61–67% (from 16–20%), and retarget timing still weak at 24–36%.

**Randomness, modelled.** Real targeting is partly random — a custom game with no players in it ends differently every time — so a rule that always picks the same creep will be "wrong" on a fraction of decisions no matter how good it is. The fix was to fit a distribution rather than a rule and sample from it. Measured against held-out games, the real outcome falls inside the simulator's range 67% of the time for HP, 77% for death time and 88% for the killer, up from 50 / 63 / 74 with the deterministic rule.

**De-aggro, from 17,279 episodes.** When does a minion stop chasing a champion? The spec said thirty ticks and a 1,000-unit leash. Seventeen thousand real minion-on-champion episodes said otherwise: a minion holds the target for about ninety ticks after the latest call for help, and drops it mainly when an enemy minion hits a nearby ally, when the champion leaves vision, or when the champion dies, with a loose leash around 1,200 units. The replaced rules went into both the live server and the simulator the same day, and a client run under them scored 27–27 on last hits with none of 2,110 actions rejected.

**Numbers from data, behaviour from replays.** Where the client's data files do carry a value, they usually beat the fitted one: siege missile speed, the siege and super minion radius, siege gold and its per-upgrade increment, and minion damage to champions at 55% rather than the wiki's 60% (77.9% of 41,532 recorded hits agree). Windups, ranges and approach stops stayed fitted, because the fits scored the same or better. All of the measurable gain came from one number — the radius.

**How big is the rest?** The 15 October estimate for the champion layer was grim: 173 champions, about 800 spell slots, 3,181 champion buff scripts and 936 missile scripts, at three days for a simple champion and two weeks for the hardest — 700 to 900 agent-days, parallelisable, plus a per-patch tax. Two days later a census of the client's data files cut that in half: 82% of the 865 core spells carry their damage, heal or shield formula in the data (also 82% weighted by ranked pick rate); 9% are partial; 9% are pure script — Garen R, Fiora E and the like. Sixty-one champions have all five core spells fully in data. The work is now targeting and side effects for spells whose numbers are known, plus about eighty hand-scripted ones. The map's minion configuration, read the same way, agreed with the replay-fitted spec on 18 of 19 quantities.

That is the method in full: numbers from the client, behaviour fitted from the stream, the stream as the mark. With minion rules inside statistical noise of the server, the Brokenwings recipe could be run again — and this time the thing it was run against was the current game.

## Appendix

<!-- add section explaining openai five comparison training throughput wise -->