/**
 * A stray semicolon behind a rule's closing brace, under every rule reading a block's text.
 *
 * Written for [#562](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/562): PostCSS files the semicolon and the whitespace in front of it in the rule's `raws.ownSemicolon` and prints that raw behind the brace, so a reading of the printed node ended on the semicolon rather than on the brace. The axes: where the rule stands, how its block is spelled, the run in front of the brace, which a break makes every block multi-line, and the run in front of the semicolon, which a break made a multi-line text of a single-line block. The shapes with no semicolon are the controls.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

/** Every rule importing `blockString`; the rules reaching it through `whitespaceBeforeSemicolon` or `writesSharedRun` read it only about a configured neighbour, which a sweep of one rule cannot show. */
const RULES = [
	`block-closing-brace-empty-line-before`,
	`block-closing-brace-newline-after`,
	`block-closing-brace-newline-before`,
	`block-closing-brace-space-after`,
	`block-closing-brace-space-before`,
	`block-opening-brace-newline-after`,
	`block-opening-brace-newline-before`,
	`block-opening-brace-space-after`,
	`block-opening-brace-space-before`,
	`declaration-block-semicolon-newline-after`,
	`declaration-block-semicolon-newline-before`,
	`declaration-block-semicolon-space-after`,
	`declaration-block-semicolon-space-before`,
	`declaration-block-single-line-max-declarations`,
]

const name: Sweep[`name`] = `stray-semicolon-behind-block`

const corpus: Sweep[`corpus`] = multiply({
	place: {
		top: `§⏎`,
		nested: `x {⏎\t§⏎}⏎`,
		nestedThenDecl: `x {⏎\t§⏎\ty: z;⏎}⏎`,
	},
	block: {
		spaced: `a { b: c; d: e¶}`,
		tight: `a{b:c;d:e¶}`,
		broken: `a {⏎\t\tb: c;⏎\t\td: e¶}`,
	},
	brace: {
		space: ` `,
		nothing: ``,
		lineBreak: `⏎\t`,
	},
	semicolon: {
		none: ``,
		abutting: `;`,
		space: ` ;`,
		lineBreak: `⏎\t;`,
	},
}, ({ place, block, brace, semicolon }) => (place ?? ``).replace(`§`, (block ?? ``).replace(`¶`, brace ?? ``) + (semicolon ?? ``)).replaceAll(`⏎`, `\n`))

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

export { configs, corpus, name }
