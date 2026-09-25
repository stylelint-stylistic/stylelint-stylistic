/**
 * A semicolon standing behind the break that closes a `//` comment, where the parser may keep it in the comment's text.
 *
 * Less closes a `//` comment on a bare carriage return as well as on a line feed, while `postcss-less` reads on to the line feed and keeps what follows in the comment node, so a semicolon closing nothing stands in the comment's text there. A row says which semicolons are reported and which the fix takes away.
 *
 * The break is each spelling a compiler may close the comment on, and a form feed, which Less keeps in the comment; behind it stand a semicolon alone, two, a declaration closed by its own, the same with a second, a block comment in front of one, semicolons as text of a string or an address, which are the controls, and a second one behind a mixin call or a variable. The places are behind a declaration on its line, on a line of its own, at the root and in front of a declaration.
 */

import { multiply } from "../harness/matrix.ts"

import type { Sweep } from "./run.ts"

/** The break the comment's text runs into. */
const BREAKS: Record<string, string> = {
	lineFeed: `\n`,
	carriageReturn: `\r`,
	windowsPair: `\r\n`,
	formFeed: `\f`,
	twoCarriageReturns: `\r\r`,
}

/** What stands behind the break. */
const TAILS: Record<string, string> = {
	semicolon: `;`,
	twoSemicolons: `; ;`,
	declaration: ` top: 0;`,
	declarationAndSemicolon: ` top: 0; ;`,
	commentAndSemicolon: ` /* d */ ;`,
	string: ` content: "a;;";`,
	address: ` background: url(a;;b);`,
	mixinCall: ` .m();;`,
	variable: ` @v: 1;;`,
}

/** Where the comment stands, `§` for the comment's text through its tail. */
const PLACES: Record<string, string> = {
	behindDeclaration: `a {\n\tcolor: pink; // c§\n}\n`,
	ownLine: `a {\n\tcolor: pink;\n\t// c§\n}\n`,
	root: `// c§\na {}\n`,
	inFrontOfDeclaration: `a {\n\t// c§\n\tcolor: pink;\n}\n`,
}

const name: Sweep[`name`] = `semicolon-in-inline-comment`

const corpus: Sweep[`corpus`] = multiply({ place: PLACES, brk: BREAKS, tail: TAILS }, ({ place = ``, brk = ``, tail = `` }) => place.replace(`§`, `${brk}${tail}`))

/** The rule the sweep was written for, and `declaration-block-trailing-semicolon`, which reads the semicolon closing a declaration. */
const configs: Sweep[`configs`] = [
	{ rule: `no-extra-semicolons`, primary: true },
	{ rule: `declaration-block-trailing-semicolon`, primary: `always` },
]

export { configs, corpus, name }
