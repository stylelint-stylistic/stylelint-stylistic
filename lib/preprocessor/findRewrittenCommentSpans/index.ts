import type { InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { rewriteInlineComments } from "../../utils/rewriteInlineComments/index.ts"

/**
 * Finds the spans the inline comments of a value occupy in it, out of the two copies `postcss-scss` keeps of that value: one with every inline comment rewritten into a block comment, and one spelled as the file spells it. Only the comments set the two apart, so the first character they disagree on is the second character of one — the asterisk of a block comment against the second slash of an inline one. A comment ends with its line in both copies, and none of them holds a line break, so the next line break puts the two back in step whatever the rewriting did to the text in between, and the distance between them there is what a position behind the comment has to be moved by to be read in the rewritten copy.
 *
 * Everything here rests on the two copies being the two copies of one text, which holds only until a rule writes to one of them and leaves the other where it was — a line break of the raw taken away, a colour spelled differently in it, a space put in front of it. The reading is therefore checked against the raw before it is handed out, by rewriting the comments it found the way the syntax rewrote them, and nothing is returned unless the raw comes back character for character.
 * @param rewritten - The copy the comments were rewritten in.
 * @param spelled - The copy spelled as the file spells it.
 * @returns The spans, in the coordinates of the spelled copy, or `null` if the two copies have gone out of step.
 */
export function findRewrittenCommentSpans (rewritten: string, spelled: string): InlineCommentSpan[] | null {
	let spans: InlineCommentSpan[] = []
	let rewrittenIndex = 0
	let spelledIndex = 0

	while (rewrittenIndex < rewritten.length && spelledIndex < spelled.length) {
		if (rewritten[rewrittenIndex] === spelled[spelledIndex]) {
			rewrittenIndex += 1
			spelledIndex += 1

			continue
		}

		// The asterisk of a block comment against the second slash of an inline one, and the first slash of both already behind. Anything else is two texts that have parted ways.
		if (spelledIndex === 0 || rewritten[rewrittenIndex] !== `*` || spelled[spelledIndex] !== `/` || spelled[spelledIndex - 1] !== `/`) return null

		let lineBreakIndex = spelled.indexOf(`\n`, spelledIndex)
		let rewrittenLineBreakIndex = rewritten.indexOf(`\n`, rewrittenIndex)
		let runsToTheEnd = lineBreakIndex === -1 || rewrittenLineBreakIndex === -1

		spans.push({
			start: spelledIndex - 1,
			end: runsToTheEnd ? spelled.length : lineBreakIndex,
			delta: runsToTheEnd ? rewritten.length - spelled.length : rewrittenLineBreakIndex - lineBreakIndex,
		})

		if (runsToTheEnd) break

		spelledIndex = lineBreakIndex
		rewrittenIndex = rewrittenLineBreakIndex
	}

	// A reading of one copy against the other proves nothing by itself: the walk above sees where the two part company, not whether they ever meant the same text. Rewriting the comments it found the way the syntax rewrites them does prove it — the raw comes back or it does not.
	return rewriteInlineComments(spelled, spans) === rewritten ? spans : null
}
