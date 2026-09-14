import type { Container } from "postcss"

import { TRAILING_CSS_WHITESPACE, TRAILING_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"
import { isDeclaration } from "../typeGuards/index.ts"

/**
 * Sets the block's final raw where the parser filed it, the raw {@link lastNodeHoldsTheBlockAfter} names and `getBlockAfter` reads: the last node's `raws.between`, behind whatever else it holds, where that node swallowed the run. It stays there, since `declaration-block-trailing-semicolon` reads `raws.between` for it. A custom property's run is written behind its printed value through the syntax, so every copy of the value stays in step, or behind its `!important` raw ([#538](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/538)).
 * @param syntax - The syntax the rule is built over, which writes the value.
 * @param statement - The statement carrying the block.
 * @param after - The run to write.
 * @returns The statement.
 */
export function setBlockAfter (syntax: Syntax, statement: Container, after: string): Container {
	if (!lastNodeHoldsTheBlockAfter(statement)) {
		statement.raws.after = after

		return statement
	}

	let { last } = statement

	if (isDeclaration(last)) {
		if (last.important) last.raws.important = (last.raws.important ?? ` !important`).replace(TRAILING_CSS_WHITESPACE, ``) + after
		else syntax.write(last, syntax.read(last).replace(TRAILING_CSS_WHITESPACE, ``) + after)

		return statement
	}

	last.raws.between = (last.raws.between ?? ``).replace(TRAILING_WHITESPACE, ``) + after

	return statement
}
