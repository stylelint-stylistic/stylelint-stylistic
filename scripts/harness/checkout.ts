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
 * @param revision - Anything `git rev-parse` reads, or `worktree` for the working tree as it stands.
 * @returns The absolute path of that `lib/`.
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
 * Names the entry file of a checkout's `lib/` under one name, in whichever of the two spellings the checkout keeps it.
 *
 * The migration to TypeScript renames every module of `lib/` from `.js` to `.ts`, and a base a branch is measured against keeps the spelling it was written with; a run asks both sides in one process, so the file has to be found rather than named. The probe goes once the base of every branch is on the far side of the migration.
 * @param lib - The path of the checkout's `lib/` directory.
 * @param name - The module, relative to `lib/` and without its extension.
 * @returns The absolute path of that module.
 */
function entryAt (lib: string, name: string): string {
	let typescript = path.join(lib, `${name}.ts`)

	return existsSync(typescript) ? typescript : path.join(lib, `${name}.js`)
}

/**
 * Names the revision a branch is measured against: where it left `origin/main`.
 * @returns The commit.
 */
function defaultBase (): string {
	return execFileSync(`git`, [`merge-base`, `HEAD`, `origin/main`], { cwd: ROOT, encoding: `utf8` }).trim()
}

/** The two sides of a comparison: the revision a branch is measured against, and the branch. */
export type Side = `base` | `head`

export { defaultBase, entryAt, libAt, ROOT }
