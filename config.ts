import { defineConfig } from "./lib/configMeta.ts";

export default defineConfig({
	antennaCalibration: {
		distance_0: 5.0,
		strength_0: -22.0,
		distance_1: 15.0,
		strength_1: -38.0,
	},
	antennas: [
		{
			position: [10, 10],
		},
		{
			position: [0, -10],
		},
		{
			position: [20, 20],
		},
		{
			position: [-10, 40],
		},
	],
	persons: [
		{
			direction: {
				bearing: 270,
				speed: 1, // Meters pr. Second.
			},
			position: [0, 150],
		},
	],
});
