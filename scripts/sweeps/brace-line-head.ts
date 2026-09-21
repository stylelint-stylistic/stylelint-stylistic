/**
 * Something standing on a closing brace's line in front of it, where the parser files it into the run between the block's last node and the brace. Behind a block it goes into the last node's `raws.ownSemicolon` instead, and behind a declaration the file spells no semicolon for it closes that declaration: the `atRule` and `bareDeclaration` places, which the run never reaches.
 *
 * Written for the reading `indentation` took of that run: the whole of its last line was the brace's indentation, so a stray semicolon there was reported at every level, and the fix, writing the run in front of the semicolon, left the warning standing. The bare runs are the controls, and so is the whitespace the tokenizer reads as a word, which no parser here takes in front of a brace at all.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run opening the brace's line: none, a level under `tab`, two levels, a level of two spaces, and the tokenizer whitespace of #452. */
const RUNS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
	twoSpaces: `  `,
	carriageReturnTab: `\r\t`,
	formFeed: `\f`,
}

/** What stands behind the run, in front of the brace; the last three are the controls, the last two whitespace the tokenizer reads as a word. */
const HEADS: Record<string, string> = {
	semicolonTight: `;`,
	semicolonSpace: `; `,
	twoSemicolons: `;;`,
	nothing: ``,
	verticalTab: `\v`,
	noBreakSpace: ` `,
}

/** Where the brace stands, its line at `§`: a rule's, an empty rule's, one behind a declaration the file spells no semicolon for, a nested rule's and an at-rule's. */
const PLACES: Record<string, string> = {
	rule: `a {\n\tcolor: red;\n§}\n`,
	emptyRule: `a {\n§}\n`,
	bareDeclaration: `a {\n\tcolor: red\n§}\n`,
	nestedRule: `@media print {\n\ta {\n\t\tcolor: red;\n§}\n}\n`,
	atRule: `@media print {\n\ta { color: red; }\n§}\n`,
}

const name: Sweep[`name`] = `brace-line-head`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, run: RUNS, head: HEADS }, ({ place = ``, run = ``, head = `` }) => place.replace(`§`, `${run}${head}`))

/** The rule under both spellings of its primary. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

export { configs, corpus, name }
