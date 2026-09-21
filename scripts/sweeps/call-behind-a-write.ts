/**
 * A call read after a fix has been written earlier in the same value, with a comment standing at the write, behind it or around the call, under the three options of `function-parentheses-newline-inside`.
 *
 * Written for [#346](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/346). The rule reads every call of a value against the comment spans found before the walk. A write still moves a span where the text of a `//` comment ends in whitespace and what closes it is no line feed, the break an `always` option writes in front of the `)` lands in that whitespace and closes the comment early, which hands nothing but whitespace back to the code; whether a call is ever read against spans a write has made wrong is a question about the pairing of a written call and a later one, which `function-parentheses-breaks` and `parentheses-leading-comments` never spell, since each holds one call. Five places: the comment between two calls, at the front and at the back of the written one, in front of a nested call, and at both ends of a call holding one. Eleven comments and the value without one, a call or a lone parenthesis in the text of some; behind each stands nothing, a space, or one of the four spellings that may end a `//` comment, which differ to the syntaxes: a form feed closes one under `postcss-scss` and is its text under `postcss-less`. The run is every spelling the options tell apart.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const FORM_FEED = String.fromCodePoint(0x0c)

const COMMENTS = {
	none: ``,
	inline: `// c`,
	inlineEndingInSpace: `// c `,
	inlineCall: `// g(2)`,
	inlineCloser: `// c )`,
	inlineOpener: `// ( c`,
	inlineOpeningBlock: `// /* c`,
	block: `/* c */`,
	blockCall: `/* g(2) */`,
	blockOfInline: `/* // c */`,
	slashStarSlashCall: `/*/ g(2) */`,
	slashStarSlashCloser: `/*/ ) */`,
}

const CLOSERS = { none: ``, space: ` `, lineFeed: `\n`, pair: `\r\n`, carriageReturn: `\r`, formFeed: FORM_FEED }

const RUNS = { none: ``, space: ` `, lineBreak: `\n`, spaceThenBreak: ` \n ` }

const SECONDS = { none: ``, tight: `g(2)`, spaced: `g( 2 )`, brokenBehind: `g(2\n)`, broken: `g(\n2\n)` }

const PLACES: Record<string, (values: Record<string, string>) => string> = {
	between: ({ comment, closer, run, second }) => `f(${run}1${run})${run}${comment}${closer}${second}`,
	front: ({ comment, closer, run, second }) => `f(${run}${comment}${closer}${run}1${run}) ${second}`,
	back: ({ comment, closer, run, second }) => `f(${run}1${run}${comment}${closer}${run}) ${second}`,
	nested: ({ comment, closer, run, second }) => `f(${run}${comment}${closer}${second}${run})`,
	around: ({ comment, closer, run, second }) => `f(${run}${comment}${closer}${second}${run}${comment}${closer})`,
}

const OUTERS: Record<string, (value: string) => string> = {
	bare: (value) => value,
	call: (value) => `h(${value})`,
	brokenCall: (value) => `h(\n${value}\n)`,
}

const name: Sweep[`name`] = `call-behind-a-write`

/**
 * Keeps the first of the values spelled alike, which two places do where there is no comment.
 * @param values - The values, keyed.
 * @returns The values, each text once.
 */
function distinct (values: [string, string][]): [string, string][] {
	let spelled: Set<string> = new Set()

	return values.filter(([, value]) => {
		if (spelled.has(value)) return false

		spelled.add(value)

		return true
	})
}

const corpus: Sweep[`corpus`] = place(
	distinct(Object.entries(OUTERS).flatMap(([outerName, wrap]) => Object.entries(PLACES).flatMap(([placeName, spell]) => multiply({ comment: COMMENTS, closer: CLOSERS, run: RUNS, second: SECONDS }, spell)
		.map(([key, value]) => [`${outerName}|${placeName}|${key}`, wrap(value)] as [string, string])))),
	{ declaration: (value) => `a { b: ${value}; }\n`, customProperty: (value) => `a { --b: ${value}; }\n` },
)

const configs: Sweep[`configs`] = [
	{ rule: `function-parentheses-newline-inside`, primary: `always` },
	{ rule: `function-parentheses-newline-inside`, primary: `always-multi-line` },
	{ rule: `function-parentheses-newline-inside`, primary: `never-multi-line` },
]

export { configs, corpus, name }
