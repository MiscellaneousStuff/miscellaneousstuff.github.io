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
3. (Dataset Transformation) Data transformation of replays all the way from JSON files to SQLite3 database files to half precision NumPy arrays
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
only want to choose blue side replays which halves the number of replays we can use. Buliding on this, we also want to
choose replays where players performed the best. As you can see from the above GitHub gist, we have multiple features to
filter replays on. From empirical evaluations, the best features to filter games on which results in the highest win rate
for Ezreal players is time spent dead. On top of this, we also should limit the total number of replays initially to something
which we can process within a reasonable amount of time, and then scale up later when our baseline data transformation process
if working correctly and somewhat refined. For this purpose, 10,000 games should suffice. It's using the roughly top 33% best played
replays which were played on blue side which means it's still using a significant number of the entire dataset, and shouldn't include
many instances of players intentionally feeding or trolling games (again, relying on the fact that players who haven't spent much time
dead on average have a significantly above average win rate and are therefore unlikely to be trolling games).

## Resources

- [League of Legends Python ML Library](https://github.com/MiscellaneousStuff/tlol-py)
- [Data Analysis / Training Repo](https://github.com/MiscellaneousStuff/tlol-analysis)
- [Datasets Used in this Post](https://github.com/MiscellaneousStuff/tlol?tab=readme-ov-file#ezreal-dataset-patch-1323)
- [All Datasets](https://github.com/MiscellaneousStuff/tlol)
- [T_T-Pandoras-Box](https://github.com/Braziliana/T_T-Pandoras-Box/)