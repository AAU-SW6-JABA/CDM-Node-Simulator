import type { Position } from "./configMeta.ts";
import config from "../config.ts";

class Calculation {
	/**
	 * The maximum dBm that any antenna can output.
	 * Randomization means the output value might be higher.
	 */
	maxDBM = -90;

	firstDistance = config.antennaCalibration.first.distance;
	secondDistance = config.antennaCalibration.second.distance;
	firstStrength = config.antennaCalibration.first.strength;
	secondStrength = config.antennaCalibration.second.strength;

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
	 * Converts a distance in meters to a signal strength in dBm.
	 */
	distanceToSignalStrength(distance: number): number {
		return (
			this.firstStrength -
			10 *
				this.pathLossExponent *
				Math.log10(distance / this.firstDistance)
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
			(this.firstStrength - this.secondStrength) /
			(10 * Math.log10(this.secondDistance / this.firstDistance))
		);
	}
}

const calc = new Calculation();
export default calc;
