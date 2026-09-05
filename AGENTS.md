# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

Every task goes through the [`Makefile`](Makefile), which is the list of tasks: read it, or run `make help` for every target with its description and its flags. Nothing is repeated here, so no list can fall behind the one that runs. It puts `node_modules/.bin` on `PATH`. The only npm scripts are `help`, which calls `make help`, and `prepare`, which the package manager runs after an install: it points Git at [.githooks](.githooks) where there is a repository to point at, and builds `dist/`, since `exports` names the built entry and a package installed straight from Git has to build it too.

The one thing the file cannot say for itself is that a flag is passed as a variable rather than as an option:

```shell
make test FILE=lib/rules/color-hex-case/index.test.ts        # one rule's tests
make test TEST_FLAGS="-t 'lower'"                            # filter by test name
make lint FILE=lib/rules/color-hex-case
```

Two targets collect results rather than check them: `make oracles` and `make sweep FILE=…`. Both cache every result by what it depends on under `~/.cache/stylelint-stylistic/` and measure only the side no entry answers for, so a run is seconds and a rerun over an unchanged tree is nothing. Run them freely, before a branch and after it, and read the diff they write.

CI (`.github/workflows/test.yaml`) runs `pnpm ci` then `make verify`, and so does the `pre-push` hook, which refuses a push that fails it and skips the run where a green one over this very tree is remembered — so proving the branch by hand a moment earlier costs nothing at the push. `.github/workflows/release.yaml` runs `pnpm ci` then `make release` on pushes to `release` and `release-*`. The `pre-commit` hook lints the staged `.ts` files and runs, in one `vitest related` pass, whatever test imports one of them, so a util is answered for by the rules that use it rather than by the directory it sits in.

## Architecture

A Stylelint plugin (`@stylistic/stylelint-plugin`) that restores the stylistic rules Stylelint removed in v16 and adds rules of its own. How many there are is `lib/rules/index.ts`'s to say; no number is written here, since a written one falls behind. Pure ESM. `make build` (`tsc -p tsconfig.build.json`) writes `lib/` to `dist/` — every module beside its `.d.ts`, the tests left out — and `dist/` is what the package publishes and what `exports` points at; it is never committed, and `make release` builds it before publishing.

- `lib/index.ts` — builds every rule of the registry once per syntax, through `stylelint.createPlugin(addNamespace(name, syntax.namespace), createRule(syntax))`, and exports the array. `addNamespace` prefixes `@stylistic/`, so users write `"@stylistic/color-hex-case"`; a syntax registered beside the core adds its segment, `"@stylistic/scss/color-hex-case"`.
- `lib/rules/index.ts` — the registry: static imports of every rule's `createRule` plus a default-exported object keyed by kebab-case rule name. **A new rule is not active until it is added here.**
- `lib/syntaxes/index.ts` — the `Syntax` contract a rule is built over, and the list of the syntaxes registered beside the core, each under a namespace of its own; `lib/syntaxes/css/` is the core's. A syntax's directory holds everything that is its — the adapter, its tests, its README.
- `lib/preprocessor/` — the machinery only a syntax's adapter reads: the `//`-comment probe with the reader's and writer's questions over it, `isInlineComment` (the one reading of a parser's inline mark), `printedText` (the copies a node carries of its text, which the core's adapter reads and writes through too, since which copies a parser leaves on a node is the parser's doing) with the selector copy triad over them, and `guards/` for the constructs only a preprocessor spells, which the Less guards compose over, with a `regexps.ts` of its own. What a plugin spells over plain CSS — a `$` variable, the `$(…)` of postcss-simple-vars, the interpolation spellings — stays a reading of the core's, in `lib/utils/`.
- Nothing under `lib/rules/` or `lib/utils/` imports out of `lib/preprocessor/`, nor out of `lib/syntaxes/` beyond the contract and `css/`, which `lib/syntaxes/index.test.ts` enforces.
- `lib/rules/<rule-name>/` — `index.ts` (rule), `index.test.ts`, `README.md` (user docs).
- `lib/utils/<utilName>/index.ts` — one util per directory, its helpers above what it exports, a type exported where it is declared. Many rules are thin wrappers over shared checkers: `whitespaceChecker` (the `always`/`never`/`always-single-line`/… engine behind most `*-space-*` and `*-newline-*` rules), plus the `*CommaSpaceChecker`, `*ColonSpaceChecker`, `isStandardSyntax*` and `has*Interpolation` families. Look for an existing util before writing new traversal logic — and reach the syntax-aware ones (`isStandardSyntax*`, `has*Interpolation`, the inline-comment machinery, `read`/`write`) only through the `Syntax` contract, never by importing them.
- `lib/regexps.ts` — every regular expression the plugin reads a stylesheet with, each a named constant under a line saying what it matches. Nothing else in `lib/` spells a pattern inline, so a pattern wanted in a second place is already there under a name, with whatever had to be worked out about it written once. A namespace keeps the expressions only its adapter reads in a `regexps.ts` of its own — `lib/syntaxes/less/regexps.ts` is the first — and `lib/preprocessor/regexps.ts` holds the readings only the preprocessor's guards ask.
- `lib/reference/selectors.ts` — shared CSS reference data.

