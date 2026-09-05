import { tokenize, TokenType } from "@csstools/css-tokenizer"
import type { AtRule, Declaration } from "postcss"
import valueParser, { type Node } from "postcss-value-parser"
import stylelint, { type RuleMessage } from "stylelint"

import { MEDIA_AT_RULE } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { atRuleParamIndex } from "../../utils/atRuleParamIndex/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findCommentSpanHolding } from "../../utils/findCommentSpans/index.ts"
import { findInterpolationSpanTouching } from "../../utils/findInterpolationSpans/index.ts"
import { getDimension } from "../../utils/getDimension/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import { hideQuotesInComments } from "../../utils/hideQuotesInComments/index.ts"
import { opensAnAddress } from "../../utils/opensAnAddress/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { weldEscapedWords } from "../../utils/weldEscapedWords/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `unit-case`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** What one miscased unit is reported as: where the warning stands, counted in the node, what it says, and the write that answers it, counted in the text the walk reads. */
type Problem = {
	index: number,
	endIndex: number,
	message: RuleMessage,
	messageArgs: string[],
	edit: Edit,
}

/**
 * Specifies lowercase or uppercase for units.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, one of `lower` and `upper`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: `lower` | `upper`): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(result, ruleName, {
			actual: primary,
			possible: [`lower`, `upper`],
		})

		if (!validOptions) return

		/**
		 * Checks a node for unit case violations.
		 * @param node - The node to check.
		 * @param checkedValue - The value to check.
		 * @param getIndex - Function to get the index of the node.
		 */
		function check<T extends AtRule | Declaration> (node: T, checkedValue: string, getIndex: (node: T) => number): void {
			let problems: Problem[] = []
			let hasFixed = false

			// Every comment of the value, both kinds, and both readings below want them all. A double slash opens a comment that runs to the end of its line, and the value parser knows nothing of the kind, so what such a comment holds comes back as ordinary words and calls; a block comment reaches the walk as a node of its own — except one opening `/*/`, which the parser closes on the star it opened with, handing the rest of its text back the same way (#378)
			let comments = syntax.commentSpans(checkedValue, node, result)
			// An interpolation is written in a language of its own, and the compiler expanding it settles what the text beside it means, so nothing a value spells next to one is a dimension this rule can read. The interpolations are found in the value once, and every node of the walk is measured against them. They are sought in a copy with every comment blanked out, since a brace written in a comment closes no interpolation and the code standing behind such a brace is code the file spells
			let interpolations = syntax.interpolationSpans(blankComments(checkedValue, comments), node, result)

			/**
			 * Reads the dimension a value node holds and says where its unit is written in the case the option does not ask for.
			 * @param valueNode - The value parser node to read.
			 * @returns What to report about the unit and what to write in its place, or `null` where the node carries no miscased one.
			 */
			function readMiscasedUnit (valueNode: Node): Problem | null {
				let dimension = getDimension(syntax, valueNode)

				if (!dimension.number || !dimension.unit) return null

				let { number, unit, positions } = dimension

				let expectedUnit = primary === `lower` ? unit.toLowerCase() : unit.toUpperCase()

				if (unit === expectedUnit) return null

				let index = getIndex(node)
				// The warning opens where the unit's first character stands and closes one character past its last, so it covers the run that reading was taken from and nothing besides. `getDimension` reads its unit out of a copy with the hack units taken out, and `positions` is the only way from a length counted in that copy to a place in the text the file spells: a `\9` written between the letters of a unit keeps its place, and everything the unit ends in front of — a bang flag, a brace, a hash, the name of a variable — stays outside a run measured this way.
				let unitStart = positions[number.length]
				let unitLast = positions[number.length + unit.length - 1]

				if (unitStart === undefined || unitLast === undefined) return null

				let unitEnd = unitLast + 1
				// The write is the run the warning underlines, recased, and nothing else. The text is edited at that run rather than printed anew from the parsed tree, since `postcss-value-parser` does not always give back the text it was handed — a comment opening `/*/` comes back as `/**/` — and a fix printed from the tree would rewrite a comment standing elsewhere in the value. The run is taken from the file rather than from the copy the unit was read out of, so that a hack unit standing between its letters keeps its place and only the letters change case
				let run = valueNode.value.slice(unitStart, unitEnd)

				return {
					index: index + valueNode.sourceIndex + unitStart,
					endIndex: index + valueNode.sourceIndex + unitEnd,
					message: messages.expected,
					messageArgs: [unit, expectedUnit],
					edit: {
						start: valueNode.sourceIndex + unitStart,
						end: valueNode.sourceIndex + unitEnd,
						text: primary === `lower` ? run.toLowerCase() : run.toUpperCase(),
					},
				}
			}

			// The value is parsed in a copy of itself with every quotation mark its comments leave open masked, so that the parser pairs the marks the value spells the way the file pairs them (#508)
			let parsed = valueParser(hideQuotesInComments(checkedValue, comments))

			// The words the parser hands over are not the tokens the file spells, and they part from them both ways. The whitespace closing a hexadecimal escape belongs to the escape, and the parser breaks the value at it all the same, so `10px\9 2PX` — one dimension to the tokenizer, to Sass, to Less and to `lightningcss` — came back as two words and was read as two dimensions, `2PX` reported under `lower` and `px` under `upper`; the words are put back together before anything is read, the comments given along so that a word standing in the text of one, which the parser hands back as words like any other, is welded onto nothing (#526)
			weldEscapedWords(parsed.nodes, comments)

			parsed.walk((valueNode, at, siblings) => {
				let value = valueNode.value

				// A call opening an address holds a URL and no arguments of its own, so it is passed over whole. The name is read rather than matched against four characters, so that `u\rl(`, `\75 rl(` and `URL(` are the token `url(` is here as they are to the scan that finds the comments — and to Sass, and to `lightningcss`.
				if (opensAnAddress(valueNode, at, siblings)) return false

				// A node standing in the text of a comment is no node of the value: leave it alone. What it holds is still walked, and every node of that asked the same question, since a call opened inside such a comment reaches past the break or the delimiter that closes it and the code it gathers there is code the file spells. An address is passed over first, since the scan that finds the comments steps over one only where it reads it as code: an `url()` opened in a comment's text is a node of that comment holding an address that reaches past the comment's end, and what stands there is nothing this rule may read.
				if (findCommentSpanHolding(valueNode, comments)) return

				// A node carrying any text of an interpolation is passed over whichever side of it the node opens on, since a value parser breaks an interpolation holding whitespace into words and hands no one of them the whole of it: `isStandardSyntaxValue` is asked about a word at a time and answers that `10px#{$a` holds no interpolation at all. What such a node holds is still walked, as the text of an inline comment is, and every node of it asked the same
				if (findInterpolationSpanTouching(valueNode, interpolations)) return

				if (valueNode.type !== `word`) return

				// The other way the words part from the tokens: the parser hands over as one word what the grammar reads as several, and a word is more than one dimension wherever a character that is no code point of an identifier ends a unit without parting the word — `10PX*2REM` is two dimensions and a star, `10PX%2REM` two and a delimiter, `10PX.2REM` and `10PX+2REM` two standing next to each other with nothing between, and `10PX\⏎2REM` two with a delimiter and whitespace between, every one of which `lightningcss` recases both units of. The word used to be cut at the stars it spells and each part read as one dimension, so the second of any other pair was reached by nothing (#526). The tokenizer the plugin already depends on reads the word into its tokens instead, and every dimension among them is read through a node built for it — standing where the word does plus what the tokens in front of it take up, which is the shape two makings that described no text of the part at all went wrong on: `2*10PX` was underlined as an empty run past the end of the line, and `10px*2REM` as the closing brace of the block behind the value. The escapes are the tokenizer's to read, so `10PX\*2REM` is the one dimension whose unit is `PX\*2REM` (#414) and `10PX\\*2REM` two again. What is written is decided by the same reading: each named unit carries its own edit, so a dimension is written whether or not the word around it reads as one — `$var*2REM` used to be named and never written, since the whole word was refused and one edit per word was all there was — and nothing outside a named unit is written at all, neither the `A` of `1PX*A` nor the name of the variable in `10PX*$VAR` (#413, #425)
				for (let token of tokenize({ css: value })) {
					if (token[0] !== TokenType.Dimension) continue

					let problem = readMiscasedUnit({
						...valueNode,
						sourceIndex: valueNode.sourceIndex + token[2],
						sourceEndIndex: valueNode.sourceIndex + token[3] + 1,
						value: value.slice(token[2], token[3] + 1),
					})

					if (problem) problems.push(problem)
				}
			})

			/** Says that a fix was called, so that the write below knows it was asked for. */
			function markFixed (): void {
				hasFixed = true
			}

			if (problems.length > 0) {
				for (let err of problems) {
					report({
						index: err.index,
						endIndex: err.endIndex,
						message: err.message,
						messageArgs: err.messageArgs,
						node,
						result,
						ruleName,
						fix: markFixed,
					})
				}

				// Every fix of this rule writes every unit the walk named, whichever problem it was reported for: the text is written once, so the writing waits for the whole list of problems to be reported, and one fix among them called is what asks for it.
				if (hasFixed) {
					let fixedValue = applyEditsFromEnd(checkedValue, problems.map((problem) => problem.edit))

					syntax.write(node, fixedValue)
				}
			}
		}

		root.walkAtRules((atRule) => {
			if (!MEDIA_AT_RULE.test(atRule.name) && !syntax.readsAtRuleAsVariable(atRule)) return

			check(atRule, syntax.read(atRule), atRuleParamIndex)
		})
		root.walkDecls((decl) => check(decl, syntax.read(decl), declarationValueIndex))
	}
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
