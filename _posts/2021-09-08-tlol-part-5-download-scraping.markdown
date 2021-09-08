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

### Method

## References

Summary

## References

<!--
Papers
- JueWu-SL
>