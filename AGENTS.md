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

CI (`.github/workflows/test.yaml`) runs `make setup` and then `make verify` — run `make verify` locally before pushing. The release workflow (`.github/workflows/release.yaml`) runs `make setup` and then `make release` on pushes to `release` and `release-*`. The `pre-commit` hook lints the staged `.js`/`.ts` files and runs, in one pass of `vitest related`, whatever test imports one of them — so a util is answered for by the rules that use it rather than by the directory it sits in.

## Architecture

A Stylelint plugin (`@stylistic/stylelint-plugin`) that restores the 76 stylistic rules Stylelint removed in v16. Pure ESM, no build step — `lib/` is published as-is (minus `*.test.js`).

- `lib/index.js` — maps every entry of the rule registry through `stylelint.createPlugin(addNamespace(name), rule)` and exports the array. `addNamespace` prefixes `@stylistic/`, so users write `"@stylistic/color-hex-case"`.
- `lib/rules/index.js` — the registry: static imports of every rule plus a default-exported object keyed by kebab-case rule name. **A new rule is not active until it is added here.**
- `lib/rules/<rule-name>/` — `index.js` (rule), `index.test.js`, `README.md` (user docs).
- `lib/utils/<utilName>/index.js` — one util per directory. Many rules are thin wrappers over shared checkers: `whitespaceChecker` (the `always`/`never`/`always-single-line`/… engine behind most `*-space-*` and `*-newline-*` rules), plus the `*CommaSpaceChecker`, `*ColonSpaceChecker`, `isStandardSyntax*`, and `has*Interpolation` families. Look for an existing util before writing new traversal logic. A util puts its helpers above what it exports, since `import/exports-last` asks for the exports at the foot of the file; a rule is the one exception, and its config entry says why.
- `lib/regexps.js` — every regular expression the plugin reads a stylesheet with, each one a named constant under a line saying what it matches. Nothing else in `lib/` spells a pattern inline, so a pattern wanted in a second place is already there under a name, and whatever had to be worked out about it is written once.
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

Every case carries a `description`, written as a noun phrase that continues the sentence the block already started: `accept` reads “accepts …”, `reject` reads “rejects …”. So it opens in lower case, ends without a period, and names what the fixture *is* rather than what the rule does with it — “a space in front of the comma of a single-line list”, not “rejects a space” or “CRLF”. Where a case exists for a reason the code cannot show, a clause says why: “a comma inside an attribute value, which is no comma of the list”. A case that repeats the one above it with a line break of another kind says so — “the same list written with a carriage-return line break” — rather than spelling the whole thing out again. The field is written with backticks, so a description can hold none; name identifiers in plain words instead.

A case writes its fields in one order, whatever it holds of them: `only`, `skip`, `autoStripIndent`, `description`, `code`, `fixed`, `line`, `column`, `endLine`, `endColumn`, `message`, `messages`, `warnings` — what runs the case, then what the case is, then what it holds, then where the warning falls and what it says. The objects of a `warnings` array are written the same way. A comment introducing a case — the issue it came from, most often — stands at the top, over the first field, and nothing separates one field from the next.

Indentation is stripped from every fixture: `autoStripIndent` is set once, in [vitest.setup.ts](vitest.setup.ts), and no test file turns it on. So multi-line `code` and `fixed` are written as indented template literals rather than with `\n` escapes:

```js
{
	code: `
		a {
			transform: scale(1,1);
		}
	`,
},
```

What the stripping does, in the order it does it:

- the line break that opens the literal goes, and every space and tab in front of the first line's content with it, so indentation a case is *about* can never stand on the first line;
- the last line break goes too, along with the whitespace behind it, so a fixture cannot end in a newline;
- of what is left, the shortest run of tabs and spaces in front of content is measured, and that many characters come off the front of every line — so a fixture's own indentation is written on top of the common tabs, and a space put in front of the tabs is taken off as one of the stripped characters instead;
- `code` and `fixed` are stripped apart from each other, each by its own common indentation.

Line numbers in `reject` cases therefore count from the first line of the fixture, not from the line its literal opens on.

A case whose subject is the whitespace at the edges of the source — a blank first line, a newline at the end, the indentation of the whole fixture — cannot be written under stripping at all, and turns it off with `autoStripIndent: false`. That is the only reason to write the flag, and it goes at the narrowest scope covering the cases that need it: the case itself, the `testRule({ … })` block, or the `createTestRule({ … })` factory where a rule is about nothing else, as `linebreaks`, `max-empty-lines` and `no-missing-end-of-source-newline` are.

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

