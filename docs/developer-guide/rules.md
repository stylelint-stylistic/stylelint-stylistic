# Writing rules

Please help us create, enhance, and debug our rules!

## Set up

Clone the repository and install its dependencies with pnpm:

```shell
pnpm ci
```

Every task goes through the `Makefile`; `make help` lists the targets with their flags. The ones a rule needs:

```shell
make test FILE=lib/rules/color-hex-case/index.test.ts  # one rule's tests
make lint LINT_FLAGS=--fix                             # lint and format the code
make verify                                            # everything CI runs
```

`make verify` is what CI runs, and the `pre-push` hook runs it too.

## Add a rule

### Define the rule

A rule must be:

- for standard CSS syntax only
- generally useful; not tied to idiosyncratic patterns

And have a:

- unambiguous finished state
- singular purpose that doesn't overlap with other rules

Its name is split into two parts:

- the _thing_ the rule applies to, e.g. `at-rule`
- what the rule is checking, e.g. `name-case`

Unless it applies to the whole source, then there is no first part.

A rule is written once for plain CSS and serves every namespace: `@stylistic/scss/`, `@stylistic/less/` and `@stylistic/styled/` are built out of the same module. What a preprocessor spells is answered under `lib/syntaxes/`, and a rule reaches it only through the `syntax` it is handed.

### Write the rule

A rule lives in `lib/rules/<rule-name>/`: `index.ts`, `index.test.ts` and `README.md`. Follow `lib/rules/color-hex-case/index.ts`; abridged, a rule module looks like this:

```ts
import stylelint from "stylelint"

import { css } from "../../syntaxes/css/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { report } from "../../utils/report/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `color-hex-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `lower` | `upper`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			let value = syntax.read(decl)

			/* … */

			report({
				message: messages.expected,
				messageArgs: [actual, expected],
				node: decl,
				index,
				endIndex,
				result,
				ruleName,
				fix () { /* … */ },
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
```

- `defineRule` builds the rule once per namespace, so the rule takes its `ruleName`, `messages` and `syntax` from its first parameter rather than from the module.
- Every question about the stylesheet's language goes through `syntax`: reading and writing text, comments, `syntax.isStandardAtRule` and its siblings. Nothing specific to SCSS or Less goes into the rule.
- Report through `report` of `lib/utils/report`, never through Stylelint's own. The autofix is the `fix` callback, and `fixable: true` in `meta` marks the rule as fixable.
- Make the rule strict by default, and add secondary `ignore` options to make it more permissive.

Use the [PostCSS API](https://postcss.org/api/) to walk the tree, preferring the `walk` iterators (e.g. `walkDecls`) to `forEach`, and check a node's `type` before reading its other properties. For values and selectors, use [postcss-value-parser](https://github.com/TrySound/postcss-value-parser) and [postcss-selector-parser](https://github.com/postcss/postcss-selector-parser) rather than regular expressions. A regular expression that is needed all the same goes into `lib/regexps.ts` under a name saying what it matches.

Look through `lib/utils/` before writing new traversal logic: most whitespace rules are thin wrappers over `whitespaceChecker` and the `*SpaceChecker` families.

### Add options

Each rule can accept a primary and an optional secondary option.

Only add an option to a rule if it addresses a _requested_ use case to avoid polluting the tool with unused features.

#### Primary

Every rule _must have_ a primary option. For example, in:

- `"color-hex-case": "lower"`, the primary option is `"lower"`
- `"max-empty-lines": [2, { "ignore": ["comments"] }]`, the primary option is `2`

Rules are named to encourage explicit primary options. For example, `color-hex-case: "lower"|"upper"` rather than `color-hex-uppercase: "always"|"never"`, since `"never"` only _implies_ lower case, whereas `"lower"` makes it _explicit_.

#### Secondary

Some rules require extra flexibility to address edge cases. These can use an optional secondary options object. The most typical secondary options are `"ignore": []` and `"except": []`:

- `"ignore"` skips over a particular pattern
- `"except"` inverts the primary option for a particular pattern

Both accept an array of predefined keywords, e.g. `["comments"]`. Some rules accept a _user-defined_ list of things to ignore instead, in the form of `"ignore<Things>": []`, e.g. `"ignoreFunctions": []`, which lets users ignore non-standard syntax at the configuration level rather than the rule carrying code for it.

No rule of this plugin takes an array as its primary option, so `defineRule` has no field telling Stylelint so yet; the first rule that needs one adds it there.

### Add problem messages

Add problem messages in form of:

- "Expected \[installsomething\] \[in some context\]"
- "Unexpected \[something\] \[in some context\]"

If the rule has autofix use:

- 'Expected "\[unfixed\]" to be "\[fixed\]"' for short strings
- 'Expected "\[primary\]" ... notation' for long strings

### Write tests

Tests run on Vitest with [`@morev/stylelint-testing-library`](https://github.com/MorevM/stylelint-testing-library). A test file imports `messages` and `ruleName` from its rule and calls `testRule` with `accept` and `reject` cases; a `reject` case asserts what `--fix` writes (`fixed`), the `message`, the `line` and the `column`:

```ts
import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			description: `a keyword, which carries no hash at all`,
			code: `a { color: pink; }`,
		},
	],

	reject: [
		{
			description: `an upper-case color`,
			code: `a { color: #ABC; }`,
			fixed: `a { color: #abc; }`,
			line: 1,
			column: 12,
			message: messages.expected(`#ABC`, `#abc`),
		},
	],
})
```

A `description` names what the fixture _is_, continuing the sentence the block starts: “accepts a keyword…”, “rejects an upper-case color”. Cases for a custom syntax of its own go into `lib/syntaxes/<name>/rules/<rule-name>/index.test.ts`.

You should add test cases for all patterns that are considered problems and all that are _not_. You should use:

- realistic CSS, avoiding the use of ellipses
- the minimum amount of code possible, e.g. use an empty rule if targetting selectors
- `{}` for empty rules, rather than `{ }`
- the `a` type selector by default
- the `@media` at-rules by default
- the `color` property by default
- the `red` value by default
- the `(min-)width` media feature by default
- _foo_, _bar_ and _baz_ for names, e.g. `.foo`, `#bar`, `--baz`

