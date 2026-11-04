---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 3 - Patch 26.19: 1v1)"
excerpt: "This post discusses efforts to train agents on modern League of Legends"
date:   2026-11-04 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Behavioural Cloning", "fastsim"]
tags: [""]
rlYoutubeId: np2o24KoRF4
imitationYoutubeId: 8wmOg4Hlb_Y
---

## Table of Contents

* TOC
{:toc}

## Overview

<div class="key-findings" markdown="1">
In short

- **Two oracles stand in for Riot's server.** The game client says whether our server speaks League; replays say whether it is *right*.
- **Rules are fitted, not read.** Numbers come from the client's data files, behaviour is fitted to the replay stream, and the stream marks the answer.
- **fastduel** reproduces our live server byte for byte at up to 1.95M samples a second on one GH200.
- **Self-play ran out of signal, not compute**: the policy gradient's noise scale is about 130× the minibatch.
- **More human data made a better imitator and a worse duelist**, and interpretability traced at least half of that to plumbing.
</div>

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

## Oracle Data Source

### Memory Reading

This means that [memory reading methods](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html#replay-scraping) are robust to patch changes (or at least only require re-discovering
the memory offset locations for specific game objects and their fields which is relatively routine using signature based
detection every patch).

However memory reading methods are simulatenously slow and fall victim to sampling noise (*when* you read memory, results
in inconsistent data output unless you run it at very slow speeds). The other option is capturing the functions which
the game client itself uses to decode replays.

### Semantic Packet Decoding and Game Server Oracle

<div class="callout" markdown="1">
Context

