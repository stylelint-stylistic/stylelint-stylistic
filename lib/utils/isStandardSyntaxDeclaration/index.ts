import type { Declaration } from "postcss"

import { isScssVariable } from "../isScssVariable/index.ts"

/**
 * Asks whether a declaration is plain CSS.
 * @param decl - The declaration.
 * @returns True where it is.
 */
export function isStandardSyntaxDeclaration (decl: Declaration): boolean {
	// A `$` variable is Sass's or postcss-simple-vars', not a declaration
	if (isScssVariable(decl.prop)) return false

	return true
}
