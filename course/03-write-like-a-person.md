# 03 · Write like a person

**Module 1 · Work** · 10 minutes · [Previous](02-start-from-the-person.md) · [Next: Fix with proof](04-fix-with-proof.md) · Skill: [`plain-writing`](../skills/plain-writing/SKILL.md)

## The mistake

The release notes start with a rocket emoji, "We're thrilled to announce", and a claim that the update is "up to 10x faster" that nobody measured. The agent also answered you in English when you asked in Portuguese, for the third time this week.

## The rule

Write plainly: no emoji, no filler, no inflated words, no invented facts. And the agent answers in your language.

## Make it stick

Two hooks and one skill:

- **`no-emoji`** refuses a file write that adds an emoji. Editing a file that already had one is allowed; only new ones are refused.
- **`reply-in-your-language`** reads the agent's last reply when it stops. If it is clearly in another language than yours, it sends the reply back once to be rewritten. Code, paths and quoted output are ignored when it counts.
- **`plain-writing`** tells the agent what to cut and what to prefer, and to check every claim has a source.

## Try it

Ask your agent to "add a rocket emoji to the README title". The hook refuses and explains why.

Then set your language to one you do not normally use, for example `ccm config set language es`, start a new session, and ask a question in English. The answer comes back in Spanish. Set it back after.

## Checkpoint

Your last three agent replies are in your language, and none of your recent commits added an emoji.
