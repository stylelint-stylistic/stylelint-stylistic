/**
 * A comment standing in a declaration's value, holding a line break inside it or none, in every place the value has for one — in front of its first word, between two words, behind its last word, in front of its flag, and alone as the whole of the value — with a break, a space or nothing behind the comment, over a plain property and a custom one, and behind every run the colon rules tell apart: a single space, two, and a break. The comment in front of the colon is the control, since it is no part of the value and a break inside it makes no line of the declaration.
 *
 * Written for #389, where the two `declaration-colon-*-after` rules counted the lines of `decl.value`, the copy PostCSS builds with every comment taken out: a break spelled inside a comment, or between a comment and the word behind it, was in no line of that copy, and one declaration was single-line to `always-single-line` and to `always-multi-line` at once. The rules are the two whose lineness options read the value, the `always` and `never` options of both as controls, `declaration-colon-space-before`, which shares the checker of the space rule and takes no lineness option, and the two `declaration-block-semicolon-*-before` rules, whose lineness options read the block rather than the value and which read the run behind the colon through `writesSharedRun`, where the same reading stood a third time.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `colon-lineness`

const corpus: Sweep[`corpus`] = multiply({
	comment: {
		broken: `/*c\n*/`,
		plain: `/*c*/`,
	},
	place: {
		head: `head`,
		alone: `alone`,
		between: `between`,
		tail: `tail`,
		flag: `flag`,
		beforeColon: `before`,
	},
	gap: {
		lineBreak: `\n`,
		space: ` `,
		abutting: ``,
	},
	colonRun: {
		space: ` `,
		twoSpaces: `  `,
		lineBreak: `\n`,
	},
	property: {
		plain: `b`,
		custom: `--b`,
	},
}, ({ comment, place, gap, colonRun, property }) => {
	switch (place) {
		case `head`: return `a { ${property}:${colonRun}${comment}${gap}x; }\n`
		case `alone`: return `a { ${property}:${colonRun}${comment}${gap}; }\n`
		case `between`: return `a { ${property}:${colonRun}x ${comment}${gap}y; }\n`
		case `tail`: return `a { ${property}:${colonRun}x ${comment}${gap}; }\n`
		case `flag`: return `a { ${property}:${colonRun}x ${comment}${gap}!important; }\n`
		default: return `a { ${property} ${comment}${gap}:${colonRun}x; }\n`
	}
})

/** The two rules whose lineness options read the value, under every primary option `scripts/oracles/options.ts` lists for them, and the three controls beside them. */
const configs: Sweep[`configs`] = ([
	[`declaration-colon-newline-after`, [`always`, `always-multi-line`]],
	[`declaration-colon-space-after`, [`always`, `never`, `always-single-line`]],
	[`declaration-colon-space-before`, [`always`, `never`]],
	[`declaration-block-semicolon-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`declaration-block-semicolon-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
