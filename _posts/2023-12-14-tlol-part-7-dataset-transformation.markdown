---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 7 - Dataset Transformation)"
excerpt: ""
date:   2023-12-23 00:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "TLoL", "Data Transformation", "T_T-Pandoras-Box"]
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
1. (Replay Dataset) Download a new dataset of replays, totalling 57,667 replays across multiple regions (EUW1, EUN, KR, LA1, NA1).
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

### Overview



## Resources

- [GitHub Repo](https://github.com/MiscellaneousStuff/tlol-analysis)
- [Dataset](https://github.com/MiscellaneousStuff/tlol?tab=readme-ov-file#ezreal-dataset-patch-1323)