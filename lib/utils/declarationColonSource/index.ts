import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { valueAsClosed } from "../closedBySemicolon/index.ts"
import { declarationThroughValue } from "../declarationThroughValue/index.ts"
import { runPastDeclaration } from "../runPastDeclaration/index.ts"

/**
 * Builds the text a rule reads to see what a declaration prints behind its colon.
 *
 * PostCSS hands the whitespace standing after the colon to `raws.between` only where the value has a word of its own to leave behind. Where it has none — where all that stands behind the colon is whitespace, comments and a flag — `raws.between` ends at the colon and the run stays at the head of the value instead: in the raw of it where PostCSS keeps one, and in `decl.value` itself where it does not. So the text opens on the declaration down to the end of its value, as {@link declarationThroughValue} prints it, and the run is in this text wherever the declaration keeps it.
 *
 * Where the declaration prints nothing at all behind its colon and the file writes no semicolon behind it, the run reaches none of those three copies and stands in the raw of whatever the file wrote next, so it is laid out behind the value in its turn. `runPastDeclaration` is what says whether there is such a run and where it stands, and the text a rule reads is the whole of what the file spells behind the colon either way — save at the end of a stylesheet, where that raw is the one the stylesheet closes its last line in and `runPastDeclaration` hands it to nobody, so the text ends at the colon whatever stands behind it. The two rules that read behind the colon pass such a declaration over before they ask for this text at all; `declaration-colon-space-before` asks for it and reads in front of the colon, where the run is no part of what it counts.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
 *
 * The characters tacked onto the end give the checker something that is not whitespace to read behind the colon. Either caller reads two at the most — one asks about a space and the other about one character only — and the third stands against the branch of the checker that reads a character further than that, which neither of them reaches. A declaration with no value at all — `a { color:; }` — ends at the colon, and both halves of the checker return without a word where the character they ask about is not there, so `always` would pass such a declaration over in silence.
 *
 * Where the file writes a semicolon behind the declaration and `declaration-block-trailing-semicolon` is configured to take it away, the run in front of it goes with it, and the run behind the colon is then the one that ran on past the declaration; where it writes none and that rule is configured to put one there, the run behind the declaration is the block's. Either boundary is read as that rule will leave it, so that the text is the same at every rule's turn whatever order the configuration lists the rules in (#536).
 *
 * The flag is nowhere in this text: {@link declarationString} prints it behind the same value, and where the file spells nothing behind the value there has to be something here to read past the colon instead.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The CSS declaration node.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The declaration as the file prints it, up to the end of the value and of whatever run ran on past it, with a sentinel behind that.
 */
export function declarationColonSource (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	let through = declarationThroughValue(syntax, decl)
	// The run `declaration-block-trailing-semicolon` takes away with the semicolon is no run behind the colon, so it is taken off the end of the text here as that rule will take it off the value (#536)
	let taken = syntax.read(decl).length - valueAsClosed(syntax, decl, result).length

	return `${through.slice(0, through.length - taken)}${runPastDeclaration(syntax, decl, result) ?? ``}xxx`
}
