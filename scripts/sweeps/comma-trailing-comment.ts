/**
 * A comment and the runs around it standing beside the comma of a call, under the fourteen configurations of the four rules about those commas.
 *
 * Written for 1789508660. The copy a call's commas are checked over has the comments taken out, and a comment followed by whitespace alone carries the whitespace in front of itself off with it, so the run read behind a comma was the one past the comment while the fix wrote the one in front of it. The comment stands on either side of the comma, since the rules of the two sides read it apart; six comment spellings, four runs on each side, and three tails, one of them a nested call, whose commas a rule writes in the same pass. A comment carrying a break of its own is there because taking it out of the copy changes how many lines the arguments have, and a pair of comments because the break rule is moved past the first of them alone.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

const COMMENTS = { none: ``, block: `/*c*/`, inline: `//c`, slashStarSlash: `/*/c*/`, brokenBlock: `/*c\nd*/`, twoBlocks: `/*c*/ /*d*/` }

const RUNS = { none: ``, space: ` `, lineBreak: `\n\t\t`, spaceThenBreak: ` \n\t\t` }

const TAILS = { word: `2`, list: `2, 3`, call: `g(4, 5)` }

const name: Sweep[`name`] = `comma-trailing-comment`

const corpus: Sweep[`corpus`] = place(
	[
		...multiply({ lead: RUNS, comment: COMMENTS, run: RUNS, tail: TAILS }, ({ lead, comment, run, tail }) => `f(1,${lead}${comment}${run}${tail})`).map(([key, value]) => [`behind|${key}`, value] as [string, string]),
		...multiply({ lead: RUNS, comment: COMMENTS, run: RUNS, tail: TAILS }, ({ lead, comment, run, tail }) => `f(1${lead}${comment}${run},${tail})`).map(([key, value]) => [`front|${key}`, value] as [string, string]),
	],
	{ declaration: (value) => `a {\n\tb: ${value};\n}\n` },
)

const configs: Sweep[`configs`] = [
	{ rule: `function-comma-space-after`, primary: `always` },
	{ rule: `function-comma-space-after`, primary: `never` },
	{ rule: `function-comma-space-after`, primary: `always-single-line` },
	{ rule: `function-comma-space-after`, primary: `never-single-line` },
	{ rule: `function-comma-space-before`, primary: `always` },
	{ rule: `function-comma-space-before`, primary: `never` },
	{ rule: `function-comma-space-before`, primary: `always-single-line` },
	{ rule: `function-comma-space-before`, primary: `never-single-line` },
	{ rule: `function-comma-newline-after`, primary: `always` },
	{ rule: `function-comma-newline-after`, primary: `always-multi-line` },
	{ rule: `function-comma-newline-after`, primary: `never-multi-line` },
	{ rule: `function-comma-newline-before`, primary: `always` },
	{ rule: `function-comma-newline-before`, primary: `always-multi-line` },
	{ rule: `function-comma-newline-before`, primary: `never-multi-line` },
]

export { configs, corpus, name }
