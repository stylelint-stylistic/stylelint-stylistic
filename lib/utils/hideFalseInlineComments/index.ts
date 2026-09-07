import { type CommentSpan, findCommentSpans } from "../findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../findInlineCommentSpans/index.ts"

/**
 * Writes the second slash of every `//` that opens no comment as `?`, so a reader that knows less than {@link findCommentSpans} cannot take it for a comment.
 *
 * `style-search` reads a `//` anywhere, `url(http://x/y.png)` included, as a comment to the end of the line, so its count of open parentheses never comes back down; the pattern `functionCommaSpaceChecker` maps indexes with reads it the same way. A `?` is a character no reading of the copy gives a meaning to; a hyphen stood there until [#252](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/252), and `//-(` came out as `/--(`, an identifier. Positions hold. A slash a comment opens on is left alone whichever of the two it is: `*\/` closing one comment and `/*` opening the next spell a `//` between them.
 * @param text - The value or file to copy.
 * @param spans - The comment spans of the text, both kinds, where known; a span left out leaves its slash unguarded.
 * @returns The text with every false opening masked.
 */
export function hideFalseInlineComments (text: string, spans: (CommentSpan | InlineCommentSpan)[] = findCommentSpans(text)): string {
	let openings = new Set(spans.map(({ start }) => start))
	// A text with no false opening is returned as it came
	let hidden = null

	for (let index = text.indexOf(`//`); index !== -1; index = text.indexOf(`//`, index + 1)) {
		// A comment opening on either slash would be taken away
		if (openings.has(index) || openings.has(index + 1)) continue

		// `split` cuts into code units, which the scan's indexes count in too
		hidden ??= text.split(``)
		hidden[index + 1] = `?`
	}

	return hidden ? hidden.join(``) : text
}
