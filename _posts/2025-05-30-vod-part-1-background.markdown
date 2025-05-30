---
layout: post
comments: true
title:  "VOD: Human Level Programming Agents (Part 1 - Existing Solutions)" # this could be a lot better
excerpt: ""
date:   2025-05-30 00:00:00
categories: [Project]
tags: ["Programming", "Machine Learning"]
devinai: fjHtjT7GO1c
---

## Table of Contents

* TOC
{:toc}

## Introduction

This post examines emerging AI-powered programming tools, across the wide
range in which they're being used.
There are currently varying levels of automation being used in the programming
context. The range of automation ranges from existing tools such as
coding IDEs to tools promising full automation such as Devin.ai, along with my own
personal attempts to create tools in this space.

## Existing Solutions

### Cursor, Continue.dev, Windsurf, etc. (IDE)

Cursor is a VSCode fork created by four MIT classmates: Michael Truell, Sualeh Asif,
Arvid Lunnemark, and Aman Sanger. It was started in 2022 and initially explored
automating mechnical enginering tools such as CAD software. However then soon
switched over to programming as there was a growing opportunity and more aligned
with the teams expertise.

On March 2023, they officially launched Cursor which was now the VSCode fork
with integrated AI capabilities, such as in-context code generation (the ability
to arbitrarily reference any project file, external documentation, etc.),
intelligent autocompletion and codebase querying.

Then in 2024, they raised a much larger round at $60 million which valued
Anysphere (the company behind Cursor) at $400 million.
At this stage, Cursor.ai was growing rapidly, especially in the startup space.
One of the major factors here is the release of Claude 3.5 Sonnet (June 2024),
which was a Large Language Model (LLM) released by Anthropic which catapulted the
performance of all LLM-based coding tools, including Cursor.

Since then, the tool has continued to explode in popularity and is now used by
1 million users globally, with approximately 360,000 paying customers.
<!--
https://taptwicedigital.com/stats/cursor
-->

<!-- ## References -->

Tools such as Cursor, Continue.dev (VSCode extension similar to Cursor), Windsurf
(which was recently acquired by OpenAI) and others represent a new class of tools
aimed at helping software engineers mainly create new software.

This combined workflow of underlying powerful LLMs with increasingly strong
coding capabilities and heavily UX focused tools such as Cursor which have
re-designed the IDE experience for use with AI has lead to a new software
creation experience known as "vibe-coding".
This term was popularised by the
famous deep learning expert, Andrej Karparthy.
<!--
https://x.com/karpathy/status/1886192184808149383?lang=en-GB
-->

### Vibe Coding

Vibe coding refers to the experience of iteratively developing software by describing requirements in natural language to an AI, which then generates code that developers refine through conversation. The term was popularised by deep learning expert Andrej Karpathy, capturing the shift from writing code line-by-line to "vibing" with an AI assistant.

For people who were unable to program before, it has allowed
them to quickly iterate on greenfield projects and experiment with ideas.
This is especially true for projects which are similar to existing projects
which the LLMs have been trained on (such as Next.js + ShadCN + Tailwind style,
full stack projects).

As for experienced engineers, this allows them to architect and scaffold out the solution,
and then use tools such as Cursor to automatically generate the more boilerplate aspects
of the solution (such as generating API specifications, database schemas, etc.) and then
use other LLMs to implement the solution. This might look like taking in a set of requirements
which have already been gathered, working alongside a powerful reasoning model more suited
to accurate, architectural decision making such as OpenAI's o3 model, generating a high
level spec or architecture, and then using something like Gemini 2.5 Pro or Claude 4 Opus
or another model to actually implement the modules along with their testing.

This has also transitioned development more towards Testing Driven Development (TDD) where
the process allows the compiler or scripting engines feedback to inform the LLM of errors
in a recipricol loop to quickly build out functionality.

### Lovable, Bolt.new, Devin.ai, AutoGPT, SWE-Agent, Anterion, etc. (Mostly Autonomous Agents)

This has further culminated in an interesting new class of software production
agents such as Lovable, Bolt.new, Devin.ai and others. The goal of these tools
is to allow a person with no prior programming experience to have a ChatGPT-style
experience where, similar to Cursor, the user simply dictates the problem they
want the software to build. However, unlike Cursor, these tools also execute all
of the steps required to execute the building and debugging of these projects,
which aims to provide a seamless experience for the end users.

The solution of this class was Devin.ai, created by Cognition Labs. The founding
team of Cognition Labs is comprised of current and former world class competitive
programmers, including the brothers Scott Wu and Neal Wu.

<div style="text-align: center;">
{% include youtubePlayer.html id=page.devinai %}
</div>

There had been existing attempts at creating fully autonomous programming agents
before, such as GPT Engineer (which eventually became Lovable), AutoGPT (which
was an attempt to see how recursive prompting and basic prompt scaffolding could
achieve AGI using GPT-4, the best model at the time), but this new generation
of tools now includes human-guidance to steer the process.