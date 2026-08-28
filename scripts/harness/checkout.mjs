/**
 * Puts the `lib/` of another revision on disk, so that a run can ask a base and a branch in one process.
 *
 * The working tree is never moved for the sake of a run. The directory is extracted once per content — it is named by the hash of the `lib` tree, which a rebase or an amend that touched no file of it leaves as it was — under `tmp/checkouts/`, which the repository ignores.
 */

import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"

/** The root of the repository, whatever directory the run was started from. */
const ROOT = execFileSync(`git`, [`rev-parse`, `--show-toplevel`], { encoding: `utf8` }).trim()

/**
 * Hands back the path of a revision's `lib/`, extracting it where it is not on disk yet.
 * @param {string} revision - Anything `git rev-parse` reads, or `worktree` for the working tree as it stands.
 * @returns {string} The absolute path of that `lib/`.
 */
function libAt (revision) {
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
 * Names the revision a branch is measured against: where it left `origin/main`.
 * @returns {string} The commit.
 */
function defaultBase () {
	return execFileSync(`git`, [`merge-base`, `HEAD`, `origin/main`], { cwd: ROOT, encoding: `utf8` }).trim()
}

export { defaultBase, libAt, ROOT }
