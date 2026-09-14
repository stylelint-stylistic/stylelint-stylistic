/**
 * An interpolation standing on a node's line in a styled template, in front of the node, under every host indentation and every run opening the line.
 *
 * Written for [#516](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/516): `postcss-styled-syntax` files such an interpolation into the node's `raws.before`, and `indentation` read the whole of that line as the node's indentation, so the line was reported at every level and the fix, writing the run in front of the interpolation, left the warning standing. An interpolation on a line of its own and a line holding the node alone are the controls.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The indentation of the host line. */
const HOST_INDENTS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoSpaces: `  `,
}

/** The run opening the line, after the host's indentation: none, a level under `tab`, two levels, a level of two spaces. */
const RUNS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
	twoSpaces: `  `,
}

/** What stands on the line in front of the node; the last two are the controls. */
const HEADS: Record<string, string> = {
	semicolon: `\${x}; `,
	space: `\${x} `,
	two: `\${x}; \${y}; `,
	ownLine: `\${x}\n¶§`,
	nothing: ``,
}

/** The template, host indentation at `¶`, the run at `§` and the head at `‡`. */
const TEMPLATES: Record<string, string> = {
	backtickLine: `\`‡color: red;\``,
	firstDeclaration: `\`\n¶§‡color: red;\n¶\``,
	laterDeclaration: `\`\n¶\tcolor: red;\n¶§‡top: 0;\n¶\``,
	nestedDeclaration: `\`\n¶\ta {\n¶\t§‡color: red;\n¶\t}\n¶\``,
	rule: `\`\n¶§‡a { color: red; }\n¶\``,
}

const name: Sweep[`name`] = `styled-interpolation-line`

const corpus: Sweep[`corpus`] = multiply({ hostIndent: HOST_INDENTS, run: RUNS, head: HEADS, template: TEMPLATES }, ({ hostIndent = ``, run = ``, head = ``, template = `` }) => `function f () {\n${hostIndent}const a = styled.div${template.replace(`‡`, head).replaceAll(`¶`, hostIndent).replaceAll(`§`, run)};\n}\n`)

/** The rule under both spellings of its primary, under the styled namespace alone. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

const syntaxes: Sweep[`syntaxes`] = [`styled`]

export { configs, corpus, name, syntaxes }
