import type { AtRule, Root } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { isStandardSyntaxAtRule } from "../isStandardSyntaxAtRule/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around at-rule names.
 * @param options - The options object.
 */
export function atRuleNameSpaceChecker (options: {
	root: Root,
	locationChecker: (opts: {
		source: string,
		index: number,
		err: (msg: string) => void,
		errTarget: string,
	}) => void,
	result: PostcssResult,
	checkedRuleName: string,
	fix?: ((atRule: AtRule) => void) | null,
}): void {
	options.root.walkAtRules((atRule) => {
		if (!isStandardSyntaxAtRule(atRule)) return

		checkColon(
			`@${atRule.name}${atRule.raws.afterName || ``}${atRule.params}`,
			atRule.name.length,
			atRule,
		)
	})

	/**
	 * Checks a colon for whitespace violations in at-rule names.
	 * @param source - The source string.
	 * @param index - The index to check.
	 * @param node - The at-rule node.
	 */
	function checkColon (source: string, index: number, node: AtRule): void {
		let { fix } = options

		options.locationChecker({
			source,
			index,
			err: (m) => {
				report({
					message: m,
					node,
					index,
					endIndex: index,
					result: options.result,
					ruleName: options.checkedRuleName,
					fix: fix ? (): void => fix(node) : undefined,
				})
			},
			errTarget: `@${node.name}`,
		})
	}
}
