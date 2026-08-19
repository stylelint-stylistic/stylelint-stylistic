import { findInlineCommentSpans } from "../findInlineCommentSpans/index.js"

/** @typedef {import('../findInlineCommentSpans/index.js').InlineCommentSpan} InlineCommentSpan */

/**
 * Spells every double slash that opens no comment out of harm's way, so that a reader which knows
 * less about the text than {@link findInlineCommentSpans} does cannot take one for a comment.
 *
 * `style-search` reads a double slash as the opening of an inline comment wherever it stands, the
 * one in `url(http://x/y.png)` among them, and everything from there to the end of the line is
 * comment text as far as it is concerned — the closing parenthesis of the address with it, so that
 * its count of open parentheses never comes back down. The pattern that `functionCommaSpaceChecker`
 * maps its indexes with reads the same slashes the same way. The spans say which double slash opens
 * a comment and which only looks like one, and the second slash of every one that does not is
 * written as a hyphen here: a character no reader of a comment, of a string, of a function name or
 * of an address gives a meaning to.
 *
 * The copy is as long as the text and spells it character for character everywhere else, so every
 * position stands where it did, and the checks that follow are made against the text as it stands.
 * A double slash opening a real comment is left alone, and so is one whose second slash opens a
 * block comment right behind it, since writing over either would hide from the reader a comment
 * that is there. Inside the text of a comment the hyphen goes in like anywhere else: the reader is
 * already inside that comment when it reaches the text, and the copy is read for its code alone.
 * @param {string} text - The text to hide the false comment openings of.
 * @param {InlineCommentSpan[]} [spans] - The spans its inline comments occupy in it, where they are already known.
 * @returns {string} The text, with the second slash of every false comment opening written as a hyphen.
 */
export function hideFalseInlineComments (text, spans = findInlineCommentSpans(text)) {
	let openings = new Set(spans.map(({ start }) => start))
	// The characters are taken apart only where there is something to write over, and a text carrying
	// no false opening — every text holding no double slash among them — is handed back as it came
	let hidden = null

	for (let index = text.indexOf(`//`); index !== -1; index = text.indexOf(`//`, index + 1)) {
		// The slash being written over is the second of the pair, so a comment opening either on it or
		// on the first slash is a comment this would take away
		if (openings.has(index) || openings.has(index + 1)) continue

		// That same slash opens a block comment where a `*` follows it, and `/*` is a delimiter the
		// reader needs as much as the text needs its own
		if (text[index + 2] === `*`) continue

		// `split` cuts the text into code units, which is what the indexes of the scan count in: a
		// character standing outside the basic plane is two of them here as it is there
		hidden ??= text.split(``)
		hidden[index + 1] = `-`
	}

	return hidden ? hidden.join(``) : text
}
