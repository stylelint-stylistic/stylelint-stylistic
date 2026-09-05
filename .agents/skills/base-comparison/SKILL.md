---
name: base-comparison
description: Measure a branch against the commit it stands on — extract the base instead of flipping the working tree, pick the base by hash, and prove a new test case red on it. Use before any run that compares two versions of `lib/`, before handing a branch to a review subagent, and whenever a probe, a mutant or an oracle needs the code as it was.
---

# Comparing a branch against its base

Everything here exists because one move — reverting a tracked path to look at the old code — keeps eating uncommitted work: four times across three sessions by one count, and three more inside a single later session, twice in sessions that had the warning in front of them from the start.

## Never flip a tracked path

`git checkout <rev> -- lib` and `git checkout HEAD -- lib` both restore the **committed** state. Any uncommitted edit under that path is gone: not stashed, not recoverable, and `git status` comes back clean afterwards, which is exactly what a lost round looks like. The tell that it is about to happen is a command holding both `checkout HEAD~` and `checkout HEAD`.

`git stash push -- <path>` is worse. The stash stack is per repository and holds other people's work; where the named path has no uncommitted change the push stores nothing, and the `pop` behind it unpacks whoever's entry is on top over your branch. If a pop has already gone wrong, the entry survives a conflicted pop, so `git checkout HEAD -- <the unpacked paths>` restores the tree; an entry that disappears outright is still findable with `git fsck --unreachable | grep commit` and `git stash store`.

Get the base without touching the worktree, in this order of preference:

1. **The sweep's own checkout.** `make sweep` extracts the base's `lib/` under `tmp/checkouts/<tree hash of base:lib>/` and leaves it there. `loadRules(path)` of `scripts/harness/lint.ts` takes any such path, so a probe loads two registries and compares them.
2. **An archive.** `git archive <rev> lib | tar -x -C tmp/base` for a probe that needs no dependencies.
3. **A throwaway worktree** for anything needing an install — the oracles, a lint sweep:

```shell
git worktree add -f tmp/base-<n> <rev>
ln -s "$PWD/node_modules" tmp/base-<n>/node_modules
make -C tmp/base-<n> oracles OUT=tmp/base-<n>-oracles
git worktree remove --force tmp/base-<n>   # after rm-ing the symlink
```

`make -C` keeps the shell's own directory from drifting, which matters: the Bash tool keeps the working directory a previous call left it in, so a bare `cd` into an extracted tree silently redirects every later call — the edits land in the copy, and the `git status` that would have shown it reports the copy. Never leave a `cd` standing; pass absolute paths, or write `cd <worktree> && …` inside the one command. Print `pwd` beside any `git status` you intend to rely on.

## Commit first, always

Make committing the **first** step of a comparison, before writing the command that flips or extracts. Run `git status --short`; if it prints anything under the path, commit it — a fixup costs nothing and a lost round costs a rewrite from the transcript. The same holds for mutant testing: restore a mutant from a copy under `tmp/`, never from HEAD.

Two traps sit inside this one:

- **`libAt("worktree")`** in `scripts/harness/checkout.ts` resolves through `git write-tree`, which reads the **index**. An unstaged mutant is invisible to it, so the mutant "survives" every probe run through `loadRules(libAt("worktree"))`. Measure a mutant through the plugin path — `lint({ config: { plugins: [<absolute path to lib/index.ts>] } })` — or `make test`, both of which read the files.
- **When work is lost anyway**, the oracles' and sweeps' cache meta holds a `git write-tree` hash of `lib` for every side they measured (`~/.cache/stylelint-stylistic/*/…/*.meta.json`, field `lib`). `git diff --name-only HEAD:lib <hash>` names the files and `git show <hash>:<relative path> > lib/<relative path>` restores each.

## Name the base by hash

