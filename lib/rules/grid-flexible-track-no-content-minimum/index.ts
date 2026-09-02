import type { Declaration } from "postcss"
import valueParser, { type FunctionNode, type Node as ValueParserNode } from "postcss-value-parser"
import stylelint, { type PostcssResult } from "stylelint"

import { CONTENT_SIZED_KEYWORD, GRID_ROW_TRACK_PROPERTY, GRID_SHORTHAND_PROPERTY, GRID_TRACK_LIST_PROPERTY } from "../../regexps.ts"
import { css } from "../../syntaxes/css/index.ts"
import type { Syntax } from "../../syntaxes/index.ts"
import { applyEditsFromEnd, type Edit } from "../../utils/applyEditsFromEnd/index.ts"
import { blankComments } from "../../utils/blankComments/index.ts"
import { declarationValueIndex } from "../../utils/declarationValueIndex/index.ts"
import { defineMessages, defineRule, type RuleScope } from "../../utils/defineRule/index.ts"
import { findInterpolationSpanTouching, type InterpolationSpan } from "../../utils/findInterpolationSpans/index.ts"
import { getDimension } from "../../utils/getDimension/index.ts"
import { getRuleDocUrl } from "../../utils/getRuleDocUrl/index.ts"
import type { NeighbourRule } from "../../utils/neighbourSettings/index.ts"
import { optionsMatches } from "../../utils/optionsMatches/index.ts"
import type { RuleCheck } from "../../utils/ruleCheck/index.ts"
import { type Whitespace, whitespaceAsked } from "../../utils/whitespaceAsked/index.ts"

let { utils: { report, validateOptions } } = stylelint

let shortName = `grid-flexible-track-no-content-minimum`

const MESSAGES = defineMessages({
	expected: (actual, expected) => `Expected "${actual}" to be "${expected}"`,
})

export let meta = {
	url: getRuleDocUrl(shortName),
	fixable: true,
}

/** The three runs of whitespace the call the fix writes holds: inside its parentheses, in front of its comma and behind it. */
type CallRun = `inside` | `beforeComma` | `afterComma`

/** The rules about the whitespace of a call, by the run each of them speaks of and by the whitespace each writes. */
const RULES_OF_CALL_WHITESPACE: Record<CallRun, Partial<Record<Whitespace, NeighbourRule>>> = {
	inside: {
		newline: {
			name: `function-parentheses-newline-inside`,
			options: [`always`, `always-multi-line`, `never-multi-line`],
		},
		space: {
			name: `function-parentheses-space-inside`,
			options: [`always`, `never`, `always-single-line`, `never-single-line`],
		},
	},
	beforeComma: {
		newline: {
			name: `function-comma-newline-before`,
			options: [`always`, `always-multi-line`, `never-multi-line`],
		},
		space: {
			name: `function-comma-space-before`,
			options: [`always`, `never`, `always-single-line`, `never-single-line`],
		},
	},
	afterComma: {
		newline: {
			name: `function-comma-newline-after`,
			options: [`always`, `always-multi-line`, `never-multi-line`],
		},
		space: {
			name: `function-comma-space-after`,
			options: [`always`, `never`, `always-single-line`, `never-single-line`],
		},
	},
}

/** A flexible track whose minimum is content-sized: the node the problem is reported over, and the edit that gives the track a minimum of zero. */
type Problem = {
	node: ValueParserNode,
	edit: Edit,
}

/** What a walk over a track list reads every word against: the interpolations of the text, the syntax that says what a word spells, and how a call the fix writes is to be spelled. */
type Reading = {
	syntax: Syntax,
	interpolations: InterpolationSpan[],
	spellCall: (maximum: string) => string,
}

/**
 * Disallows a content-sized minimum for a flexible grid track.
 *
 * A bare `<flex>` sizes a track as `minmax(auto, <flex>)`, and the `auto` is what lets a long word push the track wider than its share of the space. The rule reports a flexible track whose minimum is `auto`, `min-content` or `max-content` — the bare spelling among them — in every property whose value spells a track list, and its fix gives the track a minimum of zero.
 * @param scope - What the namespace the rule is registered under hands it.
 * @param scope.ruleName - The name a configuration refers to the rule by.
 * @param scope.messages - The messages, each closing with that name.
 * @param scope.syntax - The syntax the rule is built over.
 * @param primary - The primary option, which is `true`.
 * @param secondaryOptions - The secondary options: `ignore`.
 * @returns The check, run over every stylesheet the rule is configured for.
 */
