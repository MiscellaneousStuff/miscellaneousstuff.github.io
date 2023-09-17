---
layout: post
comments: true
title:  "MechInterp: TinyStories-1Layer-21M Model Embed, Attention and MLP Analysis (Part 1 - Basic Embedding, Attention and MLP Analysis)"
excerpt: "?"
date:   2023-09-17 00:00:00
categories: [Project, MechInterp]
tags: ["Tiny Stories", "LLM", "MechInterp", "Analysis", "Visualisation", "Attention", "MLP", "Embedding"]
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
even models with a single Transformer block layer are capable of producing coherent speech.
This is exciting from an interpretability perspective as it means that the attention heads within
a single Transformer Block and it's accompanying MLP layer are directly responsible for
interpreting the current prompt context, and then predicting the next token all together.

## Toolset

The main custom tool which will be used in this blog post is the
[TransformerLens](https://github.com/neelnanda-io/TransformerLens) repo from Neel Nanda
which allows us to hook and intervene in the activations of Transformer models during
inference. This conveniently allows to then analyse the runtime activations of things
like the attention matrix per head for an input prompt and the MLP activations. Being
able to dynamically analyse the runtime values for the model allows us to determine
how the model is representing and processing information. This is analogous to performing
dynamic analysis in reverse engineering where we are able to determine how a program is
processing inputs. However, it is even more useful in the case of neural networks as
neural network parameters are not set in the same way as programmers explicitly engineer
programs, instead they are discovered during backpropagation.

## Experiment Plan

Analysing any language model during inference is a very open ended task as there are
many different aspects of the model you can analyse and the prompt you provide it can
also drastically change the runtime values. With this is mind, it is helpful to explicitly
set what the prompts are going to be and choose which aspects of the model to analyse
ahead of time.

### Attention Visualisation

For per attention head visualisation, I will be using the following prompt:
"One day, Lucy asks Tom: "I am looking for a banana but I can't find it". Tom says: "Don't".

This prompt is directly taken from the [TinyStories](https://arxiv.org/pdf/2305.07759.pdf)
paper as the paper documents characteristics of the model along with this prompt such
as what the following word should be, as well as what the model is documented as being
able to do w.r.t keeping context across the prompt and factual knowledge completion.

### MLP Analysis

From what I can tell, MLP analysis is quite an open-ended topic and is genuinely
quite difficult. One of the main difficulties arises from a phenomenon that arises
within MLPs referred to as ["superposition"](https://transformer-circuits.pub/2022/toy_model/index.html).
This is where models represent more features
than they have dimensions. This particularly happens when features are sparse, superposition
allows compression beyond what a linear model can do, at the cost of "interference" which
requires non-linear filtering. We will see possible evidence for this later on.

## Summary

Summary