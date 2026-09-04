import type { Declaration } from "postcss"

import { isInlineStyleAttribute } from "../isInlineStyleAttribute/index.ts"
import { isLastNodeWithoutSemicolon } from "../isLastNodeWithoutSemicolon/index.ts"
import { isRoot } from "../typeGuards/index.ts"

/**
 * Asks whether a declaration is the last thing the stylesheet holding it is written with, so that whatever whitespace stands behind its colon runs on to the end of that stylesheet.
 *
 * Nothing of the stylesheet stands behind such a declaration: it is the last node of a root, no node of any kind is written behind it, and no semicolon closes it. PostCSS asks no block of a declaration, so a stylesheet may hold one at its top level; a declaration inside a block is bounded by the brace closing that block wherever it stands.
 *
 * The root of an inline `style` attribute is the one root left out. A stylesheet embedded in a `<style>` element of an HTML page or in a template of JavaScript ends as a file does, and the rules about a stylesheet's last line speak of it; an attribute closes on its own quotation mark, and no rule closes its last line.
 * https://github.com/stylelint-stylistic/stylelint-stylistic/issues/537
 * @param decl - The declaration to ask about.
 * @returns True where the stylesheet ends with this declaration.
 */
export function declarationEndsTheStylesheet (decl: Declaration): boolean {
	let { parent } = decl

	if (!parent || !isRoot(parent) || isInlineStyleAttribute(parent)) return false

	return decl.next() === undefined && isLastNodeWithoutSemicolon(decl)
}
