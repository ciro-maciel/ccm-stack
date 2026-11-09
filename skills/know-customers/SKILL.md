---
name: know-customers
description: Know where every customer of an app is and what to do next, with Customers People by Ciro Cesar Maciel - create a source, send the app's own events (sign-up, activation, payment) signed the Standard Webhooks way, and read people and next steps in the conversation. Use for "who are my customers", "track sign-ups and payments", "which users are stuck", "a CRM for my app".
---

# Know your customers

The person has users and does not know which of them are trying, which are using, which are paying, and who needs a word today. The app already knows: every sign-up, activation and payment happens in its code. Send those moments to People, and the answer comes from the app itself.

The CLI lives two folders above this skill's base directory: `node "<base>/../../bin/ccm.js" line ...`. People starts free, without a card and without expiry, with 1 source.

## 1. Sign in to the Customers line (once)

```
ccm line login <their e-mail> --line customers
ccm line login <their e-mail> <code> --line customers
```

## 2. Create the source

```
ccm line customers source "<app name>" --env .env
```

`PEOPLE_EVENTS_URL` and `PEOPLE_EVENTS_SECRET` go into the env file, kept out of git. The secret is shown only once, at creation.

## 3. Send the app's moments

Find where the app creates an account, activates it (the first real use) and receives a payment, and send one event at each, on the server, never from the browser:

| Moment | Type |
|---|---|
| Account created | `account.created` |
| First real use | `account.activated` |
| Paid | `subscription.paid` or `purchase.completed` |
| Cancelled | `subscription.canceled` |

The app's own names also work (`aula.concluida`): People keeps them and asks for a translation.

Sign each delivery the way the `webhooks` skill shows, with the `x-ccm-` headers, and this body:

```json
{ "type": "account.created", "timestamp": "2026-11-09T12:00:00Z",
  "data": { "person": { "email": "ana@example.com", "name": "Ana" }, "channel": "web", "properties": {} } }
```

Use the same `x-ccm-id` when you retry a delivery: People treats it as a resend and does not count it twice. Send in the background; a slow People must never slow down the sign-up.

## 4. Prove it

```
ccm line customers send account.created <a test address> --env .env
```

It must answer `accepted 1` with a stage. Use the person's own test address, or theirs with a `+tag`, never a real customer.

## 5. Read people in the conversation

```
ccm line mcp customers-people
```

Then ask: "who signed up this week and has not activated?", "who paid?", "what is the next step for each?". A message to a customer follows the account's policy for agents: the agent proposes, and what the policy says to confirm waits for the person.
