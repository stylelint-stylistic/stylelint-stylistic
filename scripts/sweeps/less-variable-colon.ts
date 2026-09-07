/**
 * A Less variable declaration in every spelling of the whitespace around its colon, put to every rule reading at-rules.
 *
 * Written for [#394](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/394): `postcss-less` marks a declaration `variable` only where the colon closes the name, so `@v : pink` came over as an at-rule named `v`. Every text but the control's uses the variable, so a row whose input compiles under `less.render` while its output does not is the defect. The controls are at-rules Less reads a colon at the head of the parameters in.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The variable's name, in the case the rule writes and the other. */
const NAMES: Record<string, string> = {
	lower: `v`,
	upper: `V`,
}

/** Between name and colon: the spelling the parser marks, and four it does not. */
const BEFORES: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"tab": `\t`,
	"break": `\n`,
	"twoSpaces": `  `,
}

/** Between the colon and the value. */
const AFTERS: Record<string, string> = {
	none: ``,
	space: ` `,
}

/** What the declaration holds; the last is the control, since Less reads no value in `a (b: 1px)`. */
const VALUES: Record<string, string> = {
	plain: `pink`,
	list: `pink 1px`,
	flagged: `pink !important`,
	escaped: `~"x"`,
	empty: ``,
	ruleset: `{ c: red }`,
	directive: `a (b: 1px)`,
}

/** Where the declaration stands and whether a semicolon closes it. `§` is the declaration, `¶` the use. */
const PLACES: Record<string, string> = {
	root: `§;\n¶\n`,
	block: `a {\n\t§;\n}\n¶\n`,
	blockLast: `a {\n\t§\n}\n¶\n`,
}

/**
 * Spells the use the text ends in: a call for a ruleset, a reference for a value, none for the control.
 * @param name - The variable's name.
 * @param value - What the declaration holds.
 * @returns The use.
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

/** Every rule that asks whether an at-rule is standard, under each primary. */
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
