/**
 * A backslash ending the text in front of a semicolon.
 *
 * PostCSS lets a backslash cover no whitespace and no solidus, so `red \` ends a value there; the grammar reads one in front of a line break as a delimiter and one in front of anything else as an escape. A write changing the character behind it is read with it by one of the two. Hence the backslash runs, odd and even, and the runs behind them.
 *
 * `declaration-block-semicolon-newline-after` is the control: it writes behind the semicolon, so a branch about the run in front of it should move no row.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The node: a declaration, a custom property, whose value keeps the run in front of a brace, a bodiless at-rule, and one without params, whose name `postcss-scss` ends on the backslash. */
const NODES: Record<string, string> = {
	declaration: `color: red `,
	customProperty: `--b: red `,
	atRule: `@import a `,
	bareAtRule: `@foo`,
}

/** The backslashes ending the node's text: none, one, an escaped one, and one behind that. */
const BACKSLASHES: Record<string, string> = {
	none: ``,
	one: `\\`,
	two: `\\\\`,
	three: `\\\\\\`,
}

/** The run between the backslashes and the semicolon. */
const RUNS: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"formFeed": `\f`,
	"break": `⏎`,
	"comment": `/* c */`,
}

/** Spelled or not. */
const SEMICOLONS: Record<string, string> = {
	spelled: `;`,
	unspelled: ``,
}

/** What follows in the block. */
const TAILS: Record<string, string> = {
	nothing: ``,
	declaration: ` top: 0`,
	declarationBelow: `⏎top: 0`,
}

/** The closing container. */
const PLACES: Record<string, string> = {
	sameLine: `a { § }⏎`,
	block: `a {⏎§⏎}⏎`,
	tight: `a {§}⏎`,
}

const name: Sweep[`name`] = `backslash-before-semicolon`

/** A declaration behind a node with no semicolon is a file no parser reads. */
const corpus: Sweep[`corpus`] = multiply({ place: PLACES, node: NODES, backslashes: BACKSLASHES, run: RUNS, semicolon: SEMICOLONS, tail: TAILS }, ({ place = ``, node = ``, backslashes = ``, run = ``, semicolon = ``, tail = `` }) => place.replace(`§`, `${node}${backslashes}${run}${semicolon}${tail}`).replaceAll(`⏎`, `\n`))
	.filter(([key]) => !(/\|unspelled\|(?!nothing$)/u).test(key))

/** Every rule writing the run in front of a semicolon, under each option, and the control. */
const configs: Sweep[`configs`] = [
	{ rule: `declaration-block-trailing-semicolon`, primary: `always` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `always` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `never` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `always-single-line` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `never-single-line` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `always` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `never-multi-line` },
	{ rule: `at-rule-semicolon-space-before`, primary: `always` },
	{ rule: `at-rule-semicolon-space-before`, primary: `never` },
	{ rule: `declaration-block-semicolon-newline-after`, primary: `always` },
]

export { configs, corpus, name }
