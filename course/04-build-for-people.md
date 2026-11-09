# 04 · Build for people

**Lesson 4 of 5** · 10 minutes · [Previous](03-fix-with-proof.md) · [Next: Ship it](05-ship-it.md) · Skills: [`intent`](../skills/intent/SKILL.md), [`plain-writing`](../skills/plain-writing/SKILL.md), [`ux-rules`](../skills/ux-rules/SKILL.md), [`naming`](../skills/naming/SKILL.md), [`verify`](../skills/verify/SKILL.md), [`critique`](../skills/critique/SKILL.md)

## The mistake

The landing page opens with "Welcome to our innovative platform", and the visitor who came with one worried question leaves. A person clicks "Write with AI" and watches a spinner in a modal for forty seconds. A list says "No items yet" because the request failed. The agent says "verified" after calling the API, while the screen that renders it crashes.

## The rule

Every piece starts from the person who meets it, says only true things in plain words, and never makes them wait or lies to them on screen. A feature is proved the way they reach it, and nobody sees a screen before it was captured in every state.

## Make it stick

- **`intent`**: before writing, answer who arrives and in what state, what they want and do not say, what blocks them, what they leave with, and the one next step. Then reread the draft as that person.
- **`plain-writing`**: no emoji, filler, inflated words or invented facts.
- **`ux-rules`**: slow work runs in the background; one loader per navigation, skeletons after it; loading, failed and empty are three different states; the chosen record lives in the URL.
- **`naming`**: code in English, screens in the reader's language; `Id` never `ID`; booleans that ask a question; list collisions before a bulk rename.
- **`verify`**: a feature map in your project, one file per feature: how a person gets there, how to drive it, what end state proves it.
- **`critique`**: each changed screen in light and dark, desktop and phone, and in five states, scored on five axes; everything under 7 is fixed before anyone sees it.

Three more load on their own when you build these: **`webhooks`** (Standard Webhooks signatures, replay protection), **`mcp-design`** (a product's MCP as four tools: guide, read, write, delete) and **`mac-app`** (a Mac app opened at login starts in the menu bar; the open-source [Cleaner](https://github.com/ciro-maciel/cleaner) is the reference). On Salesforce, **`salesforce`** brings the same rules to Apex and Lightning Web Components: bulk-safe code, tests that assert behavior, and the three states in every component.

## Try it

1. `Use the intent skill to rewrite the first screen of our README for a developer who found it from a search and has two minutes.`
2. Pick one list screen: `Use ux-rules to review it. Show me loading, a failed request and truly empty.` Make the request fail on purpose and look.
3. After your next UI change: `Use critique on the screens you changed.`

## Checkpoint

You can name the reader of the last thing you shipped and its one next step, every list you own tells loading, failed and empty apart, and your last screen scored 7 or more on every axis.
