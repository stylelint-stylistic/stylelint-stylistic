import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { findInterpolationSpans } from "../../preprocessor/findInterpolationSpans/index.ts"
import { findRewrittenCommentSpans } from "../../preprocessor/findRewrittenCommentSpans/index.ts"
import { findSelectorInlineComments, type InlineComment } from "../../preprocessor/findSelectorInlineComments/index.ts"
import { isStandardPreprocessorAtRule, isStandardPreprocessorComment, isStandardPreprocessorDeclaration, isStandardPreprocessorFunction, isStandardPreprocessorProperty, isStandardPreprocessorRule, isStandardPreprocessorSelector, isStandardPreprocessorValue } from "../../preprocessor/guards/index.ts"
import { printedText, writePrintedText } from "../../preprocessor/printedText/index.ts"
import { inlineCommentReading, syntaxKeepsInlineComments } from "../../preprocessor/readsInlineComments/index.ts"
import { restoreSelectorInlineComments } from "../../preprocessor/restoreSelectorInlineComments/index.ts"
import { toSelectorSourceIndex } from "../../preprocessor/toSelectorSourceIndex/index.ts"
import { findInlineCommentSpans, type InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { isDeclaration, type SyntaxRaw } from "../../utils/typeGuards/index.ts"
import { css } from "../css/index.ts"
import type { SelectorCopies, Syntax } from "../index.ts"

/** The syntax of the `scss` namespace: a stylesheet written in SCSS and parsed with `postcss-scss`. The namespace is a superset of the core — plain CSS is read exactly as the core reads it, an embedded plain block of a page included — so a project holding both configures these rules alone for the files that carry SCSS. What the adapter holds of its own is the model of the pair: the syntax rewrites every `//` comment into a block comment in the raw a parser can read, keeps the spelling of the file in a copy of its own and prints that copy, so the reader, the writer, the selector triad and the comment spans of a printed text all go through the pair here, and the core keeps one copy. */
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
	isStandardProperty: isStandardPreprocessorProperty,
	isStandardValue: isStandardPreprocessorValue,
	isStandardSelector: isStandardPreprocessorSelector,
	isStandardFunction: isStandardPreprocessorFunction,
	isStandardComment: isStandardPreprocessorComment,
	interpolationSpans: (text) => findInterpolationSpans(text),
	read: printedText,
	write: writePrintedText,
	printedInlineComments (node: AtRule | Declaration, text: string, result: PostcssResult): InlineCommentSpan[] {
		let raws: SyntaxRaw | undefined = isDeclaration(node) ? node.raws.value : node.raws.params

		// The comments the syntax rewrote in the raw are the comments it found, and the two copies say between them where each of them runs — while both still measure the same text; a pair out of step leaves the text to be scanned as one carrying no pair at all
		if (raws && typeof raws.scss === `string`) return findRewrittenCommentSpans(raws.raw, raws.scss) ?? (text.includes(`//`) ? findInlineCommentSpans(text) : [])

		if (!text.includes(`//`)) return []

		// A double slash of a syntax that marks its comments in a copy of its own is code — part of an address, most often
		return syntaxKeepsInlineComments(nodeSyntax(node, result)) ? findInlineCommentSpans(text) : []
	},
	selectorCopies (rule: PostcssRule): SelectorCopies {
		let selectorRaws: SyntaxRaw | undefined = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector
		let inlineComments: InlineComment[] | undefined

		// The comments are scanned on the first question that needs them rather than up front: most call sites throw the copies away behind a cheap guard, and the scan reads both spellings character by character
		function commentsOf (): InlineComment[] {
			inlineComments ??= findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

			return inlineComments
		}

		return {
			selector,
			get comments (): InlineComment[] {
				return commentsOf()
			},
			toSourceIndex: (index: number) => toSelectorSourceIndex(index, commentsOf()),
			sourceSpelling (text: string, rawIndex: number): string {
				if (!selectorRaws || typeof selectorRaws.scss !== `string`) return text

				return selectorRaws.scss.slice(toSelectorSourceIndex(rawIndex, commentsOf()), toSelectorSourceIndex(rawIndex + text.length, commentsOf()))
			},
			write (fixedSelector: string): void {
				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it
					if (typeof selectorRaws.scss === `string`) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, commentsOf())
				}
				else {
					rule.selector = fixedSelector
				}
			},
		}
	},
}
