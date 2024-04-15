import { defineConfig } from "./lib/configMeta.ts";

export default defineConfig({
	antennaCalibration: {
		first: {
			distance: 5.0,
			strength: -22.0,
		},
		second: {
			distance: 15.0,
			strength: -38.0,
		},
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
