import stylelint from "stylelint"

import { LEADING_WHITESPACE_WITHOUT_BREAK, LINE_BREAK, OPENS_WITH_BLOCK_COMMENT, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE, TRAILING_WHITESPACE_WITHOUT_BREAK } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { colonIndexInBetween } from "../../utils/colonIndexInBetween/index.ts"
import { declarationColonSource } from "../../utils/declarationColonSource/index.ts"
import { declarationValueAsSpelled } from "../../utils/declarationValueAsSpelled/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getLineBreak } from "../../utils/getLineBreak/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { moveDeclarationValueHeadIntoBetween } from "../../utils/moveDeclarationValueHeadIntoBetween/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runPastDeclaration, runPastDeclarationEndsTheStylesheet, writeRunPastDeclaration } from "../../utils/runPastDeclaration/index.ts"
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

/** `always` a newline after the colon, `always-multi-line` where the value is multi-line only. */
export type PrimaryOption = `always` | `always-multi-line`

/**
 * Requires a newline after the colon of declarations.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!syntax.isStandardDeclaration(decl)) return

			// A declaration another plugin's fix built has no `raws.between`; PostCSS prints `: ` for it while `declarationValueIndex` counts `:`
			if (!decl.raws.between) return

			// A break behind the last top-level declaration's colon would end the stylesheet on a whitespace line (#537)
			if (runPastDeclarationEndsTheStylesheet(syntax, decl, result)) return

			// The declaration through its value, with the run past it
			let source = declarationColonSource(syntax, decl, result)

			// The colon is the first the parser read as one in `raws.between`: not one in the value, an escaped `\:` in the property, or one in a comment, where a break under `postcss-scss` closes an inline comment early (#388, #408, #421, #499)
			let indexInBetween = colonIndexInBetween(syntax, decl, result)

			if (indexInBetween === -1) return

			let colonIndex = declarationValueIndex(decl) - decl.raws.between.length + indexInBetween
			// A whitespace-only run behind the colon is the run in front of the semicolon too, and the semicolon rules settle who writes it (#416)
			let isFixable = writesSharedRun(syntax, decl, result, ruleName)
			// Where `declaration-block-semicolon-newline-before` asks the shared run for a break, the fix writes the bare break the neighbour would, so either order ends on one file (#417)
			let finishesTheRun = isFixable && sharesRunWithSemicolon(syntax, decl, result, ruleName) && LINE_BREAK.test(whitespaceBeforeSemicolon(syntax, decl, result))

			/** Trims the shared run to the bare break the neighbour asks for; a bare carriage return and a form feed go too, since the neighbour replaces the whole run ([#488](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/488)). */
			function finishTheRun (): void {
				if (!finishesTheRun) return

				syntax.write(decl, syntax.read(decl).replace(TRAILING_WHITESPACE_WITHOUT_BREAK, ``))

				if (syntax.read(decl) === `` && decl.raws.between) decl.raws.between = decl.raws.between.replace(TRAILING_WHITESPACE_WITHOUT_BREAK, ``)
			}

			// The search for the comment's end starts behind its opening, since `/*/` would otherwise close on its own star; an unclosed comment, which every syntax refuses, falls back to the colon (#400)
			let commentEnd = source.indexOf(`*/`, source.indexOf(`/*`, colonIndex) + 2)
			let indexToCheck = OPENS_WITH_BLOCK_COMMENT.test(source.slice(colonIndex + 1)) && commentEnd !== -1 ? commentEnd + 1 : colonIndex

			checker.afterOneOnly({
				source,
				index: indexToCheck,
				// Lineness is read from the value as spelled, since `decl.value` drops comments and the breaks in them (#389)
				lineCheckStr: declarationValueAsSpelled(syntax, decl, result),
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
								// Behind an empty value the run is in the next node's raw; a break written into `between` instead would be added every run (#387)
								let runPast = runPastDeclaration(syntax, decl, result)

								if (runPast !== undefined) {
									// Trim to an existing break, or add one
									writeRunPastDeclaration(decl, OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(runPast) ? runPast.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : getLineBreak(syntax, root, result) + runPast)

									return
								}

								let between = decl.raws.between

								assertString(between)

								// The break lands in `between`, or at the head of the value where `between` holds no whitespace
								let betweenStart = declarationValueIndex(decl) - between.length
								let sliceIndex = indexToCheck - betweenStart + 1
								let headLength = sliceIndex - between.length

								if (headLength < 0) {
									let betweenBefore = between.slice(0, sliceIndex)
									let betweenAfter = between.slice(sliceIndex)

									// Trim to an existing break, or add one
									decl.raws.between = OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE.test(betweenAfter) ? betweenBefore + betweenAfter.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : betweenBefore + getLineBreak(syntax, root, result) + betweenAfter

									finishTheRun()

									return
								}

								// Only the text in front of the break moves; the run behind it stays in the value for the semicolon rules
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
