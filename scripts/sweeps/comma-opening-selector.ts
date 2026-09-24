/**
 * A comma opening a selector, where the run in front of it lies in `raws.before` rather than in the text the selector rules read.
 *
 * `selector-list-comma-newline-before` under `always` wrote the break into the selector, the next parse carried it into that raw, the comma opened the selector again, and every `--fix` run grew the file by a line. A row says what each rule of the two comma families makes of such a comma, and what the rules writing that raw make of the file around it.
 *
 * The control is a selector naming something in front of the comma, in every spelling of the run the options part — none, a space, a break, two tabs, a comment — so a branch moving its rows has done something else. The leads spell what the raw holds, from nothing through whitespace without a break to a break with indentation behind it, and each corpus text stands both at the root and inside a block, where the raw is the nested rule's.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** Where the rule stands; the text goes in place of the marker. */
const ENVIRONMENTS: Record<string, string> = {
	root: `«rule»`,
	nested: `x {⏎«rule»⏎}`,
}

/** What stands in front of the rule, whose trailing run the parser carries into its `raws.before`; the last two leave a node of their own in front of the run. */
const LEADS: Record<string, string> = {
	"nothing": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"break": `⏎`,
	"twoBreaks": `⏎⏎`,
	"breakTab": `⏎\t`,
	"rule": `a {}⏎`,
	"comment": `/* c */⏎`,
}

/** The first five open the selector with the comma, the last five are controls naming something in front of it; the two holding a comment make the syntax hand the rules `raws.selector.raw` rather than the selector PostCSS stores. */
const SELECTORS: Record<string, string> = {
	opening: `,b`,
	openingSpaced: `, b`,
	openingTwo: `,b,c`,
	openingBreak: `,b⏎,c`,
	openingComment: `,/* c */b`,
	named: `b,c`,
	namedSpace: `b ,c`,
	namedBreak: `b⏎,c`,
	namedTabs: `b\t\t,c`,
	namedComment: `b/* c */,c`,
}

/** The file's line break. */
const LINE_BREAKS: Record<string, string> = {
	lf: `\n`,
	crlf: `\r\n`,
}

const name: Sweep[`name`] = `comma-opening-selector`

const corpus: Sweep[`corpus`] = multiply({ environment: ENVIRONMENTS, lead: LEADS, selector: SELECTORS, lineBreak: LINE_BREAKS }, ({ environment = ``, lead = ``, selector = ``, lineBreak = `` }) => environment.replace(`«rule»`, `${lead}${selector} { c: d }`).replaceAll(`⏎`, lineBreak))

/** Both comma families over the selector, and the three rules that write the raw the run lies in. */
const configs: Sweep[`configs`] = [
	{ rule: `selector-list-comma-newline-before`, primary: `always` },
	{ rule: `selector-list-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `selector-list-comma-newline-before`, primary: `never-multi-line` },
	{ rule: `selector-list-comma-space-before`, primary: `always` },
	{ rule: `selector-list-comma-space-before`, primary: `never` },
	{ rule: `selector-list-comma-space-before`, primary: `always-single-line` },
	{ rule: `selector-list-comma-space-before`, primary: `never-single-line` },
	{ rule: `selector-list-comma-newline-after`, primary: `always` },
	{ rule: `selector-list-comma-newline-after`, primary: `always-multi-line` },
	{ rule: `selector-list-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `selector-list-comma-space-after`, primary: `always` },
	{ rule: `selector-list-comma-space-after`, primary: `never` },
	{ rule: `indentation`, primary: `tab` },
	{ rule: `max-empty-lines`, primary: 1 },
	{ rule: `no-empty-first-line`, primary: true },
]

export { configs, corpus, name }
