import { isRule } from "../typeGuards/index.js"
import { isScssVariable } from "../isScssVariable/index.js"

/**
 * Check whether a declaration is standard
 *
 * @param {import('postcss').Declaration | import('postcss-less').Declaration} decl
 * @returns {boolean}
 */
export function isStandardSyntaxDeclaration (decl) {
	let prop = decl.prop
	let parent = decl.parent

	// SCSS var; covers map and list declarations
	if (isScssVariable(prop)) {
		return false
	}

	// Less var (e.g. @var: x), but exclude variable interpolation (e.g. @{var})
	if (prop[0] === `@` && prop[1] !== `{`) {
		return false
	}

	// Less map declaration
	if (parent && parent.type === `atrule` && parent.raws.afterName === `:`) {
		return false
	}

	// Less map (e.g. #my-map() { myprop: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector.startsWith(`#`) && parent.selector.endsWith(`()`)) {
		return false
	}

	// Sass nested properties (e.g. border: { style: solid; color: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector[parent.selector.length - 1] === `:` && parent.selector.substring(0, 2) !== `--`) {
		return false
	}

	// Less &:extend
	if (`extend` in decl && decl.extend) {
		return false
	}

	return true
}
