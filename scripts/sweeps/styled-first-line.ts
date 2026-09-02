/**
 * A styled template whose first node stands on the line of the backtick — a single-line template, or one whose content starts right behind the backtick — on host lines indented every way, with each whitespace the tokenizer reads short of a break standing between the backtick and the node.
 *
 * Written for #453. `indentation` adds the level of the host line to every node of a template, and one more where the template is broken over lines; a first node standing on the backtick's own line carries no indentation of the stylesheet at all, and the first-child check asked it for the host's tabs and wrote them into the template.
 *
 * The controls are the templates broken over lines the ordinary way, their first line empty: one indented one level deeper than the host and one level with it, whose warnings and fixes stand on lines of the template's own and must not move.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The indentation of the host line the expression opens on. */
const HOST_INDENTS: Record<string, string> = {
	none: ``,
	tab: `\t`,
	twoTabs: `\t\t`,
	twoSpaces: `  `,
}

/** What stands between the backtick and the first node: nothing, and the whitespace PostCSS's tokenizer reads short of a line break — spaces, a run of two of them so that it can equal a level spelled in spaces, then a tab, a form feed and a bare carriage return. */
const GAPS: Record<string, string> = {
	none: ``,
	twoSpaces: `  `,
	tab: `\t`,
	formFeed: `\f`,
	carriageReturn: `\r`,
}

/** The template, the host indentation at `¶` and the gap at `§`: a single-line declaration, a single-line rule, a template whose first node stands on the backtick's line and the rest a level deeper than the host, and the two controls. */
const TEMPLATES: Record<string, string> = {
	singleDeclaration: `\`§color: red;\``,
	singleRule: `\`§a { color: red; }\``,
	firstOnBacktickLine: `\`§color: red;\n¶\tbackground: blue;\n¶\``,
	brokenRight: `\`\n¶\tcolor: red;\n¶\``,
	brokenShort: `\`\n¶color: red;\n¶\``,
}

const name: Sweep[`name`] = `styled-first-line`

const corpus: Sweep[`corpus`] = multiply({ hostIndent: HOST_INDENTS, gap: GAPS, template: TEMPLATES }, ({ hostIndent = ``, gap = ``, template = `` }) => `function f () {\n${hostIndent}const a = styled.div${template.replaceAll(`¶`, hostIndent).replace(`§`, gap)};\n}\n`)

/** The rule under both spellings of its primary, read under the styled namespace alone. */
const configs: Sweep[`configs`] = [
	{ rule: `indentation`, primary: `tab` },
	{ rule: `indentation`, primary: 2 },
]

const syntaxes: Sweep[`syntaxes`] = [`styled`]

export { configs, corpus, name, syntaxes }
