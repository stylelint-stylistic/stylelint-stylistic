/**
 * A comment opening `/*\/`, standing in every text one of the rules that walk a value with `postcss-value-parser` reads, beside code of the value spelling the same thing the comment's text spells.
 *
 * Written for #378. CSS closes a comment on the first `*\/` behind its opening, and the parser looks for that delimiter from the opening slash itself, so a comment opening `/*\/` closes three characters in to the parser and everything the file wrote behind that slash comes back as words, strings and calls of the value. Ten rules asked whether a node stands in a comment of the kind a double slash opens and of no other, and read such a text as code: a unit written there was recased, a fraction gained or lost its zero, a string its quotes, a call its spacing, a row of the grid its alignment. The corpus puts the same violation inside the comment and beside it, so that a row says two things at once — whether the comment's text is passed over, and whether the code beside it is still read.
 *
 * The controls are the same text in a block comment closed where the parser closes it, `/* … *\/`, which no rule ever read as code, and the bare violation with no comment at all: a branch that moves either has done something other than it meant to.
 */

import type { Sweep } from "./run.ts"

/** The text a comment holds and the code standing beside it, one pair per rule of the ten. The two are one and the same text, so that whatever the rule says about the code it would say about the comment's text if it read it. */
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

/** How the comment is spelled around its text: the shape of the issue, the control of the same width the parser closes where CSS does, and no comment at all. */
const SPELLINGS: Record<string, (text: string) => string> = {
	slashStarSlash: (text) => `/*/ ${text} */`,
	block: (text) => `/** ${text} */`,
	none: () => ``,
}

/** Where the comment stands: in a declaration's value beside the same text, first and last inside a call's parentheses, behind a bare address holding a slash and a star, in a grid's rows, between the parameters of a media query and of an import. The code beside the comment goes first, so that a rule reading the comment's text reports two problems where it should report one. The call places were written after the first run of this sweep, which held no comment inside a call and so could not see `function-parentheses-newline-inside` writing its break behind the star the parser closes such a comment on; the address place after a review of the same branch found a `/*` inside a bare address read as a comment running to the next `*\/` of the value, which took the code between for the comment's. */
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

/** The ten rules of #378 under every primary option `scripts/oracles/options.ts` lists for them, and the four comma rules #275 moved the same way, as a control. */
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