For some context, `*.rofl` files contain amongst many things the stream of S2C (server-to-client or in other words
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

## Game Server Re-Implementation

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

<div class="callout" markdown="1">
Scope

Two things worth saying plainly. All of this ran against our own server on our own machines; nothing in this post connects to Riot's live service, and the client was read only for interoperability with a server we wrote. And the entire thing — the client, the protocol knowledge, the replay format — sits on a decade of public work by other people, from LeagueSandbox through to the projects that decoded 16.x. We added a server that plays.
</div>

### Replays as the second oracle

The client tells you whether the game accepts you. It cannot tell you whether you're right. For that you need a record of what Riot's server actually did, and that is exactly what a replay is: the server's output stream, every message it sent to a spectator, at tick resolution, for the whole game.

<figure class="fig">
<div class="oracles">
  <div class="o-replays"><span class="tag">Oracle 2 · is it right?</span><b>Replays</b>Riot's server output at tick resolution. Rebuilds keyframes; marks every rule the simulator proposes.</div>
  <div class="o-server"><span class="tag">Ours</span><b>Live server</b>Python, 30 Hz. Rules: numbers from the client's data files, behaviour fitted to replays.</div>
  <div class="o-client"><span class="tag">Oracle 1 · is it League?</span><b>Game client</b>Connects, loads the world and plays what it's sent. Checks the protocol, not the arithmetic.</div>
  <div class="o-fast"><span class="tag">Byte-identical port</span><b>fastduel</b>Headless numba engine. Same messages as the live server, up to 1.95M samples/s on one GH200.</div>
</div>
<figcaption>The setup in one picture. Neither oracle hands over the rules: the client only shows whether a server is acceptable, and replays only record what Riot's server did. Agents train in fastduel and are evaluated back in the real client.</figcaption>
</figure>

There's a trap in that, and it's worth naming before using the data for anything. If you take a replay and stream it through your own server to the client, the client plays the game back, and nothing has been tested except your transport. *Replaying server outputs verifies playback. Reconstruction means predicting the outputs from an earlier state and the inputs you can establish.* The oracle is only an oracle if the simulator is made to guess what comes next and is marked against the stream afterwards.

**What a replay rebuilds to.** The first thing was to establish what the stream contains, with no client running. Each keyframe of a ranked game was rebuilt from the previous keyframe plus the packets between them, and compared to the keyframe the server actually sent:

<figure class="fig">
<div class="viz" data-viz="reconstruction"></div>
<figcaption>Keyframes rebuilt from the previous keyframe plus the packets between them, compared bit for bit with the keyframe the server sent. For heroes, the hollow dot allows for the server's own transmission lag. The remaining misses are server timer phases (regeneration, rune ticks) that never appear in the stream.</figcaption>
</figure>

Hold-out games give the same numbers. The misses that remain are server timer phases that never appear in the stream: regeneration ticks, rune ticks. So about 92% on those classes is the ceiling by construction, not a decoder gap. At roughly two CPU-minutes a game, the whole corpus is recoverable to that standard in days on one box. A reader who followed TLoL will recognise this as the thing we were doing by hand in 2021, now exact and three orders of magnitude cheaper.

**What a replay doesn't contain.**

Two absences shape everything after this point.

The first is inputs. A replay is server-to-client only. It holds the server's *response* to every click — a waypoint group after a move order, a cast answer after a cast request — and not the click. For imitation learning that means action labels are inferred from responses, with a tick of uncertainty and no record of the rejected or redundant inputs a human actually issued. For reconstruction it means the harness has to tolerate that same tick.

The second is the rules themselves. The client ships the numbers: base damage, ratios, cast times, missile speeds, collision radii, the navigation grid — in its data files, and the replay shows those numbers being applied. But the logic that applies them lives on the server. Buff lifecycles, stack caps, internal cooldowns, spell control flow, minion aggro and retargeting, camp timers, turret priority: none of that is in the client's data, and the replay records only its *effects*. We counted 4,316 distinct buff names across 66 games, still arriving at about six new ones per game, against 3,936 buff records in the client. The client's records say what a buff is called, not what it does.

So the stream will mark the simulator's answers, and the client will display them, and neither will hand over the function that produces them. The rules have to be fitted.

### Fitting the rules

If the rules can't be read, they can be fitted: propose a rule, run it against what the server did in thousands of recorded situations, and keep the version that agrees most often. Minions were the first subsystem to go through this, because they're the thing a laning agent interacts with most and the thing the client's data says least about.

**The scoreboard.** At every real minion decision in a held-out replay — a target chosen, a retarget, a call for help answered — the simulator is reset to the replay's exact state, asked what it would do, and compared with what the server did. That gives a per-decision accuracy per rule, on data the rule was never fitted to. By 11 October target choice was 77–80% exact (from 58–61% on the hand-written spec), caster first hit 61–67% (from 16–20%), and retarget timing still weak at 24–36%.

**Randomness, modelled.** Real targeting is partly random — a custom game with no players in it ends differently every time — so a rule that always picks the same creep will be "wrong" on a fraction of decisions no matter how good it is. The fix was to fit a distribution rather than a rule and sample from it. Measured against held-out games, the real outcome falls inside the simulator's range 67% of the time for HP, 77% for death time and 88% for the killer, up from 50 / 63 / 74 with the deterministic rule.

<figure class="fig">
<div class="viz" data-viz="minion-fit"></div>
<figcaption>Fitting minion rules to replays. <b>Top:</b> exact agreement with the server at real decisions in held-out replays, hand-written spec vs fitted rule (bars are the reported ranges). <b>Bottom:</b> how often the real outcome falls inside the range the simulator produces, deterministic rule vs a sampled distribution.</figcaption>
</figure>

**De-aggro, from 17,279 episodes.** When does a minion stop chasing a champion? The spec said thirty ticks and a 1,000-unit leash. Seventeen thousand real minion-on-champion episodes said otherwise: a minion holds the target for about ninety ticks after the latest call for help, and drops it mainly when an enemy minion hits a nearby ally, when the champion leaves vision, or when the champion dies, with a loose leash around 1,200 units. The replaced rules went into both the live server and the simulator the same day, and a client run under them scored 27–27 on last hits with none of 2,110 actions rejected.

**Numbers from data, behaviour from replays.** Where the client's data files do carry a value, they usually beat the fitted one: siege missile speed, the siege and super minion radius, siege gold and its per-upgrade increment, and minion damage to champions at 55% rather than the wiki's 60% (77.9% of 41,532 recorded hits agree). Windups, ranges and approach stops stayed fitted, because the fits scored the same or better. All of the measurable gain came from one number — the radius.

**How big is the rest?** The 15 October estimate for the champion layer was grim: 173 champions, about 800 spell slots, 3,181 champion buff scripts and 936 missile scripts, at three days for a simple champion and two weeks for the hardest — 700 to 900 agent-days, parallelisable, plus a per-patch tax. Two days later a census of the client's data files cut that in half: 82% of the 865 core spells carry their damage, heal or shield formula in the data (also 82% weighted by ranked pick rate); 9% are partial; 9% are pure script — Garen R, Fiora E and the like. Sixty-one champions have all five core spells fully in data. The work is now targeting and side effects for spells whose numbers are known, plus about eighty hand-scripted ones. The map's minion configuration, read the same way, agreed with the replay-fitted spec on 18 of 19 quantities.

<figure class="fig">
<div class="viz" data-viz="spell-census"></div>
<figcaption>Census of the 865 core spells in the client's data files: how many carry their damage, heal or shield formula in data. The 9% that are pure script (Garen R, Fiora E and the like) are the ones that need hand-writing.</figcaption>
</figure>

That is the method in full: numbers from the client, behaviour fitted from the stream, the stream as the mark. With minion rules inside statistical noise of the server, the Brokenwings recipe could be run again — and this time the thing it was run against was the current game.

### fastduel

The Brokenwings lesson was that the simulator has to be exact to the thing it's standing in for, and that the only way to know is to diff. Here the thing it stands in for is our own live server — the one the client accepts — so exactness is cheap to check and the question is only speed.

**The port.** The live server's rules were made headless, so a clientless engine could run a duel and emit the same messages the client would have received. A call log proved it: 2,653 messages across a 160-second duel against the scripted bot, byte for byte. Then the whole ruleset — movement, A\* on the map's grid, the four spells, Flash and Barrier, autos, damage, respawn — was ported to numba with the same order of operations, and both champions put on one rule set so the scripted bot is just another policy with `observe()` and `act()`. The fidelity gate is a script that replays 26 recorded sessions and requires byte-identical output; a 200-episode soak (135,000 decisions) found zero divergences from the Python rules, and a 100-episode soak zero differences in observations, masks or rewards. Later the lane with minions, then turrets, went in the same way: a line-for-line copy of the live rules with the same random generator, identical every tick in tests.

**Throughput.** The baseline showed the environment, not the learner, was the bottleneck by about twenty times. Then:

<figure class="fig">
<div class="viz" data-viz="throughput"></div>
<figcaption>Training throughput, log scale. Every row passes the byte-identical fidelity gate. The A10 box tops out at 662k samples/s; one GH200 reaches 1.27M with the old recipe and 1.65–1.95M on the turret run.</figcaption>
</figure>

The main A10 cause was fourteen threads waking per decision and queueing on the GIL; the fix also made parallel and serial stepping bit-identical, so the exactness checks still pass after every one of those rows. At the top of the table one GH200 is producing about forty million decisions a minute, which is the Brokenwings figure on a game eight patches old rather than fifteen years.

**Where the time went instead.** Once the engine was fast, the agent slowed it down. A trained policy issues a move order on about three quarters of its decisions, and every move order is an A\* search; one run's throughput fell from 950k to 157k samples a second as the policy learned to move. Faster routing with identical paths — straight-line shortcut, a route cache — recovered most of it. The simulator's cost is now set by what the policy does, which is a strange and correct place to end up.

## Training Agents

### Reinforcement Learning Agents

Everything in this section was trained in fastduel and evaluated either in fastduel or in the real client against our server. "DuelBot" is the scripted Ezreal.

**v1, 9–10 October.** A plain MLP, 160 → 256 → 256, about 231,000 parameters including the value net, decisions every 133 ms, no memory, PPO self-play with an opponent pool. Within a few hours of the first run, checkpoint v2700 beat DuelBot 4–1 in the live client; under fair rules, v3400 won 5–0 on blue and v3600 5–0 on red. On the open map the strong checkpoints mostly drew — kill-draws around 85% in self-play, timeouts at 30 s in the client — because two equal Ezreals can always walk away. A movement-bounded arena (`--arena 1400`, identical in the engine and the live server) took self-play draws from 84% to 3%, and the arena's final checkpoint rated +77 Elo over every earlier agent while tying them on the open map. It fights more, and over-commits when the opponent can retreat. The environment decides what there is to learn.

**The lane, 12–15 October.** Minions in, the Brokenwings unit-set LSTM as the network. In a ten-minute real-client video both lane agents farmed about 11 CS a minute — good dodging, constant animation cancelling, spell combos around W, and the first signs of wave management. The ladder said lane3, trained on the replay-fitted randomness model, beat lane2; it also said lane3 had been flat since about update 1,000. Flat training curves and a moving ladder was the Brokenwings pattern, and it held.

**Turrets, 19–22 October.** With towers in the lane and the rules set to first-to-100-CS-or-a-tower, the policy reached 1,042 Elo on the ladder and never won by killing a turret. Interp (next section) explained why: it had learned a real model of turret danger, pushed from behind its wave 85% of the time, and worked out that ignoring a 9,000 HP tower is close to optimal because 100 CS arrives first. Randomising turret HP at spawn — OpenAI Five's Roshan trick — added about 100 Elo and taught it to finish damaged towers, still not to start on full ones. In my first games against it, playing by hand, I went 2/0 and 8/0 on deaths and 25–55 and 88–193 on last hits. It almost always wins the return trade when autoed, and when I committed a Q trade at low HP it held E and Q and autoed back.

**The league, 22–25 October.** AlphaStar's structure: a main agent, and exploiters trained against frozen copies of it that join the main's opponent pool when they find a hole. The first exploiter passed 50% in ninety minutes and plateaued at 80% by out-farming the main three to one. Each cycle closed the previous hole — main 36,300 beat all three exploiter checkpoints 97–99% — and each fresh exploiter found a new one within four hours. Gains per four-hour block went +100, +40, +40, +28 Elo: a log-compute curve. And the games themselves had a shape the policies couldn't escape: whoever got the first trade off won, because one early trade leaves a champion near 100 of 1,003 HP, and with no recall, no potions and no lifesteal it hides for the rest of the game. That's the environment again.

<figure class="fig">
<div class="viz" data-viz="league-elo"></div>
<figcaption>The league's main agent: Elo gained in successive four-hour blocks (+100, +40, +40, +28). Each exploiter cycle closed one hole and the next exploiter found another; the gains shrink like a log-compute curve.</figcaption>
</figure>

**Why it stopped.** On 15 October we ported the gradient-noise tool from Brokenwings and ran it on six lane checkpoints. The policy gradient's noise scale came out at 1.1–3.4 million samples — roughly a hundred times the Brokenwings figure and 130 times our 16k minibatch, and already 1.5M after half an hour of training. The value gradient's was far smaller. The reading is simple and uncomfortable: a self-play opponent is always about as strong as you are, so the average "do better" direction is tiny from the start, and bigger batches, more throughput or a cleverer optimiser only harvest the same weak signal faster. Lane3 was gaining about 30 Elo per two hours at that point. We had built a simulator fast enough to make the signal the bottleneck, which is the right problem to have and not one more compute fixes.

<figure class="fig">
<div class="viz" data-viz="noise-scale"></div>
<figcaption>Why self-play stopped: the policy gradient's noise scale against the batch actually used, log scale. Brokenwings' LSTM needed batches of about 17k; the lane agents needed 1.1–3.4 million, about 130× the 16k minibatch.</figcaption>
</figure>

<div style="text-align: center;">
{% include youtubePlayer.html id=page.rlYoutubeId %}
</div>

So we trained on human data.

### Imitation

We downloaded a 26.19 corpus of replays, just over 200,000 ranked games. This is the same scale that JueWu-SL reported for Honor of Kings and every human action in it is recoverable from the stream as the server's response: a path, an attack, a cast. If self-play can't find the signal, the humans already have.

**The pipeline.** Of 18,934 archived games with an Ezreal, 16,886 were on the exact build and at least fifteen minutes long. One pinned pipeline takes a game from download through decode, tick export, action labels and observation rows to a packed training file, deleting intermediates as it goes; a golden check reproduces three reference games to about 2,400 hashes each, on x86 and on the ARM boxes. Two GH200s pulling from a shared lease queue extracted 15,881 games in a little over three and a half hours at about 4,800 games an hour — 242 GB, 117.5 million rows. Five games failed for reasons a retry can't fix: two whose end-of-game stats are literally empty, three with a sub-millisecond timestamp step backwards at a chunk boundary.

**The first model.** A 2.5M-parameter feed-forward network on 900 games, trained in 43 minutes. On 50 held-out games against the best baseline: action-type accuracy 62.5% vs 54.5%, attack F1 .465 vs .030, attack-target top-1 84.8% vs 63.7%, cast slot 88.0% vs 72.8%. Weak on timing inside the 200 ms window and on precise movement. The JueWu-SL additions — grids, intent heads, attack weighting — moved it by about a point; validation bottomed out at epoch 12 of 30. At 900 games, more data matters more than technique.

**Scaling, 900 → 15,881.** Nested training sets, one recipe, 500 validation games, the same 50 test games:

<figure class="fig">
<div class="viz" data-viz="bc-scaling"></div>
<figcaption>Behavioural cloning on 900 to 15,881 games: one recipe, nested training sets, 500 validation games and the same 50 test games. Every offline metric (blue) improves with data, each doubling by less. Wins against DuelBot in fastsim (orange, of 20 episodes) go the other way. Hover to read all four at once.</figcaption>
</figure>

Every offline metric improves with data, each doubling by less, and every 95% interval excludes zero. And the win column goes the other way. On a thousand-episode fastsim ladder the full model sat at −5 Elo to DuelBot while the 900-game model sat at +297. In one live-client game the full model went 0/4/0 with 0 CS and idled on 40% of its decisions.

**More data, worse duelist.** The interpretability work in the next section found most of it. The observation builder used by fastsim and the live server cleared the can-cast bits while a spell was on cooldown; in replays, those bits track spell *rank*, so Q's bit is set on 100% of training rows and only 28% of simulator rows. The full model had learned that a cleared Q bit means do nothing; the 900-game model never saw enough rows to learn it. A swap test — set the four bits to their replay values — predicted P(none) would fall from .41 to .25, and twenty episodes landed within .02 of that. Then the same six arms on 3,999 paired seeds:

<figure class="fig">
<div class="viz" data-viz="cancast-arms"></div>
<figcaption>The observation-builder fixes on 3,999 paired seeds. The can-cast fix stops the idling (P(none) .41 → .28) without changing wins; the action-state bit adds ten points of win rate (p &lt; 10⁻⁴). The 900-game model still wins more. Intervals are Wilson 95% where they were measured.</figcaption>
</figure>

The can-cast fix removes the idling and not the losing; a second control-state bit is what moves wins, by ten points with p < 10⁻⁴. With the fixes verified as loaded inside the client's own Python, the full model went 2/1/0 against DuelBot with turrets and idled 29% of the time, in line with fastsim. The 25 and 27 October live losses had both been on the unfixed builder.

And the gap survives: 44% against 70% in fastsim with both fixes. After them the two models idle and attack at the same rates; what's left is a move-share difference and the damage trade. Whether that is a second adapter mismatch — two input columns shift between replay and simulator rows — or a real behavioural difference is the open question carried into November. The honest reading of the whole thread: a bigger imitator of ranked play is a better imitator and, so far, a worse duelist, and the reason is at least half plumbing.

Against our own RL agents the BC models lose almost every game — 1–6% — because they don't farm this 1v1 the way a self-play policy does: they play like a ranked player dropped into a drill that isn't the game. Which is also, from the other side, an argument that the RL agents have overfit a drill.

<div style="text-align: center;">
{% include youtubePlayer.html id=page.imitationYoutubeId %}
</div>

## What the agents compute

Four interpretability passes ran in October, and each one changed a decision. That's the claim this section makes for the method: in a game, every neuron can be traced to an observation, and the result is usually actionable within the day.

**The lane agent, audited.** All 2,208 neurons of lane3 rated across eleven layers; 90% got one clear description — 54% doing one job, 36% two related ones. About eight ideas recur in every layer: the attack cycle, kill windows, own danger, incoming skillshots with a dodge direction, last-hit windows, minion aggro, the W mark, the episode clock. And last-hit circuitry, which the Brokenwings policies never developed: switch off ten encoder units labelled "killable minion" and CS falls 13% and Q casts by a third, nothing else moves; switch off one and nothing happens, because every feature has copies.

**What the LSTM remembers.** Linear probes on the hidden state, held-out R² over 60k decisions: the only thing memory reads better than the current frame is the attack rhythm (.62 vs .50). Swapping memory states between low-HP and full-HP moments shows retreat is decided by the frame; the actor's memory adds a mild lean to engage, the critic's holds more. Why: training had taught about 4.3 s of memory, episodes were 30 s, and there was no fog, so there was nothing to remember past the attack cycle

*Decision:* lane4, an 8× longer memory window with 120-second episodes, which became the reference checkpoint and topped both ladders.
{: .decision}

**The turret policy.** It fast-pushes from cover — behind its wave 85% of the time, a minion between it and the opponent 79% (parent: 61% / 31%) — opens 74% of trades with an auto, lands 73% of its champion damage with autos, and has an LSTM memory of turret shots its parent lacks. Future-event probes in the OpenAI Five style decode its own Q, E and last-hit intents two to three seconds ahead; disengages can't be (AUC .71). Branched rollouts from exact simulator state reproduce observations and rewards bit for bit.

*Decision:* randomise turret HP at spawn, and treat "doesn't attack full towers" as a reward problem rather than a capacity one.
{: .decision}

**The BC model.** A faithful single-frame copy of human conditional rates. Short-horizon anticipation is at RL level — death within 5 s, AUC .95–.97 — but with a 1.1 s lead against RL's 3.6. It has no distance cap; vision is its only limit. It reads every "who is this targeting" input as "is it targeting me." Flipping "drake up" changes almost nothing; it doesn't track the jungler; it over-recalls eight times the human rate and reads gold, not HP, to decide. The trunk discards minion *counts* (R² .83 → .31) and keeps exactly what the next action needs: killable minion in range .98, last hit coming .95.

*Decision:* the can-cast investigation above, which it found.
{: .decision}

The pattern across the four is the one from Part 2's anatomy page: these networks are not mysterious. They are HP-difference machines with a few well-labelled circuits on top, and the circuits they lack: objectives, the jungler, anything beyond a few seconds, are the ones the environment never paid for.

## Appendix

<!-- add section explaining openai five comparison training throughput wise -->

<script src="/assets/part3/figures.js" defer></script>
