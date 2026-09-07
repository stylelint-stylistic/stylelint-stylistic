import type { Node as ValueNode } from "postcss-value-parser"

import { HEX_ESCAPE_TERMINATOR, TRAILING_HEX_ESCAPE } from "../../regexps.ts"
import { type CommentSpan, findCommentSpanHolding } from "../findCommentSpans/index.ts"
import { spelledRuns } from "../spelledRuns/index.ts"

/**
 * Asks whether a word ends in a hexadecimal escape still open to the whitespace behind it.
 *
 * The last run must be a backslash and hexadecimal digits alone: a run closed on its whitespace reaches no further, `10PX\\9` opens none, and a seventh digit is a character of its own.
 * @param word - The text of the word.
 * @returns True where the whitespace behind the word is the escape's.
 */
function endsInAnOpenHexEscape (word: string): boolean {
	let last = spelledRuns(word).at(-1)

	return last !== undefined && last.escape && TRAILING_HEX_ESCAPE.test(last.text)
}

/**
 * Welds the words a hexadecimal escape's closing whitespace parted, in place at every depth of a parsed value.
 *
 * CSS closes such an escape with one whitespace character, so `10px\9 2PX` is one dimension token; `postcss-value-parser` reads no escape and parts it into two words with a space node between ([#526](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/526)). Every triple of a word ending in an open escape, a space node of the one closing character and a word becomes one word, asked again, a chain being one token.
 *
 * Only a word is welded onto: a call's node spells only its name, and a comment, a divider or a string is a token of its own. A word inside a `//` comment is welded onto nothing: the parser returns the comment's text as words, and a comment ending in such an escape closes on the break, so the next line's word would be passed over with the comment.
 * @param nodes - A parsed value's nodes, rewritten in place.
 * @param comments - The value's comment spans, in the nodes' positions.
 */
export function weldEscapedWords (nodes: ValueNode[], comments: CommentSpan[] = []): void {
	let at = 0

	while (at < nodes.length) {
		let word = nodes[at]
		let space = nodes[at + 1]
		let next = nodes[at + 2]

		if (word?.type === `function`) weldEscapedWords(word.nodes, comments)

		if (word?.type === `word` && space?.type === `space` && HEX_ESCAPE_TERMINATOR.test(space.value) && next?.type === `word` && endsInAnOpenHexEscape(word.value) && !findCommentSpanHolding(word, comments)) {
			nodes.splice(at, 3, { type: `word`, value: `${word.value}${space.value}${next.value}`, sourceIndex: word.sourceIndex, sourceEndIndex: next.sourceEndIndex })
			continue
		}

		at += 1
	}
}
