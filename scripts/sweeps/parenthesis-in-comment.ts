/**
 * A closing parenthesis written in the text of a comment inside a media feature, under both options of the rule about those parentheses.
 *
 * Written for [#347](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/347). `postcss-value-parser` knows nothing of a `//` comment and closes a `/*\/` one on its own star, so a `)` either kind holds closes the feature to it and the fixes write inside the comment's text. Neither `slash-star-slash` nor `quote-in-comment` carries a bare `)` in a comment: their texts spell a call, whose own `)` closes that call and not the feature. Nine comment spellings, seven runs inside the parentheses, four heads and three tails. A nested call is a head of its own, since its parentheses stand outside the comment while the feature's closing one is inside it; a comment holding a balanced pair is the control that must keep being read, as are the block comment, the unclosed one and the empty spelling; the vertical tab, the no-break space and the form feed are the runs the value parser and the tokenizer disagree about. `media-feature-name-case` reads the same params and no part of this may move it.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const VERTICAL_TAB = String.fromCodePoint(0x0b)

const NO_BREAK_SPACE = String.fromCodePoint(0x00a0)

const FORM_FEED = String.fromCodePoint(0x0c)

const COMMENTS = {
	none: ``,
	inline: `// c ) d\n`,
	inlineToTheEnd: `// c )`,
	slashStarSlash: `/*/ ) */`,
	slashStarSlashWithMark: `/*/ " ) */`,
	slashStarSlashThenBlock: `/*/ ) */ /* d */`,
	balancedPair: `/*/ ( d ) */`,
	block: `/** ) */`,
	openBlock: `/* ) `,
}

const RUNS = { none: ``, space: ` `, two: `  `, tab: `\t`, verticalTab: VERTICAL_TAB, noBreakSpace: NO_BREAK_SPACE, formFeed: FORM_FEED }

const HEADS = { named: `a: 1 `, bare: ``, nestedCall: `a: b( 1 `, nestedCallClosed: `a: b( 1 ) ` }

const TAILS = { none: ``, tightFeature: ` and (b: 2)`, spacedFeature: ` and ( b: 2 )` }

const name: Sweep[`name`] = `parenthesis-in-comment`

const corpus: Sweep[`corpus`] = place(
	multiply({ comment: COMMENTS, run: RUNS, head: HEADS, tail: TAILS }, ({ comment, run, head, tail }) => `(${run}${head}${comment}${run})${tail}`),
	{ media: (query) => `@media ${query} { a { b: c; } }\n` },
)

const configs: Sweep[`configs`] = [
	{ rule: `media-feature-parentheses-space-inside`, primary: `always` },
	{ rule: `media-feature-parentheses-space-inside`, primary: `never` },
	{ rule: `media-feature-name-case`, primary: `lower` },
]

export { configs, corpus, name }
