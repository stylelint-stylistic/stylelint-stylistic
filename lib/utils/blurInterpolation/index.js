/**
 * @param {string} source
 * @param {string} [blurChar]
 * @returns {string}
 */
export function blurInterpolation (source, blurChar = ` `) {
	return source.replaceAll(/[#@{}]+/g, blurChar)
}
