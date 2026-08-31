import type { AtRule, Comment, Declaration, Rule } from "postcss"
import type { FunctionNode } from "postcss-value-parser"

import { LEADING_OPERATOR } from "../../regexps.ts"
import { isStandardSyntaxFunction } from "../../utils/isStandardSyntaxFunction/index.ts"
import { isStandardSyntaxProperty } from "../../utils/isStandardSyntaxProperty/index.ts"
import { isStandardSyntaxSelectorCode } from "../../utils/isStandardSyntaxSelector/index.ts"
import { isStandardSyntaxValue } from "../../utils/isStandardSyntaxValue/index.ts"
import { isRule } from "../../utils/typeGuards/index.ts"
import { withoutQuotedTextAndComments } from "../../utils/withoutQuotedTextAndComments/index.ts"
import { hasInterpolation } from "../hasInterpolation/index.ts"
import { isScssVariable } from "../isScssVariable/index.ts"
import { SCSS_MODULE_FUNCTION, SCSS_MODULE_VARIABLE } from "../regexps.ts"

/**
 * Checks whether an at-rule is standard under a preprocessor: what the core turns away, and the constructs both languages spell an at-rule for.
 * @param atRule - The at-rule node to check.
 * @returns True if the at-rule is standard, false otherwise.
 */
export function isStandardPreprocessorAtRule (atRule: AtRule): boolean {
	// Ignore scss `@content` inside mixins
	if (!atRule.nodes && atRule.params === ``) return false

	return true
}

/**
 * Checks whether a comment is standard under a preprocessor: the Sass parser marks an inline comment with `raws.inline`, and the Less parser's own `inline` mark is asked about on top of this by the less namespace.
 * @param comment - The comment node to check.
 * @returns True if the comment has standard syntax, false otherwise.
 */
export function isStandardPreprocessorComment (comment: Comment): boolean {
	return !(`inline` in comment.raws)
}

/**
 * Checks whether a declaration is standard under a preprocessor.
 * @param decl - The declaration node to check.
 * @returns True if the declaration is standard syntax, false otherwise.
 */
export function isStandardPreprocessorDeclaration (decl: Declaration): boolean {
	let prop = decl.prop
	let parent = decl.parent

	// SCSS var; covers map and list declarations
	if (isScssVariable(prop)) return false

	// Sass nested properties (e.g. border: { style: solid; color: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector.at(-1) === `:` && parent.selector.slice(0, 2) !== `--`) return false

	return true
}

/**
 * Checks whether a property is standard under a preprocessor: what the core turns away, and the variables and interpolations either language spells a property with.
 * @param property - The property to check.
 * @returns True if the property is standard syntax, false otherwise.
 */
export function isStandardPreprocessorProperty (property: string): boolean {
	if (!isStandardSyntaxProperty(property)) return false

	// SCSS var
	if (isScssVariable(property)) return false

	// SCSS or Less interpolation
	if (hasInterpolation(property)) return false

	return true
}

/**
 * Checks whether a value is standard under a preprocessor: what the core turns away, and the variables, module readings and interpolations either language spells a value with.
 * @param value - The value to check.
 * @returns True if the value is standard syntax, false otherwise.
 */
export function isStandardPreprocessorValue (value: string): boolean {
	if (!isStandardSyntaxValue(value)) return false

	// Ignore operators before variables (example -$variable)
	let normalizedValue = LEADING_OPERATOR.test(value.charAt(0)) ? value.slice(1) : value

	// SCSS variable (example $variable)
	if (normalizedValue.startsWith(`$`)) return false

	// SCSS namespace (example namespace.$variable)
	if (SCSS_MODULE_VARIABLE.test(value)) return false

	// SCSS namespace (example namespace.function-name())
	if (SCSS_MODULE_FUNCTION.test(value)) return false

	// SCSS or Less interpolation
	if (hasInterpolation(normalizedValue)) return false

	return true
}

/**
 * Checks whether a selector is standard under a preprocessor: what the core turns away, and the placeholders, nested properties and interpolations either language spells a selector with.
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

	// SCSS or Less interpolation
	if (hasInterpolation(code)) return false

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

/**
 * Checks whether a function of a value is standard under a preprocessor: what the core turns away, and a call Sass opens on an interpolation.
 * @param fn - The function node to check.
 * @returns True if the function is standard syntax, false otherwise.
 */
export function isStandardPreprocessorFunction (fn: FunctionNode): boolean {
	// A call opening on a Sass interpolation, whose name is the interpolation's to spell
	if (fn.value.startsWith(`#{`)) return false

	return isStandardSyntaxFunction(fn)
}
