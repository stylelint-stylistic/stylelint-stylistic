#!/usr/bin/env node

/**
 * Sets a working copy up: points Git at the hooks and hands the agent CLI the skills.
 *
 * Both jobs are a contributor's, and each asks whether there is anything to do rather than assuming there is — a copy unpacked from a tarball has no repository to point Git at, and a checkout of somebody who uses no such CLI has no `.claude/` to link into.
 *
 * **This does not build `dist/`, and a dependency named by a Git reference therefore does not work.** It used to build, so that a bug report could be reproduced against an unreleased fix, and that reason no longer holds: a fix here is published as a patch version within the day, and a report arrives as a demo pinned to a version rather than to a branch. What the build cost was paid by everyone else — every package manager now gates a Git dependency that carries a `prepare` script, each in its own way and none of them from the consumer's `package.json`. `make build` builds, `make release` builds before publishing, and [README.md](../README.md) says plainly that a Git reference does not install.
 */

import { execFileSync } from "node:child_process"
import { lstatSync, symlinkSync } from "node:fs"
import path from "node:path"
import { stdout } from "node:process"

const ROOT = path.resolve(import.meta.dirname, `..`)

/**
 * Answers whether the working copy stands in a Git repository, which a copy unpacked from a tarball does not — and whether Git is there to ask at all.
 * @returns True where `git` answers for this directory, false otherwise.
 */
function hasRepository (): boolean {
	try {
		execFileSync(`git`, [`rev-parse`, `--git-dir`], { cwd: ROOT, stdio: `ignore` })

		return true
	}
	catch {
		return false
	}
}

if (hasRepository()) {
	execFileSync(`git`, [`config`, `--local`, `core.hooksPath`, `.githooks`], { cwd: ROOT })
	stdout.write(`\t🪝 Git reads its hooks from .githooks\n`)
}

// The CLI reads skills from `.claude/skills` alone, and `.claude/` is a directory every checkout keeps to itself — so the skills are carried in `.agents/skills/`, where the repository can hold them, and reached through a link made here. The link is relative, so a worktree whose `.claude` points at the main checkout's resolves it there as well, and nothing is made where the CLI is not in use.
let claude = lstatSync(path.join(ROOT, `.claude`), { throwIfNoEntry: false })
let skills = lstatSync(path.join(ROOT, `.claude`, `skills`), { throwIfNoEntry: false })

if (claude && !skills) {
	symlinkSync(path.join(`..`, `.agents`, `skills`), path.join(ROOT, `.claude`, `skills`))
	stdout.write(`\t🔗 .claude/skills reads the skills of .agents/skills\n`)
}
