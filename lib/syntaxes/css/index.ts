import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { endsWithInlineComment } from "../../preprocessor/endsWithInlineComment/index.ts"
import { findRewrittenCommentSpans } from "../../preprocessor/findRewrittenCommentSpans/index.ts"
import { findSelectorInlineComments, type InlineComment } from "../../preprocessor/findSelectorInlineComments/index.ts"
import { movesEndIntoInlineComment } from "../../preprocessor/movesEndIntoInlineComment/index.ts"
import { printedText, rawsOf, writePrintedText } from "../../preprocessor/printedText/index.ts"
import { inlineCommentReading, readsInlineComments, syntaxKeepsInlineComments } from "../../preprocessor/readsInlineComments/index.ts"
import { restoreSelectorInlineComments } from "../../preprocessor/restoreSelectorInlineComments/index.ts"
import { searchCopy } from "../../preprocessor/searchCopy/index.ts"
import { toSelectorSourceIndex } from "../../preprocessor/toSelectorSourceIndex/index.ts"
import { writesIntoInlineComment } from "../../preprocessor/writesIntoInlineComment/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { type CommentSpan, findCommentSpans } from "../../utils/findCommentSpans/index.ts"
import { findInterpolationSpans } from "../../utils/findInterpolationSpans/index.ts"
import { isStandardSyntaxCombinator } from "../../utils/isStandardSyntaxCombinator/index.ts"
import { isStandardSyntaxDeclaration } from "../../utils/isStandardSyntaxDeclaration/index.ts"
import { isStandardSyntaxFunction } from "../../utils/isStandardSyntaxFunction/index.ts"
import { isStandardSyntaxProperty } from "../../utils/isStandardSyntaxProperty/index.ts"
import { isStandardSyntaxRule } from "../../utils/isStandardSyntaxRule/index.ts"
import { isStandardSyntaxSelector } from "../../utils/isStandardSyntaxSelector/index.ts"
import { isStandardSyntaxValue } from "../../utils/isStandardSyntaxValue/index.ts"
import { nodeSyntax } from "../../utils/nodeSyntax/index.ts"
import type { SyntaxRaw } from "../../utils/typeGuards/index.ts"
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
	// An at-rule or a comment the core once turned away was a preprocessor's construct alone, and a file of such a syntax no longer reaches these rules
	isStandardAtRule: () => true,
	isStandardRule: isStandardSyntaxRule,
	isStandardDeclaration: isStandardSyntaxDeclaration,
	isStandardProperty: isStandardSyntaxProperty,
	isStandardValue: isStandardSyntaxValue,
	isStandardSelector: isStandardSyntaxSelector,
	isStandardFunction: isStandardSyntaxFunction,
	isStandardComment: () => true,
	isStandardCombinator: isStandardSyntaxCombinator,
	// Whichever copies a node carries are read and written: the raw PostCSS keeps beside a text holding comments, and the spelled copy `postcss-scss` keeps beside that. A root the probe could not classify may still have been parsed by that syntax, and a text read out of the wrong copy counts its positions two characters off per comment and lands its fix nowhere
	read: printedText,
	write: writePrintedText,
	inlineComments: inlineCommentReading,
	commentSpans: (text, node, result) => findCommentSpans(text, readsInlineComments(node, result)),
	endsWithInlineComment,
	movesEndIntoInlineComment,
	writesIntoInlineComment,
	searchCopy,
	printedComments (node: AtRule | Declaration, text: string, result: PostcssResult): CommentSpan[] {
		let raws = rawsOf(node)
		let pair = raws && typeof raws.scss === `string` ? { rewritten: raws.raw, spelled: raws.scss } : undefined
		// The comments the syntax rewrote in the raw are the comments it found, and the two copies say between them where each of them runs — while both still measure the same text; a pair out of step leaves the text to be scanned as one carrying no pair at all
		let inline = pair ? findRewrittenCommentSpans(pair.rewritten, pair.spelled)?.map(({ start, end }) => ({ start, end, isInline: true })) : null

		// The block comments the two copies spell alike, and the scan finds them in the copy the inline ones are blanked out of: a double slash left standing there is code, part of an address most often, and a `/*` inside an inline comment's text opens nothing once that text is spaces
		if (inline) return [...inline, ...findCommentSpans(blankComments(text, inline), false)].toSorted((one, other) => one.start - other.start)

		// A double slash of plain CSS is code — part of an address, most often — and so is one of a syntax that marks its comments in a copy of its own, unless the pair it marked them in has gone out of step and the text is read for what it spells. The syntax is asked only where the text holds a pair of slashes to ask about
		let spellsInlineComments = text.includes(`//`) && (pair !== undefined || syntaxKeepsInlineComments(nodeSyntax(node, result)))

		return findCommentSpans(text, spellsInlineComments)
	},
	requiresTrailingSemicolon: () => false,
	// No rule of plain CSS carries a parameter list, and no at-rule of it is a variable: both marks are `postcss-less`'s, and the less namespace reads them
	readsRuleParams: () => false,
	readsAtRuleAsVariable: () => false,
	spellsOwnArithmetic: readsInlineComments,
	// The spellings a preprocessor interpolates with, read over plain CSS too: `$(…)` is postcss-simple-vars' over a plain file, and a rule that read the text inside a `#{…}` as CSS would rewrite it (#298)
	interpolationSpans: findInterpolationSpans,
	selectorCopies (rule: PostcssRule): SelectorCopies {
		let selectorRaws: SyntaxRaw | undefined = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector
		let inlineComments: InlineComment[] | undefined

		// The comments are scanned on the first question that needs them rather than up front: most call sites throw the copies away behind a cheap guard, and the scan reads both spellings character by character — and finds none where the node carries no spelled copy
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
