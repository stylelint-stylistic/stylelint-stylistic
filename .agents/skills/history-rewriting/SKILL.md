---
name: history-rewriting
description: Fold fixups into a branch without losing a message, a marker or somebody else's branch — the `amend!` file's shape, what `rebase --continue` and a zero-exit editor really do, `rebase.updateRefs`, and the pre-commit hook's blind spot. Use before `git commit --fixup`, `git rebase --autosquash`, a rebase that rewrites a commit message, or a commit the hook refuses.
---

# Rewriting a branch's history

Every one of these ends with git saying it succeeded. Read `git log --oneline` after each step rather than the command's last line.

## The `amend!` file

A fixup that also rewrites the message is `git commit --fixup=amend:<hash>`, and what stands behind its `amend!` line is the **whole** new message, subject included. A file holding the marker and the new body alone comes out of the autosquash with the body's first paragraph as the subject; the tell is `git log --oneline` printing a paragraph.

`GIT_EDITOR="cp msg.md"` replaces the whole message file, the `amend!` line git wrote there included, and the commit comes out an ordinary one the rebase leaves in place. Build the file first and hand it over whole:

```shell
{ printf 'amend! '; git log -1 --format=%s <hash>; printf '\n'; cat <bound message, subject and body>; } > tmp/msg
```

**Take the subject from the target's own bytes.** Subjects are bound by `beautypography`, and autosquash matches them byte for byte: a `fixup!` or `amend!` header typed with plain spaces matches nothing, the rebase prints `Successfully rebased`, and the fixup is still a commit of its own on its way to `main`. A plain `--fixup <hash>` needs no editor and writes the header itself.

## What a rebase does behind your back

- **`rebase --continue` commits the step and applies the next** in one call, stopping again only at the next conflict. A message rewritten by `git commit --amend` after it lands on the wrong commit or is refused. Mark the step `edit`, or resolve, `git add`, `git commit -F <new message>` and only then `--continue`.
- **Any zero-exit sequence editor approves the todo.** `GIT_SEQUENCE_EDITOR=cat` prints the plan and then runs it. To look without running, use an editor that fails, `GIT_SEQUENCE_EDITOR='cat "$1"; false'`, or read the order off `git log --oneline`. `git rebase --abort` puts a run one back.
- **`rebase.updateRefs` is set globally**, so a rebase of a scratch branch cut to try an autosquash rewrites the branch it was cut from as well, and any other branch pointing into the range. Pass `--no-update-refs` to a scratch rebase. `git reflog show <branch>` holds the tip from before it.
- **`git rev-parse --short` takes one revision.** Given two it fails with `Needed a single revision`, and inside a compound command the single line of output reads as the check having passed.

## The pre-commit hook's copy has no git

The hook writes the index into a `mktemp -d` copy outside the repository and runs `oxlint` and `vitest related` there. `scripts/harness/checkout.ts` runs `git rev-parse --show-toplevel` on import, so a commit touching it, `scripts/harness/cache.ts`, `scripts/oracles/key.ts` or `scripts/sweeps/key.ts` fails in `cache.test.ts` and both `key.test.ts` whatever it changed. Run `make verify` on the tree, commit with `--no-verify`, and say so in the report.
