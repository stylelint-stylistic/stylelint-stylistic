import type { Node as ValueNode } from "postcss-value-parser"

import { HEX_ESCAPE_TERMINATOR, TRAILING_HEX_ESCAPE } from "../../regexps.ts"
import { type CommentSpan, findCommentSpanHolding } from "../findCommentSpans/index.ts"
import { spelledRuns } from "../spelledRuns/index.ts"

/**
 * Asks whether a word ends in a hexadecimal escape still open to the whitespace behind it.
 *
 * The escape is the last run of the word, and it is a backslash and hexadecimal digits alone: a run that has closed on its whitespace already reaches no further, and an escaped backslash in front of a digit, `10PX\\9`, opens no hexadecimal escape at all, which is what reading the runs rather than the last characters says. A seventh digit is a character of its own, so `10PX\0000611` ends in that digit and not in an escape.
 * @param word - The text of the word.
 * @returns True where the whitespace behind the word belongs to its last escape.
 */
function endsInAnOpenHexEscape (word: string): boolean {
	let last = spelledRuns(word).at(-1)

	return last !== undefined && last.escape && TRAILING_HEX_ESCAPE.test(last.text)
}

/**
 * Puts back together the words a hexadecimal escape's own whitespace parted, wherever they stand in a parsed value.
 *
 * CSS closes such an escape with one whitespace character belonging to the escape rather than to the text, so `10px\9 2PX` is one dimension token — `@csstools/css-tokenizer` reads its unit as `px`, a tab and `2PX`, and Sass, Less and `lightningcss` all print the line back exactly as it stands, none of them finding two values in it. `postcss-value-parser` reads no escape and parts the value at that whitespace, handing back the two words `10px\9` and `2PX` with a space node between them, so a rule reading each word as a dimension of its own read two where the file spells one (#526). Every such triple — a word ending in an escape open to the whitespace behind it, a space node holding exactly the one character that closes it, and a word — is rewritten in place into one word standing where the first one did and ending where the last one does, and a word so made is asked again, since a chain of them is one token too.
 *
 * Only a word is welded onto: a call standing behind such a space keeps its node, since its name is the one thing a call's node spells apart from what it holds; the grammar reads `10px\9 calc(` as a dimension whose unit ends in `calc` and then the parenthesis, and the rule that reads dimensions reaches the same unit through the hack it takes out. A comment, a divider or a string behind the space is a token of its own to every reader.
 *
 * A word standing in the text of a comment is welded onto nothing. The value parser reads no comment opened by a double slash, and hands its text back as words like any other, so a comment whose text ends in such an escape stands in front of a line break that is the escape's closing character to the reading here and the comment's own end to the file: `1PX // 10PX\9` and, on the line below, `2REM` is the dimension `1PX` and a comment to Sass and to Less, and both compile it to `1PX 2REM`. Welded, the word would open inside the comment and be passed over whole, `2REM` with it, so the comment is asked about first, at the position the word opens at, the way every walk asks it.
 * @param nodes - The nodes of a parsed value; every array of them is rewritten in place, however deep.
 * @param comments - The spans of the comments the value holds, which the nodes' positions count in; none where the caller has none to give.
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
