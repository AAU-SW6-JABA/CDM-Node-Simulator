import { defineConfig } from "./lib/configMeta.ts";

export default defineConfig({
	antennaCalibration: {
		first: {
			distance: 1.0,
			strength: -20.0,
		},
		second: {
			distance: 10.0,
			strength: -70.0,
		},
	},
	antennas: [
		{
			position: [0, 0],
		},
		{
			position: [0, 10],
		},
		{
			position: [10, 0],
		},
		{
			position: [10, 10],
		},
	],
	persons: [
		{
			direction: {
				bearing: -135,
				speed: 0.75, // Meters pr. Second.
			},
			position: [-5, -5],
		},
	],
});
