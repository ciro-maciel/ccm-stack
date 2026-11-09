# 14 · An MCP in four tools

**Module 3 · Build** · 20 minutes · [Previous](13-webhooks-the-standard-way.md) · [Next: Mac apps done right](15-mac-apps-done-right.md) · Skill: [`mcp-design`](../skills/mcp-design/SKILL.md)

## The mistake

An MCP server starts with five tools and grows one per endpoint. At sixty tools it fills the agent's context before any work starts, half of them call logic the app no longer uses, and one deletes records without asking anyone.

## The rule

A product's MCP is four tools (guide, read, write, delete) over the same routes its screens use. Destruction is confirmed by the person; decisions are never taken by the agent.

## Make it stick

The `mcp-design` skill defines the four tools, routes every call through the screen's own handler with the person's identity, makes `delete` a two-call exchange with a short-lived confirmation code, refuses approve/reject/answer routes to agents, and grows the guide instead of the tool list.

## Try it

For an app you own:

```
Use mcp-design to plan an MCP for this app. Show me the guide table it would return and which routes count as destructive.
```

Then build `guide` and `read` first, and prove each with a live call using a test account.

## Checkpoint

Your MCP lists four tools, `delete` refuses without the person's confirmation, and a new route shows up in `guide` without a new tool.
