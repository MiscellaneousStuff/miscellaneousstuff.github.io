---
layout: post
comments: true
title:  "Improving CPU-based Deep Learning Deployment on the Cloud using Dynamic Quantization"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2022-09-17 08:00:00
categories: [Research, Production]
tags: ["Quantization", "Dynamic Quantization", "ASR", "Benchmarking", "Cloud Deployment", "CPU"]
---

## Table of Contents

* TOC
{:toc}

## Overview

This post explores using dynamic quantization on a pre-trained automatic speech recognition
system model to improve the inference and throughput of the model when being used for
a cloud deployment scenario.

## Introduction

- The goal of this post was to find an improvement to existing solutions for deploying
pre-trained deep learning models on the cloud using CPUs.
cloud using the CPU.
- Production deep learning based systems are typically deployed 
using a GPU on the cloud. This is because GPUs are more suitable 
for accelerating deep learning workloads due to their highly 
parallel architecture (Can you close the performance gap 
between GPU and CPU for deep learning models?”, 2022).
- However, there are many issues with GPU-based deployment 
which include their high energy usage (Can you close the 
performance gap between GPU and CPU for deep learning 
models?”, 2022), the high cost per hour of renting a GPU on the 
cloud and recent global events which affect the availability of 
these systems for consumers and data centres alike (HAJDU, 
2021).
- This motivates the need to explore the deployment of deep 
learning models on CPUs which suffer less from these issues.
- One possible method to improve the performance of CPU based 
deep learning deployments is Quantization, specifically Dynamic 
Quantization. PyTorch (Paszke et al., 2019) is a popular machine 
learning framework which provides a readily available 
implementation of this technique.
- This post will evaluate the increase in runtime performance of a 
pre-trained deep learning ASR model for cloud deployment.