import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { isStandardPreprocessorComment } from "../../preprocessor/guards/index.ts"
import { inlineCommentReading } from "../../preprocessor/readsInlineComments/index.ts"
import { isAtRule } from "../../utils/typeGuards/index.ts"
import { css } from "../css/index.ts"
import type { Syntax } from "../index.ts"

import { atRuleVariableValue } from "./atRuleVariableValue/index.ts"
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
	atRuleVariableValue,
	// Under its default `math` mode Less divides only inside parentheses (`@a/2` prints `4/2`), a nameless call the rules pass over, so a solidus outside is the separator it is to the core
	readsSlashAsOperator: () => false,
	// Less reads a number as digits and at most one period, so `1E5PX` is the dimension `1E` beside the dimension `5PX` (#646). Answered for the whole namespace: the letter of an exponent is the one character this reading adds to what the fix writes, and its case is nothing to CSS either
	readsNumberWithExponent: () => false,
	// Less reads a unit as `%` or a run of ASCII letters and underscores, so `10px\#fff` is a dimension and an escaped value (#527), `10PX-2REM` two dimensions it subtracts (#633) and `10PX9` a dimension and a number (#646). Answered for the whole namespace, since the units it reads are substrings of the one the core reads, on the same positions, so this half of the reading costs at most a warning
	readsUnitAsIdentifier: () => false,
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
