import { defineConfig } from "./lib/configMeta.js";

export default defineConfig({
	antennas: [
		{
			id: 1,
			position: [10, 10],
		},
		{
			id: 2,
			position: [0, -10],
		},
		{
			id: 3,
			position: [20, 20],
		},
		{
			id: 4,
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
