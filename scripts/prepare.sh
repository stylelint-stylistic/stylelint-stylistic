#!/usr/bin/env bash

# Sets a working copy up: points Git at the hooks.
#
# This is a contributor's job, and it asks whether there is anything to do rather than assuming there is — a copy unpacked from a tarball has no repository to point Git at.
#
# This does not build `dist/`, and a dependency named by a Git reference therefore does not work. It used to build, so that a bug report could be reproduced against an unreleased fix, and that reason no longer holds: a fix here is published as a patch version within the day, and a report arrives as a demo pinned to a version rather than to a branch. What the build cost was paid by everyone who named such a reference — every package manager gates a Git dependency that carries a `prepare` script, each in its own way and none of them from the consumer's `package.json`. `make build` builds, `make release` builds before publishing, and README.md says plainly that a Git reference does not install.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if git rev-parse --git-dir > /dev/null 2>&1; then
	git config --local core.hooksPath .githooks
	printf '\t🪝 Git reads its hooks from .githooks\n'
fi
