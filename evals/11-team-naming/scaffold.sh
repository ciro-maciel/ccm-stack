#!/usr/bin/env bash
set -euo pipefail
mkdir -p src
printf '{ "name": "billing", "type": "module" }\n' > package.json
printf '{ "packs": { "naming": true, "api-keys": true } }\n' > ccm.standards.json
cat > src/accounts.js <<'X'
// Accounts as the billing service sees them.
export function findAccount(accounts, accountId) {
	return accounts.find((account) => account.id === accountId) ?? null
}
X
