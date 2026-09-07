import { endsWithInlineComment } from "../endsWithInlineComment/index.ts"
import type { InlineCommentReading } from "../readsInlineComments/index.ts"

/**
 * Asks whether a fix would move the last character of a text from outside a `//` comment into one: a fix emptying the run holding the comment's closing break leaves everything behind it inside the comment.
 *
 * The character ends each text rather than being named apart, since {@link endsWithInlineComment} reads trailing whitespace as room a fix is about to write in. The fixed text is spelled out, since closing a gap can bring a slash against a comment's own.
 * @param standingText - The text as the file spells it, ending with the character.
 * @param fixedText - The text the fix would leave, ending with the same character.
 * @param reading - The syntax's reading of such a comment.
 * @returns True where the character moves into a comment.
 */
export function movesEndIntoInlineComment (standingText: string, fixedText: string, reading: InlineCommentReading): boolean {
	return !endsWithInlineComment(standingText, reading) && endsWithInlineComment(fixedText, reading)
}
