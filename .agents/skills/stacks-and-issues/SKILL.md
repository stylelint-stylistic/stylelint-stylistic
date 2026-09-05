---
name: stacks-and-issues
description: The GitHub mechanics of this repository — building and re-rooting a `gh stack`, why CI runs on the bottom PR alone, which hash is stable after a merge, and how an umbrella issue closes. Use when creating or reshaping a stack of pull requests, quoting a merge commit, or closing an issue that stands for several others.
---

# Stacks, merges and umbrella issues

## `gh stack` in this repository

Stacked PRs are enabled on `stylelint-stylistic/stylelint-stylistic` and the `github/gh-stack` extension is installed. `git config remote.pushDefault origin` is set locally and kept as insurance: `checkout`, `modify` and `trunk` have no `--remote` flag, so a second remote appearing would break them outright. All worktrees share one `.git`, so a remote change reaches every checkout.

- **Adopting branches that already exist**, one of them with an open PR: `gh stack init --base main <branches…>` leaves their PRs alone — base, body and ready-for-review state kept — and `gh stack submit --auto --open --remote origin` creates the missing ones, chains their bases and groups them on GitHub.
- **`submit` writes the PR body from the commit message** and offers no flag to set it, so bodies are rewritten afterwards with `gh pr edit <n> --body-file`, keeping the `<sub>Stack created with …</sub>` footer.
- **CI does not run on a stacked PR.** `.github/workflows/test.yaml` filters `pull_request` by `branches: ["*"]`, which matches the **base** and does not match a name holding a slash, so only the bottom PR is ever tested, and only once its base is `main`. Retargeting alone starts no run (`edited` is not among the default types); a push does. Do **not** amend a mid-stack branch to force one — it changes the SHA every branch above descends from. Run `make verify` on each branch instead, which is what CI runs anyway.
- **Merging a whole stack:** `gh stack merge <stack> --yes --rebase` merges every PR bottom to top in one atomic operation, then `gh stack sync --remote origin --prune` deletes the local branches (it tells merged PRs by their state, not by ancestry). Where local `main` is checked out in another worktree it cannot fast-forward it or switch off the top branch: do those by hand.
- **Re-rooting a stack whose bottom PR has been merged.** The API refuses to retarget a PR that is part of a stack (HTTP 422), and `gh stack sync --prune` aborts on the diverged shape. What works, in this order: rebase by hand with `git rebase --onto`, force-push, `gh stack unstack` (which removes the grouping and keeps every PR — `--local` alone is not enough), retarget the bottom with `gh api -X PATCH .../pulls/<n> -f base=main`, then `init` and `submit` again.
- **Deleting a branch closes the PR based on it**, and `gh pr reopen` refuses once the base branch is gone. Retarget every PR standing on a branch **before** deleting it; the way back is `git push origin origin/main:refs/heads/<branch>`, reopen, retarget, delete again.

## Which hash is stable

Pull requests are merged by rebasing `main` **onto the PR branch** and pushing `main`, so the PR's own commits keep their hashes and everything `main` gained since the branch point is re-hashed. `git merge-base --is-ancestor <pr-head> origin/main` therefore answers "no" for most heads merged since 2026-08-22, and `git for-each-ref --contains` finds no ref: the objects are the real merged commits, and the copies on today's `main` are rewrites of other branches' work.

A stack merged upwards gets its upper branches rebased once more, so `mergeCommit` names the pre-rebase head and is absent from `main` altogether — eight of them on 2026-09-02, every one matching its `main` copy by `git patch-id`.

**Cite the PR head** (`gh pr view N --json mergeCommit`), never a hash read off `git log origin/main`, which is stale after the next merge. When a hash has to be checked, check the object exists (`git cat-file -t`) and matches by patch-id or by title — never by ancestry of `origin/main`. Never "correct" a recorded hash to a `main` one.

## Umbrella issues

GitHub cascades neither way: closing every sub-issue leaves the parent open, and closing the parent leaves every sub-issue open. `sub_issues_summary` only counts. **An umbrella always closes by hand** — that is the normal path, not a workaround, and a branch delivering part of one references it and says what it does not finish, never closes it.

Three shapes:

- **A split umbrella** — one report that turned out to be N bugs. Its content is exhausted once the N are closed. Close it as `COMPLETED` with a comment that **is** the census: a row per half with its commit, plus what the original report got wrong. That comment is the only place such a correction lives.
- **A class umbrella** — a census of a class plus a list of countermeasures. Its members closing does **not** close it: it closes when the countermeasures land and the debt list reaches zero. Comments in the code point at that census by number, so closing it early aims them at a closed issue.
- **A census issue** is not an umbrella at all: one issue that *replaces* several, which are closed into it as `duplicate`. Write it where the answer is the same at every level.

The test between the first two: does the umbrella hold anything that is in none of its children?

**Adding a member is two writes, not one:** attach the issue as a sub-issue (GraphQL `addSubIssue` with the two issue node ids — `gh` has no subcommand for it) **and** name it in a census comment. The sub-issue list is the count the umbrella shows and what its reader trusts; a comment alone leaves it behind, and one umbrella held eleven while its census named thirteen.

**The cost of a census is real.** Merging N issues into one merges their file-collision nodes too, so while it is open every issue touching those files is blocked. Worth it when the alternative is three branches arguing over whose answer is canonical; not worth it for issues that merely share a theme.
