---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 5 - Download Scraping)"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2021-09-08 18:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL", "Data Scraping"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

Following the conclusions of [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html), we will be implementing the first system out of the two
systems which need to be created to extract data from replays which we need. The first system
was the **Automated Replay Downloader**. The **Automated Replay Downloader** is responsible
for downloading replays matching a certain criteria. What we will find in this post, is that
the assumptions and evidence presented in [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html) are incorrect, and luckily for us,
were far too pessimistic.

## Downloading Scraping

### Overview

The basic idea behind the replay scraping is to find replays which match a certain criteria,
build a list of game IDs which match the criteria and download the list of replays. There are
many criterias which can be used to determine which replays need to be downloaded. From the
literature review, we found that the JueWu-SL system was largely successful because of their
data selection process within their method.

The rough criteria used in their system for deciding which replays to download include the
following:

- **Top 1% of Players**

    All of the replays came from the top 1% of players. For the League AI system, I will be
    using replays from the Europe West (EUW) region which is widely considered to be the best 
    region outside of the best region in China and the Korean (KR) region.

- **100,000,000 Samples**

    The paper also describes how the final dataset is comprised of 100 million data samples.
    The paper doesn't clearly indicate what a sample is, this could either be a frame
    (a single observation of the game at a single point in time), or this could refer to
    scenes. Scenes are collections of observations which relate to a single instance of
    something happening in the game. For instance, the `Combat` scene refers to players
    fighting against each other, the `Navigation` scene refers to players moving from
    one global intent region to another. For further details, refer to [part 4](https://miscellaneousstuff.github.io/project/2021/09/04/tlol-part-4-exploring-the-literature.html).

### Method

## References

Summary

## References

<!--
Papers
- JueWu-SL
>