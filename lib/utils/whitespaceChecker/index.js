import { configurationError } from "../configurationError/index.js"
import { isSingleLineString } from "../isSingleLineString/index.js"
import { isWhitespace } from "../isWhitespace/index.js"
import { assertFunction, isNullish } from "../validateTypes/index.js"

/**
 * @typedef {(message: string) => string} MessageFunction
 */

/**
 * @typedef {Object} Messages
 * @property {MessageFunction} [expectedBefore]
 * @property {MessageFunction} [rejectedBefore]
 * @property {MessageFunction} [expectedAfter]
 * @property {MessageFunction} [rejectedAfter]
 * @property {MessageFunction} [expectedBeforeSingleLine]
 * @property {MessageFunction} [rejectedBeforeSingleLine]
 * @property {MessageFunction} [expectedBeforeMultiLine]
 * @property {MessageFunction} [rejectedBeforeMultiLine]
 * @property {MessageFunction} [expectedAfterSingleLine]
 * @property {MessageFunction} [rejectedAfterSingleLine]
 * @property {MessageFunction} [expectedAfterMultiLine]
 * @property {MessageFunction} [rejectedAfterMultiLine]
 */

/**
 * @typedef {Object} WhitespaceCheckerArgs
 * @property {string} source - The source string
 * @property {number} index - The index of the character to check before
 * @property {(message: string) => void} err - If a problem is found, this callback
 *   will be invoked with the relevant warning message.
 *   Typically this callback will report() the problem.
 * @property {string} [errTarget] - If a problem is found, this string
 *   will be sent to the relevant warning message.
 * @property {string} [lineCheckStr] - Single- and multi-line checkers
 *   will use this string to determine whether they should proceed,
 *   i.e. if this string is one line only, single-line checkers will check,
 *   multi-line checkers will ignore.
 *   If none is passed, they will use `source`.
 * @property {boolean} [onlyOneChar=false] - Only check *one* character before.
 *   By default, "always-*" checks will look for the `targetWhitespace` one
 *   before and then ensure there is no whitespace two before. This option
 *   bypasses that second check.
 * @property {boolean} [allowIndentation=false] - Allow arbitrary indentation
 *   between the `targetWhitespace` (almost definitely a newline) and the `index`.
 *   With this option, the checker will see if a newline *begins* the whitespace before
 *   the `index`.
 */

/**
 * @typedef {(args: WhitespaceCheckerArgs) => void} WhitespaceChecker
 */

/**
 * @typedef {{
 *   before: WhitespaceChecker,
 *   beforeAllowingIndentation: WhitespaceChecker,
 *   after: WhitespaceChecker,
 *   afterOneOnly: WhitespaceChecker,
 * }} WhitespaceCheckers
 */

/**
 * Create a whitespaceChecker, which exposes the following functions:
 * - `before()`
 * - `beforeAllowingIndentation()`
 * - `after()`
 * - `afterOneOnly()`
 *
 * @param {"space" | "newline"} targetWhitespace - This is a keyword instead
 *   of the actual character (e.g. " ") in order to accommodate
 *   different styles of newline ("\n" vs "\r\n")
 * @param {"always" | "never" | "always-single-line" | "always-multi-line" | "never-single-line" | "never-multi-line"} expectation
 * @param {Messages} messages - An object of message functions;
 *   calling `before*()` or `after*()` and the `expectation` that is passed
 *   determines which message functions are required
 *
 * @returns {WhitespaceCheckers} The checker, with its exposed checking functions
 */
