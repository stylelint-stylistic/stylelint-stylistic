import type { InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { rewriteInlineComments } from "../../utils/rewriteInlineComments/index.ts"

/**
 * Finds the spans of a value's inline comments from the two copies `postcss-scss` keeps, one with each inline comment rewritten into a block comment and one as the file spells it: the copies first disagree at a block comment's asterisk against an inline one's second slash, and the next line break puts them back in step.
 *
 * A rule may write to one copy and leave the other, so the found comments are rewritten the way the syntax did, and nothing is returned unless the raw comes back exactly.
 * @param rewritten - The copy with the comments rewritten.
 * @param spelled - The copy as the file spells it.
 * @returns The spans in the spelled copy, or `null` where the copies differ.
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

		// A block comment's asterisk against an inline one's second slash; anything else is two texts that have parted ways
		if (spelledIndex === 0 || rewritten[rewrittenIndex] !== `*` || spelled[spelledIndex] !== `/` || spelled[spelledIndex - 1] !== `/`) return null

		let lineBreakIndex = spelled.indexOf(`\n`, spelledIndex)
		let rewrittenLineBreakIndex = rewritten.indexOf(`\n`, rewrittenIndex)
		let runsToTheEnd = lineBreakIndex === -1 || rewrittenLineBreakIndex === -1

		spans.push({ start: spelledIndex - 1, end: runsToTheEnd ? spelled.length : lineBreakIndex })

		if (runsToTheEnd) break

		spelledIndex = lineBreakIndex
		rewrittenIndex = rewrittenLineBreakIndex
	}

	// The walk sees where the two part, not whether they ever meant one text
	return rewriteInlineComments(spelled, spans) === rewritten ? spans : null
}
