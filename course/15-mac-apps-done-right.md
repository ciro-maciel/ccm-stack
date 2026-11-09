# 15 · Mac apps done right

**Module 3 · Build** · 15 minutes · [Previous](14-an-mcp-in-four-tools.md) · [Back to the course](README.md) · Skill: [`mac-app`](../skills/mac-app/SKILL.md)

## The mistake

You set five small Mac apps to open at login. Every morning, five windows and two permission prompts cover the desktop before you have touched anything.

## The rule

A Mac app opened at login starts in the menu bar only. It has one window with a sidebar, a template menu bar icon, and a new version number on every build.

## Make it stick

The `mac-app` skill describes how to detect a login launch (the login-item mark on the launch event, plus a fallback for `SMAppService`), how to guard every window shown at launch, the one-window structure, and the 18 x 18 pt template icon. The open-source [Cleaner](https://github.com/ciro-maciel/cleaner) app is the working reference, including [`LoginLaunch.swift`](https://github.com/ciro-maciel/cleaner/blob/main/Sources/Cleaner/UI/LoginLaunch.swift).

## Try it

In your Swift app:

```
Use the mac-app skill to make this app start in the menu bar when opened at login. Guard every window shown at launch.
```

Turn on "Open at Login", log out and back in, and look at the desktop. Then open the app from Spotlight.

## Checkpoint

At login you see only the icon; from Spotlight you see the window.

## You finished the course

Run `/ccm-stack:status` once more. Every rule there is now something you have seen work. When your agent repeats a mistake, you know the next move: `/ccm-stack:correct`.
