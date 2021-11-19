---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 6 - Dataset
Generation)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-11-19 08:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL", "Data Generation"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

Following a long hiatus, this section will explain the data generation procedure for
the TLoL project and how the datasets used will be used to create the first agent
which can play League of Legends.

## Overview

To generate a basic replay dataset for League of Legends, a process to gather replay
files and extract useful information from them was required. As has been explained
in previous posts, there is no API from Riot to do this so a custom method was required.
The League of Legends replay files themselves used an obfuscated and encrypted format
which changes with each patch, however, there are scripting tools which rely on
scraping game objects from distinct memory locations which are far easier to update
from patch to patch. These scripting tools are easier to update from patch to patch
because the League of Legends game engine itself doesn't drastically change from patch
to patch. This makes using scripting engines to scrape data from replays loaded into
the game client a far more viable approach to extracting data from replays compared
to decrypting the League client's replay decryption method.

Before this, we need to download a sufficient number of replays to extract data from.
Fortunately, the League Client Update (LCU) introduced a new API to automatically
allow downloads directly from the location where replay files are stored. As it turns out,
Riot like many companies now, use Amazon S3 to store their replay files each patch. This
means that if you download multiple replay files using this LCU API, you are downloading
the files directly from Amazon which means that the download speeds are high.

### Data Generation Process

As summarised before, this means we need an end-to-end process for generating our replay
dataset. With all of the considerations of the previous posts, this results in the
following process:

1. Determining which players to scrape replays from
2. Determining which games these players have played to download
3. Automatically downloading all of these games from Riot's Amazon S3 replay file store
4. Creating a reliable, automated process for extracting information from the replays
   - Storing the data from the replays into an intermediate format
   - Converting the intermediate format into a format more suitable for storage
     and processing

## Player and Game Selection

### Explanation

As explained in [part 4](https://miscellaneousstuff.github.io/project/2021/09/04/tlol-part-4-exploring-the-literature.html) and [part 5](https://miscellaneousstuff.github.io/project/2021/09/08/tlol-part-5-download-scraping.html), it is important to gather data
from the best performing players available as that increases the performance of the agent,
regardless of how you use the data to train the agent. As such, I simply chose to gather
data from the top of the EUW ranked ladder. I would have preferred to use the KR ranked ladder
but sadly it is difficult to acquire a KR League of Legends account if you live outside
of the region.

As for the game selection, I am using the criteria from [part 5](https://miscellaneousstuff.github.io/project/2021/09/08/tlol-part-5-download-scraping.html) when selecting games, #
however, I have decided to change a few things. Firstly, I will be using `Miss Fortune` 
instead of `Ezreal`. The reason for this is that the attack damage carry (ADC) who is most
popular each patch changes based on which champion is currently strong within that patch.
This means that a varying amount of data is available for each champion. Another criteria
which I changed was deciding to scrape games where the game with the desired champion won
the game only. Instead I scraped games where they won and lost and instead used basic
meta-data about the performance of that player later on. This means that more replays
are available for the dataset and allows more precise fine tuning of the dataset as whether
a player won or not is a crude estimate of their performance for each game.

### Method

#### Data Source

The data source for this information is the [u.gg](https://u.gg/) website which provides a
very simplified API for accessing Riot API information. The [u.gg](https://u.gg/) website
is used instead of the Riot API because when the Riot API switched from `v4` to `v5`, they
introduced harsh API limits which rendered it useless for this project. I also avoided
[op.gg](https://op.gg) as the API is out of date and difficult to parse due to it's age,
this is further explained in [part 5](https://miscellaneousstuff.github.io/project/2021/09/08/tlol-part-5-download-scraping.html).

#### Process

The process is split into two main parts:
1.  Gather a list of high elo players from rank 1 down to a specified limit.
    In practice, the limit was set to the top 36,000 players which roughly comprise the
    top 1% of players in EUW.
2.  Gather a list of game IDs which match the criteria we want.
    The criteria used was the following:
    - Contained either `Miss Fortune` or `Nami` (as they were the most popular champions
      for the target patch `11_21`).
    - Games were played on patch `11_21`.
    - Win or loss.

The directory for this process was structured as follows:
- [champ_ids.txt](https://github.com/MiscellaneousStuff/miscellaneousstuff.github.io/blob/main/assets/configs/champ_ids.txt) (Contained a list to map champion names to their Riot defined IDs)
- replay_scraper.py (Contained the code to gather the game ids)

## References