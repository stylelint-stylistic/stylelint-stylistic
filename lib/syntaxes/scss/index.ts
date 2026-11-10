import type { Root } from "postcss"
import type { Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { isStandardPreprocessorAtRule, isStandardPreprocessorComment, isStandardPreprocessorDeclaration, isStandardPreprocessorSelector, isStandardPreprocessorSelectorCode, isStandardPreprocessorValue } from "../../preprocessor/guards/index.ts"
import { inlineCommentReading } from "../../preprocessor/readsInlineComments/index.ts"
import { restoreRunsFoldedIntoTheText } from "../../preprocessor/restoreRunsFoldedIntoTheText/index.ts"
import { EVERY_COMMENT_DELIMITER } from "../../regexps.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import type { AddressAtRules } from "../../utils/findCommentSpans/index.ts"
import { findCommentSpans } from "../../utils/findCommentSpans/index.ts"
import { findInlineCommentEnd } from "../../utils/findInlineCommentEnd/index.ts"
import { withoutQuotedTextAndComments } from "../../utils/withoutQuotedTextAndComments/index.ts"
import { css } from "../css/index.ts"
import type { SelectorCopies, Syntax } from "../index.ts"

import { readsSlashAsOperator } from "./readsSlashAsOperator/index.ts"
import { requiresTrailingSemicolon } from "./requiresTrailingSemicolon/index.ts"

/**
 * Rewrites the `//` comments of a selector into the block form `postcss-scss` produces when it captures one, so a comment that sits directly behind a token is still read. Strings are copied untouched, and `*\/` or `\/*` inside a comment are escaped the way the parser escapes them.
 * @param selector - The selector as the file spells it.
 * @returns The rewritten selector, or the original where it holds no such comment.
 */
function rewriteInlineCommentsInSelector (selector: string): string {
	let result = ``
	let index = 0
	let length = selector.length

	while (index < length) {
		let character = selector[index]

		if (character === `"` || character === `'`) {
			let quote = character
			let start = index

			index += 1

			while (index < length) {
				if (selector[index] === `\\`) {
					index += 2

					continue
				}

				if (selector[index] === quote) {
					index += 1

					break
				}

				index += 1
			}

			result += selector.slice(start, index)

			continue
		}

		if (character === `/` && selector[index + 1] === `/`) {
			let end = findInlineCommentEnd(selector, index, { spells: true, tokenizes: false, endsOnFormFeed: true })
			let content = selector.slice(index + 2, end).replaceAll(EVERY_COMMENT_DELIMITER, `*//*`)

			result += `/*${content}*/`

			if (end < length) {
				result += selector[end]
				index = end + 1
			}
			else {
				index = end
			}

			continue
		}

		result += character
		index += 1
	}

	return result
}

/** The at-rules Sass reads an address behind: its own two in lower case alone, since dart-sass passes `@USE` through as plain CSS. */
const SCSS_ADDRESS_AT_RULES: AddressAtRules = { names: [{ name: `import`, anyCase: true }, { name: `use`, anyCase: false }, { name: `forward`, anyCase: false }] }

/** The syntax of the `scss` namespace: SCSS parsed with `postcss-scss`. A superset of the core, plain CSS included, so a project holding both configures these rules alone for the SCSS files. */
export let scss: Syntax = {
	...css,
	namespace: `scss`,
	// `postcss-scss` folds the run behind a seventh hexadecimal digit into the text behind it as PostCSS does, and prints back through a copy of its own
	restore (root: Root): void {
		restoreRunsFoldedIntoTheText(root, scss)
	},
	// A styled template is the styled namespace's, a file opened with no custom syntax plain CSS; the rest are told apart by a `//`: `postcss-scss` spells such a comment and keeps none in the text a rule reads, Less keeps it, a syntax spelling none reads the probe as plain CSS
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !reading.spells || !reading.keeps
	},
	isStandardAtRule: isStandardPreprocessorAtRule,
	isStandardRule (rule: PostcssRule): boolean {
		if (rule.type !== `rule`) return false

		let rawSelector = rule.raws.selector as { raw: string, value: string, scss?: string } | undefined
		let selector = (rawSelector?.scss ?? rawSelector?.raw ?? rule.selector) as string

		// `postcss-scss` leaves a `//` comment in the selector when it is not separated from the preceding token, so it is blanked here the way `withoutQuotedTextAndComments` blanks a captured one
		let blanked = blankComments(withoutQuotedTextAndComments(selector), findCommentSpans(selector, { spells: true, tokenizes: false, endsOnFormFeed: true }))

		return isStandardPreprocessorSelectorCode(blanked)
	},
	isStandardDeclaration: isStandardPreprocessorDeclaration,
	isStandardValue: isStandardPreprocessorValue,
	isStandardSelector: isStandardPreprocessorSelector,
	// `postcss-scss` does not capture a `//` comment that is not separated from the preceding token, so its selector arrives with the comment still in it and is unreadable; rewrite such a comment into the block form its parser uses when it does capture one, keeping the source copy intact
	selectorCopies (rule: PostcssRule): SelectorCopies {
		if (rule.raws.selector === undefined && typeof rule.selector === `string` && rule.selector.includes(`//`)) {
			let scssSelector = rule.selector
			let rawSelector = rewriteInlineCommentsInSelector(scssSelector)

			if (rawSelector !== scssSelector) rule.raws.selector = { raw: rawSelector, value: scssSelector, scss: scssSelector } as never
		}

		return css.selectorCopies(rule)
	},
	isStandardComment: isStandardPreprocessorComment,
	readsSlashAsOperator,
	// Sass reads the parentheses of a `url()` holding a quotation mark as code: `URL(a"b"c)` compiles to `URL(a "b" c)`, the string printed double-quoted
	readsQuoteInsideAddressAsString: () => true,
	// Sass loads a module by the string behind `@use` and `@forward` as it does behind `@import`
	addressAtRules: () => SCSS_ADDRESS_AT_RULES,
	requiresTrailingSemicolon,
}
