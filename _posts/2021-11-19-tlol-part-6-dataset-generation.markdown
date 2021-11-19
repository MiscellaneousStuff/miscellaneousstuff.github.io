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

## Player Selection

## References