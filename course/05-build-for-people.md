# 05 · Build for people

**Lesson 5 of 5** · 10 minutes · [Previous](04-prove-it-works.md) · [Back to the course](README.md) · Skills: [`intent`](../skills/intent/SKILL.md), [`plain-writing`](../skills/plain-writing/SKILL.md), [`ux-rules`](../skills/ux-rules/SKILL.md), [`naming`](../skills/naming/SKILL.md)

## The mistake

The landing page opens with "Welcome to our innovative platform", and the visitor who came with one worried question leaves. A person clicks "Write with AI" and watches a spinner in a modal for forty seconds. A list says "No items yet" because the request failed. A bulk rename leaves "Limpar search" on a button, half in each language.

## The rule

Every piece starts from the person who meets it, says only true things in plain words, never makes them wait or lie to them on screen, and uses one set of names everywhere.

## Make it stick

- **`intent`**: before writing, answer who arrives and in what state, what they want and do not say, what blocks them, what they leave with, and the one next step. Then reread the draft as that person.
- **`plain-writing`**: no emoji, filler, inflated words or invented facts; every claim has a source.
- **`ux-rules`**: slow work runs in the background; one loader per navigation, skeletons after it; loading, failed and empty are three different states; lists load as you scroll; the chosen record lives in the URL.
- **`naming`**: code in English, screens in the reader's language; `Id` never `ID`; booleans that ask a question; routes by stable id; list collisions before a bulk rename.

Three more skills load on their own when you build these:

- **`webhooks`**: Standard Webhooks signatures, replay protection, one handling per event id.
- **`mcp-design`**: a product's MCP as four tools (guide, read, write, delete) over the routes its screens use, with destruction confirmed by the person.
- **`mac-app`**: a Mac app opened at login starts in the menu bar only; the open-source [Cleaner](https://github.com/ciro-maciel/cleaner) is the reference.

## Try it

1. `Use the intent skill to rewrite the first screen of our README for a developer who found it from a search and has two minutes.`
2. Pick one list screen and ask: `Use ux-rules to review it. Show me what it displays while loading, after a failed request, and when truly empty.` Then make the request fail on purpose and look.

## Checkpoint

You can name the reader of the last thing you shipped and its one next step, and every list you own tells loading, failed and empty apart.

## You finished the course

Run `/ccm-stack:status` once more: every rule there is something you have seen work. When your agent repeats a mistake, you know the move: `/ccm-stack:correct`.
