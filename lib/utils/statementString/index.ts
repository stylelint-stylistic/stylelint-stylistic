import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { nodeString } from "../nodeString/index.ts"
import { isRule } from "../typeGuards/index.ts"

/**
 * Prints a statement through its closing brace.
 *
 * PostCSS files a stray semicolon behind a rule's brace, with the whitespace in front of it, in the rule's `raws.ownSemicolon` and prints that raw behind the brace, so {@link nodeString} of such a rule ends on the semicolon.
 * @param statement - The container.
 * @param result - The Stylelint result, which holds the file's syntax.
 * @returns The statement's text without the raw.
 */
export function statementString (statement: Container, result?: PostcssResult): string {
	let printed = nodeString(statement, result)
	let ownSemicolon = isRule(statement) ? statement.raws.ownSemicolon : undefined

	return ownSemicolon ? printed.slice(0, -ownSemicolon.length) : printed
}
