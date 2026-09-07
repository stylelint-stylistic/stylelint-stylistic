/**
 * The inputs a side of a sweep result depends on; the store keys it by them.
 *
 * Kept apart from `run.ts`, which runs a sweep on import. Not an input of its own (unlike the [#553](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/553) gap): it measures no row, so a change here moves the key.
 */

import path from "node:path"

import { hashAt, hashSourcesAt } from "../harness/cache.ts"
import { ROOT } from "../harness/checkout.ts"

/**
 * The inputs a result of one sweep over one side depends on.
 * @param sweepFile - The absolute path of the sweep module.
 * @param revision - The side, as `treeOf` reads it.
 * @returns The sweep module, the runner, `lib/` sources, `scripts/oracles`, `scripts/harness` and the lock file. Only `lib/` is taken at the side; its tree is in the meta (`measuredTreeOf`).
 */
function inputsOf (sweepFile: string, revision: string): Record<string, string> {
	return { sweep: hashAt(`worktree`, path.relative(ROOT, sweepFile)), runner: hashAt(`worktree`, `scripts/sweeps/run.ts`), libSources: hashSourcesAt(revision, `lib`), oracles: hashSourcesAt(`worktree`, `scripts/oracles`), harness: hashSourcesAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
}

export { inputsOf }
