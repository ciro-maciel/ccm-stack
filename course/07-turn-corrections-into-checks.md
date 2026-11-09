# 07 · Turn corrections into checks

**Module 1 · Work** · 20 minutes · [Previous](06-guardrails.md) · [Next: Tests that prove something](08-tests-that-prove.md) · Skill: [`correct`](../skills/correct/SKILL.md)

## The mistake

You correct the agent for the same thing for the fourth time. Each time you add a line to `CLAUDE.md`. The file is now 400 lines long, and the agent reads the parts it happens to reach.

## The rule

A mistake corrected twice becomes a check: structure first, then a hook or lint whose message names the fix, then a test, and text only for judgment calls.

## Make it stick

The `correct` skill mines your history (commits, reverts, reviews, instruction files, saved corrections), groups mistakes into classes, and fixes each at the highest level that works. Every new check is proved by replaying a real past mistake and watching it fail.

In CCM Stack, a new hook rule is three edits: an entry in `rules.json`, a function in `lib/checks.js`, and two test cases (one refused, one allowed). A rule that is only yours goes in your config's `forbiddenCommands`.

## Try it

```
/ccm-stack:correct
```

Read the classes it found. For each, check the level it chose and its reason for not going higher.

## Checkpoint

Your instruction file has a table pairing each rule with what enforces it, and at least one rule moved from "text only" to a check.
