---
layout: post
comments: true
title:  "MechInterp: TinyStories-1Layer-21M Model Embed, Attention and MLP Analysis (Part 1 - Basic MLP Analysis)"
excerpt: "?"
date:   2023-09-17 00:00:00
categories: [Project, MechInterp]
tags: ["Tiny Stories", "LLM", "MechInterp", "Analysis", "Visualisation"]
---

## Table of Contents

* TOC
{:toc}

## Glossary

- [LLM](https://en.wikipedia.org/wiki/Large_language_model): Large Language Model

## Resources

- [Jupyter Notebook](https://github.com/MiscellaneousStuff/mech-interp-tinystories):
  The Notebook which contains all of the code and visualisations mentioned in this blog
  post.

## Introduction

This post begins the exploration of mechanistic interpretability for large language models.
We start off by attempting to understand the MLP layer from a model from the
[TinyStories](https://arxiv.org/pdf/2305.07759.pdf) paper.

For context, the goal of the paper
was to determine if creating very small Transformer Decoder models which are capable of 
producing coherent speech and following instructions was possible. It turns out that even
models with as little as 1 million parameters show basic emergent capabilites such as fluent
language generation and instruction following which we see in larger LLMs. Furthermore,
even models with a single Transformer block are capable of producing coherent speech. This
is exciting from an interpretability perspective as it means that the attention heads within
single Transformer Block and it's accompanying MLP layer are directly responsible for
interpreting the current prompt context, and then predicting the next token all together.

## Summary

Summary