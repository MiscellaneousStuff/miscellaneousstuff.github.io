---
layout: post
comments: true
title:  "MechInterp: TinyStories-1Layer-21M Model Embed, Attention and MLP Analysis (Part 1 - Attention and MLP Analysis)"
excerpt: "This post begins the exploration of mechanistic interpretability for large language models."
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

### Attention Analysis

For per attention head visualisation, I will be using the following prompt:
"One day, Lucy asks Tom: "I am looking for a banana but I can't find it". Tom says: "Don't".

This prompt is directly taken from the [TinyStories](https://arxiv.org/pdf/2305.07759.pdf)
paper as the paper documents characteristics of the model along with this prompt such
as what the following word should be, as well as what the model is documented as being
able to do w.r.t keeping context across the prompt and factual knowledge completion.

The visualisation of the attention pattern itself will be done using
[CircuitVis](https://github.com/alan-cooney/CircuitsVis), which
takes the attention pattern and allows interactively hovering over tokens and a single
attention head (or all of them) per layer, determining the attentional relationship
between tokens.

### MLP Analysis

From what I can tell, MLP analysis is quite an open-ended topic and is genuinely
quite difficult. One of the main difficulties arises from a phenomenon that arises
within MLPs referred to as ["superposition"](https://transformer-circuits.pub/2022/toy_model/index.html).
This is where models represent more features
than they have dimensions. This particularly happens when features are sparse, superposition
allows compression beyond what a linear model can do, at the cost of "interference" which
requires non-linear filtering. We will see possible evidence for this later on.

However, a good place to start here is to measure basic characteristics of neuron
activations across prompts and tokens. It makes sense to do this for the expanded
MLP layer and the final smaller MLP layer within the Transformer Block. Transformer
Blocks typically contain and MLP layer after the normed + residual attention mechamism
which is 4 times larger than the model dimensionality, and then a succeeding MLP layer
which is the models dimensionality size. Later on we will see that within the studied model,
there may be indications of superposition.

## Attention Analysis

As stated before, the prompt for this section will be:
"One day, Lucy asks Tom: "I am looking for a banana but I can't find it". Tom says: "Don't",
which is taken straight from the [TinyStories](https://arxiv.org/pdf/2305.07759.pdf) paper.

Below you can see the attention pattern, which is being visualised by CircuitVis.

### Attention Head Visualisation

<center>
    <iframe
        src="https://miscellaneousstuff.github.io/attention_vis.html"
        style="border: 0; width: 900px; height: 600px;"
    >
    </iframe>
</center>

### Attention Head Qualitative Analysis

After analysing the attention patterns, I have generated the following table which gives
a rough idea for what each attention head is paying attention to. For some attention heads,
it is obvious, for others, it's more ambiguous or the attention head has multiple roles
which may overlap with each other.

| Head | Description |
| ---- | ----------- |
| 0 | Attends to dialogue structure (e.g. speaker changes), contextual relationships (e.g. "I" to "but", action to result), and speech delimiters. |
| 1 | Attends to start of preceding structural pivot (e.g., start of text token, comma, and full stop). For the word "but," only attends to itself, not preceding structural pivot like others. |
| 2 | Strongly attends to start of preceding structural pivot (e.g., start of text token, comma, and full stop). For the word "but," only attends to itself, not preceding structural pivot like others. |
| 3 | ~~Subject of sentence? |
| 4 | Attends to the current token / also sometimes the previous token. |
| 5 | Attends to the start of a clause and the start of a co-ordinating junction? |
| 6 | Attends to the previous token (aside from the closing speech mark, attends to the starting speech mark instead). |
| 7 | Attending to backward-related parts of skip n-grams? |
| 8 | Attends to the current token. |
| 9 | ~Attends to current and previous proper nouns? |
| 10 | ~Attends to all of the other tokens within same clause/sentence by varying amounts. |
| 11 | Attends to the start of a clause? Attends to the starting speech mark within speech. |
| 12 | ~Attending to the previous token unigram / bigram. |
| 13 | ~~Subject of the sentence? |
| 14 | Attends to narrative structures and relationships. Start of text token, commas, attends to prior proper nouns on speech marks, the word "asks" i.e., verb before proper noun "Tom," attending to "banana" on token "find." Attention head is trying to keep a high-level summary of ongoing narrative, acting as a guide when generating or predicting subsequent tokens? |
| 15 | Attending to the start of a clause? |

## MLP Analysis



## Summary

Summary