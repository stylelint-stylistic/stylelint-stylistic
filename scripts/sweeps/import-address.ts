/**
 * The address of an `@import`, under every spelling of the at-rule's name, of what stands between the name and the address, and of where the at-rule itself stands ([#552](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/552)).
 *
 * `max-line-length` is the one reader of such an address, and no oracle carries an `@import` naming a string at all: the `atRule` place of `address-in-a-text` names a `url()` and nothing else. A row says which lines the rule speaks about. The controls are a name six letters long that goes on, another at-rule taking a string, and a word between the name and the address; a branch moving one of those has read something it should not.
 */

import { keysOf, multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The spellings CSS reads as `import`, a name that merely opens with them, and another at-rule taking a string. */
const NAMES: Record<string, string> = {
	plain: `@import`,
	upper: `@IMPORT`,
	hexEscaped: `@\\69 mport`,
	longer: `@imports`,
	otherAtRule: `@charset`,
}

/** What stands between the name and the address; the grammar asks for none of it, and a word ends the wait for an address. */
const SEPARATORS: Record<string, string> = {
	none: ``,
	space: ` `,
	run: `  `,
	lineBreak: `\n`,
	blockComment: ` /*c*/ `,
	inlineComment: ` //c\n`,
	word: ` a `,
}

/** The string the at-rule names, with characters a reader may misread inside it, and the two spellings that are no address of a line: an address written as a call, and one reaching past its line. */
const ADDRESSES: Record<string, string> = {
	doubleQuoted: `"a.css"`,
	singleQuoted: `'a.css'`,
	quotedParenthesis: `"a(b).css"`,
	quotedSlashes: `"a//b.css"`,
	quotedBlockComment: `"a/*b*/.css"`,
	quotedEscapedMark: `"a\\"b.css"`,
	call: `url("a.css")`,
	bareCall: `url(a.css)`,
	quotedEscapedBreak: `"a\\\nb.css"`,
}

/** Where the at-rule stands: as a statement, with a call of its own behind it, inside each thing that is text rather than code, and in the two places a statement cannot open in at all, which the walk reads all the same ([#657](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/657)). The string is quoted with the mark its content does not hold, so that the at-rule stands inside it whichever mark the address is written with. Every combination is put to three parsers and about a seventh of the rows is a text one of them refuses; such a row is stable and moves for nobody. */
const PLACES: Record<string, (head: string) => string> = {
	statement: (head) => `${head};\na { b: 1px; }\n`,
	withCall: (head) => `${head} url(b.png) screen;\na { b: 1px; }\n`,
	insideBlockComment: (head) => `/* ${head}; */\na { b: 1px; }\n`,
	insideInlineComment: (head) => `// ${head};\na { b: 1px; }\n`,
	insideString: (head) => `a { b: ${head.includes(`"`) ? `'` : `"`}${head};${head.includes(`"`) ? `'` : `"`} 1px; }\n`,
	insideBareAddress: (head) => `a { b: url(${head}) 1px; }\n`,
	insideValue: (head) => `a { b: ${head} 1px; }\n`,
	insideSelector: (head) => `a:not(${head}) { b: 1px; }\n`,
}

const name: Sweep[`name`] = `import-address`

const corpus: Sweep[`corpus`] = multiply({ place: keysOf(PLACES), name: NAMES, separator: SEPARATORS, address: ADDRESSES }, ({ place, name: spelledName, separator, address }) => {
	let wrap = PLACES[place ?? ``]

	if (!wrap || spelledName === undefined || separator === undefined || address === undefined) throw new Error(`Every axis names a value`)

	return wrap(`${spelledName}${separator}${address}`)
})

/** `max-line-length` at five maximums across these lines' width, since a row holds what the rule said and not the length it measured: two readings of one line differ on a row only where a maximum stands between them. */
const configs: Sweep[`configs`] = ([[`max-line-length`, [15, 20, 25, 30, 40]]] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
