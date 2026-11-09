# Security

CCM Stack runs hooks with your user's permissions on every command and file write your agent makes, so a flaw here matters.

## Report a vulnerability

Use GitHub's private vulnerability reporting: the **Security** tab of this repository, then **Report a vulnerability**. Please do not open a public issue for it.

Include what an attacker could do, the steps to reproduce, and the version (`.claude-plugin/plugin.json`). You will get an answer within seven days.

## What CCM Stack does on your machine

- Reads the JSON your agent's harness sends to each hook. Sends nothing anywhere.
- Copies files aside before the agent changes or deletes them, into your own config folder.
- Downloads the Phonon binary only when you run `ccm voice install`, from Gradium's GitHub releases, and refuses it if its SHA-256 differs from the one pinned in `lib/voice.js`.
- Calls Fish Audio only if you choose that engine, with your own key from `FISH_API_KEY`.
- Calls the Infrastructure line only when you run `ccm line`. Each line's sign-in session is saved in your config folder (`line/session*.json`, readable only by you) and lasts 7 days; `ccm line logout` deletes them. Keys it provisions are written to the env file you name, which it adds to `.gitignore`, and never printed.
