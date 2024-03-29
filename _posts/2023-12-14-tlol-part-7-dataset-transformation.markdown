---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 7 - Dataset Acquisition, Transformation and Model Training)"
excerpt: "This post covers the acquisition of a large and diverse dataset of replays, the transformation of these replays into a format suitable for training and the training of basic models."
date:   2023-12-23 00:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "TLoL", "Data Acquisition", "Data Transformation", "Model Training"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

Following a several year hiatus, this section will explain how this project has been restarted and how the progress towards
a working human-level agent is progressing quickly.

## Overview

Previous posts have detailed many of the dataset requirements, and data procurement methods so I will leave the explanation of these
to [part 5](https://miscellaneousstuff.github.io/project/2021/09/08/tlol-part-5-download-scraping.html)
and [part 6](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html#overview), if readers are interested.
Here, I will detail significant progress in restarting this project, and any interesting details:
1. (Replay Dataset) Download a new dataset of replays, totalling 58,530 replays across multiple regions (EUW1, EUN1, KR, LA1, NA1).
   This ranges all the way from the top of Korean challenger all the way down to roughly Diamond IV across multiple
   regions.
2. (Replay Scraping) T_T-Pandoras-Box which replaces LViewLoL as the scripting engine used for memory scraping replays and to control
   agents in the future.
3. (Dataset Transformation) Data transformation of the SQLite3 DB replays to half precision NumPy arrays
   which contain all of the data required to finally train our ML model.
4. (Initial ML Model) The initial goal in this type of research is to try and create a model which can make basic action predictions using observations.
   Here we will explore using different types of ML models, some inspired by previous approaches such as OpenAI Five. This section will highlight
   just how open-ended this problem is and that there will be a lot of exploration required to execute this properly.

## Replay Dataset

### Explanation

As detailed across all of the other posts, the most crucial aspect for this project to work is to use expert replays to train our agent.
To do this, we need a method to download a dataset of replays according to some criteria which we set out for our expert replays. Based on
aspects discussed in previous sections, and the fact that we now have access to KR replays which weren't previously available (the method will
be explained), the following criteria was chosen:

| Criteria | Choice | Reason |
| - | - | - |
| Champion | Ezreal | Ezreal is consistently one of the most played champions in every region and is also easy to infer actions from later on during the data transformation stage. |
| Replay Regions | Multiple (EUW1, EUN1, KR, LA1, NA1) | Ideally we would just use all KR replays but unfortunately our method of acquiring KR replays is slow, so we need to compensate by downloading replays from other regions to ensure an adequate number of replays. Also, the reason why we didn't just use EUW1 for all of the other regions is because it's better to use the highest players of the ladder of other regions as they're in theory better than just high elo of other regions below a certain rank (Master tier for example). This is arbitrary and may prove to be wrong, but shouldn't be a major issue. |
| Replay Count / Dataset Size | ~60,000 / 1TB | As explained in previous sections, the [JueWu-SL](https://ieeexplore.ieee.org/document/9248616) paper which this project is basing it's method on managed to train an agent with performance comparable to human pros using 120,000 games per agent. However, the game length of Honor of Kings is half of League of Legends so in theory, 60,000 should give us a highly performant agent. Although this isn't a very strong argument, 1TB of replay files should be a good base point to tell if it's enough to train a highly performant agent and if more is required further down the line, it is just a case of downloading more and we'd expect the agents performance to just continue to scale. |
| Patch | 13.23 | T_T-Pandoras-Box contains a very complete API specification of data we can scrape from replays (aside from some actions which were included in the specification, but weren't working 100% correctly after manual inspection.). I wasn't sure when it would get updated again so I decided to go all in on this patch.|

### Method (Non-KR Regions)

Since the last post, the replay downloading method described in [part 6](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html) has now been integrated into a python library called [`tlol-py`](https://github.com/MiscellaneousStuff/tlol-py)
which allows for much more easily downloading datasets according to a specific criteria (across multiple regions).
The replay downloading script within [`tlol-py`](https://github.com/MiscellaneousStuff/tlol-py) does two things:
1. Returns the list of players on the ranked ladder for a specific region between the `start_page` and `end_page`.
2. Returns a combined list of game ids for each player on the ladder who played the specified champion on the specified patch.

[`tlol-py`](https://github.com/MiscellaneousStuff/tlol-py) can be installed by doing the following:

```bash
git clone https://github.com/MiscellaneousStuff/tlol-py.git
pip install --upgrade tlol-py/
```

Then we can use the library to specify which region we want to download replay files from, and which pages of the ranked ladder we want
to download from. However, because we're using the [U.GG](https://u.gg/) website to get the list of players and the associated match IDs of
the players, we need to respect their rate limits. The easiest way to do this is to just request a small number of pages from the ranked ladder
at a time, and then use the League client to download the small list of replays. This naturally introduces a delay between bulk requests from the
[U.GG](https://u.gg/) website which will stop us from being temporarily banned from accessing the site and is more respectful usage of the site.

This stage was executed simultaneously on a Windows Desktop, MacBook Air and also partially on Google Colab instance.
Therefore, there are two different scripts for running this stage. This
also forced the [`tlol-py`](https://github.com/MiscellaneousStuff/tlol-py) library to be re-written to support multiple platforms and download regions, 
which was a plus. The main reason why this replay downloading process was split across two devices is because replay downloading is throttled by
the League client (which downloads replays from an AWS S3 store in the background). This can be verified as the download speed of the replays was
slower than my internet speed. This is likely because the API downloads indivdiual replay files at a time and doesn't properly request bulk downloads
in one go which would be more efficient and because our usage of the LCU API's download function is not what it was originally designed for.

[Here](https://github.com/MiscellaneousStuff/tlol-py/blob/main/replay_scraping.sh) is the Unix-based script (for macOS and Linux, i.e. Google Colab):

{% gist 543f40d2f4fb82b20d7ada852e2d1929 %}

and [here](https://github.com/MiscellaneousStuff/tlol-py/blob/main/replay_scraping.ps1) is the Windows Powershell based script:

{% gist 2e1d65c23c491e6912677bff56ad54f1 %}

### Method (KR Region)

The KR region replay downloading operated differently, due to differences between KR and other regions. The key difference to understand here
is that KR League of Legends accounts require you to sign up with your real-name and a valid Korean Social Security Number (SSN) which generally
makes it harder for non-residents (esp. if you're not located in South Korea) to sign up for a KR LoL account. Fortunately if you're resourceful,
there are ways of acquiring KR League of Legends accounts. With this first problem solved, this leads us to our next problem, to play on a KR
League of Legends account from outside of South Korea, you need to play on a South Korean VPN. The issue here is that many of them have throttled
bandwidth. In the context of this project, this bottlenecks the number of replay files you can download within a certain timeframe. For context,
the median size of a League of Legends replay in Patch 13.23 is ~16MB. This means that 60,000 replays would be 960GB or in other words ~1TB.

The issue with this is that the speed of the VPN which was being used was 10.53Mbit/s. This means that downloading 1TB of replays would take
~221.29 hours or 9 days and 5.5 hours. Ideally we want to be able to download replays within a day or a few days (especially for future use
cases). This means that we only ended up downloading 3,210 KR replays, however they were all Challenger or Grandmaster Ezreal games so the dataset
was of high quality.

Aside from these differences, the download process of the KR replays was the same as the others, just around 10x slower.

### Dataset Statistics

After the replay downloading process was completed, we need to make sense of this large dataset. To do so, we re-use the code
from [part 6](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html#overview):

{% gist eb1e3f25cd31a66200417c6eb2344dbb %}

The data for this can be found [here](https://drive.google.com/file/d/1czT2ZgWvZ09JPOy2_Uov8379MRcybQNv/view?usp=sharing).
Now we have the metadata for the entire dataset, we can use the following command to find out how many replay files we have
per each region:

{% gist 6ab489510f09d0cd1db96453b3b3a53a %}

Overall, the following number of games were downloaded from each region:

| Region | Count | Ranked Population (For Context - As of 23/12/2023) |
| - | - | - |
| BR1 (Brazil) | 3,049 | 1,333,420 |
| EUW1 (EU West) | 30,404 | 3,388,540 |
| KR (Korea) | 3,210 | 3,697,151 |
| LA1 (Latin America North) | 2,179 | 770,505 |
| EUN1 (EU Nordic & East) | 13,156 | 1,585,468 |
| NA1 (North America) | 6,532 | 1,554,540 |

As we can see, there is a large number of games from EU West and EU Nordic and East. EU West is generally known as the best
non-Asian region hence it was prioritised after the KR region, and EU Nordic and East afterwards due to its relatively high
ranked player population.

## Dataset Filtering and Processing Considerations

For us to build our initial agent, we need to ensure high quality replays and simplify our dataset. For starters, it would
be easier if we just considered replays which were played on one side of the map initially, as which side of the map you're
on can significantly change decision making and may add unnecessary complexity to our agent early on. For this reason, we
only want to choose blue side replays which halves the number of replays we can use. 

Buliding on this, we also want to
choose replays where players performed the best. As you can see from the above GitHub gist, we have multiple features to
filter replays on. From empirical evaluations, the best features to filter games on which results in the highest win rate
for Ezreal players is time spent dead. On top of this, we also should limit the total number of replays initially to something
which we can process within a reasonable amount of time, and then scale up later when our baseline data transformation process
if working correctly and somewhat refined.

For this purpose, 10,000 games should suffice. It's using the roughly top 33% best played
replays which were played on blue side which means it's still using a significant number of the entire dataset, and shouldn't include
many instances of players intentionally feeding or trolling games (again, relying on the fact that players who haven't spent much time
dead on average have a significantly above average win rate and are therefore unlikely to be trolling games).

The following SQL statement was used on the metadata SQLite3 database to find these games (but was instead empirically tuned to
(`time_spent_dead` < 90) and then slightly filtered.

{% gist 52c259e796940c5bdbdb4787bae1e88b %}

The other consideration we have here is game length. Here we are bounded by throughput and also the complexity of developing our model.
It would be easier to just consider the early game for model development initially, and then scale up the game length of each replay
when we're happy that it's working correctly. For this, only the first 3 minutes of games are being considered, as they are likely to
contain all of the scenes which would appear in a full length game so they are a good sampling of what will be required when scaling
up to full game replays. Fortunately 3 minute games are 10x smaller than full games (mean game length in League of Legends is roughly
30 minutes), so should also make processing of these datasets much faster and require far less storage.

## Replay Scraping

### Explanation

At this stage, we have downloaded almost 60,000 replay files across multiple regions which all contain an Ezreal player, for a total
of 58,530 replay files. Due to making the replay scraping process consistent, we delete all replays which last less than 3 minutes
(early game forfeits due to AFK players), which reduces our dataset size down to 57,667 replays. We have now filtered the original
57,667 replays down to 10,065 replays based on games which have the Ezreal player on the blue side, where the Ezreal player spends
the least amount of time dead and all games are to be scraped for 3 minutes (i.e. 180 seconds) only.

### T_T-Pandoras-Box

Now would be a good time to explain why we're changing from LViewLoL, or more accurately [LViewPlus64](https://github.com/ImbaMDT/LViewPlus64),
to the [T_T-Pandoras-Box](https://github.com/Braziliana/T_T-Pandoras-Box/) library. On 4th April 2023, Riot Games transitioned League
of Legends from supporting 32-bit and 64-bit architectures to only 64-bit architectures and also internally changed how some
parts of the game engine worked for things such as how missiles (i.e. game objects which are projectiles and similar things) work
which broke [LViewPlus64](https://github.com/ImbaMDT/LViewPlus64). Unfortunately, this also meant that the memory reading process
used to scrape replays which this project was reliant on no longer worked, and would require far too much work to rebuild for the new
version of League of Legends, which put this project on hiatus. However, within the last few months another developer created the
[T_T-Pandoras-Box](https://github.com/Braziliana/T_T-Pandoras-Box/) library, which is another scripting engine which can be adapted
for replay scraping just as [LViewPlus64](https://github.com/ImbaMDT/LViewPlus64) could. However, the new
[T_T-Pandoras-Box](https://github.com/Braziliana/T_T-Pandoras-Box/) library also has a far more feature complete API and added support
for things which [LViewPlus64](https://github.com/ImbaMDT/LViewPlus64) contained, but didn't properly support (such as buff information
which let you know which buffs were affecting which champions and many other useful pieces of information).

The change was so substantial that it basically meant that (for Patch 13.23 at least), we have complete access to all features which
we could possibly ask for which is great from a model development / research perspective. However, we are still missing complete support
for just getting which action champions are performing. That being said, this can mostly be inferred from other features so isn't a
dealbreaker, just as it wasn't with [LViewPlus64](https://github.com/ImbaMDT/LViewPlus64). The complete listing of features is
available [here](https://github.com/Braziliana/T_T-Pandoras-Box/?tab=readme-ov-file#sdkapi).

There is only one major substantial change in the T_T-Pandoras-Box repo for this project (along with some modifications in other files
to support this script). The entire C# based replay scraper is shown here:

{% gist f89706af372f70b4343a26d45e860f44 %}

The main takeaway from this code is that we set the replay speed of the client to whatever speed we want (in this case, x16 real-time),
with many of the decisions here already having been justified in
[part 6](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html#overview). We initially use JSON
when scraping the game objects from the game engine as it's highly flexible and can easily be converted into whatever format we want
later on. The main downside is how storage inefficient JSON is, especially for our use case where it is roughly 20x bigger compared
to be compressed with 7-Zip. This is due to each sample, and sub-object within each sample requiring so much boilerplate to be represented,
and the redundant recording of all strings and inefficient representation of floating point number values.

### Method

Similar to the replay downloader, the replay scraper has also been somewhat productionised into the tlol-py library, and now only
requires the following command to be run (refer to [part 6](https://miscellaneousstuff.github.io/project/2021/11/19/tlol-part-6-dataset-generation.html#overview) or the [source code](https://github.com/MiscellaneousStuff/tlol-py/blob/main/tlol/bin/replay_scraper.py) for a more extensive explanation):

```powershell
python -m tlol.bin.replay_scraper `
--game_dir "..\\Game\\" `
--replay_dir "..\\Replays\\" `
--dataset_dir "..\\JSON Replays\\" `
--scraper_dir "..\\T_T-Pandoras-Box\\x64\\Release\\T_T\\" `
--end_time 180 `
--replay_speed 16 `
--replay_list "replay_paths.txt"
```

This leaves us with a final directory of 10,065 JSON files containing everything we need from the first 3 minutes of each replay file. After this,
we need to convert the JSON files to SQLite3 databases which have the data in the correct format which we need to load it into the `pandas` library
for data analysis in Python. This is done using the following command:

```powershell
python -m tlol.bin.convert_dataset_pandoras `
--db_dir "..\DB" `
--json_dir "..\JSON Replays" `
--max_workers 12
```

Refer to the [tlol-py](https://github.com/MiscellaneousStuff/tlol-py) libraries source code for full implementation details.

## Dataset Transformation

### Explanation

At this stage, we have 10,065 SQLite3 database files which require extensive data cleaning, normalisation and different transformations
before they are ready to be supplied to any ML model. Refer to the [tlol-analysis](https://github.com/MiscellaneousStuff/tlol-analysis)
repo for extensive implementation details.

## Model Exploration

### Explanation

Now that we have converted the raw replays into scaled, flattened and embedded observations which are split into observations and
actions, we can begin to feed the observations into an ML model and predict which actions the user took, this is the beginning
of a very real ML model which can play League of Legends!

The methodology here is based on advice
from Andrej Karpathy's ["A Recipe for Training Neural Networks"](https://karpathy.github.io/2019/04/25/recipe/),
which I've found to often be good advice. The key pieces of advice which we'll follow here are:
1. Overfit
   This is especially important. The task which we're trying to accomplish here is actually very complicated, we're trying to train an
   ML model to essentially receive the variable game object tree and in-game time of some sample of a League of Legends game, and predict
   which action a high elo player would have taken in that situation. Before even attempting to create a model which can generalise, we
   need to determine what architecture even has the capacity / capability of performing the task. This is where just even trying to create
   a model which will overfit will be essential.
2. Get Dumb Baselines
   This completely ties in with the previous point. However, we also need to try the simplest model which works at all. This means that before
   we jump on to more complex model architectures such as sequential models (LSTMs, Transformers, etc.), we should at least try to use simple
   architectures such as MLP layers or possibly even non-deep learning methods such as SVMs, Decision Tree's etc.
3. Neural Net Training Fails Silently 
   This is an insidious problem which most researchers would have encountered at some stage. The problem is that, when you're trying to train
   a model to make a prediction for a real world problem, you often have to transform that data into some abstract format and then provide that
   to a model to perform the prediction. In the case of our task, it's even worse. We could train the model to have a high prediction accuracy
   for predicting expert actions within certain situations, and then when deployed within a real game, it performs absolutely horribly. The key
   idea here is to rapidly also deploy our trained models into the real game and test it during training to make sure our entire pipeline is
   working as expected and that we're not getting false positives during the research and development phase.

### Models

#### First Model: Simple MLP Model (Partially Based on JueWu-SL)

The first model which we're going to try is just a simple MLP based model which was empirically tweaked to see what is the simplest
model we can train which results in being able to predict anything with above chance accuracy. 

#### Second Model: OpenAI Five Architecture Component (ProcessSet)

TBC.

## Resources

- [League of Legends Python ML Library](https://github.com/MiscellaneousStuff/tlol-py)
- [Data Analysis / Training Repo](https://github.com/MiscellaneousStuff/tlol-analysis)
- [Datasets Used in this Post](https://github.com/MiscellaneousStuff/tlol?tab=readme-ov-file#ezreal-dataset-patch-1323)
- [All Datasets](https://github.com/MiscellaneousStuff/tlol)
- [Original T_T-Pandoras-Box](https://github.com/Braziliana/T_T-Pandoras-Box/)
- [TLoL-Scraper T_T-Pandoras-Box](https://github.com/MiscellaneousStuff/tlol-scraper-pandoras/)