import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { endsWithInlineComment } from "../../preprocessor/endsWithInlineComment/index.ts"
import { findRewrittenCommentSpans } from "../../preprocessor/findRewrittenCommentSpans/index.ts"
import { findSelectorInlineComments, type InlineComment } from "../../preprocessor/findSelectorInlineComments/index.ts"
import { movesEndIntoInlineComment } from "../../preprocessor/movesEndIntoInlineComment/index.ts"
import { inlineCommentReading, readsInlineComments, syntaxKeepsInlineComments } from "../../preprocessor/readsInlineComments/index.ts"
import { restoreSelectorInlineComments } from "../../preprocessor/restoreSelectorInlineComments/index.ts"
import { searchCopy } from "../../preprocessor/searchCopy/index.ts"
import { toSelectorSourceIndex } from "../../preprocessor/toSelectorSourceIndex/index.ts"
import { writesIntoInlineComment } from "../../preprocessor/writesIntoInlineComment/index.ts"
import { findCommentSpans } from "../../utils/findCommentSpans/index.ts"
import { findInlineCommentSpans, type InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { findInterpolationSpans } from "../../utils/findInterpolationSpans/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleSelector } from "../../utils/getRuleSelector/index.ts"
import { isStandardSyntaxAtRule } from "../../utils/isStandardSyntaxAtRule/index.ts"
import { isStandardSyntaxCombinator } from "../../utils/isStandardSyntaxCombinator/index.ts"
import { isStandardSyntaxComment } from "../../utils/isStandardSyntaxComment/index.ts"
import { isStandardSyntaxDeclaration } from "../../utils/isStandardSyntaxDeclaration/index.ts"
import { isStandardSyntaxFunction } from "../../utils/isStandardSyntaxFunction/index.ts"
import { isStandardSyntaxProperty } from "../../utils/isStandardSyntaxProperty/index.ts"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.ts"
import { isStandardSyntaxSelector } from "../../utils/isStandardSyntaxSelector/index.ts"
import { isStandardSyntaxValue } from "../../utils/isStandardSyntaxValue/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { setRuleSelector } from "../../utils/setRuleSelector/index.ts"
import { isDeclaration, isRule, type SyntaxRaw } from "../../utils/typeGuards/index.ts"
import type { SelectorCopies, Syntax } from "../index.ts"

/** The syntax of the core: plain CSS, which every rule of the plugin is written for. A styled template is the `styled` namespace's to read, so a root carrying that parser's mark is refused; every other root is still accepted, custom syntaxes without a namespace of their own included. */
export let css: Syntax = {
	// A styled template is the styled namespace's, and so is a Less file the less namespace's: a syntax that spells a double slash as a comment and keeps it in the text a rule reads is one the core's rules are no longer written for. Plain CSS — a file opened with no custom syntax at all — asks no probe.
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !(reading.spells && reading.keeps)
	},
	embedding: () => ({ indent: ``, multiline: false }),
	valueEmbedsHostCode: () => false,
	isStandardAtRule: isStandardSyntaxAtRule,
	isStandardRule: isStandardSyntaxRule,
	isStandardDeclaration: isStandardSyntaxDeclaration,
	isStandardProperty: isStandardSyntaxProperty,
	isStandardValue: isStandardSyntaxValue,
	isStandardSelector: isStandardSyntaxSelector,
	isStandardFunction: isStandardSyntaxFunction,
	isStandardComment: isStandardSyntaxComment,
	isStandardCombinator: isStandardSyntaxCombinator,
	read (node: AtRule | Declaration | PostcssRule): string {
		if (isDeclaration(node)) return getDeclarationValue(node)

		return isRule(node) ? getRuleSelector(node) : getAtRuleParams(node)
	},
	write (node: AtRule | Declaration | PostcssRule, text: string): void {
		if (isDeclaration(node)) setDeclarationValue(node, text)
		else if (isRule(node)) setRuleSelector(node, text)
		else setAtRuleParams(node, text)
	},
	inlineComments: inlineCommentReading,
	keepsInlineComments: (node, result) => syntaxKeepsInlineComments(nodeSyntax(node, result)),
	commentSpans: (text, node, result) => findCommentSpans(text, readsInlineComments(node, result)),
	inlineCommentSpans: (text, node, result) => findInlineCommentSpans(text, readsInlineComments(node, result)),
	endsWithInlineComment,
	movesEndIntoInlineComment,
	writesIntoInlineComment,
	searchCopy,
	// The one semicolon a language will not part with is a preprocessor's; no construct of plain CSS or of `postcss-scss` holds one
	printedInlineComments (node: AtRule | Declaration, text: string, result: PostcssResult): InlineCommentSpan[] {
		let raws: SyntaxRaw | undefined = isDeclaration(node) ? node.raws.value : node.raws.params

		// The comments the syntax rewrote in the raw are the comments it found, and the two copies say between them where each of them runs — while both still measure the same text; a pair out of step leaves the text to be scanned as one carrying no pair at all
		if (raws && typeof raws.scss === `string`) return findRewrittenCommentSpans(raws.raw, raws.scss) ?? (text.includes(`//`) ? findInlineCommentSpans(text) : [])

		if (!text.includes(`//`)) return []

		// A double slash of a syntax that marks its comments in a copy of its own is code — part of an address, most often
		return syntaxKeepsInlineComments(nodeSyntax(node, result)) ? findInlineCommentSpans(text) : []
	},
	requiresTrailingSemicolon: () => false,
	// No rule of plain CSS carries a parameter list, and no at-rule of it is a variable: both marks are `postcss-less`'s, and the less namespace reads them
	readsRuleParams: () => false,
	readsAtRuleAsVariable: () => false,
	spellsOwnArithmetic: readsInlineComments,
	interpolationSpans: findInterpolationSpans,
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
				else rule.selector = fixedSelector
			},
		}
	},
}
