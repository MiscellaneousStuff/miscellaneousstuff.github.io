---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 5 - Data Extraction)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-04 14:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL", "Data Extraction", "Data Exploration"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post describes how to extract information from a league of legends replay
using ideas from earlier posts. Ideas from [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html) which describe a possible method
for extracting highly granular temporal and spatial information from replays are combined
with the ideas extracted from literature in
[part 4](https://miscellaneousstuff.github.io/project/2021/09/04/tlol-part-4-exploring-the-literature.html) which explore how to process the information
extracted from a replay. This information will serve part 6 where we will actually
explore the low-level data stored within a League of Legends rofl replay.

## Data Extraction

### Overview

As explored in [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html), we will be extracting low-level replay information
from a League of Legends rofl replay file. However, the main issue with the replay
files are that the information within the replay files is encrypted using a custom
encrypted scheme which changes every patch, which is almost always every 2 weeks.
This means that extracting information directly from the replay files every patch
would be an arduous process at best. Therefore, we need an alternative method of
extracting information from a replay file.

In [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html), we explored another method of extracting information from a replay file, by
using the in-built replay system within the League of Legends client and then
extracting information from the game engine while the replay is playing.

The basis of this idea is that the replay system allows us to playback replays
at faster than real-time speed.

Also the scripting engine, in this case the LViewLoL project,
is regularly updated to work with current versions of the game as it only works
with the unencrypted data stored in memory while a League of Legends process is
active.

This means the developers who maintain the scripting engine do not have
the difficult task of reverse-engineering the encryption process like we would
have to do to directly decrypt the replay files.

Another benefit of the LViewLoL
scripting platform is that, the requirements for building a scripting platform,
i.e. extracting observational information per timestep and then issuing an
action to the game, are exactly what our project requires.

On top of that,
LViewLoL includes the C++ boost library's python integration meaning that, we
only need to use Python for our entire system and we can use existing data science
tools either, as we are extracting information from the game, or afterwards if
we `pickle` the data we're extracting.

As summarised at the end of [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html), the two main components we need to consider at this
stage are the following:

1. **Automated Replay Downloader**

    This component is responsible for downloading replays which match a certain
    criteria using the League of Legends client through the LCU API which
    is explained in further detail in [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html).

2. **Automated Replay Extractor**

    This component would be responsible for running the League of Legends
    client up with a replay downloaded using the previous component. The LViewLoL
    console application with our python script loaded would also be loaded at
    the same time. The LViewLoL script only starts the python script when the
    game is running which is convenient for us. Then, when the replay starts,
    the python script would be provided with observations as the game is running.
    For a comprehensive list of what information is available at each timestep,
    refer to [their GitHub page](https://github.com/orkido/LViewLoL/blob/dd699d52be34c36ecf65117a1c27463e91d60334/LView/PyStructs.h) (as of 04/09/2021)
    which lists all data structures available to a python script.

For the initial system, I will be developing the system using Windows as the
LViewLoL program is designed to be compiled using Visual Studio.

I have already developed a small port of the
LViewLoL system which works with Linux and League of Legends working in Linux under Wine
and it shows promising performance with the [process_vm_readv()](https://man7.org/linux/man-pages/man2/process_vm_readv.2.html) system call suggested in [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html).

Just for the initial system, I will not be implementing the `Automated Replay Downloader`
in this post as it is quite involved and doesn't really help us build an understanding
of replay files which is crucial for part 6. In part 7 we will go over how to build
the `Automated Replay Downloader` in full and in a way which fulfills all of the complex
requirements which are needed to build it. Refer to [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html) for more details.

### Method

#### Automated Replay Extractor



## Summary



## References

### Actual Replay Files Used

Be warned, the full unextracted size of these files is around 1GB because of the
very inefficient JSON encoding I used for each observation.
- [Patch 11.9 EUW Challenger](https://drive.google.com/file/d/1fMBlnPcbKWhiQG1tTU4c5h4JEQ6wobmk/view?usp=sharing)
- [Patch 11.10 EUW Challenger](https://drive.google.com/file/d/1wIwthLt7vIjibR1VBJTWZ2Zkst9wsSv0/view?usp=sharing)

### League of Legends Hacking and Scripting
- [Scripting: LViewLoL](https://github.com/orkido/LViewLoL)
- [Forum: UnknownCheats League of Legends](https://www.unknowncheats.me/forum/league-of-legends/)
- [Software: HexRays IDA Pro](https://hex-rays.com/ida-pro/)
- [Linux API: process_vm_readv()](https://man7.org/linux/man-pages/man2/process_vm_readv.2.html)