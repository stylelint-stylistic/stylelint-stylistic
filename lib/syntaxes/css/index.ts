import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"

import { endsWithInlineComment } from "../../utils/endsWithInlineComment/index.ts"
import { findCommentSpans } from "../../utils/findCommentSpans/index.ts"
import { findInlineCommentSpans } from "../../utils/findInlineCommentSpans/index.ts"
import { findSelectorInlineComments } from "../../utils/findSelectorInlineComments/index.ts"
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
import { movesEndIntoInlineComment } from "../../utils/movesEndIntoInlineComment/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import { inlineCommentReading, readsInlineComments, syntaxKeepsInlineComments } from "../../utils/readsInlineComments/index.ts"
import { restoreSelectorInlineComments } from "../../utils/restoreSelectorInlineComments/index.ts"
import { searchCopy } from "../../utils/searchCopy/index.ts"
import { setAtRuleParams } from "../../utils/setAtRuleParams/index.ts"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.ts"
import { setRuleSelector } from "../../utils/setRuleSelector/index.ts"
import { toSelectorSourceIndex } from "../../utils/toSelectorSourceIndex/index.ts"
import { isDeclaration, isRule, type SyntaxRaw } from "../../utils/typeGuards/index.ts"
import { writesIntoInlineComment } from "../../utils/writesIntoInlineComment/index.ts"
import type { SelectorCopies, Syntax } from "../index.ts"

/** The syntax of the core: plain CSS, which every rule of the plugin is written for. A styled template is the `styled` namespace's to read, so a root carrying that parser's mark is refused; every other root is still accepted, custom syntaxes without a namespace of their own included. */
export let css: Syntax = {
	accepts: (root: Root) => root.raws.styledSyntaxRangeStart === undefined,
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
	readsInlineComments,
	keepsInlineComments: (node, result) => syntaxKeepsInlineComments(nodeSyntax(node, result)),
	commentSpans: (text, node, result) => findCommentSpans(text, readsInlineComments(node, result)),
	inlineCommentSpans: (text, node, result) => findInlineCommentSpans(text, readsInlineComments(node, result)),
	endsWithInlineComment,
	movesEndIntoInlineComment,
	writesIntoInlineComment,
	searchCopy,
	selectorCopies (rule: PostcssRule): SelectorCopies {
		let selectorRaws: SyntaxRaw | undefined = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector
		let inlineComments = findSelectorInlineComments(selector, selectorRaws && selectorRaws.scss)

		return {
			selector,
			comments: inlineComments,
			toSourceIndex: (index: number) => toSelectorSourceIndex(index, inlineComments),
			sourceSpelling (text: string, rawIndex: number): string {
				if (!selectorRaws || !selectorRaws.scss) return text

				return selectorRaws.scss.slice(toSelectorSourceIndex(rawIndex, inlineComments), toSelectorSourceIndex(rawIndex + text.length, inlineComments))
			},
			write (fixedSelector: string): void {
				if (selectorRaws) {
					selectorRaws.raw = fixedSelector

					// The stringifier reads the copy the source spelled, so the fix has to reach that one as well, with every inline comment spelled the way the file spells it
					if (selectorRaws.scss) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, inlineComments)
				}
				else rule.selector = fixedSelector
			},
		}
	},
}
