/**
 * A comment in a declaration's value, with a line break or none, at its head, between two words, at its tail, in front of the flag, and as the whole value; with a break, a space or nothing behind it; over a plain and a custom property; behind a single space, two spaces and a break after the colon. The comment in front of the colon is the control.
 *
 * Written for [#389](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/389): the two `declaration-colon-*-after` rules counted the lines of `decl.value`, which PostCSS builds with every comment taken out. The controls are `declaration-colon-space-before`, with no lineness option, and the two `declaration-block-semicolon-*-before` rules, reading the run through `writesSharedRun`.
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

/** Every primary `scripts/oracles/options.ts` lists for the two rules and the three controls. */
const configs: Sweep[`configs`] = ([
	[`declaration-colon-newline-after`, [`always`, `always-multi-line`]],
	[`declaration-colon-space-after`, [`always`, `never`, `always-single-line`]],
	[`declaration-colon-space-before`, [`always`, `never`]],
	[`declaration-block-semicolon-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`declaration-block-semicolon-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
