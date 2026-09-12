import type { AtRule, Root } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { declaresTheEncoding } from "../declaresTheEncoding/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around at-rule names.
 * @param options - The root, the checker, the result, the syntax, the rule name, its fix and which at-rules the fix may write.
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
	syntax: Syntax,
	checkedRuleName: string,
	fix?: ((atRule: AtRule) => void) | null,
	isFixable?: (atRule: AtRule) => boolean,
}): void {
	options.root.walkAtRules((atRule) => {
		if (!options.syntax.isStandardAtRule(atRule)) return

		// The one space of an encoding declaration is the specification's, not a style (#703)
		if (declaresTheEncoding(atRule)) return

		checkColon(
			`@${atRule.name}${atRule.raws.afterName || ``}${atRule.params}`,
			atRule.name.length,
			atRule,
		)
	})

	/**
	 * Checks one at-rule.
	 * @param source - The at-rule's text.
	 * @param index - The index to check.
	 * @param node - The at-rule.
	 */
	function checkColon (source: string, index: number, node: AtRule): void {
		let fix = options.isFixable?.(node) === false ? null : options.fix

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
					...(fix && { fix: (): void => fix(node) }),
				})
			},
			errTarget: `@${node.name}`,
		})
	}
}
