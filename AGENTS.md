# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

Every task goes through the [`Makefile`](Makefile), and that file is the list of tasks: read it, or run `make help`, which prints every target with its description and the flags it takes. Nothing is repeated here, so that no list can fall behind the one that is executed. The only npm script is `help`, which itself calls `make help`, and `node_modules/.bin` is put on `PATH` by the Makefile.

The one thing the file cannot say for itself is that a flag is passed as a variable rather than as an option:

```shell
make test FILE=lib/rules/color-hex-case/index.test.js        # one rule's tests
make test TEST_FLAGS="-t 'lower'"                            # filter by test name
make lint FILE=lib/rules/color-hex-case
```

CI (`.github/workflows/test.yaml`) runs `make setup` and then `make verify` — run `make verify` locally before pushing. The release workflow (`.github/workflows/release.yaml`) runs `make setup` and then `make release` on pushes to `release` and `release-*`. The `pre-commit` hook lints staged `.js`/`.ts` files and runs the `*.test.js` files in their directories.

## Architecture

A Stylelint plugin (`@stylistic/stylelint-plugin`) that restores the 76 stylistic rules Stylelint removed in v16. Pure ESM, no build step — `lib/` is published as-is (minus `*.test.js`).

- `lib/index.js` — maps every entry of the rule registry through `stylelint.createPlugin(addNamespace(name), rule)` and exports the array. `addNamespace` prefixes `@stylistic/`, so users write `"@stylistic/color-hex-case"`.
- `lib/rules/index.js` — the registry: static imports of every rule plus a default-exported object keyed by kebab-case rule name. **A new rule is not active until it is added here.**
- `lib/rules/<rule-name>/` — `index.js` (rule), `index.test.js`, `README.md` (user docs).
- `lib/utils/<utilName>/index.js` — one util per directory. Many rules are thin wrappers over shared checkers: `whitespaceChecker` (the `always`/`never`/`always-single-line`/… engine behind most `*-space-*` and `*-newline-*` rules), plus the `*CommaSpaceChecker`, `*ColonSpaceChecker`, `isStandardSyntax*`, and `has*Interpolation` families. Look for an existing util before writing new traversal logic.
- `lib/reference/selectors.js` — shared CSS reference data.

### Rule module shape

Follow `lib/rules/color-hex-case/index.js` as the canonical example. Every rule module:

