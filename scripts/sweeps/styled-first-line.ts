/**
 * A styled template whose first node stands on the backtick's line, under every host indentation and every tokenizer whitespace short of a break in the gap.
 *
 * Written for [#453](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/453): `indentation` adds the host's level to every node, and the first-child check wrote the host's tabs into a first node on the backtick's line. The controls, templates broken the ordinary way, must not move.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The indentation of the host line. */
const HOST_INDENTS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
	twoSpaces: `  `,
}

/** The gap between the backtick and the first node; two spaces so the run can equal a level in spaces. */
const GAPS: Record<string, string> = {
	none: ``,
	twoSpaces: `  `,
	tab: `\t`,
	formFeed: `\f`,
	carriageReturn: `\r`,
}

/** The template, host indentation at `¶` and gap at `§`; the last two are the controls. */
const TEMPLATES: Record<string, string> = {
	singleDeclaration: `\`§color: red;\``,
	singleRule: `\`§a { color: red; }\``,
	firstOnBacktickLine: `\`§color: red;\n¶\tbackground: blue;\n¶\``,
	brokenRight: `\`\n¶\tcolor: red;\n¶\``,
	brokenShort: `\`\n¶color: red;\n¶\``,
}

const name: Sweep[`name`] = `styled-first-line`

const corpus: Sweep[`corpus`] = multiply({ hostIndent: HOST_INDENTS, gap: GAPS, template: TEMPLATES }, ({ hostIndent = ``, gap = ``, template = `` }) => `function f () {\n${hostIndent}const a = styled.div${template.replaceAll(`¶`, hostIndent).replace(`§`, gap)};\n}\n`)

/** The rule under both spellings of its primary, under the styled namespace alone. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

const syntaxes: Sweep[`syntaxes`] = [`styled`]

export { configs, corpus, name, syntaxes }
