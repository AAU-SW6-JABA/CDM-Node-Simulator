import { z } from "zod";

export const ZodNumber = z.number().safe();

const ZodRandomizer = z.object({
	/**
	 * By how many percent can the output value deviate from the input value?
	 */
	maxDeviance: ZodNumber.optional().default(10),

	/**
	 * Defines the normal distribution of deviations in the measurements.
	 * curveAlpha = 0.1 means the measured data is 99% accurate.
	 * curveAlpha = 4 is a good middle ground - the output is often pretty close to the real measurement.
	 * curveAlpha = 100 means the chance of a very bad measurement is approximately the same as the chance of a perfect measurement.
	 *
	 * You can play with the curve here: https://www.desmos.com/calculator/jxzs8fz9qr
	 */
	curveAlpha: ZodNumber.optional().default(0.5),
});

export type Randomizer = z.infer<typeof ZodRandomizer>;

const ZodPosition = z.tuple([
	/**
	 * The x position i metres.
	 */
	ZodNumber,

	/**
	 * The y position in metres.
	 */
	ZodNumber,
]);

export type Position = z.infer<typeof ZodPosition>;

const ZodDirection = z.object({
	/**
	 * A number 0-360 that sets which direction the movement is in.
	 */
	bearing: ZodNumber.optional().default(0),

	/**
	 * How many metres per poll interval the person should move.
	 */
	speed: ZodNumber.optional().default(0),
});

export type Direction = z.infer<typeof ZodDirection>;

const ZodPersonConfig = z.object({
	/**
	 * The IMSI number for the person's phone.
	 */
	imsi: ZodNumber.optional().default(() => Math.random() * 1000000000000000),

	/**
	 * Set settings for randomization of the signal strength.
	 */
	signalStrengthProperties: ZodRandomizer.optional().default({}),

	/**
	 * The starting position of the person.
	 */
	position: ZodPosition,

	/**
	 * Define where the person is moving to.
	 */
	direction: ZodDirection.optional().default({}),
});

export type PersonConfig = z.infer<typeof ZodPersonConfig>;

const ZodAntennaConfig = z.object({
	/**
	 * The position of the antenna.
	 */
	position: ZodPosition,
});

export type AntennaConfig = z.infer<typeof ZodAntennaConfig>;

const ZodPollConfig = z.object({
	/**
	 * The number of milliseconds between each triangulation.
	 */
	interval: ZodNumber.positive().int().optional().default(1000),

	/**
	 * Set settings for randomization of the polling interval.
	 */
	deviance: ZodRandomizer.optional().default({}),
});

export type PollConfig = z.infer<typeof ZodPollConfig>;

const ZodAntennaMeasurement = z.object({
	/**
	 * The signal strength measurement at the distance
	 */
	distance: ZodNumber.positive(),
	strength: ZodNumber.negative(),
});

export type antennaMeasurement = z.infer<typeof ZodAntennaMeasurement>;

const ZodAntennaCalibrationConfig = z.object({
	/**
	 * The signal strength measurements at the first distance
	 */
	first: ZodAntennaMeasurement,

	/**
	 * The signal strength measurements at the second distance
	 */
	second: ZodAntennaMeasurement,
});

export type AntennaCalibrationConfig = z.infer<
	typeof ZodAntennaCalibrationConfig
>;

/**
 * The full configuration of the simulator.
 */
const ZodConfig = z.object({
	/**
	 * Polling settings.
	 */
	poll: ZodPollConfig.optional().default({}),

	/**
	 * The max range i metres of the antennas.
	 * At the max range, the antenna will report -90dBm signal strength.
	 */
	maxRange: ZodNumber.positive().optional().default(1000),

	/**
	 * The antenna configuration that is used to estimate the relation between distance and signal strength
	 */
	antennaCalibration: ZodAntennaCalibrationConfig.required(),

	/**
	 * A list of antennas to simulate.
	 */
	antennas: z.array(ZodAntennaConfig),

	/**
	 * A list of persons to simulate.
	 */
	persons: z.array(ZodPersonConfig),
});

/**
 * The full configuration of the simulator.
 */
export type Config = z.infer<typeof ZodConfig>;

/**
 * Define a full config for the simulator.
 */
export const defineConfig =
	ZodConfig.parse; /* eslint-disable-line @typescript-eslint/unbound-method */

const ZodPersonGridConfig = z.object({
	/**
	 * The top right corner of the grid.
	 */
	cornerPosition: ZodPosition,

	/**
	 * The number of vertical rows of persons.
	 */
	rows: ZodNumber,

	/**
	 * The number of horizontal columns of persons.
	 */
	columns: ZodNumber,

	/**
	 * The vartical spacing in metres between each person.
	 */
	verticalSpacing: ZodNumber,

	/**
	 * The horizontal spacing in metrees between each person.
	 */
	horizontalSpacing: ZodNumber,

	/**
	 * Define where the person is moving to.
	 */
	direction: ZodDirection.optional().default({}),

	/**
	 * Set settings for randomization of the signal strength.
	 */
	signalStrengthProperties: ZodRandomizer.optional().default({}),
});

export type PersonGridConfig = z.infer<typeof ZodPersonGridConfig>;

/**
 * Creates a grid of persons.
 */
export const personGrid = (data?: unknown): PersonConfig[] => {
	const config = ZodPersonGridConfig.parse(data);
	const persons: PersonConfig[] = [];
	for (let col = 0; col < config.columns; col++) {
		for (let row = 0; row < config.rows; row++) {
			persons.push(
				ZodPersonConfig.parse({
					position: [
						config.cornerPosition[0] +
							col * config.horizontalSpacing,
						config.cornerPosition[1] + row * config.verticalSpacing,
					],
					direction: config.direction,
					signalStrengthProperties: config.signalStrengthProperties,
				}),
			);
		}
	}
	return persons;
};

const ZodAntennaGridConfig = z.object({
	/**
	 * The top right corner of the grid.
	 */
	cornerPosition: ZodPosition,

	/**
	 * The number of vertical rows of antennas.
	 */
	rows: ZodNumber,

	/**
	 * The number of horizontal columns of antennas.
	 */
	columns: ZodNumber,

	/**
	 * The vartical spacing in metres between each antenna.
	 */
	verticalSpacing: ZodNumber,

	/**
	 * The horizontal spacing in metrees between each antenna.
	 */
	horizontalSpacing: ZodNumber,
});

export type AntennaGridConfig = z.infer<typeof ZodAntennaGridConfig>;

/**
 * Creates a grid of antennas.
 */
export const antennaGrid = (data?: unknown): AntennaConfig[] => {
	const config = ZodAntennaGridConfig.parse(data);
	const antennas: AntennaConfig[] = [];
	for (let col = 0; col < config.columns; col++) {
		for (let row = 0; row < config.rows; row++) {
			antennas.push(
				ZodAntennaConfig.parse({
					position: [
						config.cornerPosition[0] +
							col * config.horizontalSpacing,
						config.cornerPosition[1] + row * config.verticalSpacing,
					],
				}),
			);
		}
	}
	return antennas;
};
