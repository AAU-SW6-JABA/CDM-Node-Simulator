import { defineConfig } from "./lib/configMeta.ts";

export default defineConfig({
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
