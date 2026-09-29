# Managing pull requests

You should:

- use [GitHub reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)
- review against the [Developer guide criteria](../developer-guide/rules.md)
- resolve conflicts by [rebasing](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)

A pull request carries no labels or milestones: those belong to the issue it closes.

## Merging

When merging a PR, you should:

1. Use your judgment for the number of approvals needed:
	- one approval is usually fine for simple fixes,
	- two approvals are often useful for bigger changes.

2. If the change is significant to users, add a description of the change to the changelog:
	- in the Unreleased section, select (or add if not already there) one of three possible sub-sections:
		- **Changed** — for a breaking change that requires users to do something when updating, and for a fixed false negative, which users meet as new warnings;
		- **Added** — for a new feature (rule, option, etc.) that does not require users to do anything when updating;
		- **Fixed** — to fix a bug in an existing feature.
	- If possible, add to the change description an explanation of what the user must (in case of breaking changes) or can do now.

		For example:

		```markdown
		### Changed

		- The `named-grid-areas-alignment` rule now applies to the `grid-template` and `grid` properties as well. If you used this rule for the `grid-template-areas` property, you may have new linting errors — you must fix your code (e.g. by running linting with the `--fix` flag).
		```

3. ["Squash and merge"](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#squash-and-merge-your-commits) the commits. GitHub appends the pull request's number to the subject itself; check that the subject is one imperative sentence, e.g. “Write the newline `value-list-comma-newline-before` asks for (#742)”. GitHub also fills the body with the pull request's description, which is written for the discussion: replace it with a short account of why the change is needed.
