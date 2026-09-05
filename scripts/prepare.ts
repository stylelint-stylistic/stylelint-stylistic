#!/usr/bin/env node

/**
 * Sets a working copy up: points Git at the hooks, hands the agent CLI the skills, and builds `dist/`.
 *
 * The package manager runs this after every install, and it runs in two quite different places: a clone of this repository, and a project that installed the plugin straight from Git — which is how a bug report reproduces against an unreleased fix. A tarball has neither a repository to point Git at nor a `.claude/` to link into, and each job therefore asks whether there is anything to do rather than assuming there is. Only the build is done in both, since `exports` names the built entry and nothing publishes it to a consumer who took the sources.
 */

import { execFileSync } from "node:child_process"
import { lstatSync, symlinkSync } from "node:fs"
import path from "node:path"
import { execPath, stdout } from "node:process"

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

execFileSync(execPath, [path.join(ROOT, `scripts`, `build.ts`)], { cwd: ROOT, stdio: `inherit` })
