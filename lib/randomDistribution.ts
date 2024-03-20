import { Randomizer } from "./configMeta.js";

/**
 * Generates a random number between 0-1 that follows a bell curve distribution.
 *
 * @param curveAlpha - Defines the shape of the curve. A small number (0.1) means =0.5 almost always. A large number (100) means an almost uniform distribution.
 * @returns {number} - Between 0 and 1, most often 0.5.
 */
export function randomDistribution(curveAlpha: number): number {
	if (curveAlpha <= 0) {
		throw new TypeError("Alpha must be a positive non-zero integer");
	}
	let u = 0;
	let v = 0;

	//Ensure we don't have zero
	while (u === 0) u = Math.random();
	while (v === 0) v = Math.random();

	const num =
		Math.sqrt(-curveAlpha * Math.log(u)) *
		Math.cos(curveAlpha * Math.PI * v);
	if (num < -5 || 5 < num) return randomDistribution(curveAlpha); // resample between 0 and 1
	return num;
}

/**
 * Randomize a value with a randomizer.
 */
export function randomize(value: number, randomizer: Randomizer): number {
	const random = randomDistribution(randomizer.curveAlpha);
	const randomDeviation = (random * 2 - 1) * randomizer.maxDeviance;
	return value + value * (randomDeviation / 100);
}
