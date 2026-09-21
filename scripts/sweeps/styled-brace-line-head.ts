/**
 * An interpolation standing on a closing brace's line in a styled template, in front of the brace, under every host indentation and every run opening the line.
 *
 * Written for the reading `indentation` took of the run between a block's last node and its closing brace: `postcss-styled-syntax` files such an interpolation into that run — except behind a declaration the file spells no semicolon for, where it goes into the value — and the whole of its last line was read as the brace's indentation, so the line was reported at every level and the fix, writing the run in front of the interpolation, left the warning standing. An interpolation on a line of its own and a line holding the brace alone are the controls.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The indentation of the host line. */
const HOST_INDENTS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoSpaces: `  `,
}

/** The run opening the brace's line, after the host's indentation: none, a level under `tab`, two levels, a level of two spaces. */
const RUNS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
	twoSpaces: `  `,
}

/** What stands on the line in front of the brace; the last two are the controls. */
const HEADS: Record<string, string> = {
	interpolation: `\${x}`,
	interpolationSpace: `\${x} `,
	two: `\${x}\${y}`,
	ownLine: `\${x}\n¶§`,
	nothing: ``,
}

/** The template, host indentation at `¶`, the run at `§` and the head at `‡`: a rule's brace, an empty rule's, one behind a declaration the file spells no semicolon for, a nested rule's and an at-rule's. */
const TEMPLATES: Record<string, string> = {
	rule: `\`\n¶\ta {\n¶\t\tcolor: red;\n¶§‡}\n¶\``,
	emptyRule: `\`\n¶\ta {\n¶§‡}\n¶\``,
	bareDeclaration: `\`\n¶\ta {\n¶\t\tcolor: red\n¶§‡}\n¶\``,
	nestedRule: `\`\n¶\t@media print {\n¶\t\ta {\n¶\t\t\tcolor: red;\n¶§‡}\n¶\t}\n¶\``,
	atRule: `\`\n¶\t@media print {\n¶\t\ta { color: red; }\n¶§‡}\n¶\``,
}

const name: Sweep[`name`] = `styled-brace-line-head`

const corpus: Sweep[`corpus`] = multiply({ hostIndent: HOST_INDENTS, run: RUNS, head: HEADS, template: TEMPLATES }, ({ hostIndent = ``, run = ``, head = ``, template = `` }) => `function f () {\n${hostIndent}const a = styled.div${template.replace(`‡`, head).replaceAll(`¶`, hostIndent).replaceAll(`§`, run)};\n}\n`)

/** The rule under both spellings of its primary, under the styled namespace alone. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

const syntaxes: Sweep[`syntaxes`] = [`styled`]

export { configs, corpus, name, syntaxes }
