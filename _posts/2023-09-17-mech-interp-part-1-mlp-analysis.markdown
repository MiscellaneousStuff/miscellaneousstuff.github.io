---
layout: post
comments: true
title:  "MechInterp: TinyStories-1Layer-21M Model Embed, Attention and MLP Analysis (Part 1 - Basic Attention and MLP Analysis)"
excerpt: "This post begins the exploration of mechanistic interpretability for large language models."
date:   2023-09-17 00:00:00
categories: [Project, MechInterp]
tags: ["Tiny Stories", "LLM", "MechInterp", "Analysis", "Visualisation", "Attention", "MLP"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post begins the exploration of mechanistic interpretability for large language models.
We start off by attempting to understand the MLP layer from a model from the
[TinyStories](https://arxiv.org/pdf/2305.07759.pdf) paper. For this blog post, we will
be using the `roneneldan/TinyStories-Instuct-1Layer-21M` model which can be found
on [HuggingFace](https://huggingface.co/roneneldan/TinyStories-1Layer-21M).

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
Blocks typically contain an MLP layer after the normed + residual attention mechanism
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

### Attention Head Analysis Discussion

#### Simple Tracking Heads (Current Token, Previous Token, etc.)
From the table above, we can see that there are multiple overlapping attention heads such
as Head 4 and Head 8 which both attend to the current token, although Head 8 more directly
attends to the current token. Head 6 clearly attends to the previous token, however, Head 12
also sometimes attends to the previous token occasionally, however it appears to be attending
to other tokens which are relevant in context. For example, the token "banana" appears to be
attending to the tokens "looking" and "for" which are relevant in the given context.

#### Grammatical Heads (Start of Clause)

However, aside from just performing basic routing of information such as current and previous
tokens, some attention heads operate more grammatically. For example, Head 5 appears to attend
to the start of the current clause or co-ordinating junction.
If you set the above visualisation to "Destination <- Source", and however over the
"<|endoftext|>" token, you will see that all of
the tokens up to the ":" token are attending to the "<|endoftext|>" token. If you then
do the same by hovering over the first """ speech mark token, you will see that nearly all
of the tokens enclosed by the speech marks attend to the first speech mark. The closing
speech mark is being attended to by all of the following tokens.

Heads 1 and 2 appear to strongly attend to the start of the preceding structural pivot. A
structural pivot here means significant structural or semantic shift where the flow or
structure of text changes or pivots. Both of them roughly attend to clear grammatical
indicators such as the "<|endoftext|>" token or the "," comma token. However, Head 1
strongly attends to the token "But" and Head 2 doesn't, but Head 2 strongly attends to
the word "a" but Head 1 doesn't. This might mean that although two attention heads may
pay attention to similar aspects of speech, they're not exactly the same. This may have
interesting implications for optimising large language models. It's possible that larger
models such as GPT-3 contain far more redundancy in their attention heads which may allow
for pruning the number of attention heads per layer while still mostly retaining performance.
However from what we can see here, that may mean that the model slightly loses some nuance
in processing it's prompts.

#### General Head (Multi-purpose: Narrative Stuctures and Relationships)

Head 14 is particulary interesting as it appears to be attending to many different relevant
parts of speech. It attends to narrative structures and relationships. The
Start of text token "<|endoftext|>", commas, attends to prior proper nouns on speech marks, the word "asks" i.e., verb before proper noun "Tom," attending to "banana" on token "find." It's possible that this attention head is trying to keep a high-level summary of ongoing narrative, where it may be acting as a guide when generating or predicting subsequent tokens?
This may be one of the more interesting attention heads to analyse w.r.t when this embedding
is being provided to the subsequent MLP layer.

### Attention Embedding Analysis

For this section, we will try to analyse the attention mechanisms embedding itself,
to see if there are any interesting patterns. In the below image, for the top figure,
we can see the 1024-dim embedding for the earlier prompt. In the bottom figure, we
can see the same after the residual is added to it and after layer norm has been
applied.

<div style="text-align: center;">
   <img
      src="/assets/mech_interp/p1/attn_embed_no_norm.png"
      style="width: 100%; max-width: 900px;"
   />
</div>

<div style="text-align: center;">
   <img
      src="/assets/mech_interp/p1/attn_embed_with_norm.png"
      style="width: 100%; max-width: 900px;"
   />
</div>

And here are the basic statistics for each embedding:

| Metric                              | Raw Attention Embedding | Attention Embed + Residual + LayerNorm |
| ----------------------------------- | ----------------------- | ------------------------------------- |
| **Mean**                            | -0.0011                 | -0.0115                               |
| **Standard Deviation**              | 0.2027                  | 0.7612                                |
| **Max Value**                       | 1.9523                  | 5.4987                                |
| **Min Value**                       | -5.4120                 | -10.6500                              |
| **1st Quartile (25th Percentile)**  | -0.1036                 | -0.4581                               |
| **Median (50th Percentile)**        | 0.0019                  | -0.0019                               |
| **3rd Quartile (75th Percentile)**  | 0.1089                  | 0.4553                                |

## MLP Analysis

## Resources

- [Jupyter Notebook](https://github.com/MiscellaneousStuff/mech-interp-tinystories):
  The Notebook which contains all of the code and visualisations mentioned in this blog
  post.

## Summary

Summary