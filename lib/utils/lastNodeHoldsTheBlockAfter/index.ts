import type { AtRule, Container } from "postcss"

import { hasBlock } from "../hasBlock/index.ts"
import { isAtRule } from "../typeGuards/index.ts"

/**
 * Asks whether the node closing a block has swallowed the run in front of the closing brace.
 *
 * Behind an at-rule with neither block nor semicolon (`@extend .b`, a Less mixin call) PostCSS puts the run into the at-rule's `raws.between` and leaves `raws.after` empty. Not where a semicolon or, under `postcss-less`, an `!important` read out of a mixin call is printed behind that raw: the whitespace on both sides of the flag is collected into `between`, so the node is left alone ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)). A filled `raws.after` was written by an earlier fix of the pass; a missing one is refused, since PostCSS would compute a default.
 * @param statement - The statement carrying the block.
 * @returns True where the block's last node holds that run.
 */
export function lastNodeHoldsTheBlockAfter<T extends Container> (statement: T): statement is T & { last: AtRule } {
	let last = statement.last

	if (!last || !isAtRule(last) || hasBlock(last)) return false

	return !statement.raws.semicolon && statement.raws.after === `` && !last.raws.important
}
