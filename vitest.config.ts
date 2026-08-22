import { env } from "node:process"

import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		setupFiles: [`./vitest.setup.ts`],
		reporters: env.CI ? [`github-actions`, `default`] : [`dot`],
		// `tmp/` holds work that belongs to a session rather than to the repository, and a checkout of another revision parked there brings a whole second suite with it — one that the setup file would test against this revision's plugin. The defaults are kept so that a later version of Vitest can add to them.
		exclude: [...configDefaults.exclude, `tmp/**`],
		isolate: false,
		watch: false,
		coverage: {
			reportsDirectory: `./.coverage`,
		},
	},
})
