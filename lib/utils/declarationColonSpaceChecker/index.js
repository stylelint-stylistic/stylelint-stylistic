import styleSearch from "style-search"
import stylelint from "stylelint"

import { LEADING_WHITESPACE, WHITESPACE_ONLY } from "../../regexps.js"
import { declarationValueIndex } from "../declarationValueIndex/index.js"
import { getDeclarationValue } from "../getDeclarationValue/index.js"
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
 *   isFixable?: ((decl: import('postcss').Declaration, index: number) => boolean),
 *   result: import('stylelint').PostcssResult,
 *   checkedRuleName: string,
 * }} opts - The options object.
 */
export function declarationColonSpaceChecker (opts) {
	opts.root.walkDecls((decl) => {
		if (!isStandardSyntaxDeclaration(decl)) return

		// Get the raw prop, and only the prop
		let endOfPropIndex = declarationValueIndex(decl) + (decl.raws.between || ``).length - 1

		// The extra characters tacked onto the end ensure that there is a character to check after the colon. Otherwise, with `background:pink` the character after the colon would not exist, making it impossible for the location checker to validate the whitespace.
		let propPlusColon = `${decl.toString().slice(0, endOfPropIndex)}xxx`

		// For a custom property whose value is nothing but whitespace, PostCSS puts that whitespace in `decl.value` rather than in `decl.raws.between`, so it has to be put back behind the colon for the checker to see it at all.
		if (isCustomProperty(decl.prop) && decl.value !== `` && WHITESPACE_ONLY.test(decl.value)) {
			// For custom properties whose value holds a comment, PostCSS stores that value in `decl.raws.value`, and the whitespace after the colon goes there with it. Only the leading whitespace of the raw value belongs to the colon.
			let valuePrefix = decl.raws.value ? getDeclarationValue(decl).match(LEADING_WHITESPACE)[0] : decl.value

			// The slice reaches to where the value starts, so that the whitespace taken from the value is added once and not twice. `endOfPropIndex` reaches one character further for every character standing in front of the colon, and those characters come out of the value itself.
			propPlusColon = `${decl.toString().slice(0, declarationValueIndex(decl))}${valuePrefix}x`
		}

		// The declaration's own colon is the first one outside comments and strings.
		// A comment in front of it may hold a colon of its own, an URL for one, and taking that one instead leaves the real problem unseen and sends the fix into the comment's text.
		styleSearch({ source: propPlusColon, target: `:`, once: true }, ({ startIndex }) => {
			let problemIndex = decl.prop.toString().length + 1
			// A rule may know that this particular problem cannot be fixed without breaking the code
			let isFixable = opts.fix && (!opts.isFixable || opts.isFixable(decl, startIndex))

			opts.locationChecker({
				source: propPlusColon,
				index: startIndex,
				lineCheckStr: decl.value,
				err: (message) => {
					report({
						message,
						node: decl,
						index: problemIndex,
						endIndex: problemIndex,
						result: opts.result,
						ruleName: opts.checkedRuleName,
						fix: isFixable ? () => opts.fix(decl, startIndex) : undefined,
					})
				},
			})
		})
	})
}