`git checkout main -- lib` takes the **local** `main`, which in this worktree setup is regularly ahead of the commit the branch sits on — once with a whole new rule directory in it, so the "before" run measured a tree nobody was comparing against. Files absent from `HEAD` are not restored away afterwards either; they stay, staged as additions.

`origin/main` is a moving target too: it gained three commits in one session, twice while an oracle run was in flight, and a base run taken against it picked up a fixture that had just landed. Capture the branch's own base once — `git rev-parse HEAD~1 > tmp/base.txt` right after the rebase — and flip to **that SHA** for every measurement.

And `HEAD` stops being the base the moment you commit. `git show HEAD:<path>` then hands back the branch's own version, the suite comes back green, and the green reads as "the tests pass" rather than "the check measured nothing".

For a **diff**, compare against `origin/main`, not local `main`: local `main` can hold an unpushed commit, and `git diff main` then reports every file that commit deleted as an addition of yours. The disagreement between `git log -1 --stat` and `git diff main --stat` is the tell.

## Prove the new cases red on the base

A case written for the issue a branch closes has to **fail on the base**. Reading a case cannot tell you what it pins — only the base can. Two of twenty-two cases on one branch passed on both sides: the fixture illustrated the bug's shape without holding the fix in place, and both looked right in review.

```shell
git archive <base-sha> | tar -x -C tmp/pin
ln -s "$PWD/node_modules" tmp/pin/node_modules
cp lib/rules/<rule>/index.test.ts tmp/pin/lib/rules/<rule>/index.test.ts
cd tmp/pin && ./node_modules/.bin/vitest run lib/rules/<rule>
```

Every case the branch added must appear in the failure list, and the count of failures must equal the count of cases added. **Read the count**: a pin check reporting zero failures has either found a worthless test or pointed at the wrong tree, and the second is far likelier.

The mirror of this is a case the branch already had that stops pinning. When a change makes two readings agree where they used to differ, instrument the guards that stood on the difference — `if (guardFired) console.error("HIT …")` in a copy of each side — run each rule's own test file over both, and diff the counts. Cases written for a guard keep passing when their `fixed` is updated to the new output; what they pin has quietly changed from "the guard holds" to "the fix goes through". Report the counts, and file the reachability as its own issue rather than adding a synthetic fixture to keep a pin green.

## Two copies of the plugin need two processes

A probe that lints with `plugins: ["./tmp/old/lib/index.js"]` and with `plugins: ["./lib/index.ts"]` inside one Node process gives false results: both copies register the same rule names, Stylelint's registry drifts, and a later case comes back with the other side's answer. Write the probe to take the plugin path as an argument, print one line per case, run it twice and diff the outputs. Tell any reviewing subagent the same.

## A review subagent needs a checkout of its own

A subagent asked to review a diff reaches for the obvious experiment — writing the `main` version of a file over the branch's — and does it in the worktree it was handed, silently. Create the base worktree before spawning it, name it in the prompt, and say plainly that no tracked file in the branch worktree may be touched.

## Bases older than the TypeScript migration are unmeasurable

`scripts/harness/lint.ts` imports `lib/rules/index.ts` by that name, so a base predating `fa024f9` (2026-08-30) throws on every run: `converge` reports `broke` everywhere and the other five oracles read 0. A diff against such a base reads as a branch that fixed everything. Compare only against bases at or after `fa024f9`; for anything older the PR bodies are the only record left.

## Numbers die on a rebase

Every count a commit body carries is a claim about a difference from a particular base. Rebase and that base is gone. Rebase **first**, then measure; if a rebase becomes necessary afterwards, re-run both sides and rewrite the body before pushing.

A rebase can also happen **to** you: the maintainer merges by rebasing `main` onto the PR branch, and mid-session a branch has been rebased onto a sibling's work with `git status` clean throughout and nothing announcing it. Before handing a branch to review or to a PR, check `git log --oneline -1` and `git reflog -5` against what you last committed, and re-measure if the parent moved.
