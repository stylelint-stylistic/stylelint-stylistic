import { env } from "node:process"

import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		setupFiles: [`./vitest.setup.ts`],
		reporters: env.CI ? [`github-actions`, `default`] : [`dot`],
		isolate: false,
		watch: false,
		coverage: {
			reportsDirectory: `./.coverage`,
		},
	},
})
