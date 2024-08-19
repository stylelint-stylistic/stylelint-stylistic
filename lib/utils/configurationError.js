const EXIT_CODE_INVALID_CONFIG = 78

/** @typedef {Error & { code: number }} ConfigurationError */
/**
 * Create configurationError from text and set CLI exit code.
 *
 * @param {string} text
 * @returns {ConfigurationError}
 */
export default function configurationError (text) {
	let err = /** @type {ConfigurationError} */ (new Error(text))

	err.code = EXIT_CODE_INVALID_CONFIG

	return err
}
