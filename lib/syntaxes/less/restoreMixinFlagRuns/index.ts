import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { TRAILING_CSS_WHITESPACE } from "../../../regexps.ts"
import { hasBlock } from "../../../utils/hasBlock/index.ts"
import { nodeString } from "../../../utils/nodeString/index.ts"

/** The roots restored already. */
let restored: WeakSet<Root> = new WeakSet()

/**
 * Parts the runs `postcss-less` merges around a mixin call's `!important` as the file spells them.
 *
 * The parser takes the flag out of the call's tokens, so the runs in front of it and behind it land in `raws.between` together, and the stringifier prints the flag behind that raw: every `--fix` moves a break behind the flag in front of it ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)). The flag's place is found by matching the printed call against the file; the run in front of it stays in `raws.between`, the run behind it goes to `raws.important`, except the whitespace a block's last call without a semicolon ends on, which is the block's `raws.after`. A call whose flag stands in front of text the parser filed as params, a `//` comment, is left as parsed.
 * @param root - The stylesheet, restored once.
 * @param result - The Stylelint result, which holds the file's syntax.
 */
export function restoreMixinFlagRuns (root: Root, result: PostcssResult): void {
	if (restored.has(root)) return

	restored.add(root)

	let css = root.source?.input.css

	if (css === undefined) return

	// An embedded stylesheet's offsets count the page, its `input.css` the block alone
	let origin = root.source?.start?.offset ?? 0

	root.walkAtRules((atRule) => {
		let important = atRule.raws.important
		let between = atRule.raws.between ?? ``
		let start = atRule.source?.start?.offset

		if (typeof important !== `string` || between === `` || hasBlock(atRule) || start === undefined) return

		let printed = nodeString(atRule, result)
		let head = printed.slice(0, printed.length - between.length - important.length)
		let spelled = css.slice(start - origin, start - origin + printed.length)

		for (let split = between.length; split >= 0; split -= 1) {
			if (head + between.slice(0, split) + important + between.slice(split) !== spelled) continue

			let behind = between.slice(split)
			let { parent } = atRule
			let blockAfter = parent && parent.last === atRule && !parent.raws.semicolon && parent.raws.after === `` ? behind.slice(behind.replace(TRAILING_CSS_WHITESPACE, ``).length) : ``

			atRule.raws.between = between.slice(0, split)
			atRule.raws.important = important + behind.slice(0, behind.length - blockAfter.length)

			if (parent && blockAfter) parent.raws.after = blockAfter

			return
		}
	})
}
