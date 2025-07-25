import { isGeneralEnclosed, isMediaFeature, isMediaQueryInvalid, parseFromTokens } from "@csstools/media-query-list-parser"
import { isSimpleBlockNode, isTokenNode, parseCommaSeparatedListOfComponentValues } from "@csstools/css-parser-algorithms"
import { isToken, stringify, tokenize, TokenType } from "@csstools/css-tokenizer"

/** @typedef {Array<import('@csstools/media-query-list-parser').MediaQuery>} MediaQueryList */
/** @typedef {import('@csstools/css-tokenizer').TokenIdent} TokenIdent */
/** @typedef {{ stringify: () => string }} MediaQuerySerializer */

let rangeFeatureOperator = /[<>=]/

/**
 * Search a CSS string for Media Feature names.
 * For every found name, invoke the callback, passing the token as an argument.
 *
 * Found tokens are mutable and modifications made to them will be reflected in the output.
 *
 * This function supports some non-standard syntaxes like SCSS variables and interpolation.
 *
 * @param {string} mediaQueryParams
 * @param {(mediaFeatureName: TokenIdent) => void} callback
 *
 * @returns {MediaQuerySerializer}
 */
export function findMediaFeatureNames (mediaQueryParams, callback) {
	let tokens = tokenize({ css: mediaQueryParams })
	let list = parseCommaSeparatedListOfComponentValues(tokens)

	let mediaQueryConditions = list.flatMap((listItem) => listItem.flatMap((componentValue) => {
		if (
			!isSimpleBlockNode(componentValue) || componentValue.startToken[0] !== TokenType.OpenParen
		) {
			return []
		}

		let blockTokens = componentValue.tokens()

		let mediaQueryList = parseFromTokens(blockTokens, {
			preserveInvalidMediaQueries: true,
		})

		return mediaQueryList.filter((mediaQuery) => !isMediaQueryInvalid(mediaQuery))
	}))

	mediaQueryConditions.forEach((mediaQuery) => {
		mediaQuery.walk(({ node }) => {
			if (isMediaFeature(node)) {
				let token = node.getNameToken()

				if (token[0] !== TokenType.Ident) { return }

				callback(token)
			}

			if (isGeneralEnclosed(node)) {
				topLevelTokenNodes(node).forEach((token, i, topLevelTokens) => {
					if (token[0] !== TokenType.Ident) {
						return
					}

					let nextToken = topLevelTokens[i + 1]
					let prevToken = topLevelTokens[i - 1]

					if (
						// Media Feature
						(!prevToken && nextToken && nextToken[0] === TokenType.Colon)
						// Range Feature
						|| (nextToken
							&& nextToken[0] === TokenType.Delim
							&& rangeFeatureOperator.test(nextToken[4].value))
						// Range Feature
						|| (prevToken
							&& prevToken[0] === TokenType.Delim
							&& rangeFeatureOperator.test(prevToken[4].value))
					) {
						callback(token)
					}
				})
			}
		})
	})

	// Serializing takes time/resources and not all callers will use this.
	// By returning an object with a stringify method, we can avoid doing
	// this work when it's not needed.
	return {
		stringify () {
			return stringify(...tokens)
		},
	}
}

/** @param {import('@csstools/media-query-list-parser').GeneralEnclosed} node */
function topLevelTokenNodes (node) {
	let components = node.value.value

	if (isToken(components) || components.length === 0 || isToken(components[0])) {
		return []
	}

	/** @type {Array<import('@csstools/css-tokenizer').CSSToken>} */
	let relevantTokens = []

	// To consume the next token if it is a scss variable
	let lastWasDollarSign = false

	components.forEach((component) => {
		// Only preserve top level tokens (idents, delims, ...)
		// Discard all blocks, functions, ...
		if (component && isTokenNode(component)) {
			if (component.value[0] === TokenType.Delim && component.value[4].value === `$`) {
				lastWasDollarSign = true

				return
			}

			if (lastWasDollarSign) {
				lastWasDollarSign = false

				return
			}

			relevantTokens.push(component.value)
		}
	})

	return relevantTokens
}
