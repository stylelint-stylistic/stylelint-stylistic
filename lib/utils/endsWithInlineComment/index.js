/**
 * Checks whether the last thing a raw string holds is an inline comment.
 *
 * An inline comment is closed by a line break and by nothing else — by a line feed or by a
 * carriage return, the breaks every syntax reads as one — so whatever a fixer would put after
 * it, a space, a brace, a colon, a semicolon, ends up inside the comment instead. Trailing
 * whitespace does not close it either, and is therefore ignored here.
 *
 * A double slash only opens a comment where it stands in the code itself: the one in
 * `url(http://example.com)` or in `content: "//"` opens nothing, and a string reaching
 * that far is scanned rather than matched, so that neither is taken for a comment.
 *
 * Nor does one open a comment where the syntax spells none that way, and a file of plain CSS spells
 * none: `1px//c` ends in code there, and a fixer told otherwise holds back a write that would break
 * nothing. The text cannot answer that, since the two spellings are identical, so the caller does —
 * the answer being the one {@link readsInlineComments} gives for a node. It is defaulted to the
 * syntaxes that do spell such a comment, which is the answer that only ever holds a fix back.
 * @param {string} source - The raw string to look at, a `raws` value or a part of one.
 * @param {boolean} [spellsInlineComments] - False where the syntax that spelled the string writes no comment with a double slash.
 * @returns {boolean} True if the string ends with an inline comment.
 */
export function endsWithInlineComment (source, spellsInlineComments = true) {
	// Where no double slash opens a comment, no text ends with one, and the scan below has nothing
	// else it could answer with
	if (!spellsInlineComments) return false

	// Whatever a fixer writes goes where the trailing whitespace is, the line break closing
	// the comment among it, so none of that whitespace counts as closing anything here
	let text = source.trimEnd()
	let state = `code`
	let openingQuote = ``

	for (let index = 0; index < text.length; index += 1) {
		let char = text[index]
		let nextChar = text[index + 1]

		if (state === `inlineComment`) {
			// A line feed is not the only break that closes a comment: a carriage return closes one as
			// well, in Sass by its own reading of a line and in Less by the line endings it normalises
			// before parsing. A form feed is left out, though Sass ends a comment on it too, because
			// Less does not: taking a comment for one still open only ever holds a fix back, while
			// taking one for closed where it is not lets a fix write into its text.
			if (char === `\n` || char === `\r`) state = `code`

			continue
		}

		if (state === `blockComment`) {
			if (char === `*` && nextChar === `/`) {
				state = `code`
				index += 1
			}

			continue
		}

		if (state === `string`) {
			if (char === `\\`) index += 1
			else if (char === openingQuote) state = `code`

			continue
		}

		if (state === `url`) {
			if (char === `\\`) index += 1
			else if (char === `)`) state = `code`

			continue
		}

		if (char === `\\`) index += 1
		else if (char === `"` || char === `'`) {
			state = `string`
			openingQuote = char
		}
		else if (char === `/` && nextChar === `*`) {
			state = `blockComment`
			index += 1
		}
		else if (char === `/` && nextChar === `/`) {
			state = `inlineComment`
			index += 1
		}
		// An unquoted URL carries the double slash of a protocol, and a quoted one is left to the string state
		else if (char === `(` && (/(?:^|[^\w-])url\($/iu).test(text.slice(0, index + 1)) && !(/^\s*["']/u).test(text.slice(index + 1))) {
			state = `url`
		}
	}

	return state === `inlineComment`
}
