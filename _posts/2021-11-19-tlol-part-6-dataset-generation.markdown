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
the TLoL project and how the datasets generated will be used to create the first agent
which can play League of Legends.

## Overview

To generate a basic replay dataset for League of Legends, a process to gather replay
files and extract useful information from them was required. As has been explained
in previous posts, there is no API from Riot to do this so a custom method was required.
The League of Legends replay files themselves used an obfuscated and encrypted format
which changes with each patch.
However, there are scripting tools which rely on
scraping game objects from distinct memory locations from
the client which are far easier to update
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

As for the game selection, I am using the criteria from [part 5](https://miscellaneousstuff.github.io/project/2021/09/08/tlol-part-5-download-scraping.html) when selecting games, 
however, I have decided to change a few things. Firstly, I will be targetting `Miss Fortune` 
instead of `Ezreal`. The reason for this is that the champion who is most
popular each patch changes based on which champion is currently strong within that patch.
This means that a varying amount of data is available for each champion. Another criteria
which I changed was deciding to scrape games where the game with the desired champion won
the game only. Instead I scraped games where they won and lost and instead used basic
metadata about the performance of that player later on. This means that more replays
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
- [replay_scraper.py](https://gist.github.com/MiscellaneousStuff/509303436e887ba0a4c2732511ad23a2) (Contained the code to gather the game ids)

At first, I tried querying the [u.gg](https://u.gg/) and gathered the list of the players
one by one, but I quickly found that this was a very slow process. Instead I decided
to use multithreading to quicken the process but found that issuing 10s, if not 100s of
HTTP requests to a single website per second will quickly get you temporarily banned
from using that website. Therefore I introduced a small 0.25s to 0.5s delay between
each HTTP request which over 360 HTTP requests (36,000 players / 100 players per page),
gave the best balance between increasing the player list generation process and not
getting banned.

Afterwards I needed to find games which matched the criteria described above. Fortunately,
[u.gg](https://u.gg/) also provides a convenient method within their API to do this.
Now that I had a list of the top 36,000 players summoner names, I could use this to look
through their list of played games during the target patch `11_21` and determine if
each game matched the desired criteria. If it did, it was added to the list of games
which would be downloaded later on. As you can imagine, sending 36,000 queries to
[u.gg](https://u.gg/) is also a time consuming process which needed to be sped up
using the same multithreading procedure as above.

The code for both processes combined is provided below:

{% gist 509303436e887ba0a4c2732511ad23a2 %}

Now that we have a list of game IDs we would like to download from the Amazon S3 replay
file store, we need to create a process to actually download the games.

## Replay Downloading

### Explanation

At this stage, we have a long list of game IDs to download from Riot's Amazon S3
replay file storage. When I ran the game ID scraping process for `Miss Fortune`
and `Nami`, I ended up generating at list of `19,534` and `19,860` games respectively.
However, because I stored the replay files in different directories, this meant that
there could be some games between the two lists which were repeated twice, so I combined
the two lists of game IDs, and removed the duplicates. This reduced the total game
count down from `39,394` to `36,698`. This means the final total number of games in our
dataset for `Miss Fortune` and `Nami` in patch `11_21` where the player won or lost
contains `36,698` replays. This should be a more than adequate amount of data to create
a human-level League of Legends AI system.

### Process

#### Port and Auth Token

Following this, we actually need to download the games. As mentioned previously, the
League of Legends Client Update (LCU) hosts a server on the `localhost` which provides
the local user with an API to directly interact with the League of Legends client.
One of the methods it provides is a way to download a replay file just by providing
the game ID. This method only works with replays from the region where the client
is logged into (as League of Legends accounts are tied to [specific regions](https://leagueoflegends.fandom.com/wiki/Servers)). The replay file must also be on the same
patch as the current patch, as Riot deletes replay files which are from previous patches.
Fortunately, our game ID scraping process only returns game IDs for the patch we specify.

However, to interface with this `localhost` address, we need to find out which port
the server is being hosted on and also find its credentials so we can connect to it.
The easiest way to do this is to log into the League of Legends client with an account
that matches the server we want to download games from and use a program like
[Process Explorer](https://docs.microsoft.com/en-us/sysinternals/downloads/process-explorer)
which allows us to view which command line arguments a process was started with. The reason
we need the command line arguments are so that we can see which port the client is hosting
its API interface on and to get the security token to be able to issue HTTP requests to
the client. The following images demonstate this process:

<div style="text-align: center;">
   <img
      src="/assets/op_gg/process_explorer_full_lcu_port.png"
      style="width: 100%; max-width: 640px;"
   />
</div>

From these command line arguments, you need the `--remoting-auth-token` and the `--app-port`
for the next stage.

#### Automated Replay Downloads

Now that we know where the server is being hosted and what the token is, we can use
that information along with the required game IDs and begin to download replay files
automatically. For these HTTP requests, I use the same request delay as the [u.gg](https://u.gg/) requests as downloads from the Amazon S3 replay file storage take roughly the same
amount of time as the delay which matches the download requests to the amount of time
the downloads take to complete. For me on my internet connection, the downloads peaked at
around 200Mbit/s. For an idea of the peak speed of download replays, refer to the below image
which is a log of the download speed over time when downloading the `36,698` replay files.

<!-- Insert Neptune.ai download speed real-time log image here -->

## Replay Scraping

### Explanation

At this stage, we have downloaded all of the replay files we want, in my case that is
a whopping `36,698` replay files. The total file size of all of these replays is roughly
`500GB`, as each replay file on average is about `13.5MB`. This should highlight just
how massive reinforcement learning datasets are in general.

Now that we have these files, we actually need to extract useful information from them.
However, during our extraction process we didn't scrape any metadata about the individual
replay files. However, each `*.rofl` file contains a JSON section at the start of the
file which gives fairly detailed information about the game, including it's patch, the
summoners who played the game and aggregate statistics about their performance during
the game and which champions the players played. This means that we can generate a small
SQL database with this information and use it to tailor our replay scraping process.
The code used to extract JSON metadata from a replay file is provided below:

<!-- *.rofl JSON extraction method GitHub Gist -->

Now, this `metadata.db` SQLite database allows us to query our dataset for useful
information. For instance, we can find out how many replay files we have for each champion.
For instance, we may be interested to know how many `Miss Fortune` and `Nami` replay files
we have specifically.

<!-- SQLite MF and Nami query results of their game counts within `metadata.db` -->

We can also return games based on their duration. This could be useful in creating a small
pilot dataset for us to explore and fine tune ideas before moving on to scraping larger
numbers of games. In this case, I decided to find a list of the games where the games
ended in an early surrender (first 3.5 minutes of the game) because a player failed to connect
to the game. This dataset is useful as it guarantees the game length is low and allows us
to determine which features of a game are useful to extract for a machine learning agent.

<!-- SQL query showing number of games which fit this criteria -->

It would also be useful to know which champions are present within this dataset so we know
which champions we have the most data for.

<!-- SQL query showing champion counts for 191-EarlyFF dataset and
compare it so u.gg v11.21 champion count breakdown -->

So as we can see, the champion counts for even this small dataset resemble the champion
popularity for all of low diamond which means even though this dataset is small and
contains a player which didn't connect, it is still a proportionate sample of high elo
Ranked Solo/Duo for patch `11_21`.

After this, we can begin to extract replays from the rest of the dataset. As a simplified
start, I decided to extract information from the first 5 minutes of each game as scraping
data from full length games is a time consuming process. I also decided to target games
where the `Miss Fortune` player spent the highest number of seconds alive during a game,
as that was the individual feature from the `metadata.db` which had the highest
correlation with winning, at 64.4%.

### Process

The process for extracting replay information from games involves using the LViewLoL
scripting engine. Although this scripting engine was originally intended to give
players an advantage while playing the game, it also has the useful feature of reliably
extracting information from the game while the game is running.

The LViewLoL project relies on traversing the tree of game objects which are in the
`League of Legends.exe` game memory in real-time, and copying information from those
game objects using the `ReadProcessMemory` system call. This system call allows processes
to read the memory of other processes without permission elevation. This system call
is used by many scripting engines as it provides a convenient way to read the memory
of other processes with relatively minimal overhead. The LViewLoL project also provides
an interface for Python scripts to access these observations and interact with the game.

I initially used the Python interface to gather observations from replays as they were
being run but found that the overhead of the Python interface was reducing the efficiency
of the replay scraping process because of the overhead between the LViewLoL application
(C++) and my python script. Instead, I decided to modify the source code of the LViewLoL
application directly and insert my code to save the observations directly into the main
part of the code.

## References