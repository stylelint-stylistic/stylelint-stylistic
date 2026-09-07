import valueParser from "postcss-value-parser"

import { type CommentSpan, findCommentSpanAt, findCommentSpans } from "../findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../findInlineCommentSpans/index.ts"

/** The mask: `?` opens and closes nothing and belongs to no name; {@link hideFalseInlineComments} writes it too. */
const MASK = `?`

/**
 * Finds the marks inside comments opening a string that runs past the comment, as the parser pairs them; a string wholly inside stays, hiding a parenthesis.
 * @param text - The value parsed.
 * @param spans - The comment spans found in the value, both kinds.
 * @returns The indices, in walk order.
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
 * Masks the quotation marks a comment opens a string with that runs past it, so that `postcss-value-parser` pairs a value's marks as the file does.
 *
 * The parser reads a `//` or `/*\/` comment's text as code, so a mark in it re-pairs every mark behind it; {@link findCommentSpanHolding} answers only for nodes opening inside the comment, so eleven rules wrote into the string behind it, and a call whose `)` the phantom string covers never closes ([#508](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/508)).
 *
 * Only such a mark is masked, since a string closed inside the comment hides a `)` from the parser ([#320](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/320), [#329](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/329)); masking both made `media-feature-parentheses-space-inside` grow a query every run. The price is un-hiding what the phantom string covered: the `function-parentheses-*-inside` rules turn such a call away, `media-feature-parentheses-space-inside` writes at it ([#347](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/347)).
 *
 * The parse is remade after each pass, since a removed mark re-pairs those behind it, at most once per mark. Unlike {@link blankComments}, the mask keeps a comment's width, so parse indexes count in the file's text.
 * @param text - The value or params to mask.
 * @param spans - Its comment spans, from either scan.
 * @returns The masked text.
 */
export function hideQuotesInComments (text: string, spans: (CommentSpan | InlineCommentSpan)[] = findCommentSpans(text)): string {
	if (spans.length === 0) return text

	let masked = text

	for (let leaking = findLeakingMarks(masked, spans); leaking.length > 0; leaking = findLeakingMarks(masked, spans)) {
		// Code units, as the parse counts
		let characters = masked.split(``)

		for (let index of leaking) characters[index] = MASK

		masked = characters.join(``)
	}

	return masked
}
