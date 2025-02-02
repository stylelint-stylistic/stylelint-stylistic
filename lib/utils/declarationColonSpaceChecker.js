import stylelint from "stylelint"

import declarationValueIndex from "./declarationValueIndex.js"
import isStandardSyntaxDeclaration from "./isStandardSyntaxDeclaration.js"

let { utils: { report } } = stylelint

/** @typedef {(args: { source: string, index: number, lineCheckStr: string, err: (message: string) => void }) => void} LocationChecker */

/**
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: LocationChecker,
 *   fix: ((decl: import('postcss').Declaration, index: number) => boolean),
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 * }} opts
 */
export default function declarationColonSpaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		if (!isStandardSyntaxDeclaration(decl)) {
			return
		}

		// Get the raw prop, and only the prop
		let endOfPropIndex = declarationValueIndex(decl) + (decl.raws.between || ``).length - 1

		// The extra characters tacked onto the end ensure that there is a character to check
		// after the colon. Otherwise, with `background:pink` the character after the
		let propPlusColon = `${decl.toString().slice(0, endOfPropIndex)}xxx`

		for (let i = 0, l = propPlusColon.length; i < l; i++) {
			if (propPlusColon[i] !== `:`) {
				continue
			}

			const problemIndex = decl.prop.toString().length + 1

			opts.locationChecker({
				source: propPlusColon,
				index: i,
				lineCheckStr: decl.value,
				err: (message) => {
					report({
						message,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result: opts.result,
						ruleName: opts.checkedRuleName,
						fix: opts.fix ? () => opts.fix(decl, i) : undefined,
					})
				},
			})
			break
		}
	})
}
