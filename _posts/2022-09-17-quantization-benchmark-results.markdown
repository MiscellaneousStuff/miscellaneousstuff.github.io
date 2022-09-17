---
layout: post
comments: true
title:  "Improving CPU-based Deep Learning Deployment on the Cloud using Dynamic Quantization"
excerpt: "TLoL: Human level in League of Legends using Deep Learning. Existing solutions, problem analysis, initial ideas, data exploration, visualisation, intuition and possible solutions."
date:   2022-09-17 08:30:00 +0100
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

## Problem Statement & Aims / Objectives

- The problem this research will investigate is how to increase the 
performance of CPU based deep learning deployments on the 
cloud.
- The aim of this research is to investigate the extent to which 
dynamic quantization can improve the runtime performance of a 
pre-trained ASR model while evaluating the impact on the 
model's accuracy.
- The objective of this research is to reduce the runtime latency, 
and therefore increase its throughput, of a CPU based deep 
learning ASR model while maintaining similar speech recognition 
accuracy, as measured by the model’s word-error rate (WER) on a 
hold on test set.
- The results for investigating this problem will allow deep learning 
practitioners to gain a realistic understanding for how much CPU 
based deployments may benefit them compared to GPU based 
deployments, and the trade-offs they may incur.

## Background

- Existing research has been conducted which compares the deployment of CPU and 
GPU devices for machine learning. Research by Microsoft shows that for a 5 node 35 
pod CPU cluster and a 3 node GPU cluster (which had a similar cost per hour), that 
the GPU cluster performed 415% better (Scientist, 2021). This shows that existing 
approaches to GPU based deployment yield far greater performance that CPU based 
deployment.
- However, the literature on deep learning model optimisation shows that by using 
simple quantization techniques, the performance of deep learning models can easily 
be improved on CPUs. One search approach (Jacob et al., 2017) shows that 
quantization methods can reduce the size of a neural network by up to 4 times (by 
changing the neural networks parameters from 32-bit floating point down to 8-bit 
integers). This also has the benefit of improving the performance of the models as 
well.
- Another paper goes further in describing two main approaches to model 
quantization. There are two main classes of quantization algorithms which can be 
applied to neural networks to reduce the bit-width of weights and activations: Post-Training Quantization and Quantization-Aware Training (QAT) (Nagel et al., 2021).
o Quantization-Aware Training emulates inference-time quantization that downstream 
tools use to produce quantised models, whereas post-training quantization is only 
applied after a model has been trained. Post-training quantization (PAT) involves 
scaling the weights of the model from 8-bits of precision to floating point and 
computed using floating-point kernels. To further improve latency, dynamic-range 
operators dynamically quantize activations based on their range to 8-bits and 
perform computations with 8-bit weights and activations (“Post-training 
quantization; Tensorflow Lite”, 2021).
- One interesting use of quantization is also to make recurrent neural networks 
(RNNs) such as Long-Short Term Memory (LSTM) or Gated Recurrent Network (GRU) 
more efficient for CPU deployment. This is because they are typically very slow when 
being run on CPUs due to their sequential nature. However, quantization could 
provide a promising method of improving the performance of RNNs on CPUs with 
recent research showing how dynamic quantization can improve the inference 
speed of RNNs by up to 1.46x. This means that for speech recognition models such 
as DeepSpeech2, the entire architecture could be significantly sped up using 
Dynamic Quantization (Silfa et al., 2019).

## Experimental Design

- **Speech Recognition Model:** DeepSpeech 2 (Amodei et al., 2015)
- **Aim:** The aim of this experiment is to use dynamic quantization to improve the 
runtime performance of a CPU-based deep learning ASR model.
- **Hypothesis:** Using dynamic quantization reduces the model inference time and 
increases its throughput, while having a relatively minor hit on its performance
- **Independent Variable:** Use of dynamic quantization on the pre-trained ASR model or 
not. Whether a GPU accelerator is being used or not.
- **Dependent Variable:** There are multiple dependent variables for this experiment. 
The first is the mean inference latency in milliseconds, the second is the mean 
throughput of the model and the last one is the WER of the model based on an 
evaluation dataset. The inference latency and throughput and measured to 
determine if dynamic quantization is improving run-time performance and the WER 
of the model is measured to determine the drop in accuracy after quantization.
- **Controlled Variables:** Number of inference latency trials is set to 300. Number of 
throughput trials is set to 100. The CPU used was an AMD Ryzen 5 5600X. The GPU 
used for the baseline GPU performance was an Nvidia GeForce RTX 3060 Ti
- **Experimental Conditions:**
  - No Dynamic Quantization: CPU (no quantization model), GPU (no 
quantization model)
  - Dynamic Quantization (CPU-only because PyTorch doesn’t support 
this method for GPUs): CPU (quantization model)
  - These leaves us with three experiments (CPU-quantized, CPU-non-quantized, GPU-non-quantized) with two models (quant model, non-quantized model) being run using two accelerators (CPU and GPU)
- **Methodology (for each experimental condition):**
  - Get WER score on evaluation dataset (hold-out dataset not shown to 
the model during training)
  - **(GPU experiment only)** Warm-up the GPU by running 10 dummy 
inferences. This is because some GPUs have a power saving mode, 
which means that the wake-up time would be included in the 
calculation of the inference time.
  - Calculate the mean inference time (milliseconds) over 300 trials (infer 
300 examples from the dataset)
  - Calculate the mean throughput (averaged number of samples per 
second) over trials

## References

[Can you close the 
performance gap between GPU and CPU for deep learning 
models?”, 2022](https://deci.ai/blog/close-gap-cpu-performance-gpu-deep-learning-models/#:~:text=But%20using%20compilation%20and%20quantization,reduced%20to%202.8X%20difference.)