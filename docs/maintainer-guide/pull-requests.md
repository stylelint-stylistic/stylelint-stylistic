# Managing pull requests

You should:

- use [GitHub reviews](https://help.github.com/articles/about-pull-request-reviews/)
- review against the [Developer guide criteria](../developer-guide/rules.md)
- resolve conflicts by [rebasing](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)
- assign _zero or more_ [`pr: *`](https://github.com/stylelint-stylistic/stylelint-stylistic/labels) labels

You should not use any:

- other labels
- milestones

## Merging

When merging a PR, you should:

1. Use your judgment for the number of approvals needed:
	- one approval is usually fine for simple fixes,
	- two approvals are often useful for bigger changes.

2. If the change is significant to users, add a description of the change to the changelog:
	- in the Unreleased section, select (or add if not already there) one of three possible sub-sections:
		- **Changed** — for a breaking change that requires users to do something when updating;
		- **Added** — for a new feature (rule, option, etc.) that does not require users to do anything when updating;
		- **Fixed** — to fix a bug in an existing feature.
	- If possible, add to the change description an explanation of what the user must (in case of breaking changes) or can do now.

		For example:

		```markdown
		### Changed

		- The `named-grid-areas-alignment` rule now applies to the `grid-template` and `grid` properties as well. If you used this rule for the `grid-template-areas` property, you may have new linting errors — you must fix your code (e.g. by running linting with the `--fix` flag).
		```

3. ["Squash and merge"](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-request-merges#squash-and-merge-your-pull-request-commits) commits ensuring the resulting commit message matches the pull request title with its number appended, e.g. “Fix `indentation` rule for `postcss-styled-syntax` custom syntax (#41)”.
