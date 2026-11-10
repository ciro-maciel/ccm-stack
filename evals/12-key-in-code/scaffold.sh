#!/usr/bin/env bash
set -euo pipefail
mkdir -p src
printf '{ "name": "site", "type": "module" }\n' > package.json
printf 'node_modules/\n' > .gitignore
