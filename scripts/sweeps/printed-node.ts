/**
 * A comment of every spelling wherever a rule measuring a printed node can meet one, in every block and syntax.
 *
 * Written for [#139](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/139): a position counted in `node.toString()` is off by as much as PostCSS's stringifier differs from the file's. Positions are `control.ts`'s question; this corpus asks whether the warnings and fixes differ, since the single-line options turn on a block's width. The controls carry no comment, since the rewritten utilities run for every statement.
 */

import { place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Two comment spellings of one width, and the two shapes without one. */
const COMMENTS = { inline: `// c`, block: `/**/`, none: ``, twoInline: `// c\n\t// c` }

/** Where the comment stands. */
const PLACES: Record<string, (comment: string) => string> = {
	behindValue: (comment) => `a {\n\tcolor: pink ${comment}\n}\n`,
	ownLine: (comment) => `a {\n\tcolor: pink;\n\t${comment}\n}\n`,
	behindOpeningBrace: (comment) => `a {${comment}\n\tcolor: pink;\n}\n`,
	behindSemicolon: (comment) => `a {\n\tcolor: pink;${comment}\n\ttop: 0;\n}\n`,
	valueThenSemicolon: (comment) => `a {\n\tcolor: pink ${comment}\n\t;\n}\n`,
	valueThenSemicolonThenDecl: (comment) => `a { color: pink ${comment}\n;\ntop: 0;\n}\n`,
	inSelector: (comment) => `a ${comment}\n{ color: pink; }\n`,
	inParams: (comment) => `@media screen ${comment}\n\t{ a { color: pink; } }\n`,
	inFeature: (comment) => `@media (min-width: 1px ${comment}\n\t) { a { color: pink; } }\n`,
	inBodilessParams: (comment) => `@import "a" ${comment}\n\t"b" ;\n`,
	behindBang: (comment) => `a {\n\tcolor: pink !important ${comment}\n\t;\n}\n`,
	inNestedBlock: (comment) => `a {\n\tb {\n\t\tcolor: pink ${comment}\n\t}\n}\n`,
	behindAtRuleClosingBlock: (comment) => `a {\n\t@extend .b\n\t${comment}\n}\n`,
	behindStraySemicolon: (comment) => `a {\n\tcolor: pink;\n\t${comment}\n;\n}\n`,
	singleLineBlock: (comment) => `a { color: pink ${comment} }\n`,
	emptyBlock: (comment) => `a {${comment}}\n`,
}

/** Shapes whose printed copy parts from the file without a comment: a Less mixin call, whose dot and flag live in raws PostCSS does not print, and a Sass nested property, whose block PostCSS's stringifier drops. The detached ruleset and the free semicolon are controls. The bang, comma and sibling shapes pin two drafts that handed the declaration to the bang, comma and `declaration-block-semicolon-*-before` checkers with the block laid onto its end. */
const RAW_SHAPES: [string, string][] = [
	[`raw|lessMixinCall`, `a {\n\t.m()\n}\n`],
	[`raw|lessMixinCallWithBang`, `a {\n\t.m() !important\n}\n`],
	[`raw|lessMixinCallThenDecl`, `a {\n\t.m();\n\tcolor: pink;\n}\n`],
	[`raw|sassNestedProperty`, `a {\n\tfont: 12px\n\t{ family: serif; }\n}\n`],
	[`raw|sassNestedPropertyInline`, `a {\n\tfont: 12px // c\n\t{ family: serif; }\n}\n`],
	[`raw|sassNestedPropertyBangInside`, `a {\n\tfont: 12px\n\t{ family: serif  !important; }\n}\n`],
	[`raw|sassNestedPropertyBangOutside`, `a {\n\tfont: 12px  !important\n\t{ family: serif; }\n}\n`],
	[`raw|sassNestedPropertyCommaInside`, `a {\n\tfont: 12px\n\t{ family: a  ,serif; }\n}\n`],
	[`raw|sassNestedPropertyCommaOutside`, `a {\n\tfont: 12px  ,13px\n\t{ family: serif; }\n}\n`],
	[`raw|sassNestedPropertyMultiLineValue`, `a {\n\tfont: 12px,\n\t\t13px\n\t{ family: serif; }\n}\n`],
	[`raw|sassNestedPropertyThenDecl`, `a {\n\tfont: 12px\n\t{ family: serif; }\n\ttop: 0;\n}\n`],
	[`raw|sassNestedPropertySemicolonThenDecl`, `a {\n\tfont: 12px\n\t{ family: serif; };\n\ttop: 0;\n}\n`],
	[`raw|sassNestedPropertyOneLine`, `a { font: 12px { family: serif; } ; top: 0; }\n`],
	[`raw|sassNestedPropertyHoldingRule`, `a {\n\tfont: 12px\n\t{ b { color: pink } }\n}\n`],
	[`raw|sassNestedPropertyHoldingRuleOneLine`, `a { font: 12px { b { color: pink } } }\n`],
	[`raw|sassNestedPropertyInNestedProperty`, `a {\n\tfont: 12px\n\t{ family: serif\n\t\t{ weight: bold; } }\n}\n`],
	[`raw|lessDetachedRuleset`, `a {\n\t@r: { color: pink; }\n}\n`],
	[`raw|freeSemicolonBehindBrace`, `a { &:hover { color: pink;; }; }\n`],
]

const name: Sweep[`name`] = `printed-node`

const corpus: Sweep[`corpus`] = [
	...place(Object.entries(COMMENTS), PLACES),
	...RAW_SHAPES,
]

/** Every rule with a rewritten measurement, under every listed primary. */
const configs: Sweep[`configs`] = ([
	[`at-rule-semicolon-newline-after`, [`always`]],
	[`at-rule-semicolon-space-before`, [`always`, `never`]],
	[`block-closing-brace-empty-line-before`, [`always-multi-line`, `never`]],
	[`block-closing-brace-newline-after`, [`always`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]],
	[`block-closing-brace-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`block-closing-brace-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]],
	[`block-closing-brace-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]],
	[`block-opening-brace-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`block-opening-brace-newline-before`, [`always`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]],
	[`block-opening-brace-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]],
	[`block-opening-brace-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`, `always-multi-line`, `never-multi-line`]],
	[`declaration-block-semicolon-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`declaration-block-semicolon-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`declaration-block-semicolon-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`declaration-block-semicolon-space-before`, [`always`, `never`]],
	[`declaration-block-trailing-semicolon`, [`always`, `never`]],
	[`declaration-bang-space-before`, [`always`, `never`]],
	[`declaration-bang-space-after`, [`always`, `never`]],
	[`value-list-comma-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`value-list-comma-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`value-list-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`value-list-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`indentation`, [`tab`, 2]],
	[`no-extra-semicolons`, [true]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
