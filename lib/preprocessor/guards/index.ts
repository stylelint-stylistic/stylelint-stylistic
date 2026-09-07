import type { AtRule, Comment, Declaration, Rule } from "postcss"

import { isStandardSyntaxDeclaration } from "../../utils/isStandardSyntaxDeclaration/index.ts"
import { isStandardSyntaxSelectorCode } from "../../utils/isStandardSyntaxSelector/index.ts"
import { isStandardSyntaxValue } from "../../utils/isStandardSyntaxValue/index.ts"
import { isRule } from "../../utils/typeGuards/index.ts"
import { withoutQuotedTextAndComments } from "../../utils/withoutQuotedTextAndComments/index.ts"
import { isInlineComment } from "../isInlineComment/index.ts"
import { SCSS_MODULE_FUNCTION, SCSS_MODULE_VARIABLE } from "../regexps.ts"

/**
 * Whether an at-rule is standard: Sass's bodiless, paramless `@content` is not.
 * @param atRule - The at-rule.
 * @returns True where it is.
 */
export function isStandardPreprocessorAtRule (atRule: AtRule): boolean {
	// Sass `@content`
	if (!atRule.nodes && atRule.params === ``) return false

	return true
}

/**
 * Whether a comment is standard: one not opened by `//`.
 * @param comment - The comment node whose opener is read.
 * @returns True where it is.
 */
export function isStandardPreprocessorComment (comment: Comment): boolean {
	return !isInlineComment(comment)
}

/**
 * Whether a declaration is standard: the core's answer, no for a Sass nested property.
 * @param decl - The declaration.
 * @returns True where it is.
 */
export function isStandardPreprocessorDeclaration (decl: Declaration): boolean {
	if (!isStandardSyntaxDeclaration(decl)) return false

	let parent = decl.parent

	// Sass nested property
	if (parent && isRule(parent) && parent.selector && parent.selector.at(-1) === `:` && parent.selector.slice(0, 2) !== `--`) return false

	return true
}

/**
 * Whether a value is standard: the core's answer, no for a Sass module reading.
 * @param value - The declaration value as written.
 * @returns True where it is.
 */
export function isStandardPreprocessorValue (value: string): boolean {
	if (!isStandardSyntaxValue(value)) return false

	// `namespace.$variable`
	if (SCSS_MODULE_VARIABLE.test(value)) return false

	// `namespace.function-name()`
	if (SCSS_MODULE_FUNCTION.test(value)) return false

	return true
}

/**
 * Whether a selector is standard: the core's answer, no for a placeholder or a nested property.
 * @param selector - The rule's selector as written.
 * @returns True where it is.
 */
export function isStandardPreprocessorSelector (selector: string): boolean {
	return isStandardPreprocessorSelectorCode(withoutQuotedTextAndComments(selector))
}

/**
 * The same over a copy the caller has blanked, so stacked checks blank once.
 * @param code - The selector, quoted runs emptied and comments taken out.
 * @returns True where it is.
 */
export function isStandardPreprocessorSelectorCode (code: string): boolean {
	if (!isStandardSyntaxSelectorCode(code)) return false

	// `%placeholder`
	if (code.startsWith(`%`)) return false

	// Nested property
	if (code.endsWith(`:`)) return false

	return true
}

/**
 * Whether a rule is standard.
 * @param rule - The PostCSS node checked for a rule type and a standard selector.
 * @returns True where it is.
 */
export function isStandardPreprocessorRule (rule: Rule): boolean {
	if (rule.type !== `rule`) return false

	return isStandardPreprocessorSelectorCode(withoutQuotedTextAndComments(rule.selector))
}