You should:

- vary column and line positions across your tests
- include at least one test that has 2 warnings

#### Commonly overlooked edge-cases

You should ask yourself how does your rule handle:

- variables (e.g. `var(--custom-property)`)?
- CSS strings (e.g. `content: "anything goes";`)?
- CSS comments (e.g. `/* anything goes */`)?
- empty functions (e.g. `var()`)?
- `url()` functions, including data URIs (e.g. `url(anything/goes.jpg)`)?
- vendor prefixes (e.g. `@-webkit-keyframes name {}`)?
- case sensitivity (e.g. `@KEYFRAMES name {}`)?
- a pseudo-class _combined_ with a pseudo-element (e.g. `a:hover::before`)?
- nesting (e.g. do you resolve `& a {}`, or check it as is?)?
- whitespace and punctuation (e.g. comparing `rgb(0,0,0)` with `rgb(0, 0, 0)`)?
- the rules writing the same whitespace (e.g. `value-list-comma-newline-after` beside `value-list-comma-space-after`)?

### Write the README

Each rule is accompanied by a README in the following format:

1. Rule name.
2. Single-line description.
3. Prototypical code example.
4. Expanded description (if necessary).
5. Options.
6. Example patterns that are considered problems (for each option value).
7. Example patterns that are _not_ considered problems (for each option value).
8. Optional options (if applicable).

The single-line description is in the form of:

- "Disallow ..." for `no` rules
- "Limit ..." for `max` rules
- "Require ..." for rules that accept `"always"` and `"never"` options
- "Specify ..." for everything else

The expanded description says what the rule does, not how it gets there. A fixable rule carries the line naming the [`fix` option](https://stylelint.io/user-guide/options#fix), and a rule reporting with message arguments the line naming the [`message` secondary option](https://stylelint.io/user-guide/configure/#message); the tests of `lib/rules/index.test.ts` check both.

You should:

- pick examples from the tests
- only use standard CSS syntax in examples and options
- add the fewest examples possible to communicate the intent of the rule, rather than show edge cases
- use "this rule" to refer to the rule, e.g. "This rule ignores ..."
- align the arrows within the prototypical code example with the beginning of the highlighted construct
- align the text within the prototypical code example as far to the left as possible

For example:

```css
 @media screen and (min-width: 768px) {}
/**                 ↑          ↑
  *       These names and values */
```

Look at the READMEs of other rules to glean more conventional patterns.

### Wire up the rule

A new rule is active only once it is added to these places:

- [`lib/rules/index.ts`](../../lib/rules/index.ts), the registry;
- [the list of rules](../user-guide/rules.md), under its group, with `(Autofixable).` closing the line of a fixable rule;
- the `Unreleased` section of [`CHANGELOG.md`](../../CHANGELOG.md);
- `scripts/oracles/options.ts`, with every primary option the rule takes;
- for a rule taking a `-single-line` or `-multi-line` option, the `LINENESS_RULES` table of `lib/utils/defersToRunEnd/index.ts`;
- for a rule speaking of whitespace another rule speaks of already, where no spelling satisfies both: the table of `lib/utils/conflictingSettings/index.ts`, its test, the type beside it, which `make types-check` holds in step with the table, and [Conflicting settings](../user-guide/conflicting-settings.md).

## Add an option to a rule

You should:

1. Add new unit tests to test the option.
2. Change the rule's validation to allow for the new option.
3. Add (as little as possible) logic to the rule to make the tests pass.
4. Add documentation about the new option.
5. Add an entry to the `Unreleased` section of `CHANGELOG.md`.

## Fix a bug in a rule

You should:

1. Write failing unit tests that exemplify the bug.
2. Fiddle with the rule until those new tests pass.
3. Run `make verify`.

## Deprecate a rule

Deprecating rules doesn't happen very often. When you do, you must:

1. Add `deprecated: true` to the rule's `meta`.
2. Open its README with a `> **Warning**` block saying what to use instead; a test checks that the block is there.
3. Add an entry to the `Unreleased` section of `CHANGELOG.md`.
