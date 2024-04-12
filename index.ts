import type { AntennaConfig, PersonConfig } from "./lib/configMeta.ts";
import config from "./config.ts";
import { randomize } from "./lib/randomDistribution.ts";
import calc from "./lib/Calculation.ts";

import type { ProtoGrpcType } from "./gen/protobuf/cdm_protobuf.ts";
import type { RoutesClient } from "./gen/protobuf/cdm_protobuf/Routes.ts";
import protoLoader from "@grpc/proto-loader";
import grpc from "@grpc/grpc-js";

import dotenv from "dotenv";

dotenv.config();
if (typeof process.env?.HOST !== "string") {
	throw new TypeError("Please define a host address in your env file (HOST)");
}
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

const url = `${process.env.HOST}:${process.env.PORT}`;
console.log(`Connecting to CDM-Server at ${url}`);
/* eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment */
const client: RoutesClient = new packageObject.Routes(
	url,
	grpc.credentials.createInsecure(),
);

const persons: PersonConfig[] = structuredClone(config.persons);

type Antenna = AntennaConfig & {
	/**
	 * The ID to use when sending antenna data to the database.
	 */
	id: number | undefined;
};

const antennas: Antenna[] = structuredClone(config.antennas) as Antenna[];

console.log("Registering antennas...");
for (const antenna of antennas) {
	registerAntenna(antenna);
}
function registerAntenna(antenna: Antenna): void {
	client.registerAntennaRoute(
		{
			x: antenna.position[0],
			y: antenna.position[1],
		},
		(error, value: { aid: number }) => {
			if (!value?.aid || error) {
				console.warn(
					"Could not register antenna, retrying in one second",
					error,
				);
				setTimeout(registerAntenna, 1000, antenna);
			} else {
				console.log(`Succesfully registered antenna, id: ${value.aid}`);
				antenna.id = value.aid;
			}
		},
	);
}

console.log("Logging data...");
tick();
function tick() {
	for (const person of persons) {
		const deltaTime = config.poll.interval / 1000; //Time is in meter pr second.
		// Move the person
		const deltaPosition = calc.directionToXY(
			person.direction.bearing,
			person.direction.speed * deltaTime, //speed in m/s times poll update in seconds.
		);
		person.position[0] += deltaPosition[0];
		person.position[1] += deltaPosition[1];

		// Log the person's position on all antennas in range
		for (const antenna of antennas) {
			if (!antenna.id) continue;
			const distance = calc.getDistance(
				person.position,
				antenna.position,
			);
			if (!calc.inRange(distance)) continue;
			setTimeout(
				/* eslint-disable-next-line @typescript-eslint/no-misused-promises */
				async (antenna: { id: number }) => {
					reportLog(
						await hashContent(person.imsi),
						antenna.id,
						randomize(
							calc.distanceToSignalStrength(distance),
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
 * Log the current values to the DB server via gRPC.
 */
function reportLog(
	imsiHash: string,
	antennaId: number,
	signalStrength: number,
): void {
	client.logMeasurementRoute(
		{
			identifier: imsiHash,
			timestamp: Date.now(),
			aid: antennaId,
			signalStrength,
		},
		(error) => {
			if (error) console.error("Log error:", error);
		},
	);
}
