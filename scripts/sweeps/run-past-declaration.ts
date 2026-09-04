/**
 * The whitespace behind the colon of a declaration that prints nothing there, where the file writes no semicolon behind it and the run therefore stands in the raw of whatever comes next.
 *
 * Written for #387. Both `declaration-colon-*-after` rules read the declaration down to the end of its value, and such a run has left it: it stands in the raw of the node written behind the declaration, and in the block's own `raws.after` where the declaration closes the block. So the corpus puts the run in every raw it can reach, spelled with every character the tokenizer reads as whitespace and two it does not, with and without a node in front of the declaration, and in every container that can hold it — a rule, a rule nested in an at-rule, an at-rule holding the declaration itself, and the declaration `postcss-scss` builds for a nested property of Sass. The root of an inline `style` attribute is the one container left unswept: it is reached only through `postcss-html`, and the runner reads a corpus as CSS, SCSS and Less. The custom property, the `!important` flag and the semicolon tail are the controls: each of the three keeps the run inside the declaration, where every reader already found it. The two `block-closing-brace-*-before` rules read the same run wherever it is the block's own, and `declaration-block-trailing-semicolon` is what moves the boundary, so all three are swept beside the two rules the issue is about.
 *
 * The top level of a stylesheet is the third place such a run can stand, and the two placements reading it are what [#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537) added: `root` writes the body as it is, so that the run reaches the end of the file, and `rootBreak` closes the file on a break behind it. Those are two raws rather than one — the `raws.after` of a stylesheet's root is the tail of the file, and the `raws.before` of a comment written behind the declaration is bounded like any other — and `no-missing-end-of-source-newline` is swept beside the rules about the colon because that tail is the raw it writes its break into.
 *
 * Every character a reader cannot tell from a space is written as an escape rather than as itself — the space and the two spaces are what they are, and everything else is spelled out: a vertical tab or a no-break space written literally reads as a space on the page, which is how the first spelling of this corpus measured the space twice over and the no-break space not at all.
 */

import { multiply, place } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** What the run is spelled with: the tokenizer's whitespace first, then two characters it reads as words rather than as whitespace. */
const RUNS: Record<string, string> = {
	nothing: ``,
	space: ` `,
	twoSpaces: `  `,
	tab: `\t`,
	breakOnly: `\n`,
	breakIndent: `\n\t`,
	crlf: `\r\n`,
	bareReturn: `\r`,
	formFeed: `\f`,
	verticalTab: `\v`,
	noBreakSpace: `\u00A0`,
}

/** What stands between the run and the closing brace, which is what claims the run: nothing, one comment, two, a comment opened by a double slash — a node of the block to `postcss-scss` and a word of the value to the other two — or the semicolon that keeps the run inside the declaration. */
const TAILS: Record<string, string> = {
	brace: ``,
	comment: `/*c*/`,
	twoComments: `/*c*/ /*d*/`,
	inlineComment: `//c\n`,
	semicolon: `;`,
}

/** What stands in front of the declaration, since the run is read of the last one alone. */
const HEADS: Record<string, string> = {
	alone: ``,
	afterDeclaration: `c: red; `,
}

/** The property, since a custom property is where PostCSS keeps a whitespace-only value in `decl.value` itself and the run never leaves the declaration. */
const PROPERTIES: Record<string, string> = {
	plain: `b`,
	custom: `--b`,
}

/** What the declaration prints behind the run, the flag being the other text that keeps the run inside the declaration — in the raw the flag is printed behind. */
const FLAGS: Record<string, string> = {
	none: ``,
	important: `!important`,
}

const name: Sweep[`name`] = `run-past-declaration`

const corpus: Sweep[`corpus`] = place(multiply({ head: HEADS, property: PROPERTIES, run: RUNS, flag: FLAGS, tail: TAILS }, ({ head, property, run, flag, tail }) => `${head}${property}:${run}${flag}${tail}`), {
	rule: (body) => `a { ${body}}\n`,
	nested: (body) => `@media all {\n\ta { ${body}}\n}\n`,
	atRule: (body) => `@font-face { ${body}}\n`,
	sassProperty: (body) => `a { font: 2px/3px { ${body}} }\n`,
	root: (body) => body,
	rootBreak: (body) => `${body}\n`,
})

/** The two rules the issue is about, the two reading the same run from the closing brace, the one that writes and removes the semicolon the boundary turns on, and the one whose break the tail of a file is. */
const configs: Sweep[`configs`] = [
	{ rule: `declaration-colon-space-after`, primary: `always` },
	{ rule: `declaration-colon-space-after`, primary: `never` },
	{ rule: `declaration-colon-space-after`, primary: `always-single-line` },
	{ rule: `declaration-colon-newline-after`, primary: `always` },
	{ rule: `declaration-colon-newline-after`, primary: `always-multi-line` },
	{ rule: `block-closing-brace-space-before`, primary: `always` },
	{ rule: `block-closing-brace-space-before`, primary: `never` },
	{ rule: `block-closing-brace-newline-before`, primary: `always` },
	{ rule: `block-closing-brace-newline-before`, primary: `never-multi-line` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `always` },
	{ rule: `declaration-block-trailing-semicolon`, primary: `never` },
	{ rule: `no-missing-end-of-source-newline`, primary: true },
]

export { configs, corpus, name }
