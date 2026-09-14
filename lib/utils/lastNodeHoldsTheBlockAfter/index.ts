import type { AtRule, Container, Declaration } from "postcss"

import { hasBlock } from "../hasBlock/index.ts"
import { isCustomProperty } from "../isCustomProperty/index.ts"
import { isAtRule, isDeclaration } from "../typeGuards/index.ts"

/**
 * Asks whether the node closing a block has swallowed the run in front of the closing brace.
 *
 * Behind an at-rule with neither block nor semicolon (`@extend .b`, a Less mixin call) PostCSS puts the run into the at-rule's `raws.between` and leaves `raws.after` empty. Not where a semicolon or, under `postcss-less`, an `!important` read out of a mixin call is printed behind that raw: the whitespace on both sides of the flag is collected into `between`, so the node is left alone ([#374](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/374)). Behind a custom property with no semicolon the parser hands the tokenizer nothing back, so the run stays in the value, or in `raws.important` behind a flag ([#538](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/538)). A filled `raws.after` was written by an earlier fix of the pass; a missing one is refused, since PostCSS would compute a default.
 * @param statement - The statement carrying the block.
 * @returns True where the block's last node holds that run.
 */
export function lastNodeHoldsTheBlockAfter<T extends Container> (statement: T): statement is T & { last: AtRule | Declaration } {
	let last = statement.last

	if (!last || statement.raws.semicolon || statement.raws.after !== ``) return false

	if (isDeclaration(last)) return isCustomProperty(last.prop)

	return isAtRule(last) && !hasBlock(last) && !last.raws.important
}
