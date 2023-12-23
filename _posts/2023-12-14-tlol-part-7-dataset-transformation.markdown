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
1. Download a new dataset of replays, totalling 57,667 replays across multiple regions (EUW1, EUN, KR, LA1, NA1).
   This ranges all the way from the top of Korean challenger all the way down to roughly Diamond IV across multiple
   regions.
2. T_T-Pandoras-Box which replaces LViewLoL as the scripting engine used for memory scraping replays and to control
   agents in the future.
3. Data transformation of replays all the way from JSON files to SQLite3 database files to half precision NumPy arrays
   which contain all of the data required to finally train our ML model.

## Resources

- [GitHub Repo](https://github.com/MiscellaneousStuff/tlol-analysis)
- [Dataset](https://github.com/MiscellaneousStuff/tlol?tab=readme-ov-file#ezreal-dataset-patch-1323)