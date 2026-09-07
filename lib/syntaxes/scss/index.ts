import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { isStandardPreprocessorAtRule, isStandardPreprocessorComment, isStandardPreprocessorDeclaration, isStandardPreprocessorRule, isStandardPreprocessorSelector, isStandardPreprocessorValue } from "../../preprocessor/guards/index.ts"
import { inlineCommentReading } from "../../preprocessor/readsInlineComments/index.ts"
import { css } from "../css/index.ts"
import type { Syntax } from "../index.ts"

import { readsSlashAsOperator } from "./readsSlashAsOperator/index.ts"

/** The syntax of the `scss` namespace: SCSS parsed with `postcss-scss`. A superset of the core, plain CSS included, so a project holding both configures these rules alone for the SCSS files. */
export let scss: Syntax = {
	...css,
	namespace: `scss`,
	// A styled template is the styled namespace's, a file opened with no custom syntax plain CSS; the rest are told apart by a `//`: `postcss-scss` spells such a comment and keeps none in the text a rule reads, Less keeps it, a syntax spelling none reads the probe as plain CSS
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !reading.spells || !reading.keeps
	},
	isStandardAtRule: isStandardPreprocessorAtRule,
	isStandardRule: isStandardPreprocessorRule,
	isStandardDeclaration: isStandardPreprocessorDeclaration,
	isStandardValue: isStandardPreprocessorValue,
	isStandardSelector: isStandardPreprocessorSelector,
	isStandardComment: isStandardPreprocessorComment,
	readsSlashAsOperator,
}
