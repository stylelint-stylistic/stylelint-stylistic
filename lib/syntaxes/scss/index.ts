import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { isStandardPreprocessorAtRule, isStandardPreprocessorComment, isStandardPreprocessorDeclaration, isStandardPreprocessorRule, isStandardPreprocessorSelector, isStandardPreprocessorValue } from "../../preprocessor/guards/index.ts"
import { inlineCommentReading } from "../../preprocessor/readsInlineComments/index.ts"
import { css } from "../css/index.ts"
import type { Syntax } from "../index.ts"

import { readsSlashAsOperator } from "./readsSlashAsOperator/index.ts"

/** The syntax of the `scss` namespace: a stylesheet written in SCSS and parsed with `postcss-scss`. The namespace is a superset of the core — plain CSS is read exactly as the core reads it, an embedded plain block of a page included — so a project holding both configures these rules alone for the files that carry SCSS. What is the adapter's own is the gate and the guards over the constructs only Sass spells: a module reading, a placeholder, a nested property, `@content`, a comment the parser marked inline. The pair of copies the parser keeps of a text is read and written by the core's own adapter, which reads whichever copies a node carries. */
export let scss: Syntax = {
	...css,
	namespace: `scss`,
	// A styled template is the styled namespace's whatever else holds; plain CSS — a file opened with no custom syntax at all — is accepted as the core accepts it; of the rest, the reading of a double slash tells the syntaxes apart: `postcss-scss` spells such a comment and keeps none in the text a rule reads, Less spells one and keeps it, and a syntax spelling none reads the probe as plain CSS
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
