import valueParser from "postcss-value-parser"

import { type CommentSpan, findCommentSpanAt, findCommentSpans } from "../findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../findInlineCommentSpans/index.ts"

/** The character a quotation mark is written as. A question mark opens nothing to `postcss-value-parser` and closes nothing, and it belongs to no name a reader of the parse looks up — `url` least of all, which no run holding one can spell; it is what {@link hideFalseInlineComments} writes for the same reason. */
const MASK = `?`

/**
 * Finds the quotation marks a comment opens a string with that reaches past the comment's own end, by asking the parser where its strings begin and end.
 *
 * The pairing is the parser's own and is read off the parse rather than worked out again: a second reading would have to carry every rule the parser pairs by — a string is closed by the next mark of its kind, an escape is two characters wherever it stands, and a mark inside a bare `url()` address is a character of one word and closes nothing, `url` spelled in those three letters and no other way — and each of those is a place two readings can part. The one the parser hands over cannot part from itself.
 *
 * A string standing wholly inside the comment is left where it is: it reaches past nothing, and taking its marks away would take from the parser what they stand around — a parenthesis among it, which the parser closes a call on wherever it can see one. A string the parser opened outside every comment is none of this module's business however far it reaches, whatever the scan made of the text it runs through.
 * @param text - The text to read.
 * @param spans - The spans its comments occupy in it.
 * @returns The indices the marks stand at, in the order the walk reaches them.
 */
function findLeakingMarks (text: string, spans: (CommentSpan | InlineCommentSpan)[]): number[] {
	let leaking: number[] = []

	valueParser(text).walk((node) => {
		if (node.type !== `string`) return

		let span = findCommentSpanAt(node.sourceIndex, spans)

		if (span && node.sourceEndIndex > span.end) leaking.push(node.sourceIndex)
	})

	return leaking
}

/**
 * Writes out of harm's way every quotation mark a comment opens a string with that runs past the comment, so that `postcss-value-parser` pairs the marks of a value the way the file spells them.
 *
 * The parser has no node for a comment opened by a double slash and closes a block comment opening `/*\/` on its own star, so the text of either reaches it as code. A mark standing in that text opens a string to it that runs to the next mark of the value — and from there on every opening mark of the file is a closing one to the parser and the other way round. Eleven rules walk that parse and pass over the nodes opening inside the comment, through {@link findCommentSpanHolding}, which answers for those nodes and says nothing of the ones behind them: the string the file spells behind the comment reached them as words of the value and a string never closed, and they reported on the text inside its quotation marks and wrote into it. A call fares the same and worse — the string opened inside the comment takes the call's closing parenthesis, so `g(2PX /*\/ " *\/ "2PX")` is never closed at all and the rules reading its parentheses go quiet (#508).
 *
 * Only such a mark is written over, and taking the others as well costs more than the fix is worth: the string a comment closes around itself hides from the parser whatever its two marks stand around, and a parenthesis the parser can see is one it closes a call on. `@media ( b: 2 /*\/ "(" *\/ ) and (c: d)` under `media-feature-parentheses-space-inside: "always"` grew by a space on every run once both marks were masked, and `g(1 /*\/ "(" *\/ 2)` lost the warnings of both `function-parentheses-*-inside` rules. What such a parenthesis is read as is [#320](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320)'s question and #329's, and no mark left standing here changes the answer.
 *
 * A mark that is written over un-hides whatever its own phantom string stood around, and that is the price of the fix rather than a corner of it that could have been kept: the string was never the file's, and what it covered is code the file spells. Where a parenthesis stood there, the parser closes on it, and the two `function-parentheses-*-inside` rules turn such a call away while `media-feature-parentheses-space-inside` has no such guard and writes at that parenthesis — `@media ( b: 2 /*\/ " ) *\/ ) and (c: d)` under its `never` option now loses a space out of the comment's text, which is [#347](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/347) reached through a block comment rather than an inline one, and its `always` option stops growing a file it used to grow for ever. Measured over a corpus of a mark and a parenthesis in one comment: 45 texts write into a comment that was left alone before, 84 stop running away.
 *
 * The parse is made again after a mark is written over, since taking one away re-pairs every mark behind it: the mark that used to close the leaking string opens one from then on, and that one may leak in its turn. A mark written over opens nothing, so no index is ever named twice and the passes are at most as many as the marks the comments hold. A value holding no comment is handed straight back and parsed not at all; of the 9 205 values and sets of parameters the fixtures of this repository spell, 9 200 need no pass, one needs a single pass and four need two.
 *
 * The mask is written over the marks alone, so a comment stays a comment: it keeps its delimiters, the parser hands back the node it always did, and the whitespace a value spells beside it is the whitespace it always was. That is what parts this from {@link blankComments}, which writes over the whole of a comment and hands the reader whitespace in its place — the answer for a rule reading the nodes of a value, and no answer for one reading the runs standing between them, which would then measure a comment's own width as whitespace of the value and write over the comment.
 *
 * The copy is as long as the text and spells it character for character everywhere else, so every position of the parse counts in the text the file spells, and a fix written at one of them lands where the file writes it.
 * @param text - The text to hide the quotation marks of the comments of.
 * @param spans - The spans its comments occupy in it, where they are already known, from either scan.
 * @returns The text, with every such mark written as a question mark.
 */
export function hideQuotesInComments (text: string, spans: (CommentSpan | InlineCommentSpan)[] = findCommentSpans(text)): string {
	if (spans.length === 0) return text

	let masked = text

	for (let leaking = findLeakingMarks(masked, spans); leaking.length > 0; leaking = findLeakingMarks(masked, spans)) {
		// `split` cuts the text into code units, which is what the indexes of the parse count in: a character standing outside the basic plane is two of them here as it is there
		let characters = masked.split(``)

		for (let index of leaking) characters[index] = MASK

		masked = characters.join(``)
	}

	return masked
}
