---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 5 - Data Extraction)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-05 23:30:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL", "Data Extraction"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

In [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html), we explored the best way to gather data to 
train our human-level League of Legends playing AI where we found that using 
expert replay data was the most viable and efficient. From
this, we explored the software components which would be required to gather this data
and extract what we need from these replay files. To gather the data, we would need to determine
which replays would be suitable and how to automatically download them in bulk.

Furthermore, when we have finally downloaded our replay files, we would need to 
the extract information within them which we can use to train our League 
playing AI. The
issue with the rofl file format which stores League of Legends replays is
that Riot encrypts the game packet data inside of the replay files which we 
need to access. Further details about this can be found in [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html) 
of this series.
There are two ways we can circumvent this issue:

1. **Reverse Engineer the Encryption Method**

  During each League of Legends patch release, the method to decrypt
  rofl replays is embedded within the client itself, which means it would be
  possible for a motivated individual to reverse engineer this encryption method
  using a suitable tool such as [IDA Pro](https://hex-rays.com/ida-pro/). IDA 
  Pro would enable you to perform
  dynamic analysis of the code within the client, to determine how the game
  packets are decrypted. However, the
  issue with this method is that the encryption scheme changes every patch,
  which is every two weeks. This means that you would encounter an 
  "enigma-like" effort where you are trying to beat Riot's encryption every
  two weeks, and this is assuming that they only slightly change the encryption
  scheme. If they significantly changed the encryption scheme between two 
  patches, it could be much harder to reverse engineer. The other major issue
  with this method is that it is expressly [forbidden by Riot Games](https://riot-api-libraries.readthedocs.io/en/latest/specifics.html#replay-files) to reverse
  engineer the rofl file format.

2. **Automate the League Replay System**

  An alternative to directly decrypting the replay files is to use the League
  client to play the replay files using the replay system within the client.
  Then, we can programatically load rofl replay files into the client, allow
  the client to decrypt as per usual, and then using scripting frameworks,
  we can interpret the memory of the League of Legends process while running the
  replay system at faster than real-time speeds. This allows us a fully flexible
  method of extracting information from replays as scripting frameworks need
  only determine the address offsets of game objects in memory rather than
  the far more complex task of reverse engineering a proprietary encryption
  format every two weeks.

## Initial Attempt

### Observation Rate

Before I attempted to extract information from replay files, I needed to
know how many observations I was likely to need to gain useful information
from the files. The issue with the current API provided by Riot is that
the information is only accurate down to 60 seconds, which makes it useless
from a game playing AI perspective. However, this doesn't tell us what
resolution of data is required to create the League AI. So, where can we
find out this information? From the literature, I found two main numbers
for this:

1. **OpenAI Five**

2. **JueWu-SL**

### Overview

My initial attempt at creating this system involved a rofl replay
from patch 11.9 and patch 11.10. Each time, I downloaded a random Challenger
ranked match and then loaded the replay using the League client. Then I ran the LViewLoL software
which was loaded with my Python script to extract an observation every 1/8th
of a second. My reasons for choosing 1/8th of a second will be explained further
below. Then, I encoded the game objects and global data within each observation
as a serialized JSON object which I then wrote to a larger JSON file encoding.
However, there is one major flaw with choosing JSON here. The average League
of Legends game is just under 30 minutes long and I was recording an observation
every 1/8th of a second. The following calculation gives a rough estimate
of the number of observations per game.

```python
obs_per_sec  = 8  # Observations per second
secs_per_min = 60 # Seconds per minute
avg_mins     = 30 # Average game length in minutes
total_obs    = obs_per_sec * secs_per_min * \
               avg_mins # Total observations per game
total_obs    := 14400
```

### Game Object Analysis

On average, I found there were up to 160 game objects present within the
game at any time. This means that in total, an extracted replay would be
comprised of `14,400 * 160 := 2,304,000` objects in total. Saving this
in an unefficient format like JSON resulted in each uncompressed replay
file taking around 1GB storage, which compared to the original 13MB average
for a replay file, is gigantic. This is an issue when trying to process
replay files in bulk, such as when performing data analysis, let alone when 
training an
agent on these files. This would leave us with two options:

Decrypting these files before
processing them, which could take a very large amount of storage or, we
could alternatively setup a complex process which decompresses these
files ahead of time and then deletes files which have already been processed.
However, that is unnecessarily complicated when we could just encode
the extracted replay files in a more efficient format.

Below is an image counting the number of game objects within a challenger
level replay. The X axis is the in-game time in minutes and the Y axis
is the number of that category of objects at any one timestep.

<!-- Insert image of league of legends game objects here -->
<div style="text-align: center;">
   <img
      src="/assets/tlol_visualisations/game_objects_per_category.png"
      style="width: 100%; max-width: 640px;"
   />
</div>

The image above shows how many game objects are present within a
League of Legends game per each observation (roughly 1/8th of a
second). Here we can see in the bottom right that the total number
of game objects per observation maxes out at about 160 objects which
is a large number of objects. We can see here that the number of
minions follows a clear cycle, which makes sense as minions spawn once
every 30 seconds. An interesting thing to note here is that the number
of minions also goes down at a consistent rate, this may just be because
the recording is of a challenger level game so the players are efficiently
balancing fighting and farming. Maybe this pattern wouldn't be so clear
in a lower rated game.

Another interesting pattern in the graph is
the top-right image which shows how many turrets are present within the game.
It seems strange that the number of towers would increase. One possible explanation is that the replay extraction process 
included bugs which caused a turret to not be found during one observation,
but was found during another.

The `Others` section of the graph includes
objects which don't fall into another category. This includes objects
such as wards, which grant vision in the fog-of-war, traps and other
champion specific items (e.g. Thresh lantern, Caitlyn traps, Zoe bubble,
Ivern's ultimate ability Daisy, etc).

## Method



## Data Extraction

### Overview

<!--
Previous Attempts
- 11.9 and 11.10 replays
  - What went well?
    - We figured out how to infer movement data from this
      (provide figures)
  - What didn't go well?
    - Using JSON to store the replays was bad becaused the uncompressed
      file is 1GB big which is a pain in the arse to deal with for data
      exploration, let alone training. The data exploration loading JSON
      into pandas and running it on Jupyter Notebook ended up exploding
      my RAM usage up to 24GB.
    - Nesting JSON structures within themselves due to the naive data
      structure used to store replays. This could be rectified by using
      a data structure which is naturally better suited such as SQLite.
      This would make data storage and querying a lot more efficient.
- How can we improve
  - Use SQLite files to store replays as they're being extracted
  - Generate the schema for the SQLite database before extracting the
    database. This coincides with general MLOps issues to do with data
    schema. This will take a bit of massaging to get right.
- Replay Downloader (NA-10K run)
  - What went well?
    - System worked as intended
    - We found the bottleneck to downloading data
    - We found that download requests will need to be authenticated
      and it likely takes a lot of effort to circumvent that. This
      point relates to the AWS S3 storage calls which store League
      Replays and how it is difficult to download data from the
      stores directly as the IP addresses change between each download
      request. This might also relate to the stop-start behaviour found
      when bulk downloading replays, hard to tell.
-->

<!--
Observations Per Second
- Comes from OpenAI Five (8 obs/sec)
- JueWu-SL uses 15 obs/sec
- Our system only requires 8 obs/sec
  - PyLoL PPO testing shows 8 obs/sec is fine
-->

<!--
Relationship between obs/sec and max extractor throughput
- Max Extractor Throughput
  - This refers to the maximum number of obs/sec we can get from a replay using
    the client and then how many times faster than real-time we can playback
    the replay and still be within the obs/sec threshold that we want. Our system
    would ideally be comfortablly below the obs/sec threshold because if we start
    falling under, it could make the data unreliable for training. However, we
    can also make our model more robust to this change in data.
>

<!--
Observation Specification
- This depends on what data is available from LViewLoL
  - This depends on what offsets are posted on Unknown Cheats or what
    we can source ourselves using IDA Pro to find relevant offsets
- Inspiration from this will come from the literature
  - The main inspiration from this will be the 69pg OpenAI Five paper which contains
    the observation specification which they use for Open AI Five. However, it will
    need to be adapted for League of Legends
-->

### Method

<!--
Summarise methodological decisions from previous section:
- SQLite
- Decide on schema before bulk data extraction from rofl replay files
-->

<!--
Replay Downloader
-->

<!--
Replay Extractor
-->

## Summary

<!--
Components
- Automated Replay Downloader
- Automated Replay Extractor
-->

## References

### Initial Extracted Replay Files

These JSON files are the data source for the data visualisations
in the initial attempt section.

- [Patch 11.9](https://drive.google.com/file/d/1fMBlnPcbKWhiQG1tTU4c5h4JEQ6wobmk/view?usp=sharing)
- [Patch 11.10](https://drive.google.com/file/d/1wIwthLt7vIjibR1VBJTWZ2Zkst9wsSv0/view?usp=sharing)

<!--
Resources
- Extracted Replay Files
  - Previous (11.9, 11.10)
  - Recent (11.17)
-->

<!--
Papers
- JueWu-SL Paper
- OpenAI Five paper
-->

<!--
Misc
- PyLoL
-->