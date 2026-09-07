import type { Declaration } from "postcss"

import type { Syntax } from "../../syntaxes/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"

/**
 * Prints a declaration from its property through its value as the file writes it.
 *
 * `decl.toString()` prints `postcss-scss`'s copy of the value, each `//` comment rewritten as a block one, so the text is cut in front of the value and `syntax.read` supplies it ([#415](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/415)). {@link declarationString} and {@link declarationColonSource} add what follows.
 * @param syntax - The syntax that reads the value from the file.
 * @param decl - The declaration.
 * @returns The property through the value.
 */
export function declarationThroughValue (syntax: Syntax, decl: Declaration): string {
	return decl.toString().slice(0, declarationValueIndex(decl)) + syntax.read(decl)
}
