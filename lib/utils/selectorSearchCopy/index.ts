import { type EscapeSpan, findCommentSpans, findEscapeSpans } from "../findCommentSpans/index.ts"
import { maskEscapes } from "../maskEscapes/index.ts"
import { maskStrings } from "../maskStrings/index.ts"

/** A `//` is taken for code: `postcss-scss` rewrites every inline comment of a selector into a block one in the parseable copy, and `postcss-less`, which leaves the pair standing, hands no such selector to a rule — `isStandardLessRule` refuses it. */
const CODE_READING = { spells: false, tokenizes: false, endsOnFormFeed: false }

/**
 * Builds the copy of a rule's selector a `style-search` scan is handed in place of the text, and the copy the whitespace beside a delimiter is read over.
 *
 * The search reads a string by rules of its own: it closes none at a quotation mark with a backslash in front, escaped or not, so everything behind the mark of `[a="b\\"]` passes for the text of a string, and it opens one at a mark inside the bare address of `:is(url(x'y))`, which the tokenizer reads as a character of the address. It reads an escape by none at all, so the `,` of `a\,b` is a comma of the list to it. Every string of the copy and every mark inside an address is written as `?`, and every escape as a letter ({@link maskEscapes}), at the same length, so every position holds. The comments stay: a quotation mark inside one opens no string for the search either, masking one would eat what stands behind it, and a caller reads them out of the copy.
 *
 * The second copy is the same but for the whitespace closing a hexadecimal escape, which stays as it is: a rule reading the run in front of a comma over it may write or take that whitespace away, since the comma closes the escape as well. The spans come back with the copies for the rule whose delimiter is the whitespace itself: a single space written over the character closing a hexadecimal escape closes the escape in its turn and leaves no combinator at all, so `selector-descendant-combinator-no-non-space` reads its run from behind the span the run opens in.
 * @param selector - The parseable copy of the selector.
 * @returns The copy the scan runs over, the copy the runs are read over, and the escape spans of the selector.
 */
export function selectorSearchCopy (selector: string): { searchString: string, runString: string, escapes: EscapeSpan[] } {
	// Every walk reads the text through, so each is spared where it cannot find anything: no mark, no string to mask; no backslash, no escape; no `/*`, no comment to find, since a `//` is code here
	if (!selector.includes(`"`) && !selector.includes(`'`) && !selector.includes(`\\`)) return { searchString: selector, runString: selector, escapes: [] }

	let comments = selector.includes(`/*`) ? findCommentSpans(selector, CODE_READING) : []
	let masked = maskStrings(selector, comments)
	let escapes = selector.includes(`\\`) ? findEscapeSpans(selector, CODE_READING) : []

	return { searchString: maskEscapes(masked, escapes), runString: maskEscapes(masked, escapes, true), escapes }
}
