# 04 · Prove it works

**Lesson 4 of 5** · 10 minutes · [Previous](03-fix-with-proof.md) · [Next: Build for people](05-build-for-people.md) · Skills: [`test-truth`](../skills/test-truth/SKILL.md), [`verify`](../skills/verify/SKILL.md), [`critique`](../skills/critique/SKILL.md)

## The mistake

A publish feature breaks, and the test stays green: it checked for a `200`, and the old version also answers `200`. The agent says "verified" after calling the API, while the screen that renders it crashes. It calls the settings page done; you open it and see a button on the card's edge and a list that loads forever.

## The rule

A test counts only if breaking the code turns it red. A feature is proved the way a user reaches it. Nobody sees a screen before it was captured in every state and scored.

## Make it stick

- **`test-truth`** makes sabotage part of writing a test, and names the traps that keep a broken suite green: two checks guarding one result, a `200` that proves nothing, an API green over a blank screen, a skip that silences a test, mocks that leak or freeze an old contract.
- **`verify`** keeps a feature map in your project (`docs/verify/features/`, one file per feature: how a person gets there, how to drive it, what end state proves it) and a guide to launch, drive and capture evidence.
- **`critique`** captures each changed screen in light and dark, desktop and phone, and in five states (loading, empty, error, populated, edge), scores five axes and fixes everything under 7.

For teams that run checks on their machines and watch production with monitors, the optional hook `no-tests-in-ci` refuses test steps added to CI: `ccm rule on no-tests-in-ci`.

## Try it

1. Take a test you trust, break the line it protects, and run it. If it stays green: `Use test-truth on this test. It stayed green when I broke <the line>.`
2. `Use the verify skill to map the three features people use most and prove one of them end to end.`
3. After your next UI change: `Use critique on the screens you changed.`

## Checkpoint

You saw a test fail before you saw it pass, your project has a feature map, and your last screen scored 7 or more on every axis.
