/**
 * A comment opening `/*\/` in every text a value-parser rule reads, beside code spelling the same thing as the comment's text.
 *
 * Written for [#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378). The parser looks for `*\/` from the opening slash itself, so such a comment closes three characters in and the rest comes back as code, which ten rules asking only about `//` comments rewrote. The same violation stands inside the comment and beside it, so a row says whether the text is passed over and the code still read. The controls are the same text in a block comment closed where the parser closes it, and the bare violation.
 */

import type { Sweep } from "./run.ts"

/** The text a comment holds and the code beside it, one per rule. */
const TEXTS: Record<string, string> = {
	unit: `2PX`,
	fractionWithoutZero: `.5`,
	fractionWithZero: `0.5`,
	trailingZero: `1.50px`,
	singleQuoted: `'x'`,
	doubleQuoted: `"x"`,
	hex: `#FFF`,
	spacedCall: `f( 1 )`,
	tightCall: `f(1)`,
	brokenCall: `f(1,\n2)`,
	brokenCallWithBreaks: `f(\n1,\n2\n)`,
	emptyLinesInCall: `f(1,\n\n\n2)`,
	gridRow: `"a  a"`,
	spacedFeature: `( b: 2 )`,
	tightFeature: `(b: 2)`,
}

/** The comment around its text: the issue's shape, a same-width control, and none. */
const SPELLINGS: Record<string, (text: string) => string> = {
	slashStarSlash: (text) => `/*/ ${text} */`,
	block: (text) => `/** ${text} */`,
	none: () => ``,
}

/** Where the comment stands, the code beside it first so a rule reading the comment's text reports two problems. The call places catch `function-parentheses-newline-inside` writing behind the star; the address place a `/*` in a bare address read as a comment running to the next `*\/`. */
const PLACES: Record<string, (text: string, comment: string) => string> = {
	value: (text, comment) => `a { b: ${text} ${comment} 3; }\n`,
	valueLast: (text, comment) => `a { b: ${text} ${comment}; }\n`,
	callFirst: (text, comment) => `a { b: f(${comment} ${text}); }\n`,
	callLast: (text, comment) => `a { b: f(${text} ${comment}); }\n`,
	callFirstBroken: (text, comment) => `a { b: f(\n${comment} ${text}\n); }\n`,
	behindAddress: (text, comment) => `a { b: url(a/* x) ${text} ${comment} 3; }\n`,
	grid: (text, comment) => `a { grid-template-areas: ${text} ${comment} "b b"; }\n`,
	media: (text, comment) => `@media ${text} ${comment} and (c: 3) { a { b: c; } }\n`,
	atImport: (text, comment) => `@import ${text} ${comment} screen;\n`,
}

const name: Sweep[`name`] = `slash-star-slash`

const corpus: Sweep[`corpus`] = Object.entries(PLACES).flatMap(([placeName, wrap]) => Object.entries(SPELLINGS).flatMap(([spellingName, spell]) => Object.entries(TEXTS).map(([textName, text]) => [`${placeName}|${spellingName}|${textName}`, wrap(text, spell(text))] as [string, string])))

/** The ten rules of [#378](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/378) under every primary in `scripts/oracles/options.ts`, and [#275](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/275)'s four comma rules as a control. */
const configs: Sweep[`configs`] = ([
	[`color-hex-case`, [`lower`, `upper`]],
	[`function-max-empty-lines`, [0, 1]],
	[`function-parentheses-newline-inside`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-parentheses-space-inside`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
	[`named-grid-areas-alignment`, [true]],
	[`number-leading-zero`, [`always`, `never`]],
	[`number-no-trailing-zeros`, [true]],
	[`string-quotes`, [`single`, `double`]],
	[`unit-case`, [`lower`, `upper`]],
	[`function-comma-newline-after`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-newline-before`, [`always`, `always-multi-line`, `never-multi-line`]],
	[`function-comma-space-after`, [`always`, `never`, `always-single-line`, `never-single-line`]],
	[`function-comma-space-before`, [`always`, `never`, `always-single-line`, `never-single-line`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
