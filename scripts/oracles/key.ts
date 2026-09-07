/**
 * Names what a side of an oracle result depends on, which the store keys it by.
 *
 * Apart from `compare.ts`, which compares on import and cannot be asked by a suite. Unlike its twin in `scripts/sweeps/` it is an input of its own key, since `scripts/oracles` stands in it as a source hash.
 */

import { hashAt, hashSourcesAt } from "../harness/cache.ts"

/**
 * Names the inputs a result of one oracle over one side depends on.
 * @param oracle - The name of the script under `scripts/oracles`.
 * @param revision - The side.
 * @returns The inputs in key order: the oracle's name, the `hashSourcesAt` hashes of `lib/`, `scripts/oracles` and `scripts/harness`, and the lock file's hash. Only `lib/` is taken at the side, so both sides get the same question; `measuredTreeOf` says why the `lib/` tree is in the meta instead.
 */
function inputsOf (oracle: string, revision: string): Record<string, string> {
	return { oracle, libSources: hashSourcesAt(revision, `lib`), oracles: hashSourcesAt(`worktree`, `scripts/oracles`), harness: hashSourcesAt(`worktree`, `scripts/harness`), lock: hashAt(`worktree`, `pnpm-lock.yaml`) }
}

export { inputsOf }
