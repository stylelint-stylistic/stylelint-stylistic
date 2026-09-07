import stylelint from "stylelint"

import { LEADING_COLON_AND_WHITESPACE, LEADING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { declarationColonSpaceChecker } from "../../utils/declarationColonSpaceChecker/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { moveDeclarationValueHeadIntoBetween } from "../../utils/moveDeclarationValueHeadIntoBetween/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runInDeclarationEndsTheStylesheet } from "../../utils/runInDeclarationEndsTheStylesheet/index.ts"
import { runPastDeclaration, runPastDeclarationEndsTheStylesheet, writeRunPastDeclaration } from "../../utils/runPastDeclaration/index.ts"
import { assertString } from "../../utils/validateTypes/index.ts"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.ts"
import { writesSharedRun } from "../../utils/writesSharedRun/index.ts"

let { utils: { validateOptions } } = stylelint

let shortName = `declaration-colon-space-after`

const MESSAGES = defineMessages({
	expectedAfter: () => `Expected single space after ":"`,
	rejectedAfter: () => `Unexpected whitespace after ":"`,
	expectedAfterSingleLine: () => `Expected single space after ":" with a single-line declaration`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** `always` a single space after the colon, `never` no whitespace, `always-single-line` a space where the value is single-line only. */
export type PrimaryOption = `always` | `never` | `always-single-line`

/**
 * Requires a single space or disallows whitespace after the colon of declarations.
 * @param scope - What the namespace hands the rule.
 * @param scope.ruleName - The configured name.
 * @param scope.messages - The messages, closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option.
 * @returns The check.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: PrimaryOption): RuleCheck {
	let checker = whitespaceChecker(`space`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `never`, `always-single-line`],
		})

		if (!validOptions) return

		declarationColonSpaceChecker({
			root,
			result,
			syntax,
			locationChecker: checker.after,
			checkedRuleName: ruleName,
			// A run behind the colon that ends the stylesheet, in the trailing raw (#537) or in the declaration's text, a custom property's above all (#546), is left alone: no spelling of this rule keeps the closing break
			isChecked: (decl) => !runPastDeclarationEndsTheStylesheet(syntax, decl, result) && !runInDeclarationEndsTheStylesheet(syntax, decl, result),
			// Where the value is only the run, the semicolon rules share it, and the rules asked settle who writes (#416)
			isFixable: (decl) => writesSharedRun(syntax, decl, result, ruleName),
			fix: (decl, index) => {
				let space = primary === `never` ? `` : ` `

				// Where nothing prints behind the colon the run is in the next raw; a space in `between` would grow the declaration every `--fix` (#387)
				if (runPastDeclaration(syntax, decl, result) !== undefined) {
					writeRunPastDeclaration(decl, space)

					return true
				}

				let between = decl.raws.between

				assertString(between)

				// Counted from the start of `between`; the move below writes onto its end
				let colonIndex = between.length + index - declarationValueIndex(decl)

				// Where `between` ends at the colon the run is the value's head, unwritable in place (#109, #371)
				if (colonIndex === between.length - 1) moveDeclarationValueHeadIntoBetween(syntax, decl, (syntax.read(decl).match(LEADING_CSS_WHITESPACE) as RegExpMatchArray)[0].length)

				let { raws } = decl

				assertString(raws.between)

				raws.between = raws.between.slice(0, colonIndex) + raws.between.slice(colonIndex).replace(LEADING_COLON_AND_WHITESPACE, `:${space}`)

				return true
			},
		})
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
