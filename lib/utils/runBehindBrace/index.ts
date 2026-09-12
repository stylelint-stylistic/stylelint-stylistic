import type { ChildNode } from "postcss"

import { LEADING_CSS_WHITESPACE, WHITESPACE_OR_NOTHING } from "../../regexps.ts"

/** The leading raw of the node behind a closing brace, parted as both `block-closing-brace-*-after` rules read it. */
export type BraceRun = {

	/** The one semicolon both rules skip in front of the run, or nothing. */
	semicolon: string,

	/** The whitespace behind it, which is the run both rules judge: the break rule by its first character, the space rule by its first two. */
	run: string,

	/** Whether a further semicolon stands behind that run, which neither option can write over without crossing it; the run itself may be whitespace all the same. */
	holdsASemicolon: boolean,
}

/**
 * Parts the raw the two rules about the run behind a closing brace read.
 *
 * PostCSS keeps a stray semicolon and the whitespace in front of it in the block's own `raws.ownSemicolon`, so a semicolon reaching this raw is a second one; both rules skip one of them and judge what stands behind it ([#698](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/698)).
 * @param node - The node the run stands in front of.
 * @returns The parts; an empty run where the raw is no string, as a node another plugin inserted carries none.
 */
export function runBehindBrace (node: ChildNode): BraceRun {
	let before = node.raws.before

	if (typeof before !== `string`) return { semicolon: ``, run: ``, holdsASemicolon: false }

	let semicolon = before.startsWith(`;`) ? `;` : ``
	let rest = before.slice(semicolon.length)

	return {
		semicolon,
		run: (rest.match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0],
		holdsASemicolon: !WHITESPACE_OR_NOTHING.test(rest),
	}
}
