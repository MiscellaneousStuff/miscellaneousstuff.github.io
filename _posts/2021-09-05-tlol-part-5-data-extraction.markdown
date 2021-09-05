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

## Introduction

In [part 3]()

<!--
Components
- Automated Replay Downloader
- Automated Replay Extractor
-->

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