# 08 · Tests that prove something

**Module 2 · Prove** · 20 minutes · [Previous](07-turn-corrections-into-checks.md) · [Next: Map every feature](09-map-every-feature.md) · Skill: [`test-truth`](../skills/test-truth/SKILL.md)

## The mistake

A publish feature breaks: the upload succeeds, but nothing is committed, so the live site keeps the old version. The end-to-end test stays green, because it checked for a `200`, and the old version also answers `200`.

## The rule

A test counts only if breaking the code turns it red. You find out by breaking the code on purpose.

## Make it stick

The `test-truth` skill makes sabotage part of writing a test, and names the traps that keep broken suites green: two checks guarding one result, a `200` that proves nothing, an API that is green while the screen is blank, a skip that silences a test, mocks that leak or freeze an old contract.

An optional hook, `no-tests-in-ci`, is for teams that run checks on their machines and watch production with monitors instead: it refuses test, lint and e2e steps added to CI workflows. It is off by default:

```
ccm rule on no-tests-in-ci
```

## Try it

Take one test you trust. Break the line it protects (invert a condition, return early) and run it. If it stays green, ask your agent:

```
Use test-truth on this test. It stayed green when I broke <the line>. Make it prove the behavior.
```

## Checkpoint

For the last three tests you wrote, you saw each one fail before you saw it pass.
