import type { Rule } from "postcss"
import selectorParser, { type Root } from "postcss-selector-parser"
import type { PostcssResult } from "stylelint"

/**
 * Transforms a rule's selector through the parser and writes it back.
 * @param result - The Stylelint result.
 * @param node - The rule.
 * @param callback - Transforms the parsed selector.
 * @returns The new selector, or undefined where the parser refused it.
 */
export function transformSelector (result: PostcssResult, node: Rule, callback: (root: Root) => void): string | undefined {
	try {
		return selectorParser(callback).processSync(node, { updateSelector: true })
	}
	catch {
		result.warn(`Cannot parse selector`, { node, stylelintType: `parseError` })
	}
}
