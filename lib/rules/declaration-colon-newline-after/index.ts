import stylelint from "stylelint"

import { LEADING_WHITESPACE_WITHOUT_BREAK, LINE_BREAK, OPENS_WITH_BLOCK_COMMENT, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE, TRAILING_WHITESPACE_WITHOUT_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { colonIndexInBetween } from "../../utils/colonIndexInBetween/index.ts"
import { declarationColonSource } from "../../utils/declarationColonSource/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { moveDeclarationValueHeadIntoBetween } from "../../utils/moveDeclarationValueHeadIntoBetween/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runPastDeclaration, writeRunPastDeclaration } from "../../utils/runPastDeclaration/index.ts"
import { assertString } from "../../utils/validateTypes/index.ts"
import { whitespaceBeforeSemicolon } from "../../utils/whitespaceBeforeSemicolon/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { sharesRunWithSemicolon, writesSharedRun } from "../../utils/writesSharedRun/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `declaration-colon-newline-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected newline after ":"`,
	expectedAfterMultiLine: () => `Expected newline after ":" with a multi-line declaration`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline after the colon of declarations.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always` and `always-multi-line`.
 * @param _secondaryOptions - The secondary options, of which this rule takes none.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `always-multi-line`, _secondaryOptions: unknown): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!syntax.isStandardDeclaration(decl)) return

			// A declaration the parser did not build has no text between its property and its value for either rule to read: PostCSS prints a colon and a space in place of the raw it lacks, and `declarationValueIndex` counts a colon alone, so the two disagree by the very character these rules are about. No syntax this plugin reads through leaves that raw empty; a declaration another plugin's fix built and put in the tree does.
			if (!decl.raws.between) return

			// The declaration down to the end of its value, as the file prints it, and behind that whatever run ran on past the declaration: whatever the shape of the value, the run standing behind the colon is in this text wherever the file keeps it.
			let source = declarationColonSource(syntax, decl, result)

			// The declaration's own colon is the one PostCSS filed in `raws.between`, that raw holding everything the file spells between the property and the value, and inside that raw it is the first one the parser read as a colon rather than as text, as every reader of the raw finds it.
			// A colon standing anywhere else opens no declaration: the value may spell one, a data URI's, the property may spell one of its own, an escaped `\:`, and a comment the raw holds may spell one in its text, and reading any of them as the declaration's sends the check and the fix to a character they are not about — into the text of the comment, where a break written under `postcss-scss` closes an inline comment early and leaves the file unparsable.
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/388
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/499
			let indexInBetween = colonIndexInBetween(syntax, decl, result)

			if (indexInBetween === -1) return

			let colonIndex = declarationValueIndex(decl) - decl.raws.between.length + indexInBetween
			// Where nothing but whitespace stands behind the colon, or behind the comment on its line, down to the end of the value, the run this rule asks about is the one in front of the semicolon as well, and the rules asked about it settle between them which of them write it (#416)
			let isFixable = writesSharedRun(syntax, decl, result, ruleName)
			// And where that shared run is one `declaration-block-semicolon-newline-before` asks a break for, the fix below writes the run down to that bare break — the very text the neighbour's own fix spells — so both orders of the two rules rest on one file rather than the first-listed one deciding whether the whitespace in front of the semicolon survives (#417)
			let finishesTheRun = isFixable && sharesRunWithSemicolon(syntax, decl, result, ruleName) && LINE_BREAK.test(whitespaceBeforeSemicolon(syntax, decl, result))

			/** Takes the whitespace that is no part of a break off the end of the shared run the fix has just written its break into — a bare carriage return and a form feed with the spaces and tabs, since the neighbour's own fix replaces the whole run (#488) — wherever the declaration keeps it, so that the run is the bare break the neighbour asks for. */
			function finishTheRun (): void {
				if (!finishesTheRun) return

				syntax.write(decl, syntax.read(decl).replace(TRAILING_WHITESPACE_WITHOUT_BREAK, ``))

				if (syntax.read(decl) === `` && decl.raws.between) decl.raws.between = decl.raws.between.replace(TRAILING_WHITESPACE_WITHOUT_BREAK, ``)
			}

			// A line break is what PostCSS reads as one, so the whitespace a comment may stand behind on the colon's own line runs up to the first line feed and no further.
			// A comment closes at the first `*/` behind its own opening, and the search starts behind that opening rather than at the colon: a comment written as `/*/` opens on a solidus, and a search from in front of it takes that solidus and the star it stands behind for the comment's end, three characters into a comment that has not closed yet.
			// A search that comes back with nothing is no shape the parser hands over — all three syntaxes refuse a stylesheet holding a comment that never closes — so the colon is what the check falls back to rather than the character the file opens on.
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/400
			let commentEnd = source.indexOf(`*/`, source.indexOf(`/*`, colonIndex) + 2)
			let indexToCheck = OPENS_WITH_BLOCK_COMMENT.test(source.slice(colonIndex + 1)) && commentEnd !== -1 ? commentEnd + 1 : colonIndex

			checker.afterOneOnly({
				source,
				index: indexToCheck,
				lineCheckStr: decl.value,
				err: (m) => {
					report({
						message: m,
						node: decl,
						index: indexToCheck,
						endIndex: indexToCheck,
						result,
						ruleName,
						...(isFixable && {
							fix (): void {
								// Where the declaration prints nothing behind its colon at all, the run is in the raw of whatever the file wrote next, and the break goes there: one written into `between` here would stand in front of the run rather than open it, and the declaration would gain a break on every run of `--fix`
								// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
								let runPast = runPastDeclaration(syntax, decl, result)

								if (runPast !== undefined) {
									// Trim up to the break that already stands there, whichever character it is, and add one only where none does — the same pair the branch below writes with
									writeRunPastDeclaration(decl, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(runPast) ? runPast.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : getLineBreak(syntax, root, result) + runPast)

									return
								}

								let between = decl.raws.between

								assertString(between)

								// The break goes where the text was read, so the place for it is counted in that text; what stands behind that place is `between`'s own where the value has a word of its own, and the head of the value where it has none
								let betweenStart = declarationValueIndex(decl) - between.length
								let sliceIndex = indexToCheck - betweenStart + 1
								let headLength = sliceIndex - between.length

								if (headLength < 0) {
									let betweenBefore = between.slice(0, sliceIndex)
									let betweenAfter = between.slice(sliceIndex)

									// Trim up to the break that already stands there, whichever character it is, and add one only where none does
									decl.raws.between = OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(betweenAfter) ? betweenBefore + betweenAfter.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : betweenBefore + getLineBreak(syntax, root, result) + betweenAfter

									finishTheRun()

									return
								}

								// Only what stands in front of the break is taken over, so that the run behind it is left in the value for whichever rule is asked about the run in front of the semicolon
								moveDeclarationValueHeadIntoBetween(syntax, decl, headLength)

								let valueAfter = syntax.read(decl)

								if (OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(valueAfter)) syntax.write(decl, valueAfter.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``))
								else decl.raws.between += getLineBreak(syntax, root, result)

								finishTheRun()
							},
						}),
					})
				},
			})
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