- declares ``let shortName = `<kebab-name>` `` and `export let ruleName = addNamespace(shortName)`;
- exports `messages` built with `stylelint.utils.ruleMessages(ruleName, …)`;
- exports `meta` with `url: getRuleDocUrl(shortName)` (points at the rule's own `README.md` on GitHub) and `fixable: true` when autofixable;
- calls `validateOptions` first and bails on invalid options;
- reports via `report({ message, messageArgs, node, index, endIndex, result, ruleName, fix() { … } })` — autofix is the `fix` callback on `report`, not a separate `context.fix` branch;
- re-attaches `rule.ruleName`, `rule.messages`, `rule.meta` before `export default rule`.

### Tests

Vitest with `@morev/stylelint-testing-library`. `vitest.setup.ts` loads `lib/index.js` and installs `createTestRule` / `createTestRuleConfig` as globals — test files use them without importing (they are declared as oxlint globals too). A test file imports `{ messages, ruleName }` from its sibling `index.js`, then calls `testRule({ ruleName, config, accept: [], reject: [] })`; `reject` cases assert `fixed`, `message`, `line`, `column`. Non-standard syntax is covered by extra `testRule` blocks with ``customSyntax: `postcss-scss` `` / `postcss-less` / `postcss-html` / `postcss-styled-syntax`.

Rules must handle standard CSS only; non-standard syntax is filtered out through the `isStandardSyntax*` utils and tested there, not inside the rule.

**Always enable `autoStripIndent`** in new and edited tests, and write multi-line `code` / `fixed` as indented template literals instead of `\n` escapes:

```js
{
	code: `
		a {
			transform: scale(1,1);
		}
	`,
},
```

The common indentation is stripped, so line numbers in `reject` cases count from the first non-empty line. The flag is read from the case first, then from the `testRule({ … })` block, then from the `createTestRule({ … })` factory, so a single block, or a single case, can use it inside a file written in the old style — a whole file is migrated only when that is worth doing for its own sake, and the tests are re-run afterwards, since the flag changes the code of already-indented cases.

The common indentation is the shortest run of tabs and spaces in front of content, counted in characters, and that many characters are then taken off every line. Three things follow:

- indentation a case is *about* is written on top of the common one — the common tabs, and then the space being tested; a space put in front of the tabs is taken off as one of the stripped characters instead;
- the literal loses its final line break, and a blank first line with it, so a fixture cannot end in a newline;
- `code` and `fixed` are stripped apart from each other, each by its own common indentation.

Whitespace at the end of a line — what `no-eol-whitespace` is about — is written as an interpolated constant declared once per file, since an editor trims a real trailing space away on the first save. Indentation asks for nothing of the kind: a space inside a template literal is left alone by the linter, and is written as itself.

```js
// A space no editor trims from the end of a line.
const S = ` `

// …

{
	autoStripIndent: true,
	code: `
		@foo: (
			a,${S}${S}${S}
			b
		);
	`,
},
```

A case testing `\r` or `\r\n` stays on one line with `\n` escapes: a carriage return is invisible in the source, and no linter leaves it where it is put.

## Conventions

- Code style is enforced by oxlint (`.oxlintrc.json` extending `@firefoxic/oxlint-config`) and `.editorconfig`: tabs, LF, final newline. Double quotes in `import` statements and object keys, **backticks for all other string literals**, `let` over `const` for bindings, function declarations over expressions, sorted import groups.
- Every exported function carries JSDoc, and the types in it are read by editors alone: `tsconfig.json` sets `checkJs: false`, so `make check` (`tsc --noEmit`) never looks inside a `.js` file. Nothing catches a wrong annotation — write one as carefully as code.
- Rule names are `<thing>-<constraint>` (e.g. `color-hex-case`, `unit-case`); primary options should be explicit (`"lower"|"upper"`) rather than `always`/`never` where a noun works. Full rule-authoring conventions (options design, README format, message wording) live in `docs/developer-guide/rules.md`, adopted from Stylelint.
- Adding a rule means touching four places: the rule dir, `lib/rules/index.js`, `docs/user-guide/rules.md`, and the `Unreleased` section of `CHANGELOG.md`.

## Comments

Nothing in a comment is ever wrapped by hand, exactly as in a commit message: a paragraph is one line, however long it turns out, and a blank comment line is all that separates one paragraph from the next. No column limit applies — where the text breaks is for the reader's window to decide, not for the author. Comments keep plain spaces, never the non-breaking ones of the section below.

Three things inside a comment are not prose, and keep the lines they are written on: a list, a block of code, and a multi-line type literal such as the `@param {{ … }}` of [functionCommaSpaceFix](lib/utils/functionCommaSpaceFix/index.js).

A JSDoc block that is prose alone — one paragraph, no tags — is written on a single line: `/** The code Stylelint exits with when its configuration is invalid. */`. One tag, and the block opens up, every tag on a line of its own.

The dash before a tag's description separates that description from a name, so it is written only where there is a name to separate it from: `@param` and `@property` take it, `@returns` and `@throws` do not. `@description` is never written at all — a description is what a JSDoc block opens with, and it needs no tag.

A description that spells out the name again says nothing. `@property {MessageFunction} [expectedBefore] - Message for expected before whitespace.` costs a line and a reading, and gives back neither what the message says nor when it is used.

All of this holds in `*.test.js` as well, but a comment inside a fixture is not a comment: `/* … */` and `//` inside a `code` or `fixed` template literal are the CSS under test, and stay character for character as they are.

## Changelog

[CHANGELOG.md](CHANGELOG.md) is not a record of the work — it drives the release. `@firefoxic/release-it` reads the `## [Unreleased]` section and derives the bump from the first heading it finds there, in this order: `### Changed` ⇒ major, `### Added` ⇒ minor, `### Fixed` ⇒ patch. So a fix filed under `Changed` ships a major version. An empty `Unreleased` section aborts the release. Releases happen by merging `main` → `release`; a `release-<suffix>` branch publishes a prerelease under that suffix instead.

Entries are written from the user's point of view, as “something **now** behaves like this”, not as a description of what was done. Never “added support for…” or “fixed a bug in…”. Name the subject first, then what is now true of it:

```markdown
- The plugin now requires `stylelint` version `17.0.0` or higher.
- The `function-comma-newline-after` rule now has an additional `ignoreFunctions` option (see [#78](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/78)).
- The `selector-pseudo-class-parentheses-space-inside` rule no longer triggers false positives in multiline pseudo-classes.
```

An optional sentence after that says what it means for the user — for a breaking change, what they will most likely have to fix; for a feature, what they can do with it now; for a fix, what they can now do without fear or which workaround they can drop. Where possible, end the entry with a link to the issue or PR in parentheses, plus the author's profile for outside contributions. Follow the surrounding entries: most of this file carries no links, and multi-part entries use a nested list rather than a long sentence.

Purely internal changes — build tooling, test layout, CI — get no entry at all, since any entry forces a release.

## Prose typography

Prose binds function words to their neighbours with a non-breaking space (`U+00A0`), so that none of them is left dangling at the end of a line — the point of the whole convention is comfortable reading. This holds for every Markdown file in the repository, [README.md](README.md) and [CHANGELOG.md](CHANGELOG.md) alike, and for commit messages as well. It does **not** hold inside the code: JSDoc and ordinary comments keep plain spaces, because linters object to irregular whitespace characters.

Bind to the word that *follows*:

- every article, preposition, conjunction and particle, however long it is — `an`, `into`, `under`, `through`, `because`, `whereas` are as much part of the rule as `a`, `of` or `and`;
- `not`, always, since cut off from what it negates it says nothing;
- every number, in digits or spelled out, to what it counts or measures: 22 kilo, 12 icons. A number that trails its word instead binds backwards, as a date does: April 2, 2012.

Bind to the word *before*: an em dash, so that it never starts a line. The name of a work stays in one piece the same way, whatever it is made of — Keep a Changelog, Semantic Versioning.

Verbs stay free, however short they are: `is`, `can`, `do` and `does` are bound to nothing. An auxiliary may therefore end a line while its `not` leaves for the next one together with the verb being negated — earlier revisions bound `do` and `does` to a following `not`, which is the same pair tied the wrong way round.

One case is still unsettled: `no`. It is left free everywhere for now, since it can stand with nothing to attach to. The one exception is `no longer`: a single adverb spelled in two words, it never splits. More generally, a particle sometimes belongs to the preceding word rather than the following one — when that is clearly the case, follow the meaning.

`make prose` applies all of this to every Markdown file in the repository, `LICENSE.md` aside, since a license is quoted verbatim, and `tmp/`, which holds work that is not part of the repository. `make verify` runs the same pass as `make prose-check`, which writes nothing and fails on the first file left unbound. The script ([scripts/bind-prose.js](scripts/bind-prose.js)) is a helper, not an oracle: it cannot tell a conjunction from a pronoun, so both the pairs it must leave alone and the names it keeps whole are lists inside it. Read the diff it produces, and when meaning disagrees with the script, the meaning wins — teach it the exception, or the next run undoes yours.

## Commit messages

The subject line is one imperative sentence, capitalized, with no trailing period and **no conventional-commits prefix** — write `Fix the build target`, never `fix:`, `chore(build):` or the like. Wrap code identifiers in backticks (`` Migrate from `node:test` to `vitest` ``). Explain the why in the body when the subject cannot carry it.

Nothing in the body is ever wrapped by hand. A paragraph is a single line, as long as the paragraph itself, and a blank line is all that separates one paragraph from the next — exactly as in a Markdown file. No column limit applies, neither 72 nor 80 nor 100: where the text breaks is for the reader's window to decide, not for the author. Everything else follows the rules for Markdown files, including the rules from the “Prose typography” section above.

The message ends with its last paragraph. It carries no trailers whatsoever — no `Co-Authored-By`, no `Signed-off-by`, no note about the tool the commit was written with.
