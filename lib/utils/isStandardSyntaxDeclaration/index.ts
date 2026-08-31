import type { Declaration } from "postcss"

import { isScssVariable } from "../isScssVariable/index.ts"
import { isRule } from "../typeGuards/index.ts"

/**
 * Checks whether a declaration is standard (i.e. not a preprocessor construct).
 * @param decl - The declaration node to check.
 * @returns True if the declaration is standard syntax, false otherwise.
 */
export function isStandardSyntaxDeclaration (decl: Declaration): boolean {
	let prop = decl.prop
	let parent = decl.parent

	// SCSS var; covers map and list declarations
	if (isScssVariable(prop)) return false

	// Sass nested properties (e.g. border: { style: solid; color: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector.at(-1) === `:` && parent.selector.slice(0, 2) !== `--`) return false

	return true
}
