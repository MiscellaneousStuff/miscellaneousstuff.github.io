---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 7 - Dataset Transformation)"
excerpt: ""
date:   2023-12-23 00:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL", "Data Transformation"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post is a restart of the TLoL series which has been dormant since 2021. In this post, we will cover the
following:
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

## Resources

- [GitHub Repo](https://github.com/MiscellaneousStuff/tlol-analysis)
- [Dataset](https://github.com/MiscellaneousStuff/tlol?tab=readme-ov-file#ezreal-dataset-patch-1323)