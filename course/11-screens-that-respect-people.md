# 11 · Screens that respect people

**Module 3 · Build** · 20 minutes · [Previous](10-review-before-you-show.md) · [Next: Names and language](12-names-and-language.md) · Skill: [`ux-rules`](../skills/ux-rules/SKILL.md)

## The mistake

A person clicks "Write with AI" and watches a spinner inside a modal for forty seconds. Another opens a list and reads "No items yet", but the request had failed and their items were all there. A third sees a loader, then a second loader, then a skeleton, and thinks the page loaded three times.

## The rule

No screen waits on a slow job, claims "nothing here" when a request failed, or stacks loaders.

## Make it stick

The `ux-rules` skill carries the rules that came from screens like these:

- Slow work runs in the background; the person lands on the thing being made, with a skeleton and a visible working state.
- One loader per navigation; skeletons after it; the loading flag starts as `true`.
- Loading, failed and truly empty are three states, and failure is never shown as empty.
- Lists load as you scroll.
- The chosen resource lives in the URL, by stable id.
- Field errors under the field; what the person typed survives.
- A layout fix never removes content.

## Try it

Pick one list screen in your app and ask:

```
Use ux-rules to review this screen. Show me what it displays while loading, after a failed request, and when truly empty.
```

Then make the request fail on purpose (block it in the browser's network tools) and look.

## Checkpoint

Every list you own distinguishes loading, failed and empty, and no button waits on a model call.
