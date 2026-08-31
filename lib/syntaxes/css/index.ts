import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { endsWithInlineComment } from "../../preprocessor/endsWithInlineComment/index.ts"
import { movesEndIntoInlineComment } from "../../preprocessor/movesEndIntoInlineComment/index.ts"
import { inlineCommentReading, readsInlineComments, syntaxKeepsInlineComments } from "../../preprocessor/readsInlineComments/index.ts"
import { searchCopy } from "../../preprocessor/searchCopy/index.ts"
import { writesIntoInlineComment } from "../../preprocessor/writesIntoInlineComment/index.ts"
import { findCommentSpans } from "../../utils/findCommentSpans/index.ts"
import { findInlineCommentSpans, type InlineCommentSpan } from "../../utils/findInlineCommentSpans/index.ts"
import { getAtRuleParams } from "../../utils/getAtRuleParams/index.ts"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.ts"
import { getRuleSelector } from "../../utils/getRuleSelector/index.ts"
import { isStandardSyntaxCombinator } from "../../utils/isStandardSyntaxCombinator/index.ts"
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

/** The syntax of the core: plain CSS, which every rule of the plugin is written for. A root a namespace's syntax reads is refused — a styled template by its parser's mark, a Less or SCSS stylesheet by the probe of a double slash — and every other root is still accepted, custom syntaxes without a namespace of their own included. */
export let css: Syntax = {
	// A styled template is the styled namespace's, a Less file the less namespace's and an SCSS file the scss namespace's: a syntax that spells a double slash as a comment at all is one the core's rules are no longer written for, whether it keeps such a comment in the text a rule reads or rewrites it away. Plain CSS — a file opened with no custom syntax at all — asks no probe, and a syntax the probe learned nothing about is still the core's: only a syntax's own answer turns a file away.
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !reading.answered || !reading.spells
	},
	embedding: () => ({ indent: ``, multiline: false }),
	valueEmbedsHostCode: () => false,
	// Every at-rule, declaration and comment the core once turned away was a preprocessor's construct, and a file of such a syntax no longer reaches these rules
	isStandardAtRule: () => true,
	isStandardRule: isStandardSyntaxRule,
	isStandardDeclaration: () => true,
	isStandardProperty: isStandardSyntaxProperty,
	isStandardValue: isStandardSyntaxValue,
	isStandardSelector: isStandardSyntaxSelector,
	isStandardFunction: isStandardSyntaxFunction,
	isStandardComment: () => true,
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
	// A double slash of plain CSS is code — part of an address, most often — and no syntax the core accepts both spells an inline comment and keeps it in the text a rule reads
	printedInlineComments (node: AtRule | Declaration, text: string, result: PostcssResult): InlineCommentSpan[] {
		if (!text.includes(`//`)) return []

		return syntaxKeepsInlineComments(nodeSyntax(node, result)) ? findInlineCommentSpans(text) : []
	},
	requiresTrailingSemicolon: () => false,
	// No rule of plain CSS carries a parameter list, and no at-rule of it is a variable: both marks are `postcss-less`'s, and the less namespace reads them
	readsRuleParams: () => false,
	readsAtRuleAsVariable: () => false,
	spellsOwnArithmetic: readsInlineComments,
	// No spelling of plain CSS interpolates
	interpolationSpans: () => [],
	// PostCSS keeps the text of a selector holding comments in a raw beside the copy it hands back, and no third copy stands anywhere: the parsed text is the file's own spelling, so nothing maps and nothing restores
	selectorCopies (rule: PostcssRule): SelectorCopies {
		let selectorRaws: SyntaxRaw | undefined = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector

		return {
			selector,
			comments: [],
			toSourceIndex: (index: number) => index,
			sourceSpelling: (text: string) => text,
			write (fixedSelector: string): void {
				if (selectorRaws) selectorRaws.raw = fixedSelector
				else rule.selector = fixedSelector
			},
		}
	},
}
