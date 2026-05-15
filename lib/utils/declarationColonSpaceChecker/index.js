import stylelint from "stylelint"

import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { isCustomProperty } from "../isCustomProperty/index.js"
import { isStandardSyntaxDeclaration } from "../isStandardSyntaxDeclaration/index.js"

let { utils: { report } } = stylelint

/**
 * A function that checks whitespace at a specific location.
 * @typedef {(args: { source: string, index: number, lineCheckStr: string, err: (message: string) => void }) => void} LocationChecker
 */

/**
 * Checks whitespace around colons in declarations.
 * @param {{
 *   root: import('postcss').Root,
 *   locationChecker: LocationChecker,
 *   fix: ((decl: import('postcss').Declaration, index: number) => boolean),
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 * }} opts - The options object
 */
export function declarationColonSpaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		if (!isStandardSyntaxDeclaration(decl)) return

		// Get the raw prop, and only the prop
		let endOfPropIndex = declarationValueIndex(decl) + (decl.raws.between || ``).length - 1

		// The extra characters tacked onto the end ensure that there is a character to check after the colon.
		// Otherwise, with `background:pink` the character after the colon would not exist, making it impossible for the location checker to validate the whitespace.
		let propPlusColon = `${decl.toString().slice(0, endOfPropIndex)}xxx`

		// For custom properties with whitespace-only values, PostCSS puts the whitespace in `decl.value` instead of `decl.raws.between`.
		// We need to preserve the whitespace after the colon so the checker can validate it correctly.
		if (isCustomProperty(decl.prop) && decl.value !== `` && (/^\s+$/).test(decl.value)) {
			propPlusColon = `${decl.toString().slice(0, endOfPropIndex)}${decl.value}x`
		}

		for (let i = 0, l = propPlusColon.length; i < l; i += 1) {
			if (propPlusColon[i] !== `:`) continue

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
