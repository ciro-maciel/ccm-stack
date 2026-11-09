# 12 · Names and language

**Module 3 · Build** · 15 minutes · [Previous](11-screens-that-respect-people.md) · [Next: Webhooks the standard way](13-webhooks-the-standard-way.md) · Skill: [`naming`](../skills/naming/SKILL.md)

## The mistake

A bulk rename from Portuguese to English replaces `busca` with `search` everywhere. The code is now consistent, and a button's accessible label reads "Limpar search", half in each language, to every screen reader user.

## The rule

Code speaks English; screens speak the reader's language. Names follow one set of casing rules, records are addressed by their stable id, and commits follow Conventional Commits.

## Make it stick

The `naming` skill holds the casing table, the boolean rule (`is`, `has`, `can`, `should`, always affirmative), `Id` never `ID`, routes by UUID, and a four-step procedure for bulk renames that lists collisions first. The `conventional-commits` hook checks every commit subject.

## Try it

```
Use the naming skill to review the names in <a file you wrote recently>. List anything that breaks the rules before changing it.
```

## Checkpoint

You can rename a field across your codebase without leaving a mixed-language phrase on screen or a broken call site.
