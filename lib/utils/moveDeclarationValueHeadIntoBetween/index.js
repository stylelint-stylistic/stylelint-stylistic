import { getDeclarationValue } from "../getDeclarationValue/index.js"
import { setDeclarationValue } from "../setDeclarationValue/index.js"

/**
 * Moves the head of a declaration's value into `raws.between`, so that a fix writing behind the colon can reach it.
 *
 * Where the value has a word of its own, PostCSS puts the whitespace and the comments standing in front of that word into `raws.between` itself. Where it has none, it leaves them at the head of the value's raw instead, and a fix cannot write over them there for a price worth paying: PostCSS prints that raw only while it and `decl.value` still stand for each other, and `decl.value` is not the raw with its comments taken out but the tokens of it walked one by one — a comment between two spaces leaves nothing at all behind, and a trailing space is dropped.
 *
 * Moved into `raws.between`, that head stands where PostCSS itself keeps it whenever a value has a word, and the declaration prints character for character as it stood: the stringifier lays out `prop + between + rawValue(value)` and the raw of the flag behind that, and `rawValue` gives back the raw whenever `decl.value` still stands for it, and the two are kept standing for each other whichever way the move goes. That holds of the copy each syntax prints, which is the copy {@link getDeclarationValue} reads; the default stringifier prints something else under `postcss-scss`, where a `//` comment carried out of `raws.value.scss` reaches `raws.between` spelled as the file spells it rather than rewritten into a block comment — and the file's own spelling is the one every rule of this plugin is handed. Only as much of the head is taken as the fix is about to write over, since what stands behind that is the run in front of the semicolon and belongs to whichever rule is asked about that.
 *
 * What becomes of `decl.value` goes three ways. Where PostCSS keeps a raw beside the value and the move leaves something in it, the copy is left as the parser wrote it, which is what {@link setDeclarationValue} does wherever it is called: that copy is the one saying the raw may still be printed, and leaving it untouched is what keeps the two standing for each other. It goes stale by what the move took, and that costs nothing — {@link getDeclarationValue} hands out the raw, so a rule reading a value through the pair reads the text the file prints, and the few that read `decl.value` for themselves read what they would have read had no fix run at all.
 *
 * Where the move empties that raw, the copy cannot be left: an empty raw is read as no raw at all, and `decl.value` would then be handed out for text that is no longer in the file. The raw goes with the head it held and the value is emptied to match, which is what PostCSS itself writes for a declaration whose value is nothing. Where PostCSS keeps no raw beside the value at all — a custom property whose value is nothing but whitespace — the value is the printed text itself, and the move writes it.
 * @param {import('postcss').Declaration} decl - The CSS declaration node, whose `raws.between` the parser filled: both rules pass over one whose it did not.
 * @param {number} length - How many characters of the printed value to move, never more than that value holds. Both rules hand over nothing at all where no run stands at its head — a value opening on the word it holds, and a value that is empty.
 * @returns {import('postcss').Declaration} The declaration that was passed in.
 */
export function moveDeclarationValueHeadIntoBetween (decl, length) {
	let value = getDeclarationValue(decl)
	let tail = value.slice(length)

	decl.raws.between += value.slice(0, length)

	// A raw holding nothing is read as no raw at all — {@link getDeclarationValue} answers an empty one with `decl.value`, and that copy stands for text the move has just taken away — so where the head was the whole of the value the raw goes with it and the value is emptied to match
	if (tail === ``) {
		delete decl.raws.value
		decl.value = ``

		return decl
	}

	return setDeclarationValue(decl, tail)
}
