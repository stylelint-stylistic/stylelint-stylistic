import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { beforeBlockString } from "../beforeBlockString/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { rawNodeString } from "../rawNodeString/index.ts"

/**
 * Returns a CSS statement's block — the string that starts with `{` and ends with `}`. If the statement has no block (e.g. `@import url(foo.css);`), returns an empty string.
 * @param statement - The PostCSS container node.
 * @param result - The Stylelint result, which holds the syntax the file was opened with.
 * @returns The block string content.
 */
export function blockString (statement: Container, result?: PostcssResult): string {
	if (!hasBlock(statement)) return ``

	return rawNodeString(statement, result).slice(beforeBlockString(statement, result).length)
}
