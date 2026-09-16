/**
 * The runs on both sides of a Less mixin call's `!important`, under the rules reading the run in front of a closing brace or a semicolon.
 *
 * Written for [#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374): `postcss-less` gathers both runs into the call's `raws.between` and prints the flag behind it, so every `--fix` moved a break behind the flag in front of it, and the rules writing the run in front of the brace grew the file. The axes: the run in front of the flag, since that one stays where it is; the flag's spelling; what stands behind the flag, whitespace in the spellings the options tell apart and a block comment; what closes the call; and where it stands, a block's last node, a node with a sibling behind it, which only a semicolon allows, a nested block for `indentation`, and the stylesheet's last node, with a line behind the call or without one, where with no semicolon the parser files the run in front of the flag into the root's `raws.after`.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The run in front of the flag. */
const FRONTS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	twoSpaces: `  `,
	breakIndent: `\n\t`,
}

/** The flag as one word and spaced. */
const FLAGS: Record<string, string> = {
	word: `!important`,
	spaced: `! important`,
}

/** What stands between the flag and the closing brace or the semicolon. */
const BEHINDS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	tab: `\t`,
	breakOnly: `\n`,
	emptyLine: `\n\n`,
	spaceBreak: ` \n`,
	crlf: `\r\n`,
	comment: ` /* c */`,
	commentBreak: ` /* c */\n`,
}

/** Nothing or a semicolon behind that run. */
const CLOSERS: Record<string, string> = {
	none: ``,
	semicolon: `;`,
}

const name: Sweep[`name`] = `mixin-flag-run`

const corpus: Sweep[`corpus`] = place(multiply({ front: FRONTS, flag: FLAGS, behind: BEHINDS, closer: CLOSERS }, ({ front, flag, behind, closer }) => `.m()${front}${flag}${behind}${closer}`), {
	block: (call) => `a {\n\t${call}}\n`,
	sibling: (call) => (call.endsWith(`;`) ? `a {\n\t${call}\n\tcolor: red;\n}\n` : `a {\n\tcolor: red;\n\t${call}}\n`),
	nested: (call) => `@media all {\n\ta {\n\t\t${call}}\n}\n`,
	root: (call) => `a {}\n${call}`,
	rootLine: (call) => `a {}\n${call}\n\t/* c */\n`,
})

/** The rules writing the run in front of the brace, the one writing the semicolon, and the readers of every line. */
const configs: Sweep[`configs`] = [
	{ rule: `block-closing-brace-newline-before`, primary: `always` },
	{ rule: `block-closing-brace-newline-before`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-newline-before`, primary: `never-multi-line` },
	{ rule: `block-closing-brace-space-before`, primary: `always` },
	{ rule: `block-closing-brace-space-before`, primary: `never` },
	{ rule: `block-closing-brace-space-before`, primary: `always-single-line` },
	{ rule: `block-closing-brace-space-before`, primary: `never-multi-line` },
	{ rule: `block-closing-brace-empty-line-before`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-empty-line-before`, primary: `never` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `always` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `never` },
	{ rule: `indentation`, primary: `tab` },
	{ rule: `max-empty-lines`, primary: 0 },
	{ rule: `no-eol-whitespace`, primary: true },
]

const syntaxes: Sweep[`syntaxes`] = [`less`]

export { configs, corpus, name, syntaxes }
