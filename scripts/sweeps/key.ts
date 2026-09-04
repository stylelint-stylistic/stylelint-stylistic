/**
 * Names what a side of a sweep result depends on, which is what the store keys it by.
 *
 * It stands apart from `run.ts` so that it can be asked: that file runs a sweep as it is imported — it reads `argv`, imports the module it was handed and measures both sides — and a suite cannot put a question to it. Nothing here is an input of its own, and that is no gap of the kind #553 was: this module measures no row, it only names the inputs, so a change to it that moves an answer moves the set or the values of those names and thereby the key itself. Anything that measures a row belongs in `run.ts`, which the key carries.
 */

import path from "node:path"

import { hashAt, hashSourcesAt } from "../harness/cache.ts"
import { ROOT } from "../harness/checkout.ts"

/**
 * Names the inputs a result of one sweep over one side depends on.
 * @param sweepFile - The absolute path of the sweep module.
 * @param revision - The side, as `hashAt` reads it.
 * @returns The six inputs, in the order they stand in the key, which is part of it: the hashes Git keeps of the sweep module and of the runner that measures every row of it, the one it keeps of the `lib/` tree, the hashes `hashSourcesAt` takes of the sources of `scripts/oracles`, whose corpus and option list a sweep may import, and of `scripts/harness`, and the hash of the lock file. Only `lib/` is taken at the side; the scripts and the corpus are always the working tree's, so that the two sides are asked the same question.
 */
function inputsOf (sweepFile: string, revision: string): Record<string, string> {
	return { sweep: hashAt(`worktree`, path.relative(ROOT, sweepFile)), runner: hashAt(`worktree`, `scripts/sweeps/run.ts`), lib: hashAt(revision, `lib`), oracles: hashSourcesAt(`worktree`, `scripts/oracles`), harness: hashSourcesAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
}

export { inputsOf }
