/**
 * @param {string} source
 *
 * @returns {string}
 */
export default function blurInterpolation (source, blurChar = ` `) {
	return source.replace(/[#@{}]+/g, blurChar)
}
