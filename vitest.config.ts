import { env } from "node:process"

import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		setupFiles: [`./vitest.setup.ts`],
		reporters: env.CI ? [`github-actions`, `default`] : [`dot`],
		// Three directories hold work that belongs to a session rather than to the repository, and a checkout of another revision parked in one of them brings a whole second suite with it — one that the setup file would test against this revision's plugin. `tmp/` is where a session puts its own scratch work; `.claude/` is one directory reached by every worktree through a symlink, so an agent worktree under `.claude/worktrees/` stands in every checkout at once; `.agents/` holds the guidance `.claude/skills` points at. Vitest walks into all three, dot in the name or not. The defaults are kept so that a later version of Vitest can add to them.
		exclude: [...configDefaults.exclude, `tmp/**`, `.claude/**`, `.agents/**`],
		isolate: false,
		watch: false,
		coverage: {
			reportsDirectory: `./.coverage`,
		},
	},
})
