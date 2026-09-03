import stylelint from "stylelint"

import { LEADING_COLON_AND_WHITESPACE, LEADING_CSS_WHITESPACE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { declarationColonSpaceChecker } from "../../utils/declarationColonSpaceChecker/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { moveDeclarationValueHeadIntoBetween } from "../../utils/moveDeclarationValueHeadIntoBetween/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { runPastDeclaration, writeRunPastDeclaration } from "../../utils/runPastDeclaration/index.ts"
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

/**
 * Requires a single space or disallows whitespace after the colon of declarations.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `always`, `never` and `always-single-line`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `always` | `never` | `always-single-line`): RuleCheck {
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
			// Where the value is nothing but the run behind the colon, that run is the one in front of the semicolon as well, and the rules asked about it settle between them which of them write it (#416)
			isFixable: (decl) => writesSharedRun(syntax, decl, result, ruleName),
			fix: (decl, index) => {
				let space = primary === `never` ? `` : ` `

				// Where the declaration prints nothing behind its colon at all, the run is in the raw of whatever the file wrote next, and the option is about that raw: a space written into `between` here would stand beside the run rather than over it, and the declaration would grow by one on every run of `--fix`
				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/387
				if (runPastDeclaration(syntax, decl, result) !== undefined) {
					writeRunPastDeclaration(decl, space)

					return true
				}

				let between = decl.raws.between

				assertString(between)

				// Where the colon stands inside `between`, rather than how far its end is from there: the move that may follow writes onto the end of `between`, and only a count from the start of it survives that
				let colonIndex = between.length + index - declarationValueIndex(decl)

				// Where `between` ends at the colon, whatever run stands behind it stands at the head of the value instead, and there is no writing over it in place
				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/109
				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/371
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
