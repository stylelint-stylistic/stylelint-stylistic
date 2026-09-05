#!/usr/bin/env bash

# Sets a working copy up: points Git at the hooks and hands the agent CLI the skills.
#
# Both jobs are a contributor's, and each asks whether there is anything to do rather than assuming there is — a copy unpacked from a tarball has no repository to point Git at, and a checkout of somebody who uses no such CLI has no `.claude/` to link into.
#
# This does not build `dist/`, and a dependency named by a Git reference therefore does not work. It used to build, so that a bug report could be reproduced against an unreleased fix, and that reason no longer holds: a fix here is published as a patch version within the day, and a report arrives as a demo pinned to a version rather than to a branch. What the build cost was paid by everyone who named such a reference — every package manager gates a Git dependency that carries a `prepare` script, each in its own way and none of them from the consumer's `package.json`. `make build` builds, `make release` builds before publishing, and README.md says plainly that a Git reference does not install.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if git rev-parse --git-dir > /dev/null 2>&1; then
	git config --local core.hooksPath .githooks
	printf '\t🪝 Git reads its hooks from .githooks\n'
fi

# The CLI reads skills from `.claude/skills` alone, and `.claude/` is a directory every checkout keeps to itself — so the skills are carried in `.agents/skills/`, where the repository can hold them, and reached through a link made here. The link is relative, so a worktree whose `.claude` points at the main checkout's resolves it there as well, and nothing is made where the CLI is not in use. A link already standing is left alone even where it dangles, which `-L` is for.
if [[ -e .claude && ! -e .claude/skills && ! -L .claude/skills ]]; then
	ln -s ../.agents/skills .claude/skills
	printf '\t🔗 .claude/skills reads the skills of .agents/skills\n'
fi
