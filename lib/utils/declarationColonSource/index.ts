import type { Declaration } from "postcss"
import type { PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { runPastDeclaration } from "../runPastDeclaration/index.ts"

/**
 * Builds the text a rule reads to see what a declaration prints behind its colon.
 *
 * PostCSS hands the whitespace standing after the colon to `raws.between` only where the value has a word of its own to leave behind. Where it has none — where all that stands behind the colon is whitespace, comments and a flag — `raws.between` ends at the colon and the run stays at the head of the value instead: in the raw of it where PostCSS keeps one, and in `decl.value` itself where it does not. So the value is laid behind the property and that raw, in the copy of it the syntax prints, and the run is in this text wherever the declaration keeps it.
 *
 * Where the declaration prints nothing at all behind its colon and the file writes no semicolon behind it, the run reaches none of those three copies and stands in the raw of whatever the file wrote next, so it is laid out behind the value in its turn. `runPastDeclaration` is what says whether there is such a run and where it stands, and the text a rule reads is the whole of what the file spells behind the colon either way.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
 *
 * The characters tacked onto the end give the checker something that is not whitespace to read behind the colon. Either caller reads two at the most — one asks about a space and the other about one character only — and the third stands against the branch of the checker that reads a character further than that, which neither of them reaches. A declaration with no value at all — `a { color:; }` — ends at the colon, and both halves of the checker return without a word where the character they ask about is not there, so `always` would pass such a declaration over in silence.
 *
 * `declarationString` lays out the same property, raw and value; behind them it prints the flag — the raw of it where PostCSS kept one, and a spelling of its own where it did not — since what it is written for is to give the declaration back as the file spells it, for a position to be counted in. This text is written to be read past the colon instead, and where the file spells nothing behind the value there has to be something there to read.
 * @param syntax - The syntax the rule is built over.
 * @param decl - The CSS declaration node.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The declaration as the file prints it, up to the end of the value and of whatever run ran on past it, with a sentinel behind that.
 */
export function declarationColonSource (syntax: Syntax, decl: Declaration, result: PostcssResult): string {
	return `${decl.toString().slice(0, declarationValueIndex(decl))}${syntax.read(decl)}${runPastDeclaration(syntax, decl, result) ?? ``}xxx`
}
