---
title: "Before you hand operations to an AI agent, fix the ledger"
excerpt: "AI agents are moving into startup operations, and many projects stall on messy data and unclear ownership. Three tests a founder's office should run first."
date: "2026-11-09"
published: true
tags:
  - AI in operations
  - Founder's office
  - Startup operations
faqs:
  - q: "Should a startup use AI agents for operations?"
    a: "Yes, for work that already runs as a clear, written process with one source of truth for its numbers. Reporting, follow-up tracking and document upkeep fit well. Work that is still being figured out, or that commits money or files something with a regulator, should keep a person in charge."
  - q: "What should an AI agent not do in a founder's office?"
    a: "It should not commit money, file anything with a bank or regulator, or send anything to an investor without a person reading it first. An agent can draft those items from the ledger. A person approves them."
  - q: "What should a startup automate first with AI?"
    a: "Start with read-only work, such as weekly reporting from existing records. A mistake there costs a correction, not a payment or a filing. Follow-up tracking and data room upkeep come next."
  - q: "Why do AI agent projects fail?"
    a: "Gartner predicted in June 2025 that more than 40% of agentic AI projects will be canceled by the end of 2027, and named escalating costs, unclear business value and inadequate risk controls. In operations, the root cause is often a process nobody has written down and nobody owns."
---

An AI agent automates whatever process you give it. Give it a clean process and you get leverage. Give it a messy one and you get the same mess, produced faster.

## What the forecasts say

In June 2025 Gartner predicted that [over 40% of agentic AI projects will be canceled by the end of 2027](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027), and it named escalating costs, unclear business value and inadequate risk controls as the causes. A forecast like this is one analyst firm's guess, and nobody knows the final number. I read it as a list of jobs that nobody owns. Someone has to know what the process is, what it costs and what happens when the output is wrong. In a startup, the founder's office tends to be that someone.

Three tests tell you whether a workflow is ready for an agent.

## Test 1: Can someone who did not build the workflow explain it?

An agent needs the steps in the order they happen, with the exceptions. If you cannot hand the workflow to a new hire on one page, you cannot hand it to an agent.

At Uduvilla Investments I built operational tracking and information architecture from the ground up, and I designed automated reporting that cut leadership's manual data retrieval by more than 10 hours a week. The reports could only be as good as the tracking underneath them. The slow part of any automation is writing the process down.

## Test 2: Does each number have one source of truth?

An agent that reads five spreadsheets will quote five answers. The founder will notice, stop trusting the output, and go back to asking a person.

At Neuralzome Cybernetics I built centralized cross-border billing and metrics dashboards, and the multi-currency monthly close reached 100% accuracy. That depends on the [one-currency-of-record rule](/blog/running-ops-across-four-countries): one system, and a clear winner when two disagree. Before you point an agent at your numbers, name the system that wins.

## Test 3: What happens when it is wrong, and who finds out?

Every automation will produce a wrong answer. The question is how much damage it does before someone notices.

Give agents read access first, then the ability to draft, and the ability to act last. An agent can draft the quarterly investor update from the ledger. A person reads it before it goes out. Keep a person in the loop for three things:

1. Anything that commits money.
2. Anything filed with a bank or a regulator, such as an outbound-investment filing or a tax registration.
3. Anything an investor will read.

## What to automate first

Start with reporting. It reads records and changes nothing, so a mistake costs a correction. Follow-up tracking comes second, because most stalled work in a cross-border team is work someone started and nobody closed. Data room upkeep comes third. An agent can keep a document index current and flag files that have gone stale, and a data room that stays current is faster to diligence.

Leave alone anything you are still inventing. If you have run a process twice, you do not know it well enough to automate it.

## What changes for the founder's office

The job moves from doing the steps to owning the specification. You write down what good output looks like. You sample the output each week. You fix the process when it drifts, and you decide when a task goes back to a person. This is the [judgment-under-ambiguity work](/founders-office-guide) that already defines the role. The agent changes how many hours the steps take, and the ownership stays with you.

## One thing to do this week

Pick one report you produce by hand. Write the steps. Name the source for every number. Decide who reads it before it goes out. Then automate it, and check the first month of output line by line.
