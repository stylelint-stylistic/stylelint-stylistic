<!-- markdownlint-disable MD024 -->
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com), and this project adheres to [Semantic Versioning](https://semver.org).

## [Unreleased]

### Fixed

- The `media-feature-parentheses-space-inside` rule no longer takes the closing parenthesis of a media feature into an inline comment standing in front of it (see [#152](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/152)). The line break in that whitespace is what closes such a comment, so the `never` option cannot be satisfied without commenting out the rest of the query, and the problem is now reported rather than fixed.
- The `media-feature-parentheses-space-inside` rule no longer reads a media feature out of an inline comment standing in a media query, nor writes inside such a comment (see [#138](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/138)). A parenthesis in the text of a comment used to open a feature as far as the value parser was concerned, and the fix then put the space the option asks for into that text.
- The `media-query-list-comma-space-before` rule no longer takes a comma standing behind an inline comment onto that comment's line (see [#137](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/137)). The line break in front of the comma is what closes such a comment, so neither option can be satisfied without commenting out the rest of the query and the block behind it, and the problem is now reported rather than fixed.
- The `value-list-comma-space-before` rule no longer takes a comma standing behind an inline comment onto that comment's line (see [#136](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/136)). The line break in front of the comma is what closes such a comment, so neither option can be satisfied without commenting out the rest of the declaration, and the problem is now reported rather than fixed.
- The `function-comma-space-before`, `function-comma-space-after`, `function-comma-newline-before` and `function-comma-newline-after` rules no longer write into an inline comment standing in a function's arguments (see [#135](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/135)):
	- a comma standing behind such a comment is no longer taken onto its line, since the line break in front of the comma is what closes the comment, so the problem is now reported rather than fixed;
	- a comma standing inside the text of such a comment is no longer taken for a comma of the value at all, so nothing is reported for it and nothing written near it.
- The `declaration-colon-space-after` rule now looks for the whitespace after the colon where a custom property whose value holds a comment actually keeps it (see [#109](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/109)) ([@VChet](https://github.com/VChet)):
	- the `always` options no longer report `--a: /*comment*/ !important;`, whose single space is already in place, and no longer pass over `--a:/*comment*/ !important;`, which has none at all;
	- their fix no longer adds a space of its own on every run, so two spaces or a tab after the colon now become the single space asked for;
	- the `never` option now takes the whitespace away instead of reporting a fix and leaving the declaration as it was, and no longer reports one that has no whitespace to begin with;
	- a space or a tab standing in front of the colon is no longer counted as one standing after it.
- The `block-opening-brace-space-before` rule no longer removes a comment standing between the selector and the opening brace when fixing (see [#63](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/63)):
	- a block comment is kept, and only the whitespace next to the brace changes, so such a stylesheet can now be autofixed without losing anything;
	- an inline comment leaves the brace nowhere to go, since the comment ends only with a line break, so the problem is now reported rather than silently rewritten.
- The `declaration-block-trailing-semicolon` rule no longer damages the block when it adds a missing semicolon after a bodiless at-rule (see [#87](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/87)):
	- a comment standing between the at-rule and the closing brace is kept;
	- the closing brace stays on its own line instead of being pulled up to the at-rule;
	- an inline comment leaves the semicolon nowhere to go, since the comment ends only with a line break, so the problem is now reported rather than silently rewritten.
- The `declaration-colon-space-before` rule no longer rewrites a declaration whose property is followed by an inline comment into code that does not parse (see [#88](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/88)). Such a comment ends only with a line break, so neither option can be satisfied without taking the colon into the comment, and the problem is now reported rather than fixed.
- The `block-opening-brace-newline-before` rule no longer takes the opening brace into an inline comment standing in front of it (see [#89](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/89)). Such a comment ends only with a line break, so the `never-*` options cannot be satisfied without commenting the whole block out, and the problem is now reported rather than fixed.
- The `declaration-colon-space-before` and `declaration-colon-space-after` rules now work on the declaration's own colon instead of the first colon they come across (see [#92](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/92)). A comment standing in front of the colon may hold a colon of its own, an URL for one, and used to be taken for the declaration's:
	- the fix no longer edits the text of such a comment;
	- the `never` options no longer miss the real violation hiding behind it;
	- the `always` options no longer report a declaration that is already correct.
- The `selector-combinator-space-before` rule no longer reports a combinator that opens a selector when a comment stands in front of it (see [#66](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/66)). A selector list broken over several lines and interleaved with comments is now left alone instead of being pulled onto one line. Two more things follow for this rule and for `selector-combinator-space-after` alike, whenever the selector holds an inline comment:
	- the reported position no longer drifts two characters per comment, so it points at the combinator itself;
	- the fix now reaches the output instead of being silently discarded, and the comment keeps its `//` spelling.
- The `no-eol-whitespace` rule now trims every line of a comment when fixing, and not only the lines up to the first quotation mark in it (see [#67](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/67)). An apostrophe in the text of a comment, the one in `isn't` for instance, used to be taken for the opening quote of a string, and the lines after it were passed over — reported, but left as they were, however many times the fix was run.
- The `string-quotes` rule no longer loses its bearings in a declaration's value or an at-rule's parameters holding a comment (see [#61](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/61), [#33](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/33)):
	- the reported position now points at the quote itself instead of drifting by the length of every comment standing in front of it;
	- the fix now changes the quote characters and nothing else, so every comment in the value survives it.
- The `string-quotes` rule no longer reports a quotation mark standing inside a `//` comment (see [#32](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/32)). A Less value or an at-rule's parameters keep such a comment in themselves whenever it does not open the statement, and the quotes in its text used to be taken for a string of code:
	- the warning is gone, and the fix no longer rewrites the text of the comment;
	- a double slash opens a comment only where the syntax says one does: under `postcss-scss` those are the comments its parser found, and a value of plain CSS is read exactly as before;
	- a double slash belonging to an address opens no comment even there, whether the address is quoted or bare inside `url()`, and whatever parentheses its interpolation or its escapes bring along;
	- a comment ends with its line, so a string on the next one is checked as before.
- The `string-quotes` rule now asks each block of a page about its own language (see [#101](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/101)). A stylesheet written in Less inside a `<style lang="less">` used to be read as plain CSS, so the quotes standing in the text of a `//` comment were reported and the fix rewrote them; a page may now hold blocks in several languages and each is read as its own.
- A Less at-variable now keeps the fix written to it (see [#99](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/99)). `postcss-less` gives such a variable two copies of its text and prints the one no rule writes, so `--fix` used to leave the file exactly as it was and drop the warning along with it, reporting a clean pass on a file it never touched. This held for every rule that fixes an at-rule's parameters: `indentation`, `no-eol-whitespace`, `number-leading-zero`, `number-no-trailing-zeros` and `string-quotes`.
- The `indentation` rule now corrects every mis-indented line of an at-rule, and not only one of them (see [#103](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/103)). This holds for the parameters and for anything standing between the name and them, a multi-line comment for one. The remaining lines used to keep their indentation while all of the warnings disappeared, so a second run reported nothing left to fix.
- The `unit-case` rule now fixes an at-rule whose name is not spelled in lower case, `@MEDIA` for one (see [#104](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/104)). Such a query used to be reported and then left exactly as it was, the warning disappearing with the fix, so the problem survived any number of runs.
- The `declaration-bang-space-before` rule no longer takes `!important` into an inline comment standing in front of it (see [#116](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/116)). Such a comment ends only with a line break, so neither option can be satisfied without commenting out the flag and the semicolon behind it, and the problem is now reported rather than fixed. A double slash belonging to an address, or standing inside a string, opens no comment of that kind, so a flag written on the line under a value that ends in `url(http://example.com/a.png)` is still pulled up to it.
- The `declaration-block-semicolon-space-before` rule no longer takes the semicolon into an inline comment standing in front of it (see [#117](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/117)). Such a comment ends only with a line break, so neither option can be satisfied without commenting the semicolon out, and `!important` along with it, and the problem is now reported rather than fixed. The `always` options no longer rewrite everything standing between the value and `!important` either, so a comment there, the line the flag is written on, and the spelling the flag itself was given, `!IMPORTANT` included, all survive the fix.
- The `declaration-block-semicolon-newline-after`, `declaration-block-semicolon-newline-before`, `declaration-block-semicolon-space-after` and `declaration-block-semicolon-space-before` rules now check the declarations of an inline `style` attribute (see [#49](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/49)). A page gives such an attribute a root of its own with no rule inside it, and the four rules used to pass over every declaration whose parent is not a rule, so nothing was reported for `style="color: pink;top: 0;"` in an HTML, Vue, Svelte or Astro file, while the `<style>` block of the same page was checked as usual. The top level of a Sass file is left alone as before, since a variable written there is not a declaration block.
- The `function-parentheses-newline-inside` rule no longer takes a function's closing parenthesis into an inline comment standing in front of it (see [#113](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/113)). Such a comment ends only with a line break, so `never-multi-line` cannot be satisfied without commenting out the parenthesis, and everything the declaration has left, and the problem is now reported rather than fixed. The `always` and `always-multi-line` options add a line break rather than take one away, and are unaffected.
- A `//` comment that a carriage return ends is now read as ended wherever the plugin asks whether a fix would land inside one. Sass reads that character as a line of its own, and Less turns one into a line feed before it parses anything, so a comment ends there in either language; every rule that declines a fix next to such a comment used to read the comment as running on, and declined where nothing was at risk.
- The `function-parentheses-space-inside` rule no longer takes a function's closing parenthesis into an inline comment standing in front of it (see [#114](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/114)). Such a comment ends only with a line break, so no option can be satisfied without commenting out the parenthesis, and everything the declaration has left, and the problem is now reported rather than fixed. All four options are asked, the single-line ones included: a function whose only line break is a form feed passes for a single line, while Sass ends an inline comment on that character all the same. A value with no comment in it is fixed exactly as before.
- The `selector-pseudo-class-parentheses-space-inside` rule now fixes the whitespace next to a closing parenthesis that a comment stands in front of (see [#123](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/123)). The parser keeps such a comment, and the space on either side of it, in the raws of the node before it, and prints the raw one; the rule wrote to the clean value instead, so the problem was reported, `--fix` claimed a clean pass and the parenthesis stayed exactly where it was. A nested pseudo-class was left half fixed at every level. Under `always` a line break in front of the closing parenthesis now collapses to a single space where a comment stands before it, as it already did where none does.
- The `value-list-comma-space-after`, `value-list-comma-space-before` and `value-list-comma-newline-after` rules no longer drop the warning about a comma they cannot fix (see [#126](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/126)). A comma the value does not hold is out of their reach, and they said so by returning `false` from the fixer — a refusal Stylelint has never read, since it counts a fixer as applied whatever it does. So `--fix` ended with a clean pass on a file it had not finished fixing, and only a second run over the output brought the surviving problem back. What counts as out of reach is a character too wide, and a comma opening the value is refused along with a comma standing in the property name, which is [#134](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/134); such a warning now stands where it used to vanish.
- The `selector-descendant-combinator-no-non-space` rule now reports a parenthesised group standing after a space where a combinator belongs, `.foo (  ) .bar` for one (see [#125](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/125)). The rule used to read a combinator only where its value was a single space, so every such selector went past unseen; a group holding one space or none, `.foo ( ) .bar` and `.foo () .bar`, is reported alongside the rest. Nothing can be written to repair such a selector, so the problem is reported and the code left exactly as it was.
- A Less CSS guard is no longer read as ordinary CSS (see [#125](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/125)). `isStandardSyntaxSelector` used to recognise one only by accident — a guard on a selector carrying no colon looked like a mixin definition, and a condition naming a variable looked like a parametric mixin — so `.a:hover when (1 = 1)` answered to neither and every rule built on that util went on checking it. Such a selector is now passed over as any other Less construct is, whatever the case of the word and wherever the guard stands, while a quoted attribute value holding the same text, `a[href$=" when ("]` for one, is ordinary CSS and is checked as before.

## [5.3.0] — 2026–08–09

### Added

- The `function-comma-newline-after` rule now has an additional `ignoreFunctions` option (see [#78](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/78)).
- The `function-comma-newline-before` rule now has an additional `ignoreFunctions` option (see [#81](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/81)).
- The `function-comma-space-after` rule now has an additional `ignoreFunctions` option (see [#82](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/82)).
- The `function-comma-space-before` rule now has an additional `ignoreFunctions` option (see [#83](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/83)).

## [5.2.1] — 2026–07–01

### Fixed

- The protocol in the repository's metadata URL now meets current requirements ([#79](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/79)) ([@BowenMilner](https://github.com/BowenMilner)).

## [5.2.0] — 2026–05–20

### Added

- The `declaration-block-semicolon-newline-before` rule is now autofixable.

### Fixed

- An exception for an empty custom property value has been added to the `declaration-block-semicolon-newline-before` and `declaration-colon-space-after` rules: the `--custom-prop: ;` and `--custom-prop:;` variants are now considered valid (see [#50](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50)).

## [5.1.0] — 2026–03–28

### Added

- The `no-multiple-whitespaces` rule, which disallows multiple whitespaces between property values and function arguments.

### Fixed

- The dependencies have now been updated to versions that include security fixes.

## [5.0.1] — 2026–01–22

### Fixed

- The `selector-pseudo-class-parentheses-space-inside` rule no longer triggers false positives in multiline pseudo-classes.

## [5.0.0] — 2026–01–15

### Changed

- The plugin now requires:
	- `stylelint` version `17.0.0` or higher
	- `node.js` version `20.19.0` or higher

## [4.0.1] — 2026–01–15

### Fixed

- Multiline pseudos are now aligned correctly with the `@stylistic/indentation` rule.

	**Before**:

	```css
	.foo:where(
	:not(
	    .bar,
	    .baz
	)
	) {}
	```

	**Now**:

	```css
	.foo:where(
	  :not(
	    .bar,
	    .baz
	  )
	) {}
	```

## [4.0.0] — 2025–07–22

### Changed

- The plugin now requires `stylelint` version `16.22.0` or higher.

## [3.1.3] — 2025–06–25

### Fixed

- `stylelint` has been moved from `dependencies` to `devDependencies`. This may potentially fix some errors (see [Stylelint's documentation regarding `peerDependencies`](https://stylelint.io/developer-guide/plugins#peer-dependencies) and [PRs that explain the motivation behind this decision](https://github.com/stylelint/stylelint/issues/2812)).
- `postcss` has been moved from `devDependencies` to `dependencies`. This fixes the “Cannot find package `postcss`” and “Named export `Input` not found” error in some environments.

## [3.1.2] — 2025–02–05

### Fixed

- An explicit end position is now passed to all `report` calls. \
	The `report` calls no longer receive the `line` argument, which was [deprecated](https://github.com/stylelint/stylelint/pull/8244) in `stylelint@16.13.0`. \
	Previously, attempts to update `stylelint` to `16.13.0` version resulted in multiple DeprecationWarning messages ([#53](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/53)) ([@MorevM](https://github.com/MorevM)).
- Added an exception to the `declaration-block-semicolon-space-before` rule for an empty value of a custom property: now both `--custom-prop: ;` and `--custom-prop:;` are considered valid even with the `never` and `never-single-line` options. \
  You can find a detailed explanation in [the original issue](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/50) ([#51](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/51)) ([@MorevM](https://github.com/MorevM)).
- Fixed behavior of `baseIndentLevel` option of `indentation` rule when used in non-CSS files (e.g. when using `postcss-html` syntax) ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).
- Fixed removing the starting indentation along with the blank line in the `no-empty-first-rule` rule ([#47](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/47)) ([@net-solution](https://github.com/net-solution)).

## [3.1.1] — 2024–10–04

### Fixed

- Indentation checking for property values that use dynamic expressions when using `postcss-styled-syntax` is now disabled ([#44](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/44)) ([@MorevM](https://github.com/MorevM)).

## [3.1.0] — 2024–09–23

### Added

- The `messageArgs` to 16 rules for custom message arguments. See [stylelint documentation](https://stylelint.io/user-guide/configure/#message) for details.

### Fixed

- Calculation of indentation using `postcss-styled-syntax` custom syntax ([#41](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/41)) ([@MorevM](https://github.com/MorevM)).

## [3.0.1] — 2024–08–18

### Fixed

- The `context.fix`, which is deprecated in `stylelint@16.8.2`, is no longer used. Previously, attempts to update `stylelint` to `16.8.2` version resulted in multiple DeprecationWarning messages ([#37](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/37)).

## [3.0.0] — 2024–07–30

### Changed

- The plugin now requires `stylelint` version `16.8.0` or higher.

## [2.1.3] — 2024–07–29

### Fixed

- Dependencies are now updated, which fixes test fails ([#29](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/29)) ([@ybiquitous](https://github.com/ybiquitous)).

## [2.1.2] — 2024–04–28

### Fixed

- Autofixing of `@charset` name by `string-quotes` rule ([#26](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/26)) ([@Mouvedia](https://github.com/Mouvedia)).

## [2.1.1] — 2024–03–31

### Fixed

- `block-closing-brace-empty-line-before` with except: ["after-closing-brace"] false negatives for CSS Nesting ([#22](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/22)) ([@firefoxic](https://github.com/firefoxic)).
- `named-grid-areas-alignment` for single-line input ([#21](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/21)) ([@MorevM](https://github.com/MorevM)).

## [2.1.0] — 2024–02–18

### Added

- `named-grid-areas-alignment` rule ([#16](https://github.com/stylelint-stylistic/stylelint-stylistic/pull/16)) ([@MorevM](https://github.com/MorevM)).

## [2.0.0] — 2023–12–20

### Changed

- The repository renamed to `stylelint-stylistic` and moved to the organization of the same name.
- The plugin is published in `npm` under the new name `@stylistic/stylelint-plugin`. Therefore, you should:
	- change the former plugin name `stylelint-codeguide` to the new one in the config,
	- remove the old `stylelint-codeguide` package from dependencies
	- install the new `@stylistic/stylelint-plugin` package.
- The namespace of plugin rules has been renamed. Therefore, you should change the rules prefix from `codeguide/` to `@stylistic/` in the config.

## [1.0.2] — 2023–12–12

### Updated

- **Stylelint** to version `16.0.2`, which fixes the use of plugins in Windows.

## [1.0.1] — 2023–12–10

### Fixed

- Dependency definition.

## [1.0.0] — 2023–12–08

### Changed

- The required version of **Stylelint** is now at least `v16.0.1`.
- The required version of **Node.js** is now **LTS** at least `v18.12`, or at least `v20.9`.
- The plugin is now converted to a pure ES module.

## [0.3.2] — 2023–10–19

### Updated

- Stylelint to `^15.11.0`.
- Node.js to `>=18.16`.

## [0.3.1] — 2023–10–13

No meaningful changes.

## [0.3.0] — 2023–10–13

### Changed

- Along with updating the plugin to this release, Stylelint needs to be updated to `v15.10.3` as well.

### Updated

- All code according to `stylelint@15.10.3`.
- Peer dependency — `stylelint@15.10.3`.

## [0.2.2] — 2023–09–14

### Fixed

- The path to the internal module.

## [0.2.1] — 2023–07–08

### Fixed

- Any LTS version of Node.js on the 18th branch is now required (i.e. at least `18.12.0`), not the latest.
- Any version of Stylelint on the 15th branch is now required (i.e. at least `15.0.0`), not the latest.

## [0.2.0] — 2023–07–01

### Updated

- Peer dependency Stylelint to `15.9.0`.

## [0.1.5] — 2023–07–01

### Fixed

- All paths to docs.

## [0.1.4] — 2023–05–20

### Changed

- Reorganized `package.json`.

## [0.1.3] — 2023–03–28

### Removed

- The `deprecated` flag from the `meta` of each rule.

## [0.1.2] — 2023–03–28

### Fixed

- `Error [ERR_REQUIRE_ESM]: require() of ES Module`.

## [0.1.1] — 2023–03–28

### Added

- Babel until Stylelint is converted to ES Modules.

## [0.1.0] — 2023–03–28

### Added

- `at-rule-name-case` rule.
- `at-rule-name-newline-after` rule.
- `at-rule-name-space-after` rule.
- `at-rule-semicolon-newline-after` rule.
- `at-rule-semicolon-space-before` rule.
- `block-closing-brace-empty-line-before` rule.
- `block-closing-brace-newline-after` rule.
- `block-closing-brace-newline-before` rule.
- `block-closing-brace-space-after` rule.
- `block-closing-brace-space-before` rule.
- `block-opening-brace-newline-after` rule.
- `block-opening-brace-newline-before` rule.
- `block-opening-brace-space-after` rule.
- `block-opening-brace-space-before` rule.
- `color-hex-case` rule.
- `declaration-bang-space-after` rule.
- `declaration-bang-space-before` rule.
- `declaration-block-semicolon-newline-after` rule.
- `declaration-block-semicolon-newline-before` rule.
- `declaration-block-semicolon-space-after` rule.
- `declaration-block-semicolon-space-before` rule.
- `declaration-block-trailing-semicolon` rule.
- `declaration-colon-newline-after` rule.
- `declaration-colon-space-after` rule.
- `declaration-colon-space-before` rule.
- `function-comma-newline-after` rule.
- `function-comma-newline-before` rule.
- `function-comma-space-after` rule.
- `function-comma-space-before` rule.
- `function-max-empty-lines` rule.
- `function-parentheses-newline-inside` rule.
- `function-parentheses-space-inside` rule.
- `function-whitespace-after` rule.
- `indentation` rule.
- `linebreaks` rule.
- `max-empty-lines` rule.
- `max-line-length` rule.
- `media-feature-colon-space-after` rule.
- `media-feature-colon-space-before` rule.
- `media-feature-name-case` rule.
- `media-feature-parentheses-space-inside` rule.
- `media-feature-range-operator-space-after` rule.
- `media-feature-range-operator-space-before` rule.
- `media-query-list-comma-newline-after` rule.
- `media-query-list-comma-newline-before` rule.
- `media-query-list-comma-space-after` rule.
- `media-query-list-comma-space-before` rule.
- `no-empty-first-line` rule.
- `no-eol-whitespace` rule.
- `no-extra-semicolons` rule.
- `no-missing-end-of-source-newline` rule.
- `number-leading-zero` rule.
- `number-no-trailing-zeros` rule.
- `property-case` rule.
- `selector-attribute-brackets-space-inside` rule.
- `selector-attribute-operator-space-after` rule.
- `selector-attribute-operator-space-before` rule.
- `selector-combinator-space-after` rule.
- `selector-combinator-space-before` rule.
- `selector-descendant-combinator-no-non-space` rule.
- `selector-list-comma-newline-after` rule.
- `selector-list-comma-newline-before` rule.
- `selector-list-comma-space-after` rule.
- `selector-list-comma-space-before` rule.
- `selector-max-empty-lines` rule.
- `selector-pseudo-class-case` rule.
- `selector-pseudo-class-parentheses-space-inside` rule.
- `selector-pseudo-element-case` rule.
- `string-quotes` rule.
- `unicode-bom` rule.
- `unit-case` rule.
- `value-list-comma-newline-after` rule.
- `value-list-comma-newline-before` rule.
- `value-list-comma-space-after` rule.
- `value-list-comma-space-before` rule.
- `value-list-max-empty-lines` rule.

[Unreleased]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.3.0...HEAD
[5.3.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.2.1...v5.3.0
[5.2.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.2.0...v5.2.1
[5.2.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.0.1...v5.1.0
[5.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v5.0.0...v5.0.1
[5.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v4.0.1...v5.0.0
[4.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.3...v4.0.0
[3.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.2...v3.1.3
[3.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.1.0...v3.1.1
[3.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.0.1...v3.1.0
[3.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.3...v3.0.0
[2.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.2...v2.0.0
[1.0.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.3.2...v1.0.0
[0.3.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.2...v0.3.1
[0.3.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/stylelint-stylistic/stylelint-stylistic/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/stylelint-stylistic/stylelint-stylistic/releases/tag/v0.1.0
