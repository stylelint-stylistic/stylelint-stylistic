/**
 * A comment of every spelling, standing wherever a rule that measures a printed node can meet one, in every kind of block and under every syntax.
 *
 * Written for #139, where every position counted in `node.toString()` stands as far past its mark as PostCSS's stringifier differs from the one the file was opened with. The positions themselves are `control.mjs`'s question — a sweep keeps the text of a warning and not the place of it — so what this corpus is for is the other half: whether a rule that now reads the text the file spells says something it did not say before, and whether `--fix` writes something else. The block-measuring options turn on whether a block is single-line or multi-line, and two characters of a rewritten comment are enough to change that answer rather than the column, so a widening here shows as a warning arriving or leaving and as a fix output moving.
 *
 * The controls carry no comment at all: a corpus in which every block holds one is blind to what the branch does to a block that holds none, and the three utilities it rewrites are called for every statement of every file.
 */

import { place } from "../harness/matrix.mjs"

/** The comment, in the two spellings of the same width, and the two shapes that carry no comment. A block comment is what the inline one is measured against, since neither the file nor the code around it differs by a character between the two. */
const COMMENTS = { inline: `// c`, block: `/**/`, none: ``, twoInline: `// c\n\t// c` }

/**
 * Where the comment stands: behind the value of the last declaration, on a line of its own, behind the opening brace, and behind a semicolon.
 * @type {Record<string, (comment: string) => string>}
 */
const PLACES = {
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

/** The shapes whose printed copy parts from the file for a reason other than a comment: a Less mixin call, whose leading dot and flag live in raws PostCSS prints neither of, and a Sass nested property, a declaration carrying a block that `postcss-scss` prints and PostCSS's own stringifier drops. The detached ruleset and the free semicolon behind a brace are controls: the two stringifiers agree on both, and a corpus in which every shape diverges says nothing about what the change does where none does. Five of them put a bang and a comma on either side of that block and three put a sibling behind it, since a rule reading a declaration's own text has to be measured on one that holds something to read and on one the rule does not pass over: the first draft of this branch handed such a declaration to the bang and comma checkers with the block laid onto the end of it, and every bang and comma the block held came past the checker a second time; the second draft handed it to the `declaration-block-semicolon-*-before` rules the same way, and every fixture that had it standing last in its block was passed over by all four of them before they could say so. */
const RAW_SHAPES = [
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

const name = `printed-node`

const corpus = [
	...place(Object.entries(COMMENTS), PLACES),
	...RAW_SHAPES,
]

/** Every rule this branch rewrites a measurement in, under every primary option `scripts/oracles/options.mjs` lists for it. */
const configs = /** @type {[string, unknown[]][]} */ ([
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
]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
