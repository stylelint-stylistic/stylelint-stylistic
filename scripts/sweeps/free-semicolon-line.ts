/**
 * A line a free semicolon stands alone on, under `indentation`.
 *
 * PostCSS files such a line in the leading raw of the node behind it, in the run in front of a closing brace, in a rule's `raws.ownSemicolon`, or in the root's `raws.after`, and none of the lines the rule measured was it. What stands in front picks the raw, and what stands behind picks whether the line closes on a break; a node, a comment or a brace on the semicolon's line are the controls, since that line is theirs.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the line stands: the root, a rule's block, a rule's block inside an at-rule's, two levels down, and a block whose brace stands on the last line, which is the control where nothing but the brace follows the semicolon. */
const PLACES: Record<string, string> = {
	root: `§⏎`,
	nested: `x {§⏎}⏎`,
	deep: `@media print {⏎\tx {§⏎\t}⏎}⏎`,
	braceOnTheLine: `x {§}⏎`,
}

/** What the semicolon stands behind, on a line of its own; nothing is the opening brace, or the file's start at the root. */
const PREVIOUS: Record<string, string> = {
	nothing: ``,
	rule: `⏎\ta {}`,
	atRuleBlock: `⏎\t@media screen {}`,
	declaration: `⏎\tcolor: red;`,
	comment: `⏎\t/* c */`,
	semicolon: `⏎\t;`,
}

/** The run opening the semicolon's line, a bare carriage return, a form feed and an empty line in front included. */
const RUNS: Record<string, string> = {
	none: `⏎`,
	tab: `⏎\t`,
	twoTabs: `⏎\t\t`,
	threeTabs: `⏎\t\t\t`,
	twoSpaces: `⏎  `,
	carriageReturnTab: `⏎\r\t`,
	formFeed: `⏎\f`,
	emptyLineTab: `⏎⏎\t`,
	windows: `\r⏎\t\t`,
}

/** What follows the semicolon; the last two are the controls. */
const BEHIND: Record<string, string> = {
	nothing: ``,
	nodeOnNextLine: `⏎\tb {}`,
	declarationOnNextLine: `⏎\ttop: 0;`,
	semicolonOnNextLine: `⏎\t\t;`,
	secondSemicolon: ` ;`,
	nodeOnTheLine: ` b {}`,
	commentOnTheLine: ` /* c */`,
}

const name: Sweep[`name`] = `free-semicolon-line`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, previous: PREVIOUS, run: RUNS, behind: BEHIND }, ({ place = ``, previous = ``, run = ``, behind = `` }) => place.replace(`§`, `${previous}${run};${behind}`).replaceAll(`⏎`, `\n`))

/** The rule under both spellings of its primary, under `except: ["block"]`, which moves a block's level and not a declaration's, and under `indentClosingBrace`, which moves the brace's. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`block`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { indentClosingBrace: true } },
]

export { configs, corpus, name }