function rule ({ ruleName, messages, syntax }: RuleScope<typeof MESSAGES>, primary: true, secondaryOptions: { ignore?: `rows`[] } = {}): RuleCheck {
	return (root, result) => {
		let validOptions = validateOptions(
			result,
			ruleName,
			{ actual: primary },
			{
				actual: secondaryOptions,
				possible: {
					ignore: [`rows`],
				},
				optional: true,
			},
		)

		if (!validOptions) return

		let ignoresRows = optionsMatches(secondaryOptions, `ignore`, `rows`)

		root.walkDecls((decl) => {
			let { prop } = decl

			if (!GRID_TRACK_LIST_PROPERTY.test(prop)) return

			if (ignoresRows && GRID_ROW_TRACK_PROPERTY.test(prop)) return

			let value = syntax.read(decl)
			let comments = syntax.commentSpans(value, decl, result)
			// The value parser has a node for a block comment and none for a comment opened by a double slash, whose text comes back as ordinary words and calls, and it closes a comment opening `/*/` on the star it opened with (#378). Blanking every comment out answers all of it at once: the copy spells the text character for character everywhere else, so every position below counts in the value itself, and what the parse holds is code the file spells and nothing else
			let copy = blankComments(value, comments)
			let reading: Reading = {
				syntax,
				interpolations: syntax.interpolationSpans(copy, decl, result),
				spellCall: (maximum) => spellCall(syntax, decl, result, maximum),
			}
			let { nodes } = valueParser(copy)
			// A shorthand sizes the rows in front of its top-level solidus and the columns behind it, so with the rows ignored the walk opens behind the solidus. A longhand sizes one axis whatever it spells, and a solidus there parts nothing
			let tracks = ignoresRows && GRID_SHORTHAND_PROPERTY.test(prop) ? behindSolidus(nodes) : nodes
			let problems: Problem[] = []

			findProblems(tracks, reading, problems)

			if (problems.length === 0) return

			let valueIndex = declarationValueIndex(decl)
			// What the fixes changed, and nothing else: the value is edited at the positions the fixes name rather than printed anew from the parsed tree, since `postcss-value-parser` does not give back the text it was handed where a comment opens `/*/`, and a fix made anywhere in such a value would rewrite a comment standing elsewhere in it
			let edits: Edit[] = []

			for (let { node, edit } of problems) {
				let actual = value.slice(node.sourceIndex, node.sourceEndIndex)
				let expected = applyEditsFromEnd(actual, [{ ...edit, start: edit.start - node.sourceIndex, end: edit.end - node.sourceIndex }])

				report({
					message: messages.expected,
					messageArgs: [actual, expected],
					node: decl,
					index: valueIndex + node.sourceIndex,
					endIndex: valueIndex + node.sourceEndIndex,
					result,
					ruleName,
					// Each fix puts its own edit and nothing else on the list, so a problem the report passed over — one standing in a disabled range — writes nothing, whichever of its neighbours is fixed
					fix () {
						edits.push(edit)
					},
				})
			}

			if (edits.length > 0) syntax.write(decl, applyEditsFromEnd(value, edits))
		})
	}
}

/**
 * Finds every flexible track of a track list whose minimum is content-sized.
 *
 * A track list is read where the grammar spells one: at the top level of the value, and again behind the first argument of a `repeat()`. A `minmax()` standing in it is read for the two sizes it holds. A word inside any other call — a `calc()`, the fallback of a `var()`, a `fit-content()` — is a word of that call, and what it sizes is nothing this rule reads.
 * @param nodes - The nodes of the track list.
 * @param reading - What every word is read against.
 * @param problems - The list the problems found are added to.
 */
function findProblems (nodes: ValueParserNode[], reading: Reading, problems: Problem[]): void {
	for (let node of nodes) {
		if (node.type === `word` && isFlexibleTrack(node, reading)) {
			problems.push({ node, edit: { start: node.sourceIndex, end: node.sourceEndIndex, text: reading.spellCall(node.value) } })
			continue
		}

		if (node.type !== `function`) continue

		let name = node.value.toLowerCase()

		if (name === `repeat`) {
			findProblems(argumentsOf(node).slice(1).flat(), reading, problems)
			continue
		}

		if (name !== `minmax`) continue

		let problem = readMinmax(node, reading)

		if (problem) problems.push(problem)
	}
}

/**
 * Reads a `minmax()` for a flexible maximum standing behind a content-sized minimum.
 *
 * The call is read only where it spells the two sizes the grammar gives it, one word each. A minimum spelling anything else — a length, a percentage, a call, a variable, an interpolation, a keyword this rule does not know — is one the rule cannot call content-sized, and the call is left alone.
 * @param call - The `minmax()` node.
 * @param reading - What every word is read against.
 * @returns The problem, or nothing where the call is no flexible track with a content-sized minimum.
 */
