import { env } from "node:process"

import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		setupFiles: [`./vitest.setup.ts`],
		reporters: env.CI ? [`github-actions`, `default`] : [`dot`],
		// Three directories hold work that belongs to a session rather than to the repository. `tmp/` is where a session puts its own scratch work. `.agents/local/` is the session's private repository — a checkout of another revision parked in it brings a whole second suite with it, one that the setup file would test against this revision's plugin. `.agents/` holds the guidance, skills and memory the repository carries. Vitest walks into all three, dot in the name or not. The defaults are kept so that a later version of Vitest can add to them.
		exclude: [...configDefaults.exclude, `tmp/**`, `.agents/**`],
		isolate: false,
		watch: false,
		coverage: {
			reportsDirectory: `./.coverage`,
		},
	},
})
