# 09 · Map every feature

**Module 2 · Prove** · 25 minutes · [Previous](08-tests-that-prove.md) · [Next: Review before you show](10-review-before-you-show.md) · Skill: [`verify`](../skills/verify/SKILL.md)

## The mistake

"Verified, it works." The agent called the API, got the right JSON, and stopped. The screen that renders it crashed on a missing field, and the person found out from a customer.

## The rule

Every feature is mapped from the user's side and proved the way a user reaches it: through the screen, with evidence of the action and of the result.

## Make it stick

The `verify` skill keeps two things in your project:

- **A verification guide** (`docs/verify/README.md`): how to launch the app, check that it is worth driving, drive it like a person, capture evidence, and clean up.
- **A feature map** (`docs/verify/features/`): one file per user-facing feature with four sections: its parts, how a person gets there, how to drive it and what end state proves it, and its gotchas.

When a feature has several entry points (a screen, an API, a public link), proving one of them is an incomplete proof. A journey that cannot pass because seed data is missing fails and says why; it is never loosened to pass.

## Try it

```
Use the verify skill to create the verification guide and map the three features people use most in this app. Then prove one of them end to end and show me the evidence.
```

## Checkpoint

Your project has `docs/verify/` with at least three mapped features, and you have seen one journey's screenshots of the action and the result.
