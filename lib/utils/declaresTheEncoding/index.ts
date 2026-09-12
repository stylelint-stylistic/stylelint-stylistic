import type { AtRule } from "postcss"

import { LEADING_ENCODING_DECLARATION } from "../../regexps.ts"

/**
 * Asks whether an at-rule is the encoding declaration a decoder reads, which the fallback-encoding step of css-syntax-3 matches in the byte stream before anything is parsed, so that no rule respells it into a file declaring nothing ([#703](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/703)).
 *
 * The text answers, not the raws: the step reads bytes, and what it reads is the head of the file. So the at-rule has to stand at offset zero, which is the file's start under every syntax, and the text of its root has to open with the declaration; under `postcss-html` and styled that text is the embedded block alone, and the offset is what keeps such a block from answering yes.
 *
 * A byte-order mark is answered yes over, PostCSS taking it off the text it hands back while the offsets stay where they were. The mark outranks the declaration there, so the at-rule declares nothing either way, and the answer only ever holds a rule back.
 * @param atRule - The at-rule.
 * @returns True where the at-rule is that declaration.
 */
export function declaresTheEncoding (atRule: AtRule): boolean {
	if (atRule.name !== `charset` || atRule.source?.start?.offset !== 0) return false

	let root = atRule.root()

	if (root.first !== atRule) return false

	return LEADING_ENCODING_DECLARATION.test(root.source?.input.css ?? ``)
}
