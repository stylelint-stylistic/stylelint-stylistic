/**
 * A comment behind a stylesheet's last statement, which the parser puts in the root's `raws.after` where that statement is an at-rule with params and neither block nor semicolon.
 *
 * `indentation` measured no line of that raw. The controls (a semicolon, a rule) make the comment a node of its own, and an at-rule without params keeps it in its own `raws.between`, measured already.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The first five have neither block nor semicolon, the last three are controls; `postcss-less` reads the mixin calls as at-rules, the other parsers refuse or read them otherwise. */
const STATEMENTS: Record<string, string> = {
	"import": `@import "x"`,
	"includeBrokenCall": `@include m(⏎\t1px⏎)`,
	"mixinCall": `.m()`,
	"mixinCallImportant": `.m() !important`,
	"paramless": `@foo`,
	"importSemicolon": `@import "x";`,
	"rule": `a {}`,
	"declaration": `color: pink;`,
}

/** What follows the statement; `deeper` parts `except: ["param"]` and `ignore: ["param"]` from the default. */
const TRAILING: Record<string, string> = {
	level: `⏎/* c */`,
	indented: `⏎\t/* c */`,
	deeper: `⏎\t\t/* c */`,
	inline: `⏎\t// c`,
	two: `⏎\t/* c */⏎\t\t/* d */`,
	besideAndBelow: ` /* x */⏎\t/* c */`,
	none: ``,
}

/** The run at the end of the file. */
const TAILS: Record<string, string> = {
	"none": ``,
	"break": `⏎`,
	"indented": `⏎\t`,
	"twoBreaks": `⏎⏎`,
}

/** What stands in front of the statement. */
const LEADS: Record<string, string> = {
	nothing: ``,
	rule: `a {}⏎`,
}

/** The file's line break. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `root-trailing-line`

const corpus: Sweep[`corpus`] = multiply({ lead: LEADS, statement: STATEMENTS, trailing: TRAILING, tail: TAILS, lineBreak: LINE_BREAKS }, ({ lead = ``, statement = ``, trailing = ``, tail = ``, lineBreak = `` }) => `${lead}${statement}${trailing}${tail}`.replaceAll(`⏎`, lineBreak))

/** Both primaries, and the secondaries moving a param's or brace's level. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`param`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { ignore: [`param`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { indentClosingBrace: true } },
]

export { configs, corpus, name }
