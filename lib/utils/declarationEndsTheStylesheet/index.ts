import type { Declaration } from "postcss"

import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { isRoot } from "../typeGuards/index.ts"

/**
 * Asks whether a declaration is the last node of its root, unclosed by a semicolon, so that the whitespace behind its colon runs to the stylesheet's end.
 *
 * An inline `style` attribute is left out: it closes on its quotation mark, and no rule closes its last line ([#537](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537)).
 * @param decl - The declaration.
 * @returns True where the stylesheet ends with it.
 */
export function declarationEndsTheStylesheet (decl: Declaration): boolean {
	let { parent } = decl

	if (!parent || !isRoot(parent) || isInlineStyleAttribute(parent)) return false

	return decl.next() === undefined && isLastNodeWithoutSemicolon(decl)
}
