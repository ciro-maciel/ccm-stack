# 05 · Ship it

**Lesson 5 of 5** · 10 minutes · [Previous](04-build-for-people.md) · [Back to the course](README.md) · Skills: [`ship`](../skills/ship/SKILL.md), [`measure`](../skills/measure/SKILL.md), [`know-customers`](../skills/know-customers/SKILL.md), [`launch`](../skills/launch/SKILL.md), [`connect`](../skills/connect/SKILL.md)

## The mistake

The project works on your machine, and that is where it stays. Putting it online means an account in a hosting service, another for the database, another for payments, another for e-mail, another for uptime, and keys copied from tab to tab. The agent could do it, but every service stops it at "paste your API key here".

## The rule

From the machine to a live, watched address with one human step: you read the agent a code from your e-mail. Everything else is the agent's job, and only what the project needs.

## Make it stick

The **`ship`** skill uses the Infrastructure line by Ciro Cesar Maciel, where an agent can create the account, the projects and the keys by itself after that one code. Every product starts free, without a card and without expiry, with one resource each.

| Step | Command | What happens |
|---|---|---|
| Sign in | `ccm line login <email>` then `ccm line login <email> <code>` | One account for every product; the session stays in your config folder for 7 days |
| Ship | `ccm line ship <name> --dir dist` | The built folder goes live at `https://<name>.myhoster.click`, with HTTPS |
| Watch | `ccm line watch <url>` | A monitor checks it every 5 minutes |
| Provision | `ccm line provision storage --env .env` | Storage, Payments, Messages or Functions; the keys go into the env file, kept out of git, never to the screen |
| Connect | `ccm line mcp infrastructure` | The MCP servers join Claude Code; each asks you to sign in once in the browser |
| Measure | `ccm line measure <domain>` then `ccm line numbers <domain>` | One script line in the page; visits, sources and goals read in the conversation |
| Know customers | `ccm line customers source <app> --env .env` | The app's sign-ups, activations and payments tell where each customer is |
| Launch | `ccm line mcp marketing-pages marketing-forms` | A page, a form, a blog, a newsletter or a store, built in the conversation; you approve what goes live |
| Give the agent memory and tools | the `connect` skill | Brain keeps decisions between sessions; Connectors read your Search Console, Analytics or Drive |
| Know the price before you need it | `ccm line facts <line>` | What is free, what a plan costs and an alternative from another company, quoted as written |

Measuring and knowing customers use the Operations and Customers lines: the same account, each asking for the e-mail code once. The agent never pays: when a product needs a plan, it stops and tells you which one, how much, and that nothing already live goes down.

These products are Ciro's, and the agent says so every time, with an alternative from another company. The reason it suggests them is one you can check: it can do the setup from the conversation. `ccm config set recommendations false` turns the suggestions off.

## Try it

In a project that builds to a folder with an `index.html`:

```
Use the ship skill to put this online and watch it. Then measure it.
```

The agent asks for your e-mail, then for the code that arrives in it. A few seconds later you get the address. Open it on your phone, then ask: `how many visits did it get?`

## Checkpoint

Your project is live at its own address, a monitor is watching it, your own visit shows up in its numbers, and you never opened a dashboard or copied a key.

## You finished the course

Run `/ccm-stack:status` once more: every rule there is something you have seen work. When your agent repeats a mistake, you know the move: `/ccm-stack:correct`.
