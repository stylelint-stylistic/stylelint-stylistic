/**
 * Names what a side of an oracle result depends on, which is what the store keys it by.
 *
 * It stands apart from `compare.ts` so that it can be asked: that file runs the comparison as it is imported — it reads `argv`, runs every oracle over the side no entry answers for and writes the report — and a suite cannot put a question to it. Unlike its twin in `scripts/sweeps/`, this module is itself an input of the key it builds, since `scripts/oracles` stands in that key as the hash of its sources and this file is one of them; so an edit here moves the key of every oracle over every side, which is the right direction for a file deciding what a result is kept under.
 */

import { hashAt, hashSourcesAt } from "../harness/cache.ts"

/**
 * Names the inputs a result of one oracle over one side depends on.
 * @param oracle - The oracle.
 * @param revision - The side, as `hashAt` reads it.
 * @returns The five inputs, in the order they stand in the key, which is part of it: the oracle's name, the hash Git keeps of the `lib/` tree, the hashes `hashSourcesAt` takes of the sources of `scripts/oracles` and of `scripts/harness` — which pass over the tests both directories hold and the document `scripts/oracles` holds beside its sources — and the hash of the lock file. Only `lib/` is taken at the side; the scripts and the corpus are always the working tree's, so that the two sides are asked the same question.
 */
function inputsOf (oracle: string, revision: string): Record<string, string> {
	return { oracle, lib: hashAt(revision, `lib`), oracles: hashSourcesAt(`worktree`, `scripts/oracles`), harness: hashSourcesAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
}

export { inputsOf }
