import type {
	AntennaConfig,
	PersonConfig,
	Position,
} from "./lib/configMeta.ts";
import config from "./config.ts";
import { randomize } from "./lib/randomDistribution.ts";

import type { ProtoGrpcType } from "./gen/protobuf/cdm_protobuf.ts";
import type { RoutesClient } from "./gen/protobuf/cdm_protobuf/Routes.ts";
import protoLoader from "@grpc/proto-loader";
import grpc from "@grpc/grpc-js";

import dotenv from "dotenv";

dotenv.config();
if (typeof process.env?.PORT !== "string") {
	throw new TypeError("Please define a port in your env file (PORT)");
}

const protoDefinitionPath = "./CDM-ProtocolBuffer/cdm_protobuf.proto";

const packageDefinition: protoLoader.PackageDefinition = await protoLoader.load(
	protoDefinitionPath,
	{},
);
const packageObject: ProtoGrpcType["cdm_protobuf"] = (
	grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType
).cdm_protobuf;
/* eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment */
const client: RoutesClient = new packageObject.Routes(
	`localhost:${process.env.PORT}`,
	grpc.credentials.createInsecure(),
);

/**
 * The maximum dBm that any antenna can output.
 * Randomization means the output value might be higher.
 */
const maxDBM = -90;

const persons: PersonConfig[] = structuredClone(config.persons);

type Antenna = AntennaConfig & {
	/**
	 * The ID to use when sending antenna data to the database.
	 */
	id: number | undefined;
};

const antennas: Antenna[] = structuredClone(config.antennas) as Antenna[];

for (const antenna of antennas) {
	registerAntenna(antenna);
}
function registerAntenna(antenna: Antenna): void {
	client.registerAntennaRoute(
		{
			x: antenna.position[0],
			y: antenna.position[1],
		},
		(error, value) => {
			if (!value?.aid || error) {
				console.warn(
					"Could not register antenna, retrying in one second",
					error,
				);
				setTimeout(registerAntenna, 1000, antenna);
				return;
			} else {
				antenna.id = value.aid;
			}
		},
	);
}

tick();
function tick() {
	for (const person of persons) {
		const deltaTime = config.poll.interval / 1000; //Time is in meter pr second.
		// Move the person
		const deltaPosition = directionToXY(
			person.direction.bearing,
			person.direction.speed * deltaTime, //speed in m/s times poll update in seconds.
		);
		person.position[0] += deltaPosition[0];
		person.position[1] += deltaPosition[1];

		// Log the person's position on all antennas in range
		for (const antenna of antennas) {
			if (!antenna.id) return;
			const distance = getDistance(person.position, antenna.position);
			if (!inRange(distance)) continue;
			setTimeout(
				/* eslint-disable-next-line @typescript-eslint/no-misused-promises */
				async (antenna: { id: number }) => {
					reportLog(
						await hashContent(person.imsi),
						antenna.id,
						randomize(
							distanceToSignalStrength(distance),
							person.signalStrength,
						),
					);
				},
				randomize(config.poll.interval / 2, config.poll.deviance),
				antenna,
			);
		}
	}
	setTimeout(tick, config.poll.interval);
}

/**
 * Reads a distance with a specific bearing and turns it into an x-distance and y-distance that matches the original distance.
 */
function directionToXY(bearing: number, distance: number): Position {
	const angleInRadians = (bearing * Math.PI) / 180;
	const deltaX = distance * Math.cos(angleInRadians);
	const deltaY = distance * Math.sin(angleInRadians);
	return [deltaX, deltaY];
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
async function hashContent(content: string | number): Promise<string> {
	content = String(content);
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
): void {
	console.log(imsiHash, antennaId, Date.now(), signalStrength);
}
