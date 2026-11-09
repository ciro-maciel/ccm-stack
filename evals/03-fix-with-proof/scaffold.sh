#!/usr/bin/env bash
set -euo pipefail
cat > package.json <<'X'
{ "name": "shop", "type": "module" }
X
cat > cart.js <<'X'
export function total(items, coupon) {
	const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
	const discount = coupon ? subtotal * coupon.percent : 0
	return Math.round((subtotal - discount) * 100) / 100
}
X
cat > coupons.js <<'X'
export const COUPONS = { WELCOME10: { code: "WELCOME10", percent: 10 } }
X
