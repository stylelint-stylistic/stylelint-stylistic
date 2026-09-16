import { findCommentSpans } from "../findCommentSpans/index.ts"
import { maskStrings } from "../maskStrings/index.ts"

/** A `//` is taken for code: `postcss-scss` rewrites every inline comment of a selector into a block one in the parseable copy, and `postcss-less`, which leaves the pair standing, hands no such selector to a rule — `isStandardLessRule` refuses it. */
const CODE_READING = { spells: false, tokenizes: false, endsOnFormFeed: false }

/**
 * Builds the copy of a rule's selector a `style-search` scan is handed in place of the text.
 *
 * The search reads a string by rules of its own ([#739](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/739)): it closes none at a quotation mark with a backslash in front, escaped or not, so everything behind the mark of `[a="b\\"]` passes for the text of a string, and it opens one at a mark inside the bare address of `:is(url(x'y))`, which the tokenizer reads as a character of the address. Every string of the copy, and every mark inside an address, is written as `?`, at the same length, so every position holds. The comments stay: a quotation mark inside one opens no string for the search either, masking one would eat what stands behind it, and a caller reads them out of the copy.
 * @param selector - The parseable copy of the selector.
 * @returns The copy the scan runs over.
 */
export function selectorSearchCopy (selector: string): string {
	// Both walks read the text through, so each is spared where it cannot find anything: no mark, nothing to mask; no `/*`, no comment to find, since a `//` is code here
	if (!selector.includes(`"`) && !selector.includes(`'`)) return selector

	return maskStrings(selector, selector.includes(`/*`) ? findCommentSpans(selector, CODE_READING) : [])
}