export function whitespaceChecker (targetWhitespace, expectation, messages) {
	// Keep track of active arguments in order to avoid passing
	// too much stuff around, making signatures long and confusing.
	// This variable gets reset anytime a checking function is called.
	/** @type {WhitespaceCheckerArgs} */
	let activeArgs

	/**
	 * Check for whitespace *before* a character.
	 * @type {WhitespaceChecker}
	 */
	function before ({
		source,
		index,
		err,
		errTarget,
		lineCheckStr,
		onlyOneChar = false,
		allowIndentation = false,
	}) {
		activeArgs = {
			source,
			index,
			err,
			errTarget,
			onlyOneChar,
			allowIndentation,
		}

		switch (expectation) {
			case `always`:
				expectBefore()
				break
			case `never`:
				rejectBefore()
				break
			case `always-single-line`:
				if (!isSingleLineString(lineCheckStr || source)) {
					return
				}

				expectBefore(messages.expectedBeforeSingleLine)
				break
			case `never-single-line`:
				if (!isSingleLineString(lineCheckStr || source)) {
					return
				}

				rejectBefore(messages.rejectedBeforeSingleLine)
				break
			case `always-multi-line`:
				if (isSingleLineString(lineCheckStr || source)) {
					return
				}

				expectBefore(messages.expectedBeforeMultiLine)
				break
			case `never-multi-line`:
				if (isSingleLineString(lineCheckStr || source)) {
					return
				}

				rejectBefore(messages.rejectedBeforeMultiLine)
				break
			default:
				throw configurationError(`Unknown expectation "${expectation}"`)
		}
	}

	/**
	 * Check for whitespace *after* a character.
	 * @type {WhitespaceChecker}
	 */
	function after ({ source, index, err, errTarget, lineCheckStr, onlyOneChar = false }) {
		activeArgs = { source, index, err, errTarget, onlyOneChar }

		switch (expectation) {
			case `always`:
				expectAfter()
				break
			case `never`:
				rejectAfter()
				break
			case `always-single-line`:
				if (!isSingleLineString(lineCheckStr || source)) {
					return
				}

				expectAfter(messages.expectedAfterSingleLine)
				break
			case `never-single-line`:
				if (!isSingleLineString(lineCheckStr || source)) {
					return
				}

				rejectAfter(messages.rejectedAfterSingleLine)
				break
			case `always-multi-line`:
				if (isSingleLineString(lineCheckStr || source)) {
					return
				}

				expectAfter(messages.expectedAfterMultiLine)
				break
			case `never-multi-line`:
				if (isSingleLineString(lineCheckStr || source)) {
					return
				}

				rejectAfter(messages.rejectedAfterMultiLine)
				break
			default:
				throw configurationError(`Unknown expectation "${expectation}"`)
		}
	}

	/**
	 * @type {WhitespaceChecker}
	 */
	function beforeAllowingIndentation (obj) {
		before({ ...obj, allowIndentation: true })
	}

	function expectBefore (messageFunc = messages.expectedBefore) {
		if (activeArgs.allowIndentation) {
			expectBeforeAllowingIndentation(messageFunc)

			return
		}

		let _activeArgs = activeArgs
		let source = _activeArgs.source
		let index = _activeArgs.index

		let oneCharBefore = source[index - 1]
		let twoCharsBefore = source[index - 2]

		if (isNullish(oneCharBefore)) {
			return
		}

		if (targetWhitespace === `space` && oneCharBefore === ` ` && (activeArgs.onlyOneChar || isNullish(twoCharsBefore) || !isWhitespace(twoCharsBefore))) {
			return
		}

		assertFunction(messageFunc)
		activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
	}

	function expectBeforeAllowingIndentation (messageFunc = messages.expectedBefore) {
		let _activeArgs2 = activeArgs
		let source = _activeArgs2.source
		let index = _activeArgs2.index
		let err = _activeArgs2.err

		let expectedChar = targetWhitespace === `newline` ? `\n` : undefined
		let i = index - 1

		while (source[i] !== expectedChar) {
			if (source[i] === `\t` || source[i] === ` `) {
				i--
				continue
			}

			assertFunction(messageFunc)
			err(messageFunc(activeArgs.errTarget || source.charAt(index)))

			return
		}
	}

	function rejectBefore (messageFunc = messages.rejectedBefore) {
		let _activeArgs3 = activeArgs
		let source = _activeArgs3.source
		let index = _activeArgs3.index

		let oneCharBefore = source[index - 1]

		if (!isNullish(oneCharBefore) && isWhitespace(oneCharBefore)) {
			assertFunction(messageFunc)
			activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
		}
	}

	/**
	 * @type {WhitespaceChecker}
	 */
	function afterOneOnly (obj) {
		after({ ...obj, onlyOneChar: true })
	}

	function expectAfter (messageFunc = messages.expectedAfter) {
		let _activeArgs4 = activeArgs
		let source = _activeArgs4.source
		let index = _activeArgs4.index

		let oneCharAfter = source[index + 1]
		let twoCharsAfter = source[index + 2]
		let threeCharsAfter = source[index + 3]

		if (isNullish(oneCharAfter)) {
			return
		}

		if (targetWhitespace === `newline`) {
			// If index is followed by a Windows CR-LF ...
			if (oneCharAfter === `\r` && twoCharsAfter === `\n` && (activeArgs.onlyOneChar || isNullish(threeCharsAfter) || !isWhitespace(threeCharsAfter))) {
				return
			}

			// If index is followed by a Unix LF ...
			if (oneCharAfter === `\n` && (activeArgs.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))) {
				return
			}
		}

		if (
			targetWhitespace === `space` && oneCharAfter === ` ` && (activeArgs.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))
		) {
			return
		}

		assertFunction(messageFunc)
		activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
	}

	function rejectAfter (messageFunc = messages.rejectedAfter) {
		let _activeArgs5 = activeArgs
		let source = _activeArgs5.source
		let index = _activeArgs5.index

		let oneCharAfter = source[index + 1]

		if (!isNullish(oneCharAfter) && isWhitespace(oneCharAfter)) {
			assertFunction(messageFunc)
			activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
		}
	}

	return {
		before,
		beforeAllowingIndentation,
		after,
		afterOneOnly,
	}
}
