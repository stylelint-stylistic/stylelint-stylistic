/** The code `sysexits.h` reserves for a configuration error, which is the one Stylelint exits with. */
const EXIT_CODE_INVALID_CONFIG = 78

export type ConfigurationError = Error & { code: number }

/**
 * Creates a configuration error from text and sets the CLI exit code.
 * @param text - The error message text.
 * @returns The configuration error object with exit code.
 */
export function configurationError (text: string): ConfigurationError {
	let err = new Error(text) as ConfigurationError

	err.code = EXIT_CODE_INVALID_CONFIG

	return err
}
