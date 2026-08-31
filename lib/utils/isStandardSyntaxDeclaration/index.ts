import type { Declaration } from "postcss"

import { isScssVariable } from "../isScssVariable/index.ts"

/**
 * Checks whether a declaration is standard (i.e. not a preprocessor construct).
 * @param decl - The declaration node to check.
 * @returns True if the declaration is standard syntax, false otherwise.
 */
export function isStandardSyntaxDeclaration (decl: Declaration): boolean {
	// A `$` variable, which is a value of the language rather than a declaration — Sass's, and postcss-simple-vars' over plain CSS; a map or a list is declared the same way
	if (isScssVariable(decl.prop)) return false

	return true
}
