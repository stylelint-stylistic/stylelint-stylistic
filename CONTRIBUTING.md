# Contributing

## How you can help

- Report a bug or ask for a feature through the [issue templates](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/new/choose). A minimal stylesheet and the configuration it runs under help most.
- Fix a bug, or add a rule or an option: the [developer guide](docs/developer-guide/rules.md) has the steps.
- Improve the documentation. The site is built from the Markdown files of the repository, and each rule's page from the `README.md` beside the rule.
- Chime in on any open issue or pull request.
- Spread the word.

We communicate via [issues](https://github.com/stylelint-stylistic/stylelint-stylistic/issues) and [pull requests](https://github.com/stylelint-stylistic/stylelint-stylistic/pulls).

## Pull requests

Install the dependencies with `pnpm ci`, and run `make verify` before pushing: it is what CI runs, and the `pre-push` hook runs it too.

- A pull request carries one change. A tidy-up riding along makes the review about two things at once, so it goes into a pull request of its own.
- A change a user of the plugin meets gets an entry in the `Unreleased` section of [`CHANGELOG.md`](CHANGELOG.md), saying what is now true for them.
- A commit subject is one imperative sentence with no conventional-commits prefix: `Fix the build target`, never `fix: build target`. The body, if any, says briefly why the change is needed; what changed is the diff.
