/**
 * A block comment beside a combinator, the one in front folded by `postcss-selector-parser` into the combinator's `raws.spaces.before`, and the run standing between the comment and the combinator.
 *
 * The checker the two combinator rules share refused to write where the combinator held such a raw, answering a print of the tree the fix no longer makes, and the warning of `selector-combinator-space-before` stood; the write is a cut of the selector's text now. A row says what each rule and option makes of the run on either side of the combinator, and whether the comment and the text around it come through the write.
 *
 * The control is the same run without a comment, so a branch moving its rows has done something else. Under `postcss-scss` the last front is a `//` comment closed by the break that opens the run; under plain CSS the pair is code, and under `postcss-less` the rule passes such a selector over, so those rows are a control too.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The combinators the rules read; the descendant one is whitespace and read by neither. */
const COMBINATORS: Record<string, string> = {
	child: `>`,
	adjacent: `+`,
	sibling: `~`,
}

/** What stands in front of the combinator, behind the first compound: nothing, a comment, or a `//` comment closed by a break. */
const FRONTS: Record<string, string> = {
	none: ``,
	block: `/* c */`,
	multiLineBlock: `/* c⏎ d */`,
	twoBlocks: `/* c *//* d */`,
	inline: `// c⏎`,
}

/** The run between the comment and the combinator, or between the compound and the combinator. */
const RUNS_IN_FRONT: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"break": `⏎`,
	"spaceBreak": ` ⏎`,
}

/** The run behind the combinator, in front of a comment or the second compound. */
const RUNS_BEHIND: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"break": `⏎`,
}

/** What stands behind the combinator's run, in front of the second compound. */
const BEHINDS: Record<string, string> = {
	none: ``,
	block: `/* e */`,
}

const name: Sweep[`name`] = `comment-at-combinator`

const corpus: Sweep[`corpus`] = multiply({ combinator: COMBINATORS, front: FRONTS, runInFront: RUNS_IN_FRONT, runBehind: RUNS_BEHIND, behind: BEHINDS }, ({ combinator = ``, front = ``, runInFront = ``, runBehind = ``, behind = `` }) => `a ${front}${runInFront}${combinator}${runBehind}${behind}b { c: d }`.replaceAll(`⏎`, `\n`))

/** The two combinator rules under every option. */
const configs: Sweep[`configs`] = [
	{ rule: `selector-combinator-space-before`, primary: `always` },
	{ rule: `selector-combinator-space-before`, primary: `never` },
	{ rule: `selector-combinator-space-after`, primary: `always` },
	{ rule: `selector-combinator-space-after`, primary: `never` },
]

export { configs, corpus, name }
