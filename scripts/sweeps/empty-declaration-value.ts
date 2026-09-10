/**
 * A declaration with nothing but whitespace, comments and an important flag behind its colon, put to every rule reading that run or the semicolon behind it.
 *
 * Written for [#358](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/358): Less reads such a declaration to its semicolon, so `never` of `declaration-block-trailing-semicolon` used to leave a file the compiler refuses. No oracle corpus holds a declaration with no value, and a custom property parts from an ordinary one on the flag alone, hence the two properties. The last two runs are the controls, a value standing where the others spell none.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** An ordinary declaration and a custom property, which take the flag differently. */
const PROPERTIES: Record<string, string> = {
	ordinary: `color`,
	custom: `--x`,
}

/** What stands behind the colon. The last two are the controls. */
const RUNS: Record<string, string> = {
	"none": ``,
	"space": ` `,
	"twoSpaces": `  `,
	"tab": `\t`,
	"break": `\n`,
	"blockComment": ` /* c */`,
	"inlineComment": ` // c`,
	"commentThenSpace": ` /* c */ `,
	"flag": ` !important`,
	"flagAgainstColon": `!important`,
	"commentThenFlag": ` /* c */ !important`,
	"value": ` pink`,
	"valueAndFlag": ` pink !important`,
}

/** Where the declaration stands and whether a semicolon closes it; `§` is the declaration. */
const PLACES: Record<string, string> = {
	block: `a {\n\t§;\n}\n`,
	blockNoSemicolon: `a {\n\t§\n}\n`,
	sameLine: `a { § }\n`,
	sibling: `a {\n\t§;\n\ttop: 0;\n}\n`,
	nested: `@media all {\n\ta {\n\t\t§;\n\t}\n}\n`,
}

const name: Sweep[`name`] = `empty-declaration-value`

const corpus: Sweep[`corpus`] = multiply({ property: PROPERTIES, run: RUNS, place: PLACES }, ({ property = ``, run = ``, place = `` }) => place.replace(`§`, `${property}:${run}`))

/** Every rule reading the run behind a declaration's colon, the semicolon behind the declaration or the flag between them, each under every primary `scripts/oracles/options.ts` names for it. */
const configs: Sweep[`configs`] = [
	{ rule: `declaration-bang-space-after`, primary: `always` },
	{ rule: `declaration-bang-space-after`, primary: `never` },
	{ rule: `declaration-bang-space-before`, primary: `always` },
	{ rule: `declaration-bang-space-before`, primary: `never` },
	{ rule: `declaration-block-semicolon-newline-after`, primary: `always` },
	{ rule: `declaration-block-semicolon-newline-after`, primary: `always-multi-line` },
	{ rule: `declaration-block-semicolon-newline-after`, primary: `never-multi-line` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `always` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `always-multi-line` },
	{ rule: `declaration-block-semicolon-newline-before`, primary: `never-multi-line` },
	{ rule: `declaration-block-semicolon-space-after`, primary: `always` },
	{ rule: `declaration-block-semicolon-space-after`, primary: `never` },
	{ rule: `declaration-block-semicolon-space-after`, primary: `always-single-line` },
	{ rule: `declaration-block-semicolon-space-after`, primary: `never-single-line` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `always` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `never` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `always-single-line` },
	{ rule: `declaration-block-semicolon-space-before`, primary: `never-single-line` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `always` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `never` },
	{ rule: `declaration-colon-newline-after`, primary: `always` },
	{ rule: `declaration-colon-newline-after`, primary: `always-multi-line` },
	{ rule: `declaration-colon-space-after`, primary: `always` },
	{ rule: `declaration-colon-space-after`, primary: `never` },
	{ rule: `declaration-colon-space-after`, primary: `always-single-line` },
	{ rule: `declaration-colon-space-before`, primary: `always` },
	{ rule: `declaration-colon-space-before`, primary: `never` },
	{ rule: `no-extra-semicolons`, primary: true },
]

export { configs, corpus, name }
