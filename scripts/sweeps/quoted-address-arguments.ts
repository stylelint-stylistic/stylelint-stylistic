/**
 * A `url()` whose parentheses a string opens, with arguments behind the string, under the spellings of its name that the value parser reads in and out of its url mode.
 *
 * Written for [#560](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/560), when the rules walking a value began to read those arguments; `address-in-a-text` holds one such form alone, and no oracle holds a comma, a solidus, a number or a nested call behind a quoted address.
 */

import { multiply } from "../harness/matrix.ts"
import { RULE_OPTIONS } from "../oracles/options.ts"

import type { Sweep } from "./run.ts"

const name: Sweep[`name`] = `quoted-address-arguments`

/** Where the call stands: a declaration, a media feature, and a `src` list beside a call naming the format. */
const PLACES: Record<string, (call: string) => string> = {
	value: (call) => `a { b: ${call} 1px; c: 2px }\n`,
	media: (call) => `@media (c: ${call}) { a { b: 1px; } }\n`,
	fontFace: (call) => `@font-face { src: ${call} format("woff"), local(a); }\n`,
}

/** The name in the parser's url mode, and three spellings it reads out of it. */
const NAMES: Record<string, string> = {
	plain: `url`,
	upper: `URL`,
	hex: `\\75 rl`,
	escaped: `u\\rl`,
}

/** The run between the `(` and the string, which under `postcss-scss` opens a url token. */
const RUNS_IN_FRONT: Record<string, string> = {
	none: ``,
	space: ` `,
	lineBreak: `\n`,
}

/** The string, and one holding the parenthesis a bare address would close on. */
const ADDRESSES: Record<string, string> = {
	plain: `"a"`,
	parenthesis: `'a)b'`,
}

/** What stands behind the string: every separator and value the rules read, a comment of either kind on either side of a comma, and an unclosed bracket inside a nested call, which parts a tokenizer's reading from the parser's. */
const TAILS: Record<string, string> = {
	comma: `,f(1)`,
	spacedComma: ` , f( 1 )`,
	format: `, format("woff2")`,
	values: `,2PX #ABC .50`,
	slash: ` 1/2`,
	spacedSlash: ` 1 / 2`,
	blockComment: ` /* c */,f(1)`,
	inlineComment: ` // c\n,f(1)`,
	inlineCommentLast: `,f(1) // c\n`,
	brokenComma: `,\nf(1)`,
	bracket: `,f(a,[b)`,
	nested: `,f(g( 1 ),2)`,
}

/** The run between the arguments and the `)`. */
const RUNS_BEHIND: Record<string, string> = {
	none: ``,
	space: ` `,
}

const corpus: Sweep[`corpus`] = multiply({ place: Object.fromEntries(Object.keys(PLACES).map((key) => [key, key])), name: NAMES, front: RUNS_IN_FRONT, address: ADDRESSES, tail: TAILS, behind: RUNS_BEHIND }, ({ place, name: spelledName, front, address, tail, behind }) => {
	let wrap = PLACES[place ?? ``]

	if (!wrap) throw new Error(`Every axis names a value`)

	return wrap(`${spelledName}(${front}${address}${tail}${behind})`)
})

/** The rules asking whether a call opens an address, the ones reading what stands beside a comma or a call inside it, and `max-line-length`, which measures the address. */
const RULES = [
	`color-hex-case`,
	`declaration-bang-space-before`,
	`function-comma-newline-after`,
	`function-comma-newline-before`,
	`function-comma-space-after`,
	`function-comma-space-before`,
	`function-max-empty-lines`,
	`function-parentheses-newline-inside`,
	`function-parentheses-space-inside`,
	`function-whitespace-after`,
	`indentation`,
	`max-line-length`,
	`media-feature-parentheses-space-inside`,
	`media-feature-slash-space-after`,
	`media-feature-slash-space-before`,
	`number-leading-zero`,
	`number-no-trailing-zeros`,
	`string-quotes`,
	`unit-case`,
	`value-list-comma-newline-after`,
	`value-list-comma-space-after`,
	`value-slash-newline-after`,
	`value-slash-newline-before`,
	`value-slash-space-after`,
	`value-slash-space-before`,
]

const configs: Sweep[`configs`] = RULES.flatMap((rule) => (RULE_OPTIONS[rule] ?? []).map((primary) => ({ rule, primary })))

export { configs, corpus, name }