function readMinmax (call: FunctionNode, reading: Reading): Problem | undefined {
	let [minimum, maximum, ...rest] = argumentsOf(call)

	if (!minimum || !maximum || rest.length > 0) return

	let [minimumNode, ...minimumRest] = minimum
	let [maximumNode, ...maximumRest] = maximum

	if (!minimumNode || !maximumNode || minimumRest.length > 0 || maximumRest.length > 0) return

	if (minimumNode.type !== `word` || !CONTENT_SIZED_KEYWORD.test(minimumNode.value)) return

	if (maximumNode.type !== `word` || !isFlexibleTrack(maximumNode, reading)) return

	return { node: call, edit: { start: minimumNode.sourceIndex, end: minimumNode.sourceEndIndex, text: `0` } }
}

/**
 * Spells the `minmax()` the fix wraps a bare track in, its parentheses and its comma spaced the way the rules about a call's whitespace ask wherever the configuration lists them, so that one run of `--fix` settles the value whichever order the configuration lists the rules in rather than leaving a call for one of them to respell on the run after. Where no rule speaks of a run, the call is spelled `minmax(0, 1fr)`.
 *
 * The call is written on one line, so the options that speak of a single-line call are the ones consulted: the `-multi-line` ones are silent. Where an `always` of a rule about a break wins, the break is written and the call stops being single-line, and what the options about a multi-line call then say of it is the run after's question (#355).
 * @param syntax - The syntax the rule is built over, whose namespace names the rules.
 * @param decl - The declaration the call is written into.
 * @param result - The Stylelint result, which holds the configuration.
 * @param maximum - The flexible length, written as the file spells it.
 * @returns The call.
 */
function spellCall (syntax: Syntax, decl: Declaration, result: PostcssResult, maximum: string): string {
	let inside = whitespaceAsked(syntax, decl, result, RULES_OF_CALL_WHITESPACE.inside, isSingleLine)
	let beforeComma = whitespaceAsked(syntax, decl, result, RULES_OF_CALL_WHITESPACE.beforeComma, isSingleLine)
	let afterComma = whitespaceAsked(syntax, decl, result, RULES_OF_CALL_WHITESPACE.afterComma, isSingleLine, ` `)

	return `minmax(${inside}0${beforeComma},${afterComma}${maximum}${inside})`
}

/**
 * Says whether the call the fix writes stands on one line, which it does as written: the options about a single-line call are the ones that speak of it.
 * @returns True.
 */
function isSingleLine (): boolean {
	return true
}

/**
 * Splits the nodes of a call into its arguments, on the commas standing between them.
 * @param call - The call.
 * @returns The arguments, each the nodes it holds, whitespace left out.
 */
function argumentsOf (call: FunctionNode): ValueParserNode[][] {
	let groups: ValueParserNode[][] = [[]]

	for (let node of call.nodes) {
		if (node.type === `div` && node.value === `,`) {
			groups.push([])
			continue
		}

		if (node.type === `space`) continue

		groups.at(-1)?.push(node)
	}

	return groups
}

/**
 * Takes the nodes standing behind the top-level solidus of a shorthand, which size its columns.
 * @param nodes - The nodes of the value.
 * @returns The nodes behind the solidus, or none where the value spells no solidus and so sizes rows alone.
 */
function behindSolidus (nodes: ValueParserNode[]): ValueParserNode[] {
	let solidus = nodes.findIndex((node) => node.type === `div` && node.value === `/`)

	return solidus === -1 ? [] : nodes.slice(solidus + 1)
}

/**
 * Says whether a word is a flexible track: a `<flex>` dimension, and nothing beside it.
 *
 * The unit is read in whatever case it is written, since CSS reads it so, and the word is written back as it stands: its case is what `unit-case` is about. A word touching an interpolation is no dimension this rule can read, whichever side of the interpolation it opens on, and a word out of which `getDimension` had to cut anything — a hack unit — spells more than a dimension.
 * @param node - The word node.
 * @param reading - What the word is read against.
 * @returns True where the word is a flexible track.
 */
function isFlexibleTrack (node: ValueParserNode, reading: Reading): boolean {
	if (findInterpolationSpanTouching(node, reading.interpolations)) return false

	let dimension = getDimension(reading.syntax, node)

	if (dimension.unit === null) return false

	return dimension.unit.toLowerCase() === `fr` && dimension.positions.length === node.value.length
}

export let createRule = defineRule({ shortName, meta, messages: MESSAGES, rule })

export let { ruleName, messages } = createRule(css)
