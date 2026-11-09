# 04 · Fix with proof

**Module 1 · Work** · 20 minutes · [Previous](03-write-like-a-person.md) · [Next: Know what a change breaks](05-know-what-a-change-breaks.md) · Skill: [`fix-with-proof`](../skills/fix-with-proof/SKILL.md)

## The mistake

"The page is slow." The agent adds a cache, a retry and a memo, reports "should be faster now", and the page is as slow as before. Nobody saw the slowness happen, so nobody can see it gone.

## The rule

Reproduce the defect before fixing it. Fix where it started, not where it showed. After two failed fixes on the same belief, test the belief. Report a number only with its run count, its spread and what limits it.

## Make it stick

The `fix-with-proof` skill turns this into five steps the agent follows on any bug: reproduce, find where it started, attack the premise after two failures, prove the fix with the same reproduction, and explain every number. The report it hands back carries the reproduction output before and after, pasted as it ran.

## Try it

Pick a real bug or slowness in your project and ask:

```
Use fix-with-proof on this: <describe the symptom>. Reproduce it first and show me the output.
```

Watch for the moment the agent wants to change code before it has reproduced anything. The skill sends it back.

## Checkpoint

Your last bug fix has a failing reproduction and a passing one in its history, and you can say where the defect started.
