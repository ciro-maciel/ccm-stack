#!/usr/bin/env bash
set -euo pipefail
cat > package.json <<'X'
{ "name": "blog", "type": "module" }
X
cat > slug.js <<'X'
export function slug(title) {
	return title
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}
X
