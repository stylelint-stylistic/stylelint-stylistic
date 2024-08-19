import stylelint from "stylelint"
import styleSearch from "style-search"

import declarationValueIndex from "./declarationValueIndex.js"

let { utils: { report } } = stylelint

/** @typedef {import('postcss').Declaration} Declaration */

/** @typedef {(args: { source: string, index: number, err: (message: string) => void }) => void} LocationChecker */

/**
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: LocationChecker,
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 *   fix: ((decl: Declaration, index: number) => boolean),
 * }} opts
 * @returns {void}
 */
export default function declarationBangSpaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		let indexOffset = declarationValueIndex(decl)
		let declString = decl.toString()
		let valueString = decl.toString().slice(indexOffset)

		if (!valueString.includes(`!`)) {
			return
		}

		styleSearch({ source: valueString, target: `!` }, (match) => {
			check(declString, match.startIndex + indexOffset, decl)
		})
	})

	/**
	 * @param {string} source
	 * @param {number} index
	 * @param {Declaration} decl
	 */
	function check (source, index, decl) {
		opts.locationChecker({
			source,
			index,
			err: (message) => {
				report({
					message,
					node: decl,
					index,
					result: opts.result,
					ruleName: opts.checkedRuleName,
					fix: opts.fix ? () => opts.fix(decl, index) : undefined,
				})
			},
		})
	}
}