### Rule module shape

Follow `lib/rules/color-hex-case/index.ts` as the canonical example. Every rule module:

- declares ``let shortName = `<kebab-name>` ``;
- names its messages in a `const MESSAGES = defineMessages({ … })`, before any rule name closes them;
- exports `meta` with `url: getRuleDocUrl(shortName)` (points at the rule's own `README.md` on GitHub) and `fixable: true` when autofixable;
- writes `function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary, secondaryOptions)`. The first parameter is what the namespace the rule is registered under hands it — the name a configuration refers to the rule by, the messages closed with that name, and the syntax the rule is built over — and the rule reads all three from there rather than from the module. Every question about the stylesheet's language goes through that `syntax`: `isStandard*`, `read`/`write`, the comment family, `selectorCopies`;
- calls `validateOptions` first and bails on invalid options;
- reports via `report({ message, messageArgs, node, index, endIndex, result, ruleName, fix() { … } })` — autofix is the `fix` callback on `report`, not a separate `context.fix` branch;
- ends with `export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })`, the factory the registry takes, and `export let { ruleName, messages } = createRule(css)`, the core's instance of both for the tests beside the module to import.

`defineRule` (`lib/utils/defineRule/index.ts`) turns the definition into a factory over a `Syntax`: it names the rule under the syntax's namespace, closes the messages, and gates the check, so a root the syntax does not accept is answered by one warning per root and read by no rule.

### Tests

Vitest with `@morev/stylelint-testing-library`. [vitest.setup.ts](vitest.setup.ts) names `lib/index.ts` as the plugin, hands the library `scripts/harness/lint.ts` in place of `stylelint.lint` — the runner of the oracles, which does what the linter does for one rule and nothing of the rest, and which `make harness-check` proves agrees with it — and installs `createTestRule` and `createTestRuleConfig` as globals, so test files use them without importing (they are oxlint globals too). A case reaching for what the runner does not model — a disable comment, a secondary option about the report, a file name, a configuration under test — is answered by the linter itself, so nothing a case can say is out of reach.

A test file imports `{ messages, ruleName }` from its sibling `index.ts`, then calls `testRule({ ruleName, config, accept: [], reject: [] })`; `reject` cases assert `fixed`, `message`, `line`, `column`. Non-standard syntax is covered by extra `testRule` blocks with ``customSyntax: `postcss-scss` `` / `postcss-html`. A syntax with a namespace of its own keeps such blocks in its directory instead — `lib/syntaxes/<name>/rules/<rule>/index.test.ts`, built with the namespace's rule name out of `createRule(<name>)` — so a `postcss-less` or `postcss-styled-syntax` block has no place in `lib/rules/`.

The library lints the fixer's output once more and asserts its warnings against the fixing run's, in report mode since 1.1.1 — so a fixer that reports itself as applied while changing nothing fails there. `unfixable: true` on a case is silently ignored; declare `fixed` with the unchanged code instead.

Rules must handle standard CSS only; non-standard syntax is filtered out through the syntax the rule is built over — `syntax.isStandardAtRule` and its siblings — and the utils answering those questions for the core are tested where they live, not inside the rule.

Every case carries a `description`, written as a noun phrase that continues the sentence the block already started: `accept` reads “accepts …”, `reject` reads “rejects …”. So it opens in lower case, ends without a period, and names what the fixture *is* rather than what the rule does with it — “a space in front of the comma of a single-line list”, not “rejects a space” or “CRLF”. Where a case exists for a reason the code cannot show, a clause says why: “a comma inside an attribute value, which is no comma of the list”. A case repeating the one above it with a line break of another kind says so — “the same list written with a carriage-return line break” — rather than spelling the whole thing out again. The field is written with backticks, so a description can hold none; name identifiers in plain words instead.

A case writes its fields in one order, whatever it holds of them: `only`, `skip`, `autoStripIndent`, `description`, `code`, `fixed`, `line`, `column`, `endLine`, `endColumn`, `message`, `messages`, `warnings` — what runs the case, then what the case is, then what it holds, then where the warning falls and what it says. The objects of a `warnings` array are written the same way. A comment introducing a case — the issue it came from, most often — stands at the top, over the first field, and nothing separates one field from the next.

Indentation is stripped from every fixture, so multi-line `code` and `fixed` are written as indented template literals rather than with `\n` escapes, and line numbers in `reject` cases count from the first line of the fixture. What the stripping does in what order, how a case turns it off, and how to spell whitespace a fixture cannot carry literally — a trailing space, a carriage return, a break inside a string — is in [.agents/docs/test-fixtures.md](.agents/docs/test-fixtures.md).

## Conventions

- Code style is enforced by oxlint (`.oxlintrc.json` extending `@firefoxic/oxlint-config`) and `.editorconfig`: tabs, LF, final newline. Double quotes in `import` statements and object keys, **backticks for all other string literals**, function declarations over expressions, sorted import groups. Everything the shared config says holds; what [.oxlintrc.json](.oxlintrc.json) adds is what this plugin has a reason of its own for, and every entry there carries that reason. A ceiling written into `overrides` names the files that have yet to come under the bar, so the list is the debt, and it shrinks rather than settles.
- `let` binds; `const` names a constant: a fixed value the module names once, in `SCREAM_CASE` at the top level. The two spellings imply each other — nothing in `SCREAM_CASE` is `let`, and nothing spelled otherwise is `const` — and the placement is nothing the author weighs, since `enough-is-enough/prefer-let` of the shared config rewrites a `const` outside the top level to `let` where it stands. So the one question left is whether the value is a constant at all, and an answer of yes carries the shouting and the top level with it: the `EXCLUDED_PATTERNS` of [max-line-length](lib/rules/max-line-length/index.ts) are built once by the module rather than once per file.
- A binding that merely happens never to be reassigned is no constant — the `WeakMap` cache of [readsInlineComments](lib/preprocessor/readsInlineComments/index.ts), the plugin array [lib/index.ts](lib/index.ts) hangs a getter on, and the `testRule` a test file binds all stay `let`. So do the four names a rule module opens with, `shortName`, `ruleName`, `messages` and `meta`, fixed as every one of them is: Stylelint and the testing library read three of them under those very names, so none of the four can be shouted without the block falling apart.
- A name in [lib/regexps.ts](lib/regexps.ts) says what the expression matches rather than what a caller does with it, and a name opening with `EVERY_` carries the `g` flag. Such an expression is shared, and its `lastIndex` with it, so it is read with `match`, `matchAll`, `replace`, `replaceAll` or `split`, none of which leaves that index behind — never with `test` or `exec`, which would carry the position of one call into the next.
- **A line break is asked about through one of those names and never by hand**, since a `===`, an `includes`, a `style-search` target and a pattern built out of a template literal all slip past that rule. [scripts/check-break-readings.ts](scripts/check-break-readings.ts), which `make verify` runs, accounts for every line of `lib/` that spells a break. Which spellings count as one, why a narrow name has to say so, and how the debt list works is in [.agents/docs/line-break-readings.md](.agents/docs/line-break-readings.md).
- Every exported function carries JSDoc, and the types stand in the signatures, never in the tags: a `@param name - …` names and describes, a `@returns …` describes, and `make check` (`tsc --noEmit`) reads the signatures. The one JSDoc type left is `@throws {Error}`, which has no place in a signature. A rule's `function rule` takes its primary option and, where it has any, its secondary options as typed parameters and returns a `RuleCheck` (`lib/utils/ruleCheck/index.ts`), so that the `root` and the `result` of the check it returns are typed as Stylelint types them and need no annotation of their own. The packages that ship no declaration of their own, `postcss-less` and `style-search`, are declared in [types/](types/) with what the plugin reads of them and nothing more.
- Rule names are `<thing>-<constraint>` (e.g. `color-hex-case`, `unit-case`); primary options should be explicit (`"lower"|"upper"`) rather than `always`/`never` where a noun works. Full rule-authoring conventions (options design, README format, message wording) live in `docs/developer-guide/rules.md`, adopted from Stylelint.
- Adding a rule means touching four places: the rule dir, `lib/rules/index.ts`, `docs/user-guide/rules.md`, and the `Unreleased` section of `CHANGELOG.md`.

## Comments

Nothing in a comment is ever wrapped by hand: a paragraph is one line, however long it turns out, and a blank comment line is all that separates one paragraph from the next. No column limit applies — where the text breaks is for the reader's window to decide, not for the author. Comments keep plain spaces, never the non-breaking ones of the section below.

Three things inside a comment are not prose, and keep the lines they are written on: a list, a block of code, and a multi-line type literal such as the object type a parameter of a checker is written with in [selectorAttributeOperatorSpaceChecker](lib/utils/selectorAttributeOperatorSpaceChecker/index.ts).

A JSDoc block that is prose alone — one paragraph, no tags — is written on a single line: `/** The code Stylelint exits with when its configuration is invalid. */`. One tag, and the block opens up, every tag on a line of its own.

The dash before a tag's description separates that description from a name, so it is written only where there is a name to separate it from: `@param` and `@property` take it, `@returns` and `@throws` do not. `@description` is never written at all — a description is what a JSDoc block opens with, and it needs no tag. A description that spells out the name again says nothing: `@property {MessageFunction} [expectedBefore] - Message for expected before whitespace.` costs a line and a reading, and gives back neither what the message says nor when it is used.

All of this holds in `*.test.ts` as well, but a comment inside a fixture is not a comment: `/* … */` and `//` inside a `code` or `fixed` template literal are the CSS under test, and stay character for character as they are.

## Changelog

[CHANGELOG.md](CHANGELOG.md) is not a record of the work — it drives the release. `@firefoxic/release-it` reads the `## [Unreleased]` section and derives the bump from the first heading it finds there, in this order: `### Changed` ⇒ major, `### Added` ⇒ minor, `### Fixed` ⇒ patch. So a fix filed under `Changed` ships a major version. An empty `Unreleased` section aborts the release. Releases happen by merging `main` → `release`; a `release-<suffix>` branch publishes a prerelease under that suffix instead.

The entry is written **in the same commit as the change it describes**. A commit that changes what a user of the package sees is not finished without it, and adding it afterwards means amending and rebasing everything stacked on top, where the entries conflict at the same spot in every branch.

A fix for a **false negative** belongs under `Changed`, not `Fixed`: the user meets it as new warnings on code that used to pass, which is a change in behaviour rather than a repair they asked for. Purely internal changes — build tooling, test layout, CI — get no entry at all, since any entry forces a release.

How an entry is worded, with examples, and how the groups inside `Unreleased` are used while a backlog is being cleared: [.agents/docs/changelog-entries.md](.agents/docs/changelog-entries.md).

## Prose typography

Prose binds function words to their neighbours with a non-breaking space (`U+00A0`), so that none of them is left dangling at the end of a line — the point of the whole convention is comfortable reading. This holds for every Markdown file in the repository, [README.md](README.md) and [CHANGELOG.md](CHANGELOG.md) alike, and for commit messages as well. It does **not** hold inside the code: JSDoc and ordinary comments keep plain spaces, because linters object to irregular whitespace characters.

`make prose` binds, `make prose-check` fails on the first file left unbound, and `make verify` runs the check. Which word binds to which, what the binder leaves alone, and which files it skips: [.agents/docs/prose-typography.md](.agents/docs/prose-typography.md).

## Commit messages

The subject line is one imperative sentence, capitalized, with no trailing period and **no conventional-commits prefix** — write `Fix the build target`, never `fix:`, `chore(build):` or the like. Wrap code identifiers in backticks (`` Migrate from `node:test` to `vitest` ``). Explain the why in the body when the subject cannot carry it.

Nothing in the body is ever wrapped by hand, exactly as in a comment and in a Markdown file: a paragraph is a single line, as long as the paragraph itself, and a blank line is all that separates one paragraph from the next. No column limit applies, neither 72 nor 80 nor 100. Everything else follows the rules for Markdown files, the prose typography above included.

The message ends with its last paragraph. It carries no trailers whatsoever — no `Co-Authored-By`, no `Signed-off-by`, no note about the tool the commit was written with.

## Branches, commits and pull requests

A commit is **atomic and self-sufficient**: it passes every check on its own and carries its own changelog entry where the change is user-visible. That requirement is about what the pull request ships, not about every intermediate state of the branch, so only the **first** commit of a fix is written whole. Every correction after it is a fixup — `git commit --fixup <hash of the commit it corrects>`, so that no message has to be invented for it — and nothing is squashed while the branch is still being worked on. When the maintainer gives the go-ahead to open the pull request, `git rebase --autosquash origin/main` folds the fixups into their targets and rebases onto the current `origin/main` in one move; it needs no `-i` and opens no editor, but the flag must be passed, since `rebase.autosquash` is not set. The target of a fixup has to be a commit on the current branch, so a correction to a lower branch of a stack is committed on that branch.

**The branch carries its issue and nothing else.** A tidy-up riding along makes the review about two things at once and leaves the issue no longer describing what the branch does. Propose one only when it is provably neutral, and check that by running the old and the new code over the same input rather than by reading; if it changes any output, take it out and file an issue for it. That holds even for a change the issue's own example needs to come out right — that one got its own issue and its own commit too.

When review rounds keep finding defects and they all land in **one half** of a branch, that is the seam: stop patching and split there. The half review never touches is the issue; the half it keeps hitting is a different question wearing the issue's name. One branch went from six rounds and twelve defects, every one in the finding half, to `CLEAN` in three once it was rebuilt from `origin/main` to the reading half alone — and the abandoned wide branch was pushed rather than deleted, since its measurements are the new issue's best evidence.

A pull request body is never the commit message reused. It opens with one paragraph of cause ending in a fenced block that shows the input and what each `--fix` run produced, then one paragraph on what the fix does, then a `## What the review turned up` section with bold-led bullets — what else moved and over how large a corpus, the issue's side requests answered, spin-offs filed with links — and ends with the closing trailer.

**GitHub needs a closing keyword before every issue number.** `Closes #61 and #33.` closes **#61 alone**, and #33 is left open with no warning of any kind; write `Closes #33. Closes #61.` instead. The trailer goes in both the commit message and the pull request body, so a correction fixes both.

## Skills

Five procedures are written out in full under [.agents/skills](.agents/skills), each as a `SKILL.md` its agent loads when it applies, so that what is needed once a session does not sit in every session's context. `.claude/skills` is a symlink to that directory, which is how the CLI finds them, and every worktree reaches the same copy through its own `.claude` link. The longer references this file links out to sit beside them in [.agents/docs](.agents/docs).

- **base-comparison** — measuring a branch against the commit it stands on. Read it **before** any run that compares two versions of `lib/`. The one move it forbids keeps eating uncommitted work, three times in a single session at its worst: reverting a tracked path with `git checkout <rev> -- lib` restores the committed state and takes everything else with it, and `git status` is clean afterwards.
- **sweeps-and-oracles** — building a corpus that can see the change, and reading what the boards report without over-reading it. Every clean run in this repository has at some point been a corpus talking about itself.
- **outward-prose** — a commit body, a changelog entry, a pull request, an issue comment or a code comment as a set of claims, each of which somebody will check. The recurring shape is a branch whose code is clean from round one and whose every review finding is in the sentences around it.
- **stacks-and-issues** — the GitHub mechanics: `gh stack`, why CI runs on the bottom pull request alone, which hash survives a merge, and how an umbrella issue closes.
- **engine-probes** — asking Less, lightningcss, dart-sass or a custom syntax's own parser what a stylesheet means, instead of reasoning about tokens. A parser is not a compiler, and a guard carrying a piece of somebody else's grammar carries a piece that will be wrong somewhere.
