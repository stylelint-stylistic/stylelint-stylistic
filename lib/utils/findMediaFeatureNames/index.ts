import { type ComponentValue, isFunctionNode, isSimpleBlockNode, isTokenNode, parseCommaSeparatedListOfComponentValues, type SimpleBlockNode } from "@csstools/css-parser-algorithms"
import { type CSSToken, isToken, mirrorVariant, stringify, type TokenIdent, tokenize, TokenType } from "@csstools/css-tokenizer"
import { type GeneralEnclosed, isGeneralEnclosed, isMediaFeature, isMediaFeatureBoolean, isMediaFeatureRangeValueNameValue, isMediaQueryInvalid, type MediaFeatureValue, type MediaQuery, parseFromTokens } from "@csstools/media-query-list-parser"

import { RANGE_FEATURE_OPERATOR } from "../../regexps.ts"

export type MediaQueryList = Array<MediaQuery>

export type MediaQuerySerializer = { stringify: () => string }

/** Closes a call; the tokenizer has no mirror for its opening token. */
const CLOSE_PAREN: CSSToken = [TokenType.CloseParen, `)`, -1, -1, undefined]

/**
 * Extracts a GeneralEnclosed node's top-level tokens.
 * @param node - The parenthesised group whose tokens are read.
 * @returns The tokens.
 */
function topLevelTokenNodes (node: GeneralEnclosed): Array<CSSToken> {
	let components = node.value.value

	if (isToken(components) || components.length === 0 || isToken(components[0])) return []

	let relevantTokens: Array<CSSToken> = []

	// Skip the token behind a `$`
	let lastWasDollarSign = false

	for (let component of components) {
		// Top-level tokens only
		if (component && isTokenNode(component)) {
			if (component.value[0] === TokenType.Delim && component.value[4].value === `$`) {
				lastWasDollarSign = true

				continue
			}

			if (lastWasDollarSign) {
				lastWasDollarSign = false

				continue
			}

			relevantTokens.push(component.value)
		}
	}

	return relevantTokens
}

/**
 * Closes what a block left open: a nested node holding the parameters' end takes the end-of-file token, and the outer block's `tokens()` holds a nothing the media parser throws on ([#399](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/399)).
 * @param block - The parenthesised block whose tokens are closed.
 * @returns Its tokens, with a closer for every open node.
 */
function closedTokens (block: SimpleBlockNode): Array<CSSToken> {
	let closers: Array<CSSToken> = []
	let node: ComponentValue | undefined = block

	while (node && (isSimpleBlockNode(node) || isFunctionNode(node))) {
		let closer = isFunctionNode(node) ? CLOSE_PAREN : mirrorVariant(node.startToken)
		// Undefined where the inner node took the end-of-file token
		let end: CSSToken | undefined = node.endToken

		if (!closer || end?.[0] === closer[0]) break

		closers.unshift(closer)
		node = node.value.at(-1)
	}

	if (closers.length === 0) return block.tokens()

	return [...block.tokens().filter((token) => isToken(token)), ...closers]
}

/**
 * Reads the media queries of a set of parameters, a block at a time.
 * @param tokens - The parameters' tokens.
 * @returns The queries the parser could read.
 */
function validQueriesOf (tokens: Array<CSSToken>): Array<MediaQuery> {
	let list = parseCommaSeparatedListOfComponentValues(tokens)

	return list.flatMap((listItem) => listItem.flatMap((componentValue) => {
		if (
			!isSimpleBlockNode(componentValue) || componentValue.startToken[0] !== TokenType.OpenParen
		) return []

		let mediaQueryList = parseFromTokens(closedTokens(componentValue), {
			preserveInvalidMediaQueries: true,
		})

		return mediaQueryList.filter((mediaQuery) => !isMediaQueryInvalid(mediaQuery))
	}))
}

/**
 * Calls back for each media feature name; a change to the token shows in the output. SCSS variables and interpolation are skipped.
 * @param mediaQueryParams - The parameters.
 * @param callback - Called per name.
 * @returns An object with a `stringify` method.
 */
export function findMediaFeatureNames (mediaQueryParams: string, callback: (mediaFeatureName: TokenIdent) => void): MediaQuerySerializer {
	let tokens = tokenize({ css: mediaQueryParams })

	for (let mediaQuery of validQueriesOf(tokens)) {
		mediaQuery.walk(({ node }) => {
			if (isMediaFeature(node)) {
				let token = node.getNameToken()

				if (token[0] !== TokenType.Ident) return

				callback(token)
			}

			if (isGeneralEnclosed(node)) {
				let topLevelTokens = topLevelTokenNodes(node)
				for (let i = 0; i < topLevelTokens.length; i += 1) {
					let token = topLevelTokens[i]
					if (!token || token[0] !== TokenType.Ident) continue

					let nextToken = topLevelTokens[i + 1]
					let prevToken = topLevelTokens[i - 1]

					if (
						// Media Feature
						(!prevToken && nextToken && nextToken[0] === TokenType.Colon)
						// Range Feature
						|| (nextToken
							&& nextToken[0] === TokenType.Delim
							&& RANGE_FEATURE_OPERATOR.test(nextToken[4].value)
						)
						// Range Feature
						|| (prevToken
							&& prevToken[0] === TokenType.Delim
							&& RANGE_FEATURE_OPERATOR.test(prevToken[4].value)
						)
					) callback(token)
				}
			}
		})
	}

	// Serializing costs, so it waits behind a method
	return {
		stringify () {
			return stringify(...tokens)
		},
	}
}

/** The span a media feature's value occupies, edge whitespace and comments excluded. */
export type MediaFeatureValueSpan = {
	start: number,
	end: number,
}

/**
 * Measures the span of one value.
 * @param value - The parsed feature value measured.
 * @returns The span, or nothing for only whitespace and comments.
 */
function spanOf (value: MediaFeatureValue): MediaFeatureValueSpan | undefined {
	let tokens = value.tokens().filter((token) => token[0] !== TokenType.Whitespace && token[0] !== TokenType.Comment)
	let first = tokens[0]
	let last = tokens.at(-1)

	if (!first || !last) return

	return { start: first[2], end: last[3] + 1 }
}

/**
 * Finds the spans the named features' values occupy, plain and range forms alike; a feature the parser cannot read, such as one holding a variable, has none.
 * @param mediaQueryParams - The parameters.
 * @param names - Lower-case.
 * @returns The spans, in source order.
 */
export function findMediaFeatureValues (mediaQueryParams: string, names: Set<string>): MediaFeatureValueSpan[] {
	let spans: MediaFeatureValueSpan[] = []

	for (let mediaQuery of validQueriesOf(tokenize({ css: mediaQueryParams }))) {
		mediaQuery.walk(({ node }) => {
			if (!isMediaFeature(node)) return

			let { feature } = node

			if (isMediaFeatureBoolean(feature) || !names.has(feature.getName().toLowerCase())) return

			let values = isMediaFeatureRangeValueNameValue(feature) ? [feature.valueOne, feature.valueTwo] : [feature.value]

			for (let value of values) {
				let span = spanOf(value)

				if (span) spans.push(span)
			}
		})
	}

	return spans.toSorted((one, other) => one.start - other.start)
}
