import type { AtRule, Declaration, Root } from "postcss"
import stylelint, { type PostcssResult } from "stylelint"

import { LEADING_CSS_WHITESPACE, MEDIA_AT_RULE, SPACES_THEN_BLOCK_COMMENT, SPACES_THEN_INLINE_COMMENT, TRAILING_CSS_WHITESPACE } from "../../regexps.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../atRuleParamIndex/index.ts"
import { declarationString } from "../declarationString/index.ts"
import { declarationValueIndex } from "../declarationValueIndex/index.ts"
import { findSeparatorSlashes } from "../findSeparatorSlashes/index.ts"
import { getLineBreak } from "../getLineBreak/index.ts"
import { matchesStringOrRegExp } from "../matchesStringOrRegExp/index.ts"
import type { WhitespaceChecker } from "../whitespaceChecker/index.ts"

let { utils: { report } } = stylelint

/** The solidus rules' options. */
export type SlashSpaceCheckerOptions = {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,

	/** A `whitespaceChecker`'s side. */
	locationChecker: WhitespaceChecker,

	/** The side of the solidus. */
	position: `before` | `after`,

	/** The primary option. */
	expectation: string,

	/** What `always` writes. */
	whitespace: `space` | `newline`,

	/** The calls skipped, nested too. */
	ignoreFunctions?: string | RegExp | (string | RegExp)[] | undefined,

	/** The properties skipped. */
	ignoreProperties?: string | RegExp | (string | RegExp)[] | undefined,
}

/**
 * Builds the check of one text's separator solidi.
 *
 * A run ends at a vertical tab or a no-break space ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). The text is edited from the back, not printed, since `postcss-value-parser` may not return what it was given.
 *
 * A newline rule behind the solidus reads as its comma twin does ([#622](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/622)): a `//` comment behind it already ends in a break, so the solidus is skipped; a block comment is read through, the break asked for behind its `*\/`. The break goes in front of the run, which becomes the next line's indentation.
 * @param opts - The options.
 * @returns The check.
 */
function textChecker (opts: SlashSpaceCheckerOptions): (node: AtRule | Declaration, text: string, textIndex: number, lineCheckStr: string, readsGroups: boolean) => void {
	let { syntax, result, position, whitespace } = opts
	let writes = opts.expectation.startsWith(`always`)

	return (node, text, textIndex, lineCheckStr, readsGroups) => {
		let reading = syntax.inlineComments(node, result)
		let written = writes ? (whitespace === `newline` ? getLineBreak(syntax, node, result) : ` `) : ``
		let edits: Edit[] = []

		for (let slashIndex of findSeparatorSlashes(text, syntax, node, result, { readsGroups, ignoreFunctions: opts.ignoreFunctions })) {
			let checkIndex = slashIndex

			if (whitespace === `newline` && position === `after`) {
				let behind = text.slice(slashIndex + 1)

				if (SPACES_THEN_INLINE_COMMENT.test(behind)) continue

				if (SPACES_THEN_BLOCK_COMMENT.test(behind)) checkIndex = text.indexOf(`*/`, slashIndex + 1) + 1
			}

			let run = position === `before`
				? { start: checkIndex - (text.slice(0, checkIndex).match(TRAILING_CSS_WHITESPACE) as RegExpMatchArray)[0].length, end: checkIndex }
				: { start: checkIndex + 1, end: checkIndex + 1 + (text.slice(checkIndex + 1).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length }
			let span = whitespace === `newline` && position === `after` && writes ? { start: run.start, end: run.start } : run
			// Refused before the report, since a fixer cannot decline: `before` over the break closing a `//` comment, `after` closing the solidus up against a comment (`1 /// c` is one)
			let isFixable = position === `before`
				? !syntax.endsWithInlineComment(text.slice(0, span.start), reading)
				: !syntax.movesEndIntoInlineComment(text.slice(0, span.end + 1), text.slice(0, span.start) + written + text.charAt(span.end), reading)

			opts.locationChecker({
				source: text,
				index: checkIndex,
				lineCheckStr,
				err: (message) => {
					let index = textIndex + slashIndex

					report({
						message,
						node,
						index,
						endIndex: index,
						result,
						ruleName: opts.checkedRuleName,
						...(isFixable && { fix: (): void => { edits.push({ ...span, text: written }) } }),
					})
				},
			})
		}

		if (edits.length > 0) syntax.write(node, applyEditsFromEnd(text, edits))
	}
}

/**
 * Checks every declaration value's separator solidi; a computed value is skipped, and `-single-line` reads the declaration to its bang's end.
 * @param opts - The options.
 */
export function checkValueSlashes (opts: SlashSpaceCheckerOptions): void {
	let { syntax } = opts
	let check = textChecker(opts)

	opts.root.walkDecls((decl) => {
		if (!syntax.isStandardDeclaration(decl) || !syntax.isStandardProperty(decl.prop)) return

		if (opts.ignoreProperties !== undefined && matchesStringOrRegExp(decl.prop, opts.ignoreProperties)) return

		let value = syntax.read(decl)

		if (!syntax.isStandardValue(value) || syntax.valueEmbedsHostCode(decl)) return

		check(decl, value, declarationValueIndex(decl), declarationString(syntax, decl), false)
	})
}

/**
 * Checks every `@media` query's separator solidi; a feature is a nameless parenthesised group, so the walk reads into every group, and an interpolation skips the parameters.
 * @param opts - The options.
 */
export function checkMediaFeatureSlashes (opts: SlashSpaceCheckerOptions): void {
	let { syntax } = opts
	let check = textChecker(opts)

	opts.root.walkAtRules(MEDIA_AT_RULE, (atRule) => {
		if (!syntax.isStandardAtRule(atRule)) return

		let params = syntax.read(atRule)

		if (!syntax.isStandardValue(params)) return

		check(atRule, params, atRuleParamIndex(atRule), params, true)
	})
}
