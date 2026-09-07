/**
 * A colon inside what `raws.between` holds besides the declaration's own (a block comment, an inline comment, a string, a group), in front of every value shape the colon rules tell apart. Four block comments a reader may take unlike PostCSS: one opening `/*\/`, which `postcss-value-parser` closes on its own star; one ending in a backslash, which `style-search` never closes; two abutting, whose `*\/` and `/*` the search reads as a double slash; one behind a backslash, which the scan reads as an escape. The inline comment behind a backslash is the same divergence; one welded to a word opens no comment for either preprocessor; the string behind a bare double slash is code to the parser and a comment to `style-search`. The property is also spelled `url`, behind which the tokenizer takes a group whole.
 *
 * Written for [#388](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/388) and [#499](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/499), where `declaration-colon-newline-after` took a comment's colon for the declaration's. The controls carry no colon.
 *
 * The rules are every reader of the raw, the `declaration-colon-*` and `declaration-block-semicolon-*-before` rules, and `declaration-block-trailing-semicolon` as a control.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `colon-in-comment`

const corpus: Sweep[`corpus`] = multiply({
	comment: {
		colonBlock: `/*x:y*/`,
		block: `/*x*/`,
		colonSlashStarSlash: `/*/x:y*/`,
		slashStarSlash: `/*/x*/`,
		colonBackslashBlock: `/*x:\\*/`,
		backslashBlock: `/*x\\*/`,
		colonAbuttingBlocks: `/*x*//*y:z*/`,
		abuttingBlocks: `/*x*//*y*/`,
		colonEscapedSlashBlock: `\\/*x:y*/`,
		escapedSlashBlock: `\\/*x*/`,
		colonEscapedInline: `\\//x:y\n`,
		escapedInline: `\\//x\n`,
		colonSlashesString: `//"x:"`,
		slashesString: `//"x"`,
		colonInline: `//x:y\n`,
		inline: `//x\n`,
		colonWeldedInline: `$//x:y\n`,
		weldedInline: `$//x\n`,
		colonString: `"x:"`,
		string: `"x"`,
		colonGroup: `(x:y)`,
		group: `(x)`,
	},
	place: {
		beforeColon: `before`,
		abuttingColon: `abutting`,
		onColonLine: `line`,
		behindBreak: `break`,
		thenBreak: `thenBreak`,
	},
	property: {
		plain: `b`,
		custom: `--b`,
		address: `url`,
	},
	value: {
		word: `red`,
		flag: `!important`,
		none: ``,
		multiLine: `red\n\tblue`,
	},
}, ({ comment, place, property, value }) => {
	switch (place) {
		case `before`: return `a { ${property} ${comment}: ${value}; }\n`
		case `abutting`: return `a { ${property}:${comment}${value}; }\n`
		case `line`: return `a { ${property}: ${comment} ${value}; }\n`
		case `break`: return `a { ${property}:\n${comment} ${value}; }\n`
		default: return `a { ${property}: ${comment}\n${value}; }\n`
	}
})

/** Every reader of `raws.between`, under every primary option it takes. */
const configs: Sweep[`configs`] = ([
	[`declaration-colon-newline-after`, [`always`, `always-multi-line`]],
	[`declaration-colon-space-after`, [`always`, `never`, `always-single-line`]],
	[`declaration-colon-space-before`, [`always`, `never`]],
	[`declaration-block-semicolon-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`declaration-block-semicolon-space-before`, [`always`, `never`]],
	[`declaration-block-trailing-semicolon`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
