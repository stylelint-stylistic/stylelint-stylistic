import { isSimpleBlockNode, isTokenNode, parseCommaSeparatedListOfComponentValues } from "@csstools/css-parser-algorithms"
import { type CSSToken, isToken, stringify, type TokenIdent, tokenize, TokenType } from "@csstools/css-tokenizer"
import { type GeneralEnclosed, isGeneralEnclosed, isMediaFeature, isMediaQueryInvalid, type MediaQuery, parseFromTokens } from "@csstools/media-query-list-parser"

import { RANGE_FEATURE_OPERATOR } from "../../regexps.ts"

export type MediaQueryList = Array<MediaQuery>

export type MediaQuerySerializer = { stringify: () => string }

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

		let blockTokens = componentValue.tokens()

		let mediaQueryList = parseFromTokens(blockTokens, {
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
