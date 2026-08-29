import { findCommentSpans } from "../findCommentSpans/index.ts"

type CommentSpan = import("../findCommentSpans/index.ts").CommentSpan

/**
 * Spells every double slash that opens no comment out of harm's way, so that a reader which knows less about the text than {@link findCommentSpans} does cannot take one for a comment.
 *
 * `style-search` reads a double slash as the opening of an inline comment wherever it stands, the one in `url(http://x/y.png)` among them, and everything from there to the end of the line is comment text as far as it is concerned — the closing parenthesis of the address with it, so that its count of open parentheses never comes back down. The pattern that `functionCommaSpaceChecker` maps its indexes with reads the same slashes the same way. The spans say which double slash opens a comment and which only looks like one, and the second slash of every one that does not is written as a question mark here: a character no reading of this copy gives a meaning to, which is what the substitute has to be rather than one meaningless in a stylesheet — a question mark opens the query of an address, and the address is the very thing the mask is written for. A hyphen stood there until #252 gave one a meaning — `//-(` came out as `/--(`, and two hyphens open an identifier of CSS, so a parenthesis grouping an expression was read as a call's.
 *
 * The copy is as long as the text and spells it character for character everywhere else, so every position stands where it did, and the checks that follow are made against the text as it stands. A slash a comment opens on is left alone, whichever of the two it is: the `/` of the `*\/` that closes one comment and the `/` of the `/*` that opens the next spell a double slash between them, and writing over the second of those would take the comment behind it away from the reader. Inside the text of a comment the question mark goes in like anywhere else: the reader is already inside that comment when it reaches the text, and the copy is read for its code alone.
 * @param text - The text to hide the false comment openings of.
 * @param spans - The spans the comments of the text occupy in it, both kinds of them, where they are already known. A caller that leaves one out leaves the slash it opens on unguarded.
 * @returns The text, with the second slash of every false comment opening written as a question mark.
 */
export function hideFalseInlineComments (text: string, spans: (CommentSpan | import("../findInlineCommentSpans/index.ts").InlineCommentSpan)[] = findCommentSpans(text)): string {
	let openings = new Set(spans.map(({ start }) => start))
	// The characters are taken apart only where there is something to write over, and a text carrying no false opening — every text holding no double slash among them — is handed back as it came
	let hidden = null

	for (let index = text.indexOf(`//`); index !== -1; index = text.indexOf(`//`, index + 1)) {
		// The slash being written over is the second of the pair, so a comment opening either on it or on the first slash is a comment this would take away
		if (openings.has(index) || openings.has(index + 1)) continue

		// `split` cuts the text into code units, which is what the indexes of the scan count in: a character standing outside the basic plane is two of them here as it is there
		hidden ??= text.split(``)
		hidden[index + 1] = `?`
	}

	return hidden ? hidden.join(``) : text
}

export type { CommentSpan }
