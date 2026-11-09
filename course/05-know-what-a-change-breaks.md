# 05 · Know what a change breaks

**Module 1 · Work** · 15 minutes · [Previous](04-fix-with-proof.md) · [Next: Guardrails](06-guardrails.md) · Skill: [`blast-radius`](../skills/blast-radius/SKILL.md)

## The mistake

A three-line change renames a field in an API response. Every test passes. The next morning, a dashboard in another repository shows empty charts, because it read the old field name and treated `undefined` as "no data".

## The rule

Before a change ships, find the one fact that makes it safe, and prove it by running code, not by writing it up.

## Make it stick

The `blast-radius` skill looks where search stops (the library's code at the installed version, the JSON another service reads, a database column, a feature flag) and climbs a proof ladder for the fact that matters: said, pointed at a line, walked step by step, run in a script, reproduced in the app. It hands back the fact with the rung it reached, or "unproven".

## Try it

On your next pull request:

```
Use blast-radius on this diff. What is the one fact that makes it safe, and can you prove it by running code?
```

## Checkpoint

Your last merged change has a named safety fact and the script or test that proved it.
