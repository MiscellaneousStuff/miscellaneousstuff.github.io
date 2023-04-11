---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 7 - Large Language
Model Based Agetn)"
excerpt: "This post explores a novel approach to game playing agents based on recent
advances in large language models which has cross domain applicability."
date:   2023-04-11 00:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Large Language Model", "TLoL", "Data Generation", "GPT-4"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

After an extremely long hiatus, this series is returning with a bang.
We start with a novel idea, is it possible to create game playing AI
agents where the main decision making component is an LLM?

## Overview

Firstly, what is an LLM? An LLM is a Large Language Model are a family
of neural networks trained on large amounts of unlabeled text using
self-supervised learning. The most prominent of them is GPT-4 released by
OpenAI, which is a Transformer based architecture which predicts the next
token given a prompt in an auto-regressive manner.
I will leave more detailed explanations to the OpenAI GPT-4 Technical Report
and many other resources available on the web.

These LLM models exhibit very strong general performance across a wide
variety of tasks due to its ability to deal with complex instructions
with a high level of understanding and creativity.

GPT-4 is highly capable of intepreting and responding to a range of user
requests for generating content, and has also showed the ability to be
integrated with uni/multi-modal foundation models (refer to references
for more details).

This then leads to another conclusion, could a game playing agent
architecture (and also robot controlling agents in the future)
which leverages the flexibility (interpretive / problem solving capacity)
and adaptabiilty (zero-shot / few-shot prompting) of LLMs be able to not
only learn how to play games with limited experience, but also able to
dynamically adjust it's behaviour in new situations?

## Data Inefficiency / Limited Generalisation of Purely RL Agents



## Summary

## References

### Foundation Models
- [Wikipedia: Foundation Models](https://en.wikipedia.org/wiki/Foundation_models)

### Large Language Models (LLMs)
- [Wikipedia: GPT-4](https://en.wikipedia.org/wiki/GPT-4)
- [Arxiv: GPT-4 Technical Report](https://arxiv.org/pdf/2303.08774.pdf)
- [GitHub: Visual ChatGPT](https://github.com/microsoft/visual-chatgpt)