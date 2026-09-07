import type { AtRule, Declaration, Rule } from "postcss"
import type { AtRule as LessAtRule, Declaration as LessDeclaration, Rule as LessRule } from "postcss-less"

import { isStandardPreprocessorAtRule, isStandardPreprocessorDeclaration, isStandardPreprocessorSelectorCode, isStandardPreprocessorValue } from "../../../preprocessor/guards/index.ts"
import { LEADING_OPERATOR } from "../../../regexps.ts"
import { isStandardSyntaxProperty } from "../../../utils/isStandardSyntaxProperty/index.ts"
import { isRule } from "../../../utils/typeGuards/index.ts"
import { withoutQuotedTextAndComments } from "../../../utils/withoutQuotedTextAndComments/index.ts"
import { isLessDetachedRulesetCall } from "../isLessDetachedRulesetCall/index.ts"
import { isLessVariableDeclaration } from "../isLessVariableDeclaration/index.ts"
import { LESS_EXTEND, LESS_EXTEND_CALL, LESS_GUARD, LESS_PARAMETRIC_MIXIN, LESS_RESOLVED_MIXIN } from "../regexps.ts"

/**
 * Checks whether an at-rule is standard under Less.
 * @param atRule - The at-rule.
 * @returns True where it is standard.
 */
export function isStandardLessAtRule (atRule: AtRule | LessAtRule): boolean {
	if (!isStandardPreprocessorAtRule(atRule)) return false

	// Ignore Less mixins
	if (`mixin` in atRule && atRule.mixin) return false

	// A variable declaration or a detached ruleset call, `@dr();`
	if (isLessVariableDeclaration(atRule) || isLessDetachedRulesetCall(atRule)) return false

	return true
}

/**
 * Checks whether a rule is standard under Less.
 * @param rule - The rule node whose selector and extend mark are read.
 * @returns True where it is standard.
 */
export function isStandardLessRule (rule: Rule | LessRule): boolean {
	if (rule.type !== `rule`) return false

	// `extend` is set on the selector's text, quotes and all, so it is asked with quoted runs emptied; Less reads `:extend` in lower case only, so case is kept
	let code = withoutQuotedTextAndComments(rule.selector)

	if (`extend` in rule && rule.extend && LESS_EXTEND_CALL.test(code)) return false

	return isStandardLessSelectorCode(code)
}

/**
 * Checks whether a selector is standard under Less.
 * @param selector - The selector's text, quotes and comments still in it.
 * @returns True where it is standard.
 */
export function isStandardLessSelector (selector: string): boolean {
	return isStandardLessSelectorCode(withoutQuotedTextAndComments(selector))
}

/**
 * The check over a selector the caller has blanked, so stacked checks blank once.
 * @param code - The selector, quoted runs emptied and comments blanked.
 * @returns True where it is standard.
 */
function isStandardLessSelectorCode (code: string): boolean {
	if (!isStandardPreprocessorSelectorCode(code)) return false

	// Less :extend()
	if (LESS_EXTEND.test(code)) return false

	// A mixin with resolved nested selectors, `.foo().bar`
	if (LESS_RESOLVED_MIXIN.test(code)) return false

	// A parametric mixin, `.mixin(@a: x) {}`
	if (LESS_PARAMETRIC_MIXIN.test(code)) return false

	// A guard, `.mixin when (@a > 0) {}`; `when` is lower case only and needs no whitespace in front of the condition
	if (LESS_GUARD.test(code)) return false

	return true
}

/**
 * Checks whether a declaration is standard under Less.
 * @param decl - The declaration.
 * @returns True where it is standard.
 */
export function isStandardLessDeclaration (decl: Declaration | LessDeclaration): boolean {
	if (!isStandardPreprocessorDeclaration(decl)) return false

	let prop = decl.prop
	let parent = decl.parent

	// A variable, `@var: x`, but not an interpolation, `@{var}`
	if (prop[0] === `@` && prop[1] !== `{`) return false

	// Less map declaration
	if (parent && parent.type === `atrule` && parent.raws.afterName === `:`) return false

	// A map, `#my-map() { a: red; }`
	if (parent && isRule(parent) && parent.selector && parent.selector.startsWith(`#`) && parent.selector.endsWith(`()`)) return false

	// `&:extend(...)` parses as the property `&`; the `extend` mark matches any value text, `b: "extend(x)"` too
	if (prop === `&`) return false

	return true
}

/**
 * Checks whether a property is standard under Less.
 * @param property - The property's text.
 * @returns True where it is standard.
 */
export function isStandardLessProperty (property: string): boolean {
	if (!isStandardSyntaxProperty(property)) return false

	// A variable
	if (property.startsWith(`@`)) return false

	// A merge property, `transform+_: scale(2)`
	if (property.endsWith(`+`) || property.endsWith(`+_`)) return false

	return true
}

/**
 * Checks whether a value is standard under Less.
 * @param value - The value's text.
 * @returns True where it is standard.
 */
export function isStandardLessValue (value: string): boolean {
	if (!isStandardPreprocessorValue(value)) return false

	// The core's operator strip: `/@var` stays a variable
	let normalizedValue = LEADING_OPERATOR.test(value.charAt(0)) ? value.slice(1) : value

	// Less variable
	if (normalizedValue.startsWith(`@`)) return false

	return true
}
