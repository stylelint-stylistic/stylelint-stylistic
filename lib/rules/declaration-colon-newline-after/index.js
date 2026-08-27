import stylelint from "stylelint"

import { LEADING_WHITESPACE_WITHOUT_BREAK, OPENS_WITH_BLOCK_COMMENT, OPENS_WITH_LINE_BREAK } from "../../regexps.js"
import { addNamespace } from "../../utils/addNamespace/index.js"
import { declarationColonSource } from "../../utils/declarationColonSource/index.js"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.js"
import { getDeclarationValue } from "../../utils/getDeclarationValue/index.js"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.js"
import { isStandardSyntaxDeclaration } from "../../utils/isStandardSyntaxDeclaration/index.js"
import { moveDeclarationValueHeadIntoBetween } from "../../utils/moveDeclarationValueHeadIntoBetween/index.js"
import { setDeclarationValue } from "../../utils/setDeclarationValue/index.js"
import { whitespaceChecker } from "../../utils/whitespaceChecker/index.js"

let { utils: { report, ruleMessages, validateOptions } } = stylelint

let shortName = `declaration-colon-newline-after`

export let ruleName = addNamespace(shortName)

export let messages = ruleMessages(ruleName, {
	expectedAfter: () => `Expected newline after ":"`,
	expectedAfterMultiLine: () => `Expected newline after ":" with a multi-line declaration`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/**
 * Requires a newline after the colon of declarations.
 * @type {import('stylelint').Rule}
 */
function rule (primary, _secondaryOptions, context) {
	let checker = whitespaceChecker(`newline`, primary, messages)

	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`always`, `always-multi-line`],
		})

		if (!validOptions) return

		root.walkDecls((decl) => {
			if (!isStandardSyntaxDeclaration(decl)) return

			// A declaration the parser did not build has no text between its property and its value for either rule to read: PostCSS prints a colon and a space in place of the raw it lacks, and `declarationValueIndex` counts a colon alone, so the two disagree by the very character these rules are about. No syntax this plugin reads through leaves that raw empty; a declaration another plugin's fix built and put in the tree does.
			if (!decl.raws.between) return

			// The declaration down to the end of its value, as the file prints it: whatever the shape of that value, the run standing behind the colon is in this text wherever the declaration keeps it.
			let source = declarationColonSource(decl)

			// The declaration's own colon is the one PostCSS filed in `raws.between`, that raw holding everything the file spells between the property and the value, so the walk is over that raw's span and no further.
			// A colon standing anywhere else opens no declaration: the value may spell one, a data URI's, and the property may spell one of its own, an escaped `\:`, and reading either as the declaration's sends the check and the fix to a character they are not about.
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/408
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/421
			let walkStart = declarationValueIndex(decl) - decl.raws.between.length

			for (let i = walkStart, l = declarationValueIndex(decl); i < l; i += 1) {
				if (source[i] !== `:`) continue

				// A bare carriage return and a form feed end a line as readily as a line feed to every syntax this plugin reads through, so neither counts as the horizontal whitespace a comment may stand behind on the colon's own line.
				// A comment closes at the first `*/` behind its own opening, and the search starts behind that opening rather than at the colon: a comment written as `/*/` opens on a solidus, and a search from in front of it takes that solidus and the star it stands behind for the comment's end, three characters into a comment that has not closed yet.
				// A search that comes back with nothing is no shape the parser hands over — all three syntaxes refuse a stylesheet holding a comment that never closes — so the colon is what the check falls back to rather than the character the file opens on.
				// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/400
				let commentEnd = source.indexOf(`*/`, source.indexOf(`/*`, i) + 2)
				let indexToCheck = OPENS_WITH_BLOCK_COMMENT.test(source.slice(i + 1)) && commentEnd !== -1 ? commentEnd + 1 : i

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
							fix () {
								let between = decl.raws.between

								// The break goes where the text was read, so the place for it is counted in that text; what stands behind that place is `between`'s own where the value has a word of its own, and the head of the value where it has none
								let betweenStart = declarationValueIndex(decl) - between.length
								let sliceIndex = indexToCheck - betweenStart + 1
								let headLength = sliceIndex - between.length

								if (headLength < 0) {
									let betweenBefore = between.slice(0, sliceIndex)
									let betweenAfter = between.slice(sliceIndex)

									// Trim up to the break that already stands there, whichever character it is, and add one only where none does
									decl.raws.between = OPENS_WITH_LINE_BREAK.test(betweenAfter) ? betweenBefore + betweenAfter.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``) : betweenBefore + context.newline + betweenAfter

									return
								}

								// Only what stands in front of the break is taken over, so that the run behind it is left in the value for whichever rule is asked about the run in front of the semicolon
								moveDeclarationValueHeadIntoBetween(decl, headLength)

								let valueAfter = getDeclarationValue(decl)

								if (OPENS_WITH_LINE_BREAK.test(valueAfter)) setDeclarationValue(decl, valueAfter.replace(LEADING_WHITESPACE_WITHOUT_BREAK, ``))
								else decl.raws.between += context.newline
							},
						})
					},
				})
			}
		})
	}
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default rule
