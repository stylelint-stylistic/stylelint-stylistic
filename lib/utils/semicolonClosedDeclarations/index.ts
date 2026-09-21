import type { Container, Declaration } from "postcss"

import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { isAtRule, isRule } from "../typeGuards/index.ts"

/**
 * Lists the declarations of a block whose semicolons the four `declaration-block-semicolon-*` rules read, those of the blocks it holds included, since a line of theirs is a line of the block.
 * @param block - The rule, the at-rule or the root of an inline `style` attribute.
 * @returns The declarations, in the file's order.
 */
export function semicolonClosedDeclarations (block: Container): Declaration[] {
	let declarations: Declaration[] = []

	block.walkDecls((decl) => {
		let { parent } = decl

		if (parent && (isAtRule(parent) || isRule(parent) || isInlineStyleAttribute(parent)) && !isLastNodeWithoutSemicolon(decl)) declarations.push(decl)
	})

	return declarations
}
