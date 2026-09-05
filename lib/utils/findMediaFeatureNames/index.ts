import { type ComponentValue, isFunctionNode, isSimpleBlockNode, isTokenNode, parseCommaSeparatedListOfComponentValues, type SimpleBlockNode } from "@csstools/css-parser-algorithms"
import { type CSSToken, isToken, mirrorVariant, stringify, type TokenIdent, tokenize, TokenType } from "@csstools/css-tokenizer"
import { type GeneralEnclosed, isGeneralEnclosed, isMediaFeature, isMediaFeatureBoolean, isMediaFeatureRangeValueNameValue, isMediaQueryInvalid, type MediaFeatureValue, type MediaQuery, parseFromTokens } from "@csstools/media-query-list-parser"

import { RANGE_FEATURE_OPERATOR } from "../../regexps.ts"

export type MediaQueryList = Array<MediaQuery>

export type MediaQuerySerializer = { stringify: () => string }

/** What closes a call, which the tokenizer has no mirror for: a call's opening token carries its name. */
const CLOSE_PAREN: CSSToken = [TokenType.CloseParen, `)`, -1, -1, undefined]

/**
 * Extracts top-level token nodes from a GeneralEnclosed node.
 * @param node - The node to extract tokens from.
 * @returns Array of relevant CSS tokens.
 */
function topLevelTokenNodes (node: GeneralEnclosed): Array<CSSToken> {
	let components = node.value.value

	if (isToken(components) || components.length === 0 || isToken(components[0])) return []

	let relevantTokens: Array<CSSToken> = []

	// To consume the next token if it is a scss variable
	let lastWasDollarSign = false

	for (let component of components) {
		// Only preserve top level tokens (idents, delims, ...)
		// Discard all blocks, functions, ...
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
 * Closes what a block left open, so that the media parser reads it as CSS does: a block the end of the parameters cut short is the block it would have been, closed there. Where the parameters end inside the block itself, the parser hands it back with the end-of-file token as its end, and `tokens()` leaves that token out; where they end inside a call or a block nested in it, that inner node takes the end-of-file token, the outer block ends in nothing at all, and `tokens()` puts that nothing in as such, which the media parser throws on (#399). The nodes left open form one chain, each the last thing in the one around it, so the closers are gathered from the outside in and written from the inside out.
 * @param block - The parenthesised block the media parser is handed.
 * @returns The block's tokens, with a closing token behind them for every node left open.
 */
function closedTokens (block: SimpleBlockNode): Array<CSSToken> {
	let closers: Array<CSSToken> = []
	let node: ComponentValue | undefined = block

	while (node && (isSimpleBlockNode(node) || isFunctionNode(node))) {
		let closer = isFunctionNode(node) ? CLOSE_PAREN : mirrorVariant(node.startToken)
		// Typed as a token, and undefined on a block whose inner node took the end-of-file token
		let end: CSSToken | undefined = node.endToken

		if (!closer || end?.[0] === closer[0]) break

		closers.unshift(closer)
		node = node.value.at(-1)
	}

	if (closers.length === 0) return block.tokens()

	return [...block.tokens().filter((token) => isToken(token)), ...closers]
}

/**
 * Reads the media queries a set of parameters spells, one parenthesised block at a time, and keeps the ones the media query parser could read.
 * @param tokens - The tokens of the parameters.
 * @returns The queries the parser read.
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
 * Searches a CSS string for Media Feature names and invokes a callback for each found name. Found tokens are mutable and modifications made to them will be reflected in the output. This function supports some non-standard syntaxes like SCSS variables and interpolation.
 * @param mediaQueryParams - The media query parameters to search.
 * @param callback - The callback to invoke for each found media feature name.
 * @returns An object with a stringify method to serialize the media query.
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

	// Serializing takes time/resources and not all callers will use this.
	// Handing back an object with a `stringify` method leaves the work undone until a caller asks for it.
	return {
		stringify () {
			return stringify(...tokens)
		},
	}
}

/** The span the value of a media feature occupies in the parameters, from its first token to its last that is neither whitespace nor a comment. */
export type MediaFeatureValueSpan = {
	start: number,
	end: number,
}

/**
 * Measures the span of one value of a feature.
 * @param value - The value, as the media query parser hands it over, its whitespace on either side included.
 * @returns The span, or nothing where the value holds no token but whitespace and comments.
 */
function spanOf (value: MediaFeatureValue): MediaFeatureValueSpan | undefined {
	let tokens = value.tokens().filter((token) => token[0] !== TokenType.Whitespace && token[0] !== TokenType.Comment)
	let first = tokens[0]
	let last = tokens.at(-1)

	if (!first || !last) return

	return { start: first[2], end: last[3] + 1 }
}

/**
 * Finds the spans the values of the named media features occupy in a set of parameters, in the plain form and in the three shapes of the range form alike — one value beside the name, or one on either side of it.
 *
 * The parameters are read the way {@link findMediaFeatureNames} reads them, block by block through the media query parser, so a feature the parser cannot read — one holding a variable of a preprocessor — has no value here, and neither has a feature written without one. The tokens of a value carry their positions in the parameters, and a value's span reaches from its first token to its last that is neither whitespace nor a comment: a comment inside the value is the caller's to read, and one at either edge is no part of the value.
 * @param mediaQueryParams - The parameters, as the file spells them.
 * @param names - The names of the features whose values are wanted, in lower case.
 * @returns The spans, in the order the values stand in the parameters.
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
