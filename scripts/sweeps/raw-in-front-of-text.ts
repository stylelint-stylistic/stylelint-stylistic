/**
 * A delimiter opening the text a rule reads, where the run in front of it lies in the raw the parser filed it in rather than in that text.
 *
 * `expectBeforeAllowingIndentation` walked back only through the text, met its head and warned, so `@media⏎,a`, `x {}⏎,a {}` and `a { grid-area:⏎/ 2 }` were asked for a break that stood in the file already. A row says what each rule of the three families makes of such a delimiter, and what the space twins and the `-after` rules make of the same file.
 *
 * The raw is spelled without whitespace, with one space, two, a tab, one break, two, a break with a tab or with spaces behind it, a lone carriage return, and with a comment on either side of the break and with no break at all, since an at-rule keeps a comment in `raws.afterName` and a declaration in `raws.between` while a rule leaves it a node of its own. The control is a text naming something in front of the delimiter, where the run lies in the text as it always did, so a branch moving its rows has done something else.
 *
 * A row is one fix pass, so a growth ended rather than a warning taken away does not show here: `value-slash-newline-before` writes at the head of a value and settles on this branch where the base grew the file every run, which a probe measures instead.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the text stands; the raw goes in place of the first marker and the text in place of the second. */
const COMMA_ENVIRONMENTS: Record<string, string> = {
	atRuleParams: `@media«raw»«text» { a { b: c } }`,
	selectorHead: `«raw»«text» { b: c }`,
	selectorBehindRule: `x {}«raw»«text» { b: c }`,
	selectorNested: `x {«raw»«text» { b: c }}`,
}

/** The same for a value, whose raw is the tail of `raws.between` behind the colon. */
const SLASH_ENVIRONMENTS: Record<string, string> = {
	declarationValue: `a { grid-area:«raw»«text» }`,
}

/** What the raw holds. A comment is filed in the raw of an at-rule and of a declaration, and left a node of its own in front of a rule. */
const RAWS: Record<string, string> = {
	"nothing": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"break": `⏎`,
	"twoBreaks": `⏎⏎`,
	"breakTab": `⏎\t`,
	"breakSpaces": `⏎  `,
	"carriageReturn": `\r`,
	"comment": ` /*x*/ `,
	"commentThenBreak": ` /*x*/⏎`,
	"breakThenComment": `⏎/*x*/ `,
}

/** The first three open the text with the comma, the last three are controls naming something in front of it. */
const COMMA_TEXTS: Record<string, string> = {
	opening: `,b`,
	openingTwo: `,b,c`,
	openingBreak: `,b⏎,c`,
	named: `b,c`,
	namedSpace: `b ,c`,
	namedBreak: `b⏎,c`,
}

/** The first two open the value with the solidus, the last three are controls. */
const SLASH_TEXTS: Record<string, string> = {
	opening: `/2`,
	openingTwo: `/2/3`,
	named: `1/2`,
	namedSpace: `1 /2`,
	namedBreak: `1⏎/2`,
}

/** The file's line break. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `raw-in-front-of-text`

const corpus: Sweep[`corpus`] = [
	...multiply({ environment: COMMA_ENVIRONMENTS, raw: RAWS, text: COMMA_TEXTS, lineBreak: LINE_BREAKS }, ({ environment = ``, raw = ``, text = ``, lineBreak = `` }) => environment.replace(`«raw»`, raw).replace(`«text»`, text).replaceAll(`⏎`, lineBreak)),
	...multiply({ environment: SLASH_ENVIRONMENTS, raw: RAWS, text: SLASH_TEXTS, lineBreak: LINE_BREAKS }, ({ environment = ``, raw = ``, text = ``, lineBreak = `` }) => environment.replace(`«raw»`, raw).replace(`«text»`, text).replaceAll(`⏎`, lineBreak)),
]

/** The three rules whose reading changes, their space twins and their `-after` siblings, which read the other side of the same delimiter. */
const configs: Sweep[`configs`] = [
	{ rule: `media-query-list-comma-newline-before`, primary: `always` },
	{ rule: `media-query-list-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `media-query-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `media-query-list-comma-space-before`, primary: `always` },
	{ rule: `media-query-list-comma-space-before`, primary: `never` },
	{ rule: `media-query-list-comma-newline-after`, primary: `always` },
	{ rule: `selector-list-comma-newline-before`, primary: `always` },
	{ rule: `selector-list-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `selector-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `selector-list-comma-space-before`, primary: `always` },
	{ rule: `selector-list-comma-space-before`, primary: `never` },
	{ rule: `selector-list-comma-newline-after`, primary: `always` },
	{ rule: `value-slash-newline-before`, primary: `always` },
	{ rule: `value-slash-newline-before`, primary: `always-multi-line` },
	{ rule: `value-slash-newline-before`, primary: `never-multi-line` },
	{ rule: `value-slash-space-before`, primary: `always` },
	{ rule: `value-slash-space-before`, primary: `never` },
	{ rule: `value-slash-newline-after`, primary: `always` },
	{ rule: `indentation`, primary: `tab` },
	{ rule: `max-empty-lines`, primary: 1 },
]

export { configs, corpus, name }
