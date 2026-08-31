import { endsWithInlineComment } from "../endsWithInlineComment/index.ts"
import type { InlineCommentReading } from "../readsInlineComments/index.ts"

/**
 * Asks whether a fix would take the character a text ends with from outside an inline comment into one.
 *
 * Such a comment is closed by a line break, so a fix emptying the whitespace that break stands in leaves everything behind it inside the comment's text — the character the option is about among the rest. The caller spells out the two texts the character stands at the end of, the one the file holds and the one the fix would leave, and this weighs them against each other.
 *
 * The answer is yes where the character stands outside a comment as the file stands and inside one once the fix has run. Inside on both sides describes a value already broken, which the fix leaves no worse; outside on both sides describes one the fix does not reach.
 *
 * The character stands at the end of each text rather than being named apart from it, since {@link endsWithInlineComment} reads trailing whitespace as room a fix is about to write in — which is the question its other callers ask and the opposite of this one. A character trimmed away together with the break in front of it would leave that comment read as still open.
 *
 * What the fix would leave is spelled out rather than measured, since closing a gap up can bring a slash against a comment's own and open a comment that was never there.
 * @param standingText - The text as the file spells it, ending with the character the question is about.
 * @param fixedText - The text the fix would leave, ending with that same character.
 * @param reading - What the syntax the text was spelled in makes of such a comment.
 * @returns True where the character moves into a comment.
 */
export function movesEndIntoInlineComment (standingText: string, fixedText: string, reading: InlineCommentReading): boolean {
	return !endsWithInlineComment(standingText, reading) && endsWithInlineComment(fixedText, reading)
}
