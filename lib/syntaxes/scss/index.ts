import type { Root } from "postcss"
import type { PostcssResult } from "stylelint"

import { isStandardPreprocessorAtRule, isStandardPreprocessorComment, isStandardPreprocessorDeclaration, isStandardPreprocessorRule, isStandardPreprocessorSelector, isStandardPreprocessorValue } from "../../preprocessor/guards/index.ts"
import { inlineCommentReading } from "../../preprocessor/readsInlineComments/index.ts"
import type { AddressAtRules } from "../../utils/findCommentSpans/index.ts"
import { css } from "../css/index.ts"
import type { Syntax } from "../index.ts"

import { readsSlashAsOperator } from "./readsSlashAsOperator/index.ts"

/** The at-rules Sass reads an address behind: its own two in lower case alone, since dart-sass passes `@USE` through as plain CSS. */
const SCSS_ADDRESS_AT_RULES: AddressAtRules = { names: [{ name: `import`, anyCase: true }, { name: `use`, anyCase: false }, { name: `forward`, anyCase: false }] }

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
	// Sass reads the parentheses of a `url()` holding a quotation mark as code: `URL(a"b"c)` compiles to `URL(a "b" c)`, the string printed double-quoted (1789604002)
	readsQuoteInsideAddressAsString: () => true,
	// Sass loads a module by the string behind `@use` and `@forward` as it does behind `@import` (#656)
	addressAtRules: () => SCSS_ADDRESS_AT_RULES,
}
