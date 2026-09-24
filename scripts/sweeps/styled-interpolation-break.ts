/**
 * An interpolation holding a break in a styled template, in every place `indentation` reads a line's head behind it, under every run opening that line.
 *
 * `postcss-styled-syntax` files an interpolation into a node's `raws.before` or a block's `raws.after` whole, and `indentation` took a break inside it for the one opening the node's line, so the check measured a line of JavaScript and the fix wrote into a string of the host file. An interpolation with no break is the control.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The indentation of the host line. */
const HOST_INDENTS: Record<string, string> = {
	tab: `\t`,
	twoSpaces: `  `,
}

/** The run opening the measured line, after the host's indentation: none, a level under `tab`, two levels, a level of two spaces. */
const RUNS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
	twoSpaces: `  `,
}

/** The interpolation: a string holding a break, the same with indentation behind it, a nested template, a call broken over lines, a Windows pair, and the control with no break. */
const INTERPOLATIONS: Record<string, string> = {
	string: `\${\`\n\`}`,
	indentedString: `\${\`\n\t\t\`}`,
	nested: `\${css\`\n\ttop: 0;\n\`}`,
	call: `\${f(\n\t1,\n)}`,
	windowsPair: `\${\`\r\n\`}`,
	control: `\${x}`,
}

/** The template, host indentation at `¶`, the run at `§` and the interpolation at `‡`. */
const TEMPLATES: Record<string, string> = {
	nodeLine: `\`\n¶§‡; color: red;\n¶\``,
	laterNodeLine: `\`\n¶\tcolor: red;\n¶§‡ top: 0;\n¶\``,
	ownLineBeforeNode: `\`\n¶\tcolor: red;\n¶\t‡\n¶§top: 0;\n¶\``,
	backtickLine: `\`‡\n¶§color: red;\n¶\``,
	ownLineBeforeBrace: `\`\n¶\ta {\n¶\t\tcolor: red;\n¶\t\t‡\n¶§}\n¶\``,
	braceLine: `\`\n¶\ta {\n¶\t\tcolor: red;\n¶§‡}\n¶\``,
	nestedNodeLine: `\`\n¶\ta {\n¶\t§‡ color: red;\n¶\t}\n¶\``,
}

const name: Sweep[`name`] = `styled-interpolation-break`

const corpus: Sweep[`corpus`] = multiply({ hostIndent: HOST_INDENTS, run: RUNS, interpolation: INTERPOLATIONS, template: TEMPLATES }, ({ hostIndent = ``, run = ``, interpolation = ``, template = `` }) => `function f () {\n${hostIndent}const a = styled.div${template.replace(`‡`, interpolation).replaceAll(`¶`, hostIndent).replaceAll(`§`, run)};\n}\n`)

/** The rule under both spellings of its primary, under the styled namespace alone. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

const syntaxes: Sweep[`syntaxes`] = [`styled`]

export { configs, corpus, name, syntaxes }
