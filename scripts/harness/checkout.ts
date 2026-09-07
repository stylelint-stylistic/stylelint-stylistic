/** Puts another revision's `lib/` on disk under `tmp/checkouts/<tree hash>`, once per content, so a run can ask a base and a branch in one process. */

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"

/** The repository root. */
const ROOT = execFileSync(`git`, [`rev-parse`, `--show-toplevel`], { encoding: `utf8` }).trim()

/**
 * Returns a revision's `lib/` on disk.
 * @param revision - A `git rev-parse` revision, or `worktree`.
 * @returns The absolute path.
 */
function libAt (revision: string): string {
	if (revision === `worktree`) return path.join(ROOT, `lib`)

	let tree = execFileSync(`git`, [`rev-parse`, `${revision}:lib`], { cwd: ROOT, encoding: `utf8` }).trim()
	let directory = path.join(ROOT, `tmp`, `checkouts`, tree)

	if (!existsSync(path.join(directory, `lib`))) {
		mkdirSync(directory, { recursive: true })
		execFileSync(`sh`, [`-c`, `git archive ${revision} lib | tar -x -C ${directory}`], { cwd: ROOT })
	}

	return path.join(directory, `lib`)
}

/**
 * Names the base of a branch: where it left `origin/main`.
 * @returns The commit.
 */
function defaultBase (): string {
	return execFileSync(`git`, [`merge-base`, `HEAD`, `origin/main`], { cwd: ROOT, encoding: `utf8` }).trim()
}

/** The two sides of a comparison. */
export type Side = `base` | `head`

export { defaultBase, libAt, ROOT }
