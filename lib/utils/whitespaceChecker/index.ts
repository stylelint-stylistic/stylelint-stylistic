import { configurationError } from "../configurationError/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import { assertFunction, isNullish } from "../validateTypes/index.ts"

/**
 * Tells whether a character ends a line, the way PostCSS reads one: a line feed does, and the carriage return of a Windows pair belongs to the break the line feed behind it ends. A bare carriage return and a form feed are whitespace to PostCSS's line counter and to every rule, so a checker asking for a newline takes neither.
 * @param char - The character to look at.
 * @returns True if the character ends a line.
 */
function isLineBreak (char: string | undefined): boolean {
	return char === `\n`
}

/** A function that returns a message string. */
export type MessageFunction = (message: string) => string

/** The messages a checker reports with. Each expectation reaches for the one named after it, so a rule has to carry the messages of the expectations it accepts and no others. */
export interface Messages {

	/** Reported by `always` where the whitespace in front of the index is missing. */
	expectedBefore?: MessageFunction,

	/** Reported by `never` where whitespace stands in front of the index. */
	rejectedBefore?: MessageFunction,

	/** Reported by `always` where the whitespace behind the index is missing. */
	expectedAfter?: MessageFunction,

	/** Reported by `never` where whitespace stands behind the index. */
	rejectedAfter?: MessageFunction,

	/** What `always-single-line` reports in place of `expectedBefore`. */
	expectedBeforeSingleLine?: MessageFunction,

	/** What `never-single-line` reports in place of `rejectedBefore`. */
	rejectedBeforeSingleLine?: MessageFunction,

	/** What `always-multi-line` reports in place of `expectedBefore`. */
	expectedBeforeMultiLine?: MessageFunction,

	/** What `never-multi-line` reports in place of `rejectedBefore`. */
	rejectedBeforeMultiLine?: MessageFunction,

	/** What `always-single-line` reports in place of `expectedAfter`. */
	expectedAfterSingleLine?: MessageFunction,

	/** What `never-single-line` reports in place of `rejectedAfter`. */
	rejectedAfterSingleLine?: MessageFunction,

	/** What `always-multi-line` reports in place of `expectedAfter`. */
	expectedAfterMultiLine?: MessageFunction,

	/** What `never-multi-line` reports in place of `rejectedAfter`. */
	rejectedAfterMultiLine?: MessageFunction,
}
export interface WhitespaceCheckerArgs {

	/** The source string. */
	source: string,

	/** The index of the character to check before. */
	index: number,

	/** If a problem is found, this callback will be invoked with the relevant warning message. Typically this callback will report() the problem. */
	err: (message: string) => void,

	/** If a problem is found, this string will be sent to the relevant warning message. */
	errTarget?: string,

	/** Single- and multi-line checkers will use this string to determine whether they should proceed, i.e. if this string is one line only, single-line checkers will check, multi-line checkers will ignore. Only where none is passed at all do they use `source` in its place: an empty text is a text, and it stands on one line, while `source` may be the whole of a construct broken across several. */
	lineCheckStr?: string,

	/** Only check *one* character before. By default, "always-*" checks will look for the `targetWhitespace` one before and then ensure there is no whitespace two before. This option bypasses that second check. */
	onlyOneChar?: boolean,

	/** Allow arbitrary indentation between the `targetWhitespace` (almost definitely a newline) and the `index`. With this option, the checker will see if a newline *begins* the whitespace before the `index`. */
	allowIndentation?: boolean,
}

/** A function that checks whitespace at a specific location. */
export type WhitespaceChecker = (args: WhitespaceCheckerArgs) => void

/** An object containing whitespace checking functions. */
export type WhitespaceCheckers = {
	before: WhitespaceChecker,
	beforeAllowingIndentation: WhitespaceChecker,
	after: WhitespaceChecker,
	afterOneOnly: WhitespaceChecker,
}

/**
 * Creates a whitespaceChecker, which exposes the following functions:
 * - `before()`
 * - `beforeAllowingIndentation()`
 * - `after()`
 * - `afterOneOnly()`
 * @param targetWhitespace - The target whitespace type to check for.
 * @param expectation - The expectation for whitespace.
 * @param messages - An object of message functions; calling `before*()` or `after*()` and the `expectation` that is passed determines which message functions are required.
 * @returns The checker, with its exposed checking functions.
 */
