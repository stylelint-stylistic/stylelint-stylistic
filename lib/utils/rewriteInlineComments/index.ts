import { EVERY_COMMENT_DELIMITER } from "../../regexps.ts"
import { findInlineCommentSpans, type InlineCommentSpan } from "../findInlineCommentSpans/index.ts"

/**
 * Rewrites the `//` comments of a value into block comments as `postcss-scss` fills the raw: `//` becomes `/*`, the break `*\/`, and a `*\/` or `/*` inside is split so that it closes nothing.
 * @param spelled - The value as spelled.
 * @param spans - Its `//` comment spans, where known.
 * @returns The value rewritten.
 */
export function rewriteInlineComments (spelled: string, spans: InlineCommentSpan[] = findInlineCommentSpans(spelled)): string {
	let rewritten = ``
	let index = 0

	for (let { start, end } of spans) {
		let text = spelled.slice(start + 2, end).replaceAll(EVERY_COMMENT_DELIMITER, `*//*`)

		rewritten += `${spelled.slice(index, start)}/*${text}*/`
		index = end
	}

	return `${rewritten}${spelled.slice(index)}`
}
