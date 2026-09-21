import type { AtRule, Root } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import type { Syntax } from "../../syntaxes/index.ts"
import { declaresTheEncoding } from "../declaresTheEncoding/index.ts"
import { runBehind, writesTwinRun } from "../writesTwinRun/index.ts"

let { utils: { report } } = stylelint

/**
 * Checks whitespace around at-rule names.
 * @param options - The root, the checker, the result, the syntax, the rule's short and configured names, its fix, and which at-rules its fix and its twin's may write.
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
	shortName: string,
	checkedRuleName: string,
	fix?: ((atRule: AtRule) => void) | null,
	isFixable?: (atRule: AtRule) => boolean,
	twinIsFixable?: (atRule: AtRule) => boolean,
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
	 * Asks whether the rule is the one to write the run behind the name, which its twin reads and writes too.
	 * @param source - The at-rule's text.
	 * @param index - The index of the name's last character.
	 * @param node - The at-rule.
	 * @returns True where the rule writes the run.
	 */
	function writesTheRun (source: string, index: number, node: AtRule): boolean {
		let run = runBehind(source, index)

		return writesTwinRun(options.shortName, options.checkedRuleName, node, options.result, {
			side: `after`,
			run,
			lineText: source,
			runs: () => [run],
			line: node.rangeBy({ index }).start.line,
			// A write that makes the at-rule the encoding declaration leaves the twin nothing to read (#703). The file is asked as the rules ahead left it, less the byte-order mark PostCSS writes back in front of it; only an at-rule opening that text is the declaration, so the index into the at-rule's text is the text's too
			twinWrites: (_option, _secondary, over) => {
				if (node.name !== `charset`) return true

				let written = node.root().toString()
				let file = written.startsWith(`\uFEFF`) ? written.slice(1) : written

				return !declaresTheEncoding(node, `${file.slice(0, index + 1)}${over}${file.slice(index + 1 + run.length)}`)
			},
			twinFixes: () => options.twinIsFixable?.(node) !== false,
		})
	}

	/**
	 * Checks one at-rule.
	 * @param source - The at-rule's text.
	 * @param index - The index to check.
	 * @param node - The at-rule.
	 */
	function checkColon (source: string, index: number, node: AtRule): void {
		options.locationChecker({
			source,
			index,
			err: (m) => {
				// Under Less the whitespace behind `@import` and `@plugin` makes them directives, so the warning stands over a file the fix would change the meaning of (#396)
				let fix = options.isFixable?.(node) === false || options.syntax.readsWhitespaceBehindAtRuleName(node) || !writesTheRun(source, index, node) ? null : options.fix

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
