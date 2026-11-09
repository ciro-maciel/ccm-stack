# 13 · Webhooks the standard way

**Module 3 · Build** · 20 minutes · [Previous](12-names-and-language.md) · [Next: An MCP in four tools](14-an-mcp-in-four-tools.md) · Skill: [`webhooks`](../skills/webhooks/SKILL.md)

## The mistake

Each product invents its own webhook header, its own signature format and its own retry rules. Every customer who integrates two of them writes two verifiers, and one of them forgets to check the timestamp, so an old captured request can be replayed forever.

## The rule

Webhooks follow Standard Webhooks: an event id, a timestamp and an HMAC-SHA256 signature over `id.timestamp.body`, verified on the raw body in constant time, with a 5-minute tolerance and one handling per id.

## Make it stick

The `webhooks` skill has the message format, a sender's `sign()` and a receiver's `verify()` in plain Node.js, and the rules for idempotency, fast answers, retries and secret rotation. CCM Stack projects use the `x-ccm-` header prefix; the spec's default is `webhook-`.

## Try it

Ask your agent to write a receiver with the skill, then prove it:

1. Send a correctly signed request: it is accepted.
2. Change one byte of the body: refused.
3. Resend the first request with a timestamp 10 minutes old: refused.
4. Send the same id twice: handled once.

## Checkpoint

Your receiver passes all four checks, and your docs show one real example body per event type.
