/**
 * A colon spelled inside what `raws.between` holds besides the declaration's own — a comment, in the block spelling and in the one a double slash opens, and a string — standing wherever the parser files such a thing between the property and the value, in front of every shape of value the colon rules tell apart. Four spellings of the block comment are the ones a reader may take unlike PostCSS: one opening `/*\/`, which `postcss-value-parser` closes on its own star; one whose text ends in a backslash, which `style-search` never closes; two comments abutting, whose `*\/` and `/*` the search reads as the double slash of a third; and one behind a backslash, which the comment scan reads as an escape where PostCSS's tokenizer lets no backslash escape a slash. The inline comment behind a backslash is the same divergence on the other kind; the one welded to the word in front of it opens no comment for either preprocessor's parser, neither of which breaks a word at a slash; and the string behind a bare double slash is a plain CSS file's — code to the parser, a comment to `style-search`, which then opened no string inside it. A parenthesised group stands beside them, holding a colon and holding none, since the tokenizer takes such a group whole and a colon inside it opens no declaration either — and the property is spelled `url` as well as plainly, that being the one name behind which the tokenizer takes a group whatever it holds.
 *
 * Written for #388 and #499, where `declaration-colon-newline-after` walked `raws.between` character by character and took a comment's colon for the declaration's, while the three other readers of that raw find the first colon standing outside a comment. The controls are the same comment and the same string with no colon inside, since a corpus in which every comment spells one is blind to what the branch does to the reading of the run behind the real colon; what moves on a control is the branch's doing and not the colon's.
 *
 * The rules are every reader of the raw — the three `declaration-colon-*` rules, and the two `declaration-block-semicolon-*-before` rules that read the tail behind the colon through `betweenTailAfterColon` and `sharedRunsOf` — and `declaration-block-trailing-semicolon` beside them as a control, a rule about the same declarations that reads no raw of theirs.
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

/** Every reader of `raws.between`, under every primary option `scripts/oracles/options.ts` lists for it. */
const configs: Sweep[`configs`] = ([
	[`declaration-colon-newline-after`, [`always`, `always-multi-line`]],
	[`declaration-colon-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`declaration-colon-space-before`, [`always`, `never`]],
	[`declaration-block-semicolon-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`declaration-block-semicolon-space-before`, [`always`, `never`]],
	[`declaration-block-trailing-semicolon`, [`always`, `never`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
