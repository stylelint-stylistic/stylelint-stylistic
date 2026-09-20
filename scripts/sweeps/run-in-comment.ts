/**
 * A whitespace run standing inside a comment of a value, and the runs standing beside that comment.
 *
 * Written for 1789885007, where `no-multiple-whitespaces` walked a value's characters with no reading of comments at all: it collapsed a run standing inside one, took the character a backslash covered there, which no escape span records, and opened a string of its own on a quotation mark of a comment, which moved the run it then wrote into out of a string of the value. A row says whether the comment's own text came back as it went in and whether the runs beside it are still read.
 *
 * The comment is spelled in every way the three syntaxes tell apart: a block comment, one opening `/*\/`, which `postcss-value-parser` closes on its own star, two abutting, whose `*\/` and `/*` a search reads as a double slash, and an inline comment, which plain CSS reads as code and both preprocessors as a comment. Each holds the run in the shapes the write turns on — bare, behind an escape, behind one quotation mark and between two — and the controls hold a single space, no whitespace at all, or are no comment.
 *
 * The runs on either side are spelled glued, single and doubled, so a row says whether the value's own runs are still collapsed where the comment's are not; a break in front of the comment is an environment of its own, indentation behind a break being no run to this rule.
 *
 * The places are the ones the comment reaches by a different road: a value, a call, the parentheses of a bare address, which only Sass reads a comment inside of, a grid table, whose runs another rule owns, a custom property, whose value the parser keeps whole, a string of the value standing behind the comment, whose run is the one a mark inside the comment used to move out of that string, media parameters and a selector, which no rule reads this value's way.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The comment, and what it holds: a run in each shape the write turns on, and the controls, which hold no run. */
const COMMENTS: Record<string, string> = {
	runBlock: `/*x  y*/`,
	emptyRunBlock: `/*  */`,
	escapeRunBlock: `/*x\\\t  y*/`,
	markRunBlock: `/*x"  y*/`,
	twoMarksRunBlock: `/*"x  y"*/`,
	breakRunBlock: `/*x\n  y*/`,
	slashStarSlashRunBlock: `/*/x  y*/`,
	abuttingRunBlocks: `/*x  y*//*z  w*/`,
	runInline: `//x  y\n`,
	markRunInline: `//x"  y\n`,
	singleBlock: `/*x y*/`,
	gluedBlock: `/*xy*/`,
	none: ``,
}

/** The run in front of the comment and the one behind it. */
const RUNS: Record<string, string> = {
	glued: ``,
	single: ` `,
	doubled: `  `,
}

const name: Sweep[`name`] = `run-in-comment`

const corpus: Sweep[`corpus`] = place(
	multiply({ comment: COMMENTS, before: RUNS, after: RUNS }, ({ before = ``, comment = ``, after = `` }) => `${before}${comment}${after}`),
	{
		value: (text) => `a { b: c${text}d; e: f }\n`,
		breakValue: (text) => `a {\n\tb: c\n${text}d;\n\te: f;\n}\n`,
		call: (text) => `a { b: g(c${text}d); e: f }\n`,
		address: (text) => `a { b: url(c${text}d); e: f }\n`,
		grid: (text) => `a { grid-template-areas: "c  c"${text}"d  d" }\n`,
		customProperty: (text) => `a { --b: c${text}d; e: f }\n`,
		string: (text) => `a { b: c${text}"d  e"; f: g }\n`,
		media: (text) => `@media (a: 1)${text}and (b: 2) { c { d: e } }\n`,
		selector: (text) => `a${text}b { c: d }\n`,
	},
)

/** The rule the sweep was written for, every rule reading a run of a value or a selector beside it, and the controls: `named-grid-areas-alignment`, which owns the runs of a table, and `string-quotes`, which reads a string the comment may have opened. */
const configs: Sweep[`configs`] = ([
	[`no-multiple-whitespaces`, [true]],
	[`declaration-colon-space-after`, [`always`, `never`]],
	[`value-list-comma-space-after`, [`always`, `never`]],
	[`value-list-comma-space-before`, [`always`, `never`]],
	[`function-comma-space-after`, [`always`, `never`]],
	[`function-parentheses-space-inside`, [`always`, `never`]],
	[`media-feature-parentheses-space-inside`, [`always`, `never`]],
	[`selector-combinator-space-before`, [`always`, `never`]],
	[`selector-descendant-combinator-no-non-space`, [true]],
	[`no-eol-whitespace`, [true]],
	[`max-line-length`, [20]],
	[`indentation`, [`tab`]],
	[`named-grid-areas-alignment`, [true]],
	[`string-quotes`, [`double`, `single`]],
] as [string, unknown[]][]).flatMap(([rule, primaries]) => primaries.map((primary) => ({ rule, primary })))

export { configs, corpus, name }
