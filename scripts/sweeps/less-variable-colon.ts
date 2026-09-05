/**
 * A Less variable declaration in every spelling of the whitespace around its colon, put to every rule that reads at-rules.
 *
 * Written for #394. `postcss-less` marks a variable declaration `variable` only where the colon closes the name, so `@v : pink` came over as an at-rule named `v` carrying `: pink`, and `at-rule-name-case` renamed it. The corpus crosses the name's case with the whitespace in front of the colon and behind it, with what the declaration holds — a plain value, one with a flag, an escaped string, nothing, a detached ruleset, and a control Less reads a directive in rather than a value — with whether a semicolon closes it, and with where it stands. Every text but the control's carries a use of the variable behind the declaration, so that the Less compiler can tell a renamed declaration from an unchanged one: the fixed text of every row is put through `less.render` beside the corpus, and a row whose input compiles while its output does not is the defect.
 *
 * The controls are the at-rules Less reads a colon at the head of the parameters in: `@page :first`, in both cases, and `@supports :x`. A branch about the variable declaration should move none of them.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The name of the variable, in the case the rule under test writes and in the other. */
const NAMES: Record<string, string> = {
	lower: `v`,
	upper: `V`,
}

/** The whitespace between the name and the colon: the one spelling the parser marks, and the four it does not. */
const BEFORES: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"tab": `\t`,
	"break": `\n`,
	"twoSpaces": `  `,
}

/** The whitespace between the colon and the value. */
const AFTERS: Record<string, string> = {
	none: ``,
	space: ` `,
}

/** What the declaration holds. The last is the control: Less reads no value in `a (b: 1px)` and prints the at-rule back as it stands, so a use of that variable would fail on the base and the branch alike, and the text carries none. */
const VALUES: Record<string, string> = {
	plain: `pink`,
	list: `pink 1px`,
	flagged: `pink !important`,
	escaped: `~"x"`,
	empty: ``,
	ruleset: `{ c: red }`,
	directive: `a (b: 1px)`,
}

/** Where the declaration stands, and whether a semicolon closes it: at the root, in a block, and last in a block with no semicolon of its own, which is the one place a Less file may leave it unclosed. `§` is the declaration and `¶` the use of the variable. */
const PLACES: Record<string, string> = {
	root: `§;\n¶\n`,
	block: `a {\n\t§;\n}\n¶\n`,
	blockLast: `a {\n\t§\n}\n¶\n`,
}

/**
 * Spells the use of the variable a text ends in: a call for a detached ruleset, a reference for a value, and no use at all for the control.
 * @param name - The variable's name.
 * @param value - What the declaration holds.
 * @returns The rule using the variable.
 */
function useOf (name: string, value: string): string {
	if (value === VALUES.directive) return `b { c: d }`
	if (value === VALUES.ruleset) return `b { @${name}(); }`

	return `b { c: @${name} }`
}

const name: Sweep[`name`] = `less-variable-colon`

const corpus: Sweep[`corpus`] = [
	...multiply({ name: NAMES, before: BEFORES, after: AFTERS, value: VALUES, place: PLACES }, ({ name: variable = ``, before = ``, after = ``, value = ``, place = `` }) => place.replace(`§`, `@${variable}${before}:${after}${value}`).replace(`¶`, useOf(variable, value))),
	[`control|page|lower`, `@page :first { margin: 0 }\n`],
	[`control|page|upper`, `@PAGE :first { margin: 0 }\n`],
	[`control|page|spaced`, `@page : first { margin: 0 }\n`],
	[`control|supports`, `@supports :x { a { b: c } }\n`],
]

/** Every rule that asks the syntax whether an at-rule is standard, under each of its primary options. */
const configs: Sweep[`configs`] = [
	{ rule: `at-rule-name-case`, primary: `lower` },
	{ rule: `at-rule-name-case`, primary: `upper` },
	{ rule: `at-rule-name-newline-after`, primary: `always` },
	{ rule: `at-rule-name-newline-after`, primary: `always-multi-line` },
	{ rule: `at-rule-name-space-after`, primary: `always` },
	{ rule: `at-rule-name-space-after`, primary: `always-single-line` },
	{ rule: `at-rule-semicolon-newline-after`, primary: `always` },
	{ rule: `at-rule-semicolon-space-before`, primary: `always` },
	{ rule: `at-rule-semicolon-space-before`, primary: `never` },
	{ rule: `no-extra-semicolons`, primary: true },
]

export { configs, corpus, name }