export function whitespaceChecker (targetWhitespace: `space` | `newline`, expectation: `always` | `never` | `always-single-line` | `always-multi-line` | `never-single-line` | `never-multi-line`, messages: Messages): WhitespaceCheckers {
	// Keep track of active arguments in order to avoid passing too much stuff around, making signatures long and confusing. This variable gets reset anytime a checking function is called.
	let activeArgs: WhitespaceCheckerArgs

	/**
	 * Checks for whitespace _before_ a character.
	 * @param args - Where to look, and what to do about what is found.
	 */
	function before (args: WhitespaceCheckerArgs): void {
		let { source, lineCheckStr, onlyOneChar = false, allowIndentation = false } = args

		activeArgs = { ...args, onlyOneChar, allowIndentation }

		switch (expectation) {
			case `always`:
				expectBefore()
				break
			case `never`:
				rejectBefore()
				break
			case `always-single-line`:
				if (isSingleLineString(lineCheckStr ?? source)) expectBefore(messages.expectedBeforeSingleLine)
				break
			case `never-single-line`:
				if (isSingleLineString(lineCheckStr ?? source)) rejectBefore(messages.rejectedBeforeSingleLine)
				break
			case `always-multi-line`:
				if (!isSingleLineString(lineCheckStr ?? source)) expectBefore(messages.expectedBeforeMultiLine)
				break
			case `never-multi-line`:
				if (!isSingleLineString(lineCheckStr ?? source)) rejectBefore(messages.rejectedBeforeMultiLine)
				break
			default:
				throw configurationError(`Unknown expectation "${expectation}"`)
		}
	}

	/**
	 * Checks for whitespace _after_ a character.
	 * @param args - Where to look, and what to do about what is found.
	 */
	function after (args: WhitespaceCheckerArgs): void {
		let { source, lineCheckStr, onlyOneChar = false } = args

		activeArgs = { ...args, onlyOneChar, allowIndentation: false }

		switch (expectation) {
			case `always`:
				expectAfter()
				break
			case `never`:
				rejectAfter()
				break
			case `always-single-line`:
				if (isSingleLineString(lineCheckStr ?? source)) expectAfter(messages.expectedAfterSingleLine)
				break
			case `never-single-line`:
				if (isSingleLineString(lineCheckStr ?? source)) rejectAfter(messages.rejectedAfterSingleLine)
				break
			case `always-multi-line`:
				if (!isSingleLineString(lineCheckStr ?? source)) expectAfter(messages.expectedAfterMultiLine)
				break
			case `never-multi-line`:
				if (!isSingleLineString(lineCheckStr ?? source)) rejectAfter(messages.rejectedAfterMultiLine)
				break
			default:
				throw configurationError(`Unknown expectation "${expectation}"`)
		}
	}

	/**
	 * Checks for whitespace before a character, allowing indentation.
	 * @param args - Where to look, and what to do about what is found.
	 */
	function beforeAllowingIndentation (args: WhitespaceCheckerArgs): void {
		before({ ...args, allowIndentation: true })
	}

	/**
	 * Expects whitespace before a character.
	 * @param messageFunc - The message function to use.
	 */
	function expectBefore (messageFunc: MessageFunction | undefined = messages.expectedBefore): void {
		if (activeArgs.allowIndentation) {
			expectBeforeAllowingIndentation(messageFunc)

			return
		}

		let localActiveArgs = activeArgs
		let source = localActiveArgs.source
		let index = localActiveArgs.index

		let oneCharBefore = source[index - 1]
		let twoCharsBefore = source[index - 2]

		if (isNullish(oneCharBefore)) return

		if (targetWhitespace === `space` && oneCharBefore === ` ` && (activeArgs.onlyOneChar || isNullish(twoCharsBefore) || !isWhitespace(twoCharsBefore))) return

		assertFunction(messageFunc)
		activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
	}

	/**
	 * Expects whitespace before a character, allowing indentation.
	 * @param messageFunc - The message function to use.
	 */
	function expectBeforeAllowingIndentation (messageFunc: MessageFunction | undefined = messages.expectedBefore): void {
		let localActiveArgs2 = activeArgs
		let source = localActiveArgs2.source
		let index = localActiveArgs2.index
		let err = localActiveArgs2.err

		let isExpectedChar = targetWhitespace === `newline` ? isLineBreak : (): boolean => false
		let i = index - 1

		// The run of indentation is closed by the line feed of the break in front of it, which is the character a Windows pair ends in as well.
		while (!isExpectedChar(source[i])) {
			if (source[i] === `\t` || source[i] === ` `) {
				i -= 1
				continue
			}

			assertFunction(messageFunc)
			err(messageFunc(activeArgs.errTarget || source.charAt(index)))

			return
		}
	}

	/**
	 * Rejects whitespace before a character.
	 * @param messageFunc - The message function to use.
	 */
	function rejectBefore (messageFunc: MessageFunction | undefined = messages.rejectedBefore): void {
		let localActiveArgs3 = activeArgs
		let source = localActiveArgs3.source
		let index = localActiveArgs3.index

		let oneCharBefore = source[index - 1]

		if (!isNullish(oneCharBefore) && isWhitespace(oneCharBefore)) {
			assertFunction(messageFunc)
			activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
		}
	}

	/**
	 * Checks for whitespace after a character, only checking one character.
	 * @param args - Where to look, and what to do about what is found.
	 */
	function afterOneOnly (args: WhitespaceCheckerArgs): void {
		after({ ...args, onlyOneChar: true })
	}

	/**
	 * Expects whitespace after a character.
	 * @param messageFunc - The message function to use.
	 */
	function expectAfter (messageFunc: MessageFunction | undefined = messages.expectedAfter): void {
		let localActiveArgs4 = activeArgs
		let source = localActiveArgs4.source
		let index = localActiveArgs4.index

		let oneCharAfter = source[index + 1]
		let twoCharsAfter = source[index + 2]
		let threeCharsAfter = source[index + 3]

		if (isNullish(oneCharAfter)) return

		if (targetWhitespace === `newline`) {
			// If index is followed by a Windows CR-LF ...
			if (oneCharAfter === `\r` && twoCharsAfter === `\n` && (activeArgs.onlyOneChar || isNullish(threeCharsAfter) || !isWhitespace(threeCharsAfter))) return

			// If index is followed by a line feed on its own ...
			if (isLineBreak(oneCharAfter) && (activeArgs.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))) return
		}

		if (
			targetWhitespace === `space` && oneCharAfter === ` ` && (activeArgs.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))
		) return

		assertFunction(messageFunc)
		activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
	}

	/**
	 * Rejects whitespace after a character.
	 * @param messageFunc - The message function to use.
	 */
	function rejectAfter (messageFunc: MessageFunction | undefined = messages.rejectedAfter): void {
		let localActiveArgs5 = activeArgs
		let source = localActiveArgs5.source
		let index = localActiveArgs5.index

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
