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

This post examines existing AI-powered programming solutions, across
the entire gamut.
There are currently varying levels of automation being used in the programming
context. The range of automation ranges from existing tools such as linters,
IDEs to recent additions such as Microsoft Co-Pilot style IDEs such as
Cursor.

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

Vibe coding refers to the experience of iteratively producing software by dictating
your project in natural language terms to an LLM which then plans out how to
create the software, and then users iteratively debug issues during development
using the AI IDE + LLM tool combination. This has introduced new capabilities for
two classes of software engineers.

For people who were unable to program before it has allowed
them to quickly iterate on greenfield projects and experiment with ideas, especially
those which are similar to existing projects which the LLMs have been trained on
(such as Next.js + ShadCN + Tailwind style, full stack projects).

### Lovable, Bolt.new, Devin.ai, Anterion, etc. (Mostly Autonomous Agents)

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