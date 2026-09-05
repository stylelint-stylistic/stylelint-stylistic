import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { isStandardPreprocessorComment } from "../../preprocessor/guards/index.ts"
import { inlineCommentReading } from "../../preprocessor/readsInlineComments/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"
import { css } from "../css/index.ts"
import type { Syntax } from "../index.ts"

import { isStandardLessAtRule, isStandardLessDeclaration, isStandardLessProperty, isStandardLessRule, isStandardLessSelector, isStandardLessValue } from "./guards/index.ts"
import { requiresTrailingSemicolon } from "./requiresTrailingSemicolon/index.ts"
import { syncLessVariableValue } from "./syncLessVariableValue/index.ts"

/** The syntax of the `less` namespace: a stylesheet written in Less and parsed with `postcss-less`. The namespace is a superset of the core — plain CSS is read exactly as the core reads it, an embedded plain block of a page included — so a project holding both configures these rules alone for the files that carry Less. The guards are the core's remaining readings with the Less constructs on top, the writer keeps the copy the Less stringifier prints in step, and the one semicolon Less will not part with is answered here alone. */
export let less: Syntax = {
	...css,
	namespace: `less`,
	isStandardAtRule: isStandardLessAtRule,
	isStandardRule: isStandardLessRule,
	isStandardSelector: isStandardLessSelector,
	isStandardDeclaration: isStandardLessDeclaration,
	isStandardProperty: isStandardLessProperty,
	isStandardValue: isStandardLessValue,
	isStandardComment: isStandardPreprocessorComment,
	requiresTrailingSemicolon,
	readsRuleParams: (rule: PostcssRule) => `params` in rule && Boolean(rule.params),
	readsAtRuleAsVariable: (atRule: AtRule) => `variable` in atRule,
	// Less divides only inside parentheses under its default `math` mode — measured against Less 4.9.1, `@a/2` prints `4/2` and `2/@a` prints `2/4` while `(4/2)` prints `2` — and a parenthesised group is a nameless call the rules pass over. Under `math: always` it divides everywhere, and whether whitespace stands beside the solidus changes nothing to it. So a solidus outside parentheses is the separator it is to the core
	readsSlashAsOperator: () => false,
	// The core writes every copy PostCSS and `postcss-scss` keep; a Less variable holds one more, the `value` its stringifier prints, and it is kept in step here
	write (node: AtRule | Declaration | PostcssRule, text: string): void {
		css.write(node, text)

		if (isAtRule(node)) syncLessVariableValue(node, text)
	},
	// A styled template is the styled namespace's whatever else holds; plain CSS — a file opened with no custom syntax at all — is accepted as the core accepts it; of the rest, the reading of a double slash tells the syntaxes apart: Less spells such a comment and keeps it in the text a rule reads, while `postcss-scss` spells one and keeps none, and a syntax spelling none reads the probe as plain CSS
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !reading.spells || reading.keeps
	},
}
