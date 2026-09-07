import type { AtRule, Declaration, Root, Rule as PostcssRule } from "postcss"
import type { PostcssResult } from "stylelint"

import { colonTokenIndex } from "../../preprocessor/colonTokenIndex/index.ts"
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

/** The core syntax, plain CSS, which every rule is written for. A root a namespace's syntax reads is refused; every other root is accepted, custom syntaxes without a namespace included. */
export let css: Syntax = {
	// A syntax spelling a double slash as a comment is a namespace's; a file with no custom syntax asks no probe, and one the probe cannot classify stays the core's
	accepts (root: Root, result: PostcssResult): boolean {
		if (root.raws.styledSyntaxRangeStart !== undefined) return false

		if (result.stylelint?.config?.customSyntax === undefined) return true

		let reading = inlineCommentReading(root, result)

		return !reading.answered || !reading.spells
	},
	embedding: () => ({ indent: ``, multiline: false }),
	valueEmbedsHostCode: () => false,
	// What the core once turned away was a preprocessor's, and such a file no longer reaches these rules
	isStandardAtRule: () => true,
	isStandardRule: isStandardSyntaxRule,
	isStandardDeclaration: isStandardSyntaxDeclaration,
	isStandardProperty: isStandardSyntaxProperty,
	isStandardValue: isStandardSyntaxValue,
	isStandardSelector: isStandardSyntaxSelector,
	isStandardFunction: isStandardSyntaxFunction,
	isStandardComment: () => true,
	isStandardCombinator: isStandardSyntaxCombinator,
	// The raw PostCSS keeps beside a text holding comments, and the `scss` copy beside that, are read and written where they exist: a root the probe could not classify may still be `postcss-scss`'s
	read: printedText,
	write: writePrintedText,
	inlineComments: inlineCommentReading,
	colonTokenIndex: (before, text, node, result) => colonTokenIndex(before, text, nodeSyntax(node, result), node.source?.input.file),
	commentSpans: (text, node, result) => findCommentSpans(text, readsInlineComments(node, result)),
	endsWithInlineComment,
	movesEndIntoInlineComment,
	writesIntoInlineComment,
	searchCopy,
	printedComments (node: AtRule | Declaration, text: string, result: PostcssResult): CommentSpan[] {
		let raws = rawsOf(node)
		let pair = raws && typeof raws.scss === `string` ? { rewritten: raws.raw, spelled: raws.scss } : undefined
		// The two copies say where each rewritten comment runs; a pair out of step is read as none
		let inline = pair ? findRewrittenCommentSpans(pair.rewritten, pair.spelled)?.map(({ start, end }) => ({ start, end, isInline: true })) : null

		// Block comments are found with the inline ones blanked: a double slash left there is code, and a `/*` inside an inline comment opens nothing
		if (inline) return [...inline, ...findCommentSpans(blankComments(text, inline), false)].toSorted((one, other) => one.start - other.start)

		// A double slash of plain CSS is code, and so is one of a syntax marking its comments in a copy of its own, unless that pair is out of step
		let spellsInlineComments = text.includes(`//`) && (pair !== undefined || syntaxKeepsInlineComments(nodeSyntax(node, result)))

		return findCommentSpans(text, spellsInlineComments)
	},
	requiresTrailingSemicolon: () => false,
	// Both marks are `postcss-less`'s, read by the less namespace
	readsRuleParams: () => false,
	readsAtRuleAsVariable: () => false,
	spellsOwnArithmetic: readsInlineComments,
	// Plain CSS divides inside a math function alone, whose arguments the separator rules pass over
	readsSlashAsOperator: () => false,
	// An escape is a code point of its identifier: `10PX\*2REM` has the unit `PX\*2REM` (#414)
	endsUnitAtEscape: () => false,
	// A preprocessor's interpolations are read over plain CSS too, since a rule reading the inside of a `#{…}` as CSS would rewrite it (#298)
	interpolationSpans: findInterpolationSpans,
	selectorCopies (rule: PostcssRule): SelectorCopies {
		let selectorRaws: SyntaxRaw | undefined = rule.raws.selector
		let selector = selectorRaws ? selectorRaws.raw : rule.selector
		let inlineComments: InlineComment[] | undefined

		// Scanned on the first question that needs them; most call sites never ask
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

					// The stringifier reads the spelled copy, so the fix reaches it too
					if (typeof selectorRaws.scss === `string`) selectorRaws.scss = restoreSelectorInlineComments(fixedSelector, commentsOf())
				}
				else {
					rule.selector = fixedSelector
				}
			},
		}
	},
}
