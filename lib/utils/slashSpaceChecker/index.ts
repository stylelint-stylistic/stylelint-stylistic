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

/** What the rules about the whitespace beside a solidus hand the checker. */
export type SlashSpaceCheckerOptions = {
	root: Root,
	result: PostcssResult,
	syntax: Syntax,
	checkedRuleName: string,

	/** The `before` or the `after` of a `whitespaceChecker`, which reads the text at the solidus and says what is wrong there. */
	locationChecker: WhitespaceChecker,

	/** The side of the solidus the rule is about. */
	position: `before` | `after`,

	/** The primary option, whose family says whether the fix writes the whitespace or takes the run away: `always` and its lineness forms write, `never` and its own take away. */
	expectation: string,

	/** The whitespace the rule is about, which is what an `always` option writes: a single space, or the line break `getLineBreak` gives. */
	whitespace: `space` | `newline`,

	/** The calls whose arguments are passed over, everything nested inside them included. */
	ignoreFunctions?: string | RegExp | (string | RegExp)[] | undefined,

	/** The properties whose declarations are passed over. */
	ignoreProperties?: string | RegExp | (string | RegExp)[] | undefined,
}

/**
 * Builds the check of one text for the whitespace beside every separator solidus it holds.
 *
 * The runs beside a solidus are measured in the text itself, the tokenizer's way (#494): a vertical tab and a no-break space are words to it, so the run ends at either, and a fix writes over the run and nothing beside it. The text is edited at the runs the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed, and every edit is written once the whole text has been read, from the back forward.
 *
 * A rule about a line break behind the solidus reads and writes as its comma twin does (#622). A comment standing behind the solidus moves the question behind the comment: an inline one is closed by a break, so the break the rule asks for is there already and the solidus is passed over, and a block one is read through, the break asked for behind its `*\/`. The break an `always` option writes goes in front of the run standing there, which then becomes the next line's indentation for `indentation` to measure; a break written in front of the solidus goes over the run, that run being the end of a line. A rule about a space writes over the run on either side.
 * @param opts - What the rule handed over.
 * @returns The check, taking the node, its text, where in the node the text opens, the text whose lineness a `-single-line` or `-multi-line` option reads, and whether a parenthesised group is read into.
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
			// A break asked for behind the solidus is put in front of the run, which the twin about a comma does as well: what stood behind the solidus stands behind the break then, as the indentation of the line the break opens
			let span = whitespace === `newline` && position === `after` && writes ? { start: run.start, end: run.start } : run
			// Two writes would take the solidus into a comment, and Stylelint counts a fixer as applied whatever it does, so each is declined before the report and the problem stands. The `before` rules write the run in front of the solidus, and where an inline comment ends in that run, the break it holds is what closes the comment: neither option can be written without taking the solidus, and everything the text has left, into the comment's text. The `after` rules write behind the solidus, where no comment can be open — but taking the run away can close the solidus up against the slash that opens a comment behind it, and `1 //*c*/` and `1 /// c` are a solidus and a comment to plain CSS and one comment opened by a double slash to a preprocessor, the solidus its first character and the rest of the line its text
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
 * Checks the whitespace beside every separator solidus of every declaration's value.
 *
 * A value a preprocessor or a host language computes — one opening with a variable, one holding an interpolation or an expression of the host's — is passed over whole: what stands beside such a text is settled by the compiler expanding it, and no solidus in it is one this checker can place. The lineness a `-single-line` option reads is the declaration's, as printed from its property to the end of its bang, which is the text the twin rules about a value list's commas read it of.
 * @param opts - What the rule handed over.
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
 * Checks the whitespace beside every separator solidus of every `@media` query's features: the `<ratio>` of an `aspect-ratio` feature, in the colon form and in the range form alike.
 *
 * A feature is a parenthesised group with no name in front of it, and so is a grouped condition around several, so the walk reads into every such group here. A parameter list holding an interpolation is passed over whole, as a value is.
 * @param opts - What the rule handed over.
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
