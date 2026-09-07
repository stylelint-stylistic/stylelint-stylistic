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

/** The syntax of the `less` namespace: Less parsed with `postcss-less`. A superset of the core, plain CSS included, so a project holding both configures these rules alone for the Less files. */
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
	// Under its default `math` mode Less divides only inside parentheses (`@a/2` prints `4/2`), a nameless call the rules pass over, so a solidus outside is the separator it is to the core
	readsSlashAsOperator: () => false,
	// Less reads a unit as ASCII letters and underscores, so `10px\#fff` is a dimension and an escaped value. Answered for the whole namespace, since the reading only shortens a unit and costs at most a warning, never a write (#527)
	endsUnitAtEscape: () => true,
	// A Less variable keeps one copy more than the core writes, the `value` its stringifier prints
	write (node: AtRule | Declaration | PostcssRule, text: string): void {
		css.write(node, text)

		if (isAtRule(node)) syncLessVariableValue(node, text)
	},
	// A styled template is the styled namespace's, a file opened with no custom syntax plain CSS; the rest are told apart by a `//`: Less spells such a comment and keeps it in the text a rule reads, `postcss-scss` keeps none, a syntax spelling none reads the probe as plain CSS
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !reading.spells || reading.keeps
	},
}
