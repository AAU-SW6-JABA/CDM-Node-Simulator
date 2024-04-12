import type { Position } from "./configMeta.ts";
import config from "../config.ts";
import { log10 } from "mathjs";

class Calculation {
	/**
	 * The maximum dBm that any antenna can output.
	 * Randomization means the output value might be higher.
	 */
	maxDBM = -90;

	distance_0 = config.antennaCalibration.distance_0;
	distance_1 = config.antennaCalibration.distance_1;
	strength_0 = config.antennaCalibration.strength_0;
	strength_1 = config.antennaCalibration.strength_1;

	pathLossExponent: number;

	constructor() {
		this.pathLossExponent = this.calculatePathLossExponent();
	}

	/**
	 * Get the absolute distance between two 2D points.
	 */
	getDistance(pos1: Position, pos2: Position): number {
		const dx = pos1[0] - pos2[0];
		const dy = pos1[1] - pos2[1];
		return Math.sqrt(dx ** 2 + dy ** 2);
	}

	/**
	 * Reads a distance with a specific bearing and turns it into an x-distance and y-distance that matches the original distance.
	 */
	directionToXY(bearing: number, distance: number): Position {
		const angleInRadians = (bearing * Math.PI) / 180;
		const deltaX = distance * Math.cos(angleInRadians);
		const deltaY = distance * Math.sin(angleInRadians);
		return [deltaX, deltaY];
	}

	/**
	 * Converts a distance in metres to a signal strength in dBm.
	 */
	distanceToSignalStrength(distance: number): number {
		return (
			this.strength_0 -
			10 * this.pathLossExponent * log10(distance / this.distance_0)
		);
	}

	/**
	 * Check to see if a distance is outside the configured maximum range of an antenna.
	 */
	inRange(distance: number): boolean {
		return this.distanceToSignalStrength(distance) >= this.maxDBM;
	}

	/**
	 * Calculate the path loss exponent
	 */
	calculatePathLossExponent(): number {
		return (
			(this.strength_0 - this.strength_1) /
			(10 * log10(this.distance_1 / this.distance_0))
		);
	}
}

const calc = new Calculation();
export default calc;
