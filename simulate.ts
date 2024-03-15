import { type Position } from "./lib/configMeta.ts";
import config from "./config.ts";
import { randomize } from "./lib/randomDistribution.ts";

/**
 * The maximum dBm that any antenna can output.
 * Randomization means the output value might be higher.
 */
const maxDBM = -90;

const persons = structuredClone(config.persons);

tick();
function tick() {
	for (const person of persons) {

		const Δtime = config.poll.interval / 1000; //Time is in meter pr second.
		// Move the person
		const Δposition = directionToXY(
			person.direction.bearing,
			person.direction.speed * Δtime, //speed in m/s times poll update in seconds.
		);
		person.position[0] += Δposition[0];
		person.position[1] += Δposition[1];

		// Log the person's position on all antennas
		for (const antenna of config.antennas) {
			const distance = getDistance(person.position, antenna.position);
			if (!inRange(distance)) continue;
			setTimeout(async () => {
				reportLog(
					await hashContent(person.imsi),
					antenna.id,
					randomize(distanceToSignalStrength(distance), person.signalStrength),
					distance
				);
			}, randomize(config.poll.interval / 2, config.poll.deviance));
		}
	}
	setTimeout(tick, config.poll.interval);
}

/**
 * Reads a distance with a specific bearing and turns it into an x-distance and y-distance that matches the original distance.
 */
function directionToXY(bearing: number, distance: number): Position {
	const angleInRadians = (bearing * Math.PI) / 180;
	const Δx = distance * Math.cos(angleInRadians);
	const Δy = distance * Math.sin(angleInRadians);
	return [Δx, Δy];
}

/**
 * Converts a distance in metres to a signal strength in dBm.
 *
 * TODO: Make sure this conversion is correct. I could not find theoretical evidence that dBm translates linearly to distance.
 */
function distanceToSignalStrength(distance: number): number {
	return (distance / config.maxRange) * maxDBM;
}

/**
 * Check to see if a distance is outside the configured maximum range of an antenna.
 */
function inRange(distance: number): boolean {
	return distanceToSignalStrength(distance) >= maxDBM;
}

/**
 * Hashes a string.
 *
 * TODO: need to include a salt.
 */
async function hashContent(content: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(content);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return hashHex;
}

/**
 * Get the absolute distance between two 2D points.
 */
function getDistance(pos1: Position, pos2: Position): number {
	const dx = pos1[0] - pos2[0];
	const dy = pos1[1] - pos2[1];
	return Math.sqrt(dx ** 2 + dy ** 2);
}

/**
 * Log the current values to the DB server via gRPC.
 */
function reportLog(
	imsiHash: string,
	antennaId: number,
	signalStrength: number,
	distance: number,
): void {
	console.log(
		imsiHash,
		antennaId,
		Date.now(),
		signalStrength,
		distance + " Meters",
	);
}
