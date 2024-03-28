/**
 * This is useful for testing exactly what value you want to use in the randomizers.
 *
 * You can run this with:
 * yarn vite-node dev/test-distribution-curve.ts ALPHA
 *
 * Where ALPHA is the number that defines the shape of the distribution curve.
 * It should be something between 0.01 to 100, the most interesting range is 1 to 10.
 */

import { randomDistribution } from "../lib/randomDistribution.ts";

const alphaCurve = parseFloat(process.argv[2]);

if (Number.isNaN(alphaCurve) || alphaCurve <= 0) {
	throw new TypeError(
		"The first argument (alpha curve) must be a number that is larger than 0",
	);
}

// Generate results
const results = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
for (let i = 0; i < 100000; i++) {
	const r = randomDistribution(alphaCurve);
	const n = r > 0 ? Math.floor(r) : Math.ceil(r);
	if (n === 0) {
		results[4] += 0.5;
		results[5] += 0.5;
	} else {
		results[n + 5] += 1;
	}
}

// Print results
for (let i = 0; i < 10; i++) {
	let s: string = i < 5 ? `-0.${4 - i}x ` : `+0.${i - 5}x `;
	const r = results[i] / 1000;
	for (let _r = 0; _r < r; _r++) {
		s += "■";
	}
	console.log(s);
}
