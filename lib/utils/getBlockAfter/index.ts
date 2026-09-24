import type { Container } from "postcss"

import { TRAILING_CSS_WHITESPACE, TRAILING_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { lastNodeHoldsTheBlockAfter } from "../lastNodeHoldsTheBlockAfter/index.ts"
import { isDeclaration } from "../typeGuards/index.ts"

/**
 * Returns the run between a block's last node and its closing brace, wherever the parser filed it.
 *
 * Where {@link lastNodeHoldsTheBlockAfter} says the last node swallowed the run, it is the trailing whitespace of that node's `raws.between`, or of a custom property's printed value or `raws.important`; otherwise `raws.after` as it stands, since PostCSS computes a default for a missing one. A value's run is read as the tokenizer reads whitespace, since a no-break space or a vertical tab there is a word the value keeps.
 * @param syntax - The syntax the rule is built over, which reads the value.
 * @param statement - The block's statement.
 * @returns The run, or undefined without a raw.
 */
export function getBlockAfter (syntax: Syntax, statement: Container): string | undefined {
	if (!lastNodeHoldsTheBlockAfter(statement)) return statement.raws.after

	let { last } = statement

	if (isDeclaration(last)) {
		let text = last.important ? last.raws.important ?? ` !important` : syntax.read(last)

		return text.slice(text.replace(TRAILING_CSS_WHITESPACE, ``).length)
	}

	let between = last.raws.between ?? ``

	return between.slice(between.replace(TRAILING_WHITESPACE, ``).length)
}
