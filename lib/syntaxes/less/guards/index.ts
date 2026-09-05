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
 * Checks whether an at-rule is standard under Less: what the core turns away, and the constructs `postcss-less` reads an at-rule for.
 * @param atRule - The at-rule node to check.
 * @returns True if the at-rule is standard, false otherwise.
 */
export function isStandardLessAtRule (atRule: AtRule | LessAtRule): boolean {
	if (!isStandardPreprocessorAtRule(atRule)) return false

	// Ignore Less mixins
	if (`mixin` in atRule && atRule.mixin) return false

	// Ignore Less variable declarations, whether the parser marked them or left the colon to the shape of the node, and calls to detached rulesets `@detached-ruleset: { background: red; }; .top { @detached-ruleset(); }`
	if (isLessVariableDeclaration(atRule) || isLessDetachedRulesetCall(atRule)) return false

	return true
}

/**
 * Checks whether a rule is standard under Less.
 * @param rule - The rule node to check.
 * @returns True if the rule is standard syntax, false otherwise.
 */
export function isStandardLessRule (rule: Rule | LessRule): boolean {
	if (rule.type !== `rule`) return false

	// Ignore a Less `:extend`, which `postcss-less` marks the rule for by matching the text of its selector, quotes and all — so `[title=":extend(x)"]` carries the mark though what stands inside the quotes is an attribute value and nothing else. The mark is asked of the code instead, of the same copy `isStandardLessSelector` reads, with every quoted run emptied. The case is left as the mark reads it, which is any case at all, though Less reads its keywords in lower case only and prints `.a:EXTEND(.b)` as it stands: the one thing this plugin would write there is the lower case `selector-pseudo-class-case` asks for, and that would turn a selector matching nothing into an extend that changes what Less compiles.
	let code = withoutQuotedTextAndComments(rule.selector)

	if (`extend` in rule && rule.extend && LESS_EXTEND_CALL.test(code)) return false

	return isStandardLessSelectorCode(code)
}

/**
 * Checks whether a selector is standard under Less: everything the core turns away, and the shapes Less spells a selector with.
 * @param selector - The selector to check.
 * @returns True if the selector is standard syntax, false otherwise.
 */
export function isStandardLessSelector (selector: string): boolean {
	return isStandardLessSelectorCode(withoutQuotedTextAndComments(selector))
}

/**
 * The same reading over a copy the caller has already emptied, blanking the selector once however many checks stack on it.
 * @param code - The selector, its quoted runs emptied and its comments taken out.
 * @returns True if the selector is standard syntax, false otherwise.
 */
function isStandardLessSelectorCode (code: string): boolean {
	if (!isStandardPreprocessorSelectorCode(code)) return false

	// Less :extend()
	if (LESS_EXTEND.test(code)) return false

	// Less mixin with resolved nested selectors (e.g. .foo().bar or .foo(@a, @b)[bar])
	if (LESS_RESOLVED_MIXIN.test(code)) return false

	// Less Parametric mixins (e.g. .mixin(@variable: x) {})
	if (LESS_PARAMETRIC_MIXIN.test(code)) return false

	// Less CSS guards (e.g. .mixin when (@a > 0) {}).
	// A parenthesis opening after whitespace is nothing CSS has a selector for, and Less asks for no whitespace in front of the condition — `.a:hover when(1 = 1)` compiles as readily as the spaced form. The word is read in lower case only, as Less reads its keywords: `.a:hover WHEN (1 = 1)` is printed by the compiler as it stands, and `when NOT (1 = 1)` is a syntax error to it.
	if (LESS_GUARD.test(code)) return false

	return true
}

/**
 * Checks whether a declaration is standard under Less.
 * @param decl - The declaration node to check.
 * @returns True if the declaration is standard syntax, false otherwise.
 */
export function isStandardLessDeclaration (decl: Declaration | LessDeclaration): boolean {
	if (!isStandardPreprocessorDeclaration(decl)) return false

	let prop = decl.prop
	let parent = decl.parent

	// Less var (e.g. @var: x), but exclude variable interpolation (e.g. @{var})
	if (prop[0] === `@` && prop[1] !== `{`) return false

	// Less map declaration
	if (parent && parent.type === `atrule` && parent.raws.afterName === `:`) return false

	// Less map (e.g. #my-map() { myprop: red; })
	if (parent && isRule(parent) && parent.selector && parent.selector.startsWith(`#`) && parent.selector.endsWith(`()`)) return false

	// A Less `&:extend(...)`, which the parser splits at its colon: the property is `&` and the value is the extend call. A property `&` is nothing CSS has, whatever the value — the compiler reads an extend there and answers anything else, `&:EXTEND(.b)` and `& :extend(.b)` among it, with a syntax error — so the shape alone is the answer. The `extend` mark the syntax puts beside the node goes unasked: it is matched against the text of any value at all, quotes and all, so `b: "extend(x)"` and `b: myextend(y)` carried it too, though both are plain declarations Less compiles as they stand.
	if (prop === `&`) return false

	return true
}

/**
 * Checks whether a property is standard under Less.
 * @param property - The property to check.
 * @returns True if the property is standard syntax, false otherwise.
 */
export function isStandardLessProperty (property: string): boolean {
	if (!isStandardSyntaxProperty(property)) return false

	// Less var (e.g. @var: x)
	if (property.startsWith(`@`)) return false

	// Less append property value with space (e.g. transform+_: scale(2))
	if (property.endsWith(`+`) || property.endsWith(`+_`)) return false

	return true
}

/**
 * Checks whether a value is standard under Less.
 * @param value - The value to check.
 * @returns True if the value is standard syntax, false otherwise.
 */
export function isStandardLessValue (value: string): boolean {
	if (!isStandardPreprocessorValue(value)) return false

	// The same operator strip the core makes, so that `*@var` and `/@var` are the variables they were before the core stopped reading them
	let normalizedValue = LEADING_OPERATOR.test(value.charAt(0)) ? value.slice(1) : value

	// Less variable
	if (normalizedValue.startsWith(`@`)) return false

	return true
}
