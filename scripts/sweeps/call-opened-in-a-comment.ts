/**
 * A call whose opening parenthesis stands in the text of a `//` comment opened inside the call in front of it, with every run inside its parentheses, under the seven configurations of the two rules about those parentheses.
 *
 * Written for [#393](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/393). The shape is the one [#280](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/280) and [#312](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/312) were written over: `f(1 // c) g(` puts the `)` of the first call and the `(` of the second into the comment's text, and the break behind that `(` is what closes it, so a fix emptying the run behind the `(` comments the argument out, and the two `never-multi-line` fixes emptying both runs of a call holding nothing but a comment comment the `)` out together. Six comments, since a comment opening a block comment, a string or holding a `)` differs to a scanner; six closers behind it, since a form feed closes such a comment under `postcss-scss` and is its text under `postcss-less`, and none and a space leave the comment running into the second call; every run the options tell apart on both sides of the argument; four arguments, since a call holding nothing but a comment is the shape of #312. The corpus of `call-behind-a-write` spells a call opened in such a comment too, with its first call closed in front of the comment and the second's name glued to the comment's text, under the break rule alone; this one puts the first call's `)` into the comment, parts the second call's name from the comment's text, varies the comment and its closer and the run on either side of the argument, and runs the space rule too.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const FORM_FEED = String.fromCodePoint(0x0c)

const COMMENTS = { none: ``, inline: `// c`, inlineOpeningBlock: `// c /*`, inlineOpeningString: `// c "`, inlineCloser: `// c )`, block: `/* c */` }

const CLOSERS = { none: ``, space: ` `, lineFeed: `\n`, carriageReturn: `\r`, pair: `\r\n`, formFeed: FORM_FEED }

const RUNS = { none: ``, space: ` `, lineFeed: `\n`, pair: `\r\n`, formFeed: FORM_FEED, spaceThenBreak: ` \n `, breakThenTab: `\n\t` }

const ARGUMENTS = { none: ``, word: `2`, block: `/*b*/`, inline: `// d\n` }

const name: Sweep[`name`] = `call-opened-in-a-comment`

/**
 * Keeps the first of the values spelled alike, which the two runs around no argument are.
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
	distinct(multiply({ comment: COMMENTS, closer: CLOSERS, before: RUNS, argument: ARGUMENTS, after: RUNS }, ({ comment, closer, before, argument, after }) => `f(1 ${comment}${closer}) g(${before}${argument}${after})`)),
	{ declaration: (value) => `a { b: ${value}; }\n`, customProperty: (value) => `a { --b: ${value}; }\n` },
)

const configs: Sweep[`configs`] = [
	{ rule: `function-parentheses-space-inside`, primary: `always` },
	{ rule: `function-parentheses-space-inside`, primary: `never` },
	{ rule: `function-parentheses-space-inside`, primary: `always-single-line` },
	{ rule: `function-parentheses-space-inside`, primary: `never-single-line` },
	{ rule: `function-parentheses-newline-inside`, primary: `always` },
	{ rule: `function-parentheses-newline-inside`, primary: `always-multi-line` },
	{ rule: `function-parentheses-newline-inside`, primary: `never-multi-line` },
]

export { configs, corpus, name }
