import { type ComponentValue, isFunctionNode, isSimpleBlockNode, isTokenNode, parseCommaSeparatedListOfComponentValues, type SimpleBlockNode } from "@csstools/css-parser-algorithms"
import { type CSSToken, isToken, mirrorVariant, stringify, type TokenIdent, tokenize, TokenType } from "@csstools/css-tokenizer"
import { type GeneralEnclosed, isGeneralEnclosed, isMediaFeature, isMediaQueryInvalid, type MediaQuery, parseFromTokens } from "@csstools/media-query-list-parser"

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
 * Searches a CSS string for Media Feature names and invokes a callback for each found name. Found tokens are mutable and modifications made to them will be reflected in the output. This function supports some non-standard syntaxes like SCSS variables and interpolation.
 * @param mediaQueryParams - The media query parameters to search.
 * @param callback - The callback to invoke for each found media feature name.
 * @returns An object with a stringify method to serialize the media query.
 */
export function findMediaFeatureNames (mediaQueryParams: string, callback: (mediaFeatureName: TokenIdent) => void): MediaQuerySerializer {
	let tokens = tokenize({ css: mediaQueryParams })
	let list = parseCommaSeparatedListOfComponentValues(tokens)

	let mediaQueryConditions = list.flatMap((listItem) => listItem.flatMap((componentValue) => {
		if (
			!isSimpleBlockNode(componentValue) || componentValue.startToken[0] !== TokenType.OpenParen
		) return []

		let mediaQueryList = parseFromTokens(closedTokens(componentValue), {
			preserveInvalidMediaQueries: true,
		})

		return mediaQueryList.filter((mediaQuery) => !isMediaQueryInvalid(mediaQuery))
	}))

	for (let mediaQuery of mediaQueryConditions) {
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
