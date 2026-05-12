import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		setupFiles: [`./vitest.setup.ts`],
		reporters: [`dot`],
		isolate: false,
		watch: false,
		coverage: {
			reportsDirectory: `./.coverage`,
		},
	},
})
