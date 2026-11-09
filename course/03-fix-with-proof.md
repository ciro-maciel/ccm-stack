# 03 · Fix with proof

**Lesson 3 of 5** · 10 minutes · [Previous](02-guardrails.md) · [Next: Prove it works](04-prove-it-works.md) · Skills: [`fix-with-proof`](../skills/fix-with-proof/SKILL.md), [`blast-radius`](../skills/blast-radius/SKILL.md)

## The mistake

"The page is slow." The agent adds a cache, a retry and a memo, reports "should be faster now", and the page is as slow as before: nobody saw the slowness happen, so nobody can see it gone. Another day, a three-line change renames a field, every test passes, and a dashboard in another repository goes blank the next morning.

## The rule

Reproduce the defect before fixing it, fix where it started, and report a number only with how many runs, how much they vary and what limits it. Before a change ships, prove by running code the one fact that makes it safe.

## Make it stick

- **`fix-with-proof`** gives the agent five steps on any bug: reproduce on the real surface, find where it started, test the premise after two failed fixes, prove the fix with the same reproduction, explain every number. Its report pastes the reproduction before and after.
- **`blast-radius`** looks where search stops (the library at the installed version, the JSON another service reads, a database column, a flag) and climbs a proof ladder for the fact that matters: said, pointed at a line, walked, run in a script, reproduced. It answers with the fact and the rung it reached, or "unproven".

## Try it

Pick a real bug and ask:

```
Use fix-with-proof on this: <the symptom>. Reproduce it first and show me the output.
```

Watch for the moment the agent wants to change code before reproducing anything: the skill sends it back. Then, on the diff:

```
Use blast-radius on this diff. What is the one fact that makes it safe, and can you prove it by running code?
```

## Checkpoint

Your last fix has a failing reproduction and a passing one, and a named safety fact with the script that proved it.
