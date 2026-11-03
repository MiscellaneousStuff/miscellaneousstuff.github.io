---
layout: post
comments: true
title:  "Superhuman League of Legends AI by 2027 (Part 2 - Brokenwings)"
excerpt: "This post focuses on the initial attempts to discover what reinforcement learning methods are required to train superhuman level League of Legends agents."
date:   2026-11-03 00:00:00
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "Simulator Enhancement", "fastsim"]
tags: [""]
---

## Table of Contents

* TOC
{:toc}

## Overview

Following on from part 1, we now move towards our first step. Implementing our methodology for creating superhuman League of Legends AI agents by simulating the game server at orders of magnitude faster than realtime to then dedicate all of
our compute away from simulation and towards the actor/trainer.

## History

First it would be good to introduce the entire history of my attempts at RL agents and League of Legends before arriving at how it was implemented for the
brokenwings project. If you want to understand other peoples methods then refer to [part 1](https://miscellaneousstuff.github.io/project/2021/09/01/tlol-part-1-existing-solutions.html)
which still remains a good starting point.