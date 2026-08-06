# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

All tasks go through the `Makefile` (there are no npm scripts besides `help` and `prepare`; `node_modules/.bin` is put on `PATH` by the Makefile):

```shell
make help                                     # list targets
make setup                                    # install pnpm/deps, point core.hooksPath at .githooks
make check                                    # tsc --noEmit (JSDoc-based type check)
make lint                                     # oxlint (NOT eslint) — accepts FLAGS= and FILE=
make test                                     # vitest, single run — accepts FLAGS= and FILE=
make release                                  # lint + check + test, then @firefoxic/release-it
```

Targeted runs:

```shell
make test FILE=lib/rules/color-hex-case/index.test.js   # one rule's tests
make test FLAGS="-t 'lower'"                            # filter by test name
make test FLAGS=--watch                                 # watch (config sets watch: false)
make test FLAGS=--coverage                              # coverage → ./.coverage
make lint FILE=lib/rules/color-hex-case
```

CI (`.github/workflows/test.yaml`) runs `make setup`, `make check`, `make lint`, `make test` — match that order locally before pushing. The `pre-commit` hook lints staged `.js`/`.ts` files and runs the `*.test.js` files in their directories.

## Architecture

A Stylelint plugin (`@stylistic/stylelint-plugin`) that restores the 76 stylistic rules Stylelint removed in v16. Pure ESM, no build step — `lib/` is published as-is (minus `*.test.js`).

- `lib/index.js` — maps every entry of the rule registry through `stylelint.createPlugin(addNamespace(name), rule)` and exports the array. `addNamespace` prefixes `@stylistic/`, so users write `"@stylistic/color-hex-case"`.
- `lib/rules/index.js` — the registry: static imports of every rule plus a default-exported object keyed by kebab-case rule name. **A new rule is not active until it is added here.**
- `lib/rules/<rule-name>/` — `index.js` (rule), `index.test.js`, `README.md` (user docs).
- `lib/utils/<utilName>/index.js` — one util per directory. Many rules are thin wrappers over shared checkers: `whitespaceChecker` (the `always`/`never`/`always-single-line`/… engine behind most `*-space-*` and `*-newline-*` rules), plus the `*CommaSpaceChecker`, `*ColonSpaceChecker`, `isStandardSyntax*`, and `has*Interpolation` families. Look for an existing util before writing new traversal logic.
- `lib/reference/selectors.js` — shared CSS reference data.

### Rule module shape

Follow `lib/rules/color-hex-case/index.js` as the canonical example. Every rule module:

- declares ``let shortName = `<kebab-name>` `` and `export let ruleName = addNamespace(shortName)`;
- exports `messages` built with `stylelint.utils.ruleMessages(ruleName, …)`;
- exports `meta` with `url: getRuleDocUrl(shortName)` (points at the rule's own `README.md` on GitHub) and `fixable: true` when autofixable;
- calls `validateOptions` first and bails on invalid options;
- reports via `report({ message, messageArgs, node, index, endIndex, result, ruleName, fix() { … } })` — autofix is the `fix` callback on `report`, not a separate `context.fix` branch;
- re-attaches `rule.ruleName`, `rule.messages`, `rule.meta` before `export default rule`.

### Tests

Vitest with `@morev/stylelint-testing-library`. `vitest.setup.ts` loads `lib/index.js` and installs `createTestRule` / `createTestRuleConfig` as globals — test files use them without importing (they are declared as oxlint globals too). A test file imports `{ messages, ruleName }` from its sibling `index.js`, then calls `testRule({ ruleName, config, accept: [], reject: [] })`; `reject` cases assert `fixed`, `message`, `line`, `column`. Non-standard syntax is covered by extra `testRule` blocks with ``customSyntax: `postcss-scss` `` / `postcss-less` / `postcss-html` / `postcss-styled-syntax`.

Rules must handle standard CSS only; non-standard syntax is filtered out through the `isStandardSyntax*` utils and tested there, not inside the rule.

## Conventions

- Code style is enforced by oxlint (`.oxlintrc.json` extending `@firefoxic/oxlint-config`) and `.editorconfig`: tabs, LF, final newline. Double quotes in `import` statements and object keys, **backticks for all other string literals**, `let` over `const` for bindings, function declarations over expressions, sorted import groups.
- JSDoc on exported functions and rule bodies is load-bearing — `make check` type-checks JS via `tsconfig.json` (`allowJs`, `checkJs: false`, `strict`).
- Rule names are `<thing>-<constraint>` (e.g. `color-hex-case`, `unit-case`); primary options should be explicit (`"lower"|"upper"`) rather than `always`/`never` where a noun works. Full rule-authoring conventions (options design, README format, message wording) live in `docs/developer-guide/rules.md`, adopted from Stylelint.
- Adding a rule means touching four places: the rule dir, `lib/rules/index.js`, `docs/user-guide/rules.md`, and the `Unreleased` section of `CHANGELOG.md`.
- `CHANGELOG.md` drives the release: `Unreleased → Changed` ⇒ major, `Added` ⇒ minor, only `Fixed` ⇒ patch (see `docs/maintainer-guide/releases.md`). Releases happen by merging `main` → `release`.
