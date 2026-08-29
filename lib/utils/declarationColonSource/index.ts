import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { getDeclarationValue } from "../getDeclarationValue/index.ts"

/**
 * Builds the text a rule reads to see what a declaration prints behind its colon.
 *
 * PostCSS hands the whitespace standing after the colon to `raws.between` only where the value has a word of its own to leave behind. Where it has none — where all that stands behind the colon is whitespace, comments and a flag — `raws.between` ends at the colon and the run stays at the head of the value instead: in the raw of it where PostCSS keeps one, and in `decl.value` itself where it does not. So the value is laid behind the property and that raw, in the copy of it the syntax prints, and the run is in this text wherever the declaration keeps it.
 *
 * The characters tacked onto the end give the checker something that is not whitespace to read behind the colon. Either caller reads two at the most — one asks about a space and the other about one character only — and the third stands against the branch of the checker that reads a character further than that, which neither of them reaches. A declaration with no value at all — `a { color:; }` — ends at the colon, and both halves of the checker return without a word where the character they ask about is not there, so `always` would pass such a declaration over in silence.
 *
 * `declarationString` lays out the same property, raw and value; behind them it prints the flag — the raw of it where PostCSS kept one, and a spelling of its own where it did not — since what it is written for is to give the declaration back as the file spells it, for a position to be counted in. This text is written to be read past the colon instead, and where the file spells nothing behind the value there has to be something there to read.
 * @param decl - The CSS declaration node.
 * @returns The declaration as the file prints it, up to the end of the value, with a sentinel behind it.
 */
export function declarationColonSource (decl: import("postcss").Declaration): string {
	return `${decl.toString().slice(0, declarationValueIndex(decl))}${getDeclarationValue(decl)}xxx`
}