- Code style is enforced by oxlint (`.oxlintrc.json` extending `@firefoxic/oxlint-config`) and `.editorconfig`: tabs, LF, final newline. Double quotes in `import` statements and object keys, **backticks for all other string literals**, function declarations over expressions, sorted import groups. Everything the shared config says holds; what [.oxlintrc.json](.oxlintrc.json) adds is what this plugin has a reason of its own for, and every entry there carries that reason. A ceiling written into `overrides` names the files that have yet to come under the bar, so the list is the debt, and it shrinks rather than settles.
- `let` binds; `const` names a constant. A constant is a fixed value the module names once, written in `SCREAM_CASE` at the top level, and the two spellings imply each other: nothing in `SCREAM_CASE` is `let`, and nothing spelled otherwise is `const`. A binding that merely happens never to be reassigned is no constant — the `WeakMap` cache of [readsInlineComments](lib/utils/readsInlineComments/index.js), the plugin array [lib/index.js](lib/index.js) hangs a getter on, and the `testRule` a test file binds all stay `let`. So do the four names a rule module opens with, `shortName`, `ruleName`, `messages` and `meta`, fixed as every one of them is: Stylelint and the testing library read three of them under those very names, so none of the four can be shouted without the block falling apart.
- A constant is a value and nothing else, so it can always stand at the top level, and that is where it is put: the `EXCLUDED_PATTERNS` of [max-line-length](lib/rules/max-line-length/index.js) are built once by the module rather than once per file. `enough-is-enough/prefer-let` of the shared config says as much, and says it in the only way a linter can: `const` stands at the top level or it is rewritten to `let` where it stands. So the placement is nothing the author weighs — the one question left is whether the value is a constant at all, and an answer of yes carries the `SCREAM_CASE` and the top level with it.
- A name in [lib/regexps.js](lib/regexps.js) says what the expression matches rather than what a caller does with it, and a name opening with `EVERY_` carries the `g` flag. Such an expression is shared, and its `lastIndex` with it, so it is read with `match`, `matchAll`, `replace`, `replaceAll` or `split`, none of which leaves that index behind — never with `test` or `exec`, which would carry the position of one call into the next.
- A name in that file also says which question it is allowed to answer, wherever it matches less than the whole of what it is named for. Sixteen of its names read fewer than the three characters that end a line — two of them without naming a break at all, the `m` flag deciding where a line begins for them, and JavaScript beginning one after a carriage return but not after a form feed — and three of the sixteen are narrow on purpose; a reader picking a name cannot tell the two apart, so each says so for itself. Adding a narrow name without that sentence is how #245 and #247 came to be written.
- Asking whether a character or a text is a line break is done through one of those names and never by hand. A comparison is not a regular expression, so a `===` against a break character, an `includes` of one, a `style-search` target and a pattern built out of a template literal all slip past the rule above — which is where #246 stood. [scripts/check-break-readings.js](scripts/check-break-readings.js), which `make verify` runs, therefore accounts for **every** line of `lib/` that spells a break rather than looking for the shapes a reading is written in: a line matching neither of its two lists is what it fails on, so no shape can slip. Forty-four readings are carried as a named debt list, the way `overrides` above carries its own, and fourteen lines that only write a break are named beside them. Writing a break is untouched by any of this — a fixer has to be free to put the character the file is spelled with.
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

`make prose` applies all of this to every Markdown file in the repository, `LICENSE.md` aside, since a license is quoted verbatim, and `tmp/` and `.claude/` aside as well, neither of which the repository carries: both hold work a session keeps for itself, and a working tree may spell that work in another language than this one, where the binder would do harm rather than nothing. `make verify` runs the same pass as `make prose-check`, which writes nothing and fails on the first file left unbound. The script ([scripts/bind-prose.js](scripts/bind-prose.js)) is a helper, not an oracle: it cannot tell a conjunction from a pronoun, so both the pairs it must leave alone and the names it keeps whole are lists inside it. Read the diff it produces, and when meaning disagrees with the script, the meaning wins — teach it the exception, or the next run undoes yours.

## Commit messages

The subject line is one imperative sentence, capitalized, with no trailing period and **no conventional-commits prefix** — write `Fix the build target`, never `fix:`, `chore(build):` or the like. Wrap code identifiers in backticks (`` Migrate from `node:test` to `vitest` ``). Explain the why in the body when the subject cannot carry it.

Nothing in the body is ever wrapped by hand. A paragraph is a single line, as long as the paragraph itself, and a blank line is all that separates one paragraph from the next — exactly as in a Markdown file. No column limit applies, neither 72 nor 80 nor 100: where the text breaks is for the reader's window to decide, not for the author. Everything else follows the rules for Markdown files, including the rules from the “Prose typography” section above.

The message ends with its last paragraph. It carries no trailers whatsoever — no `Co-Authored-By`, no `Signed-off-by`, no note about the tool the commit was written with.
