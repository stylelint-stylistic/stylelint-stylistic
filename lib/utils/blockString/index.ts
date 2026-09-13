import type { Container } from "postcss"
import type { PostcssResult } from "stylelint"

import { beforeBlockString } from "../beforeBlockString/index.ts"
import { hasBlock } from "../hasBlock/index.ts"
import { statementString } from "../statementString/index.ts"

/**
 * Returns a statement's block, `{` to `}`, or an empty string where it has none.
 * @param statement - The container.
 * @param result - The Stylelint result.
 * @returns The block.
 */
export function blockString (statement: Container, result?: PostcssResult): string {
	if (!hasBlock(statement)) return ``

	return statementString(statement, result).slice(beforeBlockString(statement, result, { noRawBefore: true }).length)
}
