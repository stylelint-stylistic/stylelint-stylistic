/**
 * A node standing on the line of a free semicolon behind a closing brace, under `indentation`.
 *
 * Written for 1789424028: behind a rule's brace PostCSS files the semicolon, with the break and the run in front of it, into the rule's `raws.ownSemicolon`, so the node's own raw held no break and its line went unmeasured. A declaration and an at-rule's block in front are the controls, since there the semicolon lands in the node's `raws.before`; so are a node on a line of its own behind the semicolon's and a semicolon with nothing behind it.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the pair stands: the root, a rule's block, and a rule's block inside an at-rule's, two levels down. */
const PLACES: Record<string, string> = {
	root: `§⏎`,
	nested: `x {⏎\t§⏎}⏎`,
	deep: `@media print {⏎\tx {⏎\t\t§⏎\t}⏎}⏎`,
}

/** What the semicolon stands behind; the last two are the controls. */
const PREVIOUS: Record<string, string> = {
	rule: `a {}`,
	ruleTight: `a{}`,
	ruleBroken: `a {⏎}`,
	atRuleBlock: `@media print {}`,
	declaration: `color: red;`,
}

/** The run opening the semicolon's line, the tokenizer whitespace of #452 and an empty line in front included. */
const RUNS: Record<string, string> = {
	none: `⏎`,
	tab: `⏎\t`,
	twoTabs: `⏎\t\t`,
	threeTabs: `⏎\t\t\t`,
	twoSpaces: `⏎  `,
	carriageReturnTab: `⏎\r\t`,
	formFeed: `⏎\f`,
	emptyLineTab: `⏎⏎\t`,
	sameLine: ` `,
}

/** What follows the semicolon; the last two are the controls. */
const BEHIND: Record<string, string> = {
	rule: ` b {}`,
	ruleTight: `b {}`,
	declaration: ` top: 0;`,
	atRule: ` @media screen {}`,
	comment: ` /* c */`,
	secondSemicolon: `; b {}`,
	nodeOnNextLine: `⏎\tb {}`,
	nothing: ``,
}

const name: Sweep[`name`] = `node-behind-free-semicolon`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, previous: PREVIOUS, run: RUNS, behind: BEHIND }, ({ place = ``, previous = ``, run = ``, behind = `` }) => place.replace(`§`, `${previous}${run};${behind}`).replaceAll(`⏎`, `\n`))

/** The rule under both spellings of its primary, under `except: ["block"]`, which moves a node's level, and under `indentClosingBrace`, which moves the brace's. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
	{ rule: `indentation`, primary: `tab`, secondary: { except: [`block`] } },
	{ rule: `indentation`, primary: `tab`, secondary: { indentClosingBrace: true } },
]

export { configs, corpus, name }
