import type { AtRule, Comment, Declaration, Rule } from "postcss"

import { isStandardSyntaxDeclaration } from "../../utils/isStandardSyntaxDeclaration/index.ts"
import { isStandardSyntaxSelectorCode } from "../../utils/isStandardSyntaxSelector/index.ts"
import { isStandardSyntaxValue } from "../../utils/isStandardSyntaxValue/index.ts"
import { isRule } from "../../utils/typeGuards/index.ts"
import { withoutQuotedTextAndComments } from "../../utils/withoutQuotedTextAndComments/index.ts"
import { isInlineComment } from "../isInlineComment/index.ts"
import { SCSS_MODULE_FUNCTION, SCSS_MODULE_VARIABLE } from "../regexps.ts"

/**
 * Checks whether an at-rule is standard under a preprocessor: what the core turns away, and the one shape Sass spells an at-rule in that no plain CSS does.
 * @param atRule - The at-rule node to check.
 * @returns True if the at-rule is standard, false otherwise.
 */
export function isStandardPreprocessorAtRule (atRule: AtRule): boolean {
	// Ignore scss `@content` inside mixins
	if (!atRule.nodes && atRule.params === ``) return false

	return true
}

/**
 * Checks whether a comment is standard under a preprocessor: one the syntax has not marked as opened by a double slash.
 * @param comment - The comment node to check.
 * @returns True if the comment has standard syntax, false otherwise.
 */
export function isStandardPreprocessorComment (comment: Comment): boolean {
	return !isInlineComment(comment)
}

/**
 * Checks whether a declaration is standard under a preprocessor: what the core turns away, and a Sass nested property on top.
 * @param decl - The declaration node to check.
 * @returns True if the declaration is standard syntax, false otherwise.
 */
export function isStandardPreprocessorDeclaration (decl: Declaration): boolean {
	if (!isStandardSyntaxDeclaration(decl)) return false

	let parent = decl.parent

	// Sass nested properties (e.g. border: { style: solid; color: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector.at(-1) === `:` && parent.selector.slice(0, 2) !== `--`) return false

	return true
}

/**
 * Checks whether a value is standard under a preprocessor: what the core turns away, and a reading through a Sass module on top.
 * @param value - The value to check.
 * @returns True if the value is standard syntax, false otherwise.
 */
export function isStandardPreprocessorValue (value: string): boolean {
	if (!isStandardSyntaxValue(value)) return false

	// SCSS namespace (example namespace.$variable)
	if (SCSS_MODULE_VARIABLE.test(value)) return false

	// SCSS namespace (example namespace.function-name())
	if (SCSS_MODULE_FUNCTION.test(value)) return false

	return true
}

/**
 * Checks whether a selector is standard under a preprocessor: what the core turns away, and the placeholders and nested properties Sass spells a selector with.
 * @param selector - The selector to check.
 * @returns True if the selector is standard syntax, false otherwise.
 */
export function isStandardPreprocessorSelector (selector: string): boolean {
	return isStandardPreprocessorSelectorCode(withoutQuotedTextAndComments(selector))
}

/**
 * The same reading over a copy the caller has already emptied, so that a caller stacking further checks on the same copy blanks the selector once.
 * @param code - The selector, its quoted runs emptied and its comments taken out.
 * @returns True if the selector is standard syntax, false otherwise.
 */
export function isStandardPreprocessorSelectorCode (code: string): boolean {
	if (!isStandardSyntaxSelectorCode(code)) return false

	// SCSS placeholder selectors
	if (code.startsWith(`%`)) return false

	// SCSS nested properties
	if (code.endsWith(`:`)) return false

	return true
}

/**
 * Checks whether a rule is standard under a preprocessor.
 * @param rule - The rule node to check.
 * @returns True if the rule is standard syntax, false otherwise.
 */
export function isStandardPreprocessorRule (rule: Rule): boolean {
	if (rule.type !== `rule`) return false

	return isStandardPreprocessorSelectorCode(withoutQuotedTextAndComments(rule.selector))
}
