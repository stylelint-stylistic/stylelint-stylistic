/** The `sysexits.h` code for a configuration error, which Stylelint exits with. */
const EXIT_CODE_INVALID_CONFIG = 78

export type ConfigurationError = Error & { code: number }

/**
 * Creates a configuration error carrying the CLI exit code.
 * @param text - The message.
 * @returns The error.
 */
export function configurationError (text: string): ConfigurationError {
	let err = new Error(text) as ConfigurationError

	err.code = EXIT_CODE_INVALID_CONFIG

	return err
}
