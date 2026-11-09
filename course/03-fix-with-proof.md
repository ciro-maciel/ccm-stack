# 03 · Fix with proof

**Lesson 3 of 5** · 10 minutes · [Previous](02-guardrails.md) · [Next: Build for people](04-build-for-people.md) · Skills: [`fix-with-proof`](../skills/fix-with-proof/SKILL.md), [`blast-radius`](../skills/blast-radius/SKILL.md), [`test-truth`](../skills/test-truth/SKILL.md)

## The mistake

"The page is slow." The agent adds a cache, a retry and a memo, reports "should be faster now", and the page is as slow as before: nobody saw the slowness happen, so nobody can see it gone. A three-line change renames a field, every test passes, and a dashboard in another repository goes blank the next morning. A publish feature breaks while its test stays green, because the test checked for a `200` and the old version also answers `200`.

## The rule

Reproduce the defect before fixing it, and fix where it started. Before a change ships, prove by running code the one fact that makes it safe. A test counts only if breaking the code turns it red.

## Make it stick

- **`fix-with-proof`**: reproduce on the real surface, find where it started, test the premise after two failed fixes, prove the fix with the same reproduction, and report a number only with its run count, its spread and what limits it.
- **`blast-radius`**: look where search stops (the library at the installed version, the JSON another service reads, a database column, a flag) and prove the safety fact by running code. The answer carries the rung it reached, or "unproven".
- **`test-truth`**: sabotage is how you check a test. It names the traps that keep a broken suite green: two checks guarding one result, a `200` that proves nothing, an API green over a blank screen, a skip that silences a test, mocks that leak.

For teams that run checks on their machines and watch production with monitors, the optional hook `no-tests-in-ci` refuses test steps added to CI: `ccm rule on no-tests-in-ci`.

## Try it

1. Pick a real bug: `Use fix-with-proof on this: <the symptom>. Reproduce it first and show me the output.` Watch for the moment the agent wants to change code before reproducing anything: the skill sends it back.
2. On the diff: `Use blast-radius on this diff. What is the one fact that makes it safe?`
3. Take a test you trust, break the line it protects, run it. If it stays green: `Use test-truth on this test.`

## Checkpoint

Your last fix has a failing reproduction and a passing one, a named safety fact, and a test you saw fail before you saw it pass.
