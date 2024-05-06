import { antennaGrid, defineConfig, personGrid } from "./lib/configMeta.ts";

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
		...antennaGrid({
			cornerPosition: [0, 0],
			rows: 2,
			columns: 2,
			verticalSpacing: 20,
			horizontalSpacing: 20,
		}),
	],
	persons: [
		...personGrid({
			cornerPosition: [2, 3],
			rows: 2,
			columns: 2,
			verticalSpacing: 5,
			horizontalSpacing: 5,
			direction: {
				bearing: 70,
				speed: 0.2,
			},
		}),
	],
});
