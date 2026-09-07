import { configurationError } from "../configurationError/index.ts"
import { isSingleLineString } from "../isSingleLineString/index.ts"
import { isWhitespace } from "../isWhitespace/index.ts"
import { assertFunction, isNullish } from "../validateTypes/index.ts"

/**
 * Whether a character is a line feed, the only break PostCSS counts; a bare `\r` or `\f` is whitespace.
 * @param char - The character.
 * @returns True for a line feed.
 */
function isLineBreak (char: string | undefined): boolean {
	return char === `\n`
}

/** Builds a message. */
export type MessageFunction = (message: string) => string

/** The messages a checker reports with; a rule carries only those of the expectations it accepts. */
export interface Messages {

	/** `always`, whitespace missing in front. */
	expectedBefore?: MessageFunction,

	/** `never`, whitespace in front. */
	rejectedBefore?: MessageFunction,

	/** `always`, whitespace missing behind. */
	expectedAfter?: MessageFunction,

	/** `never`, whitespace behind. */
	rejectedAfter?: MessageFunction,

	/** `always-single-line`. */
	expectedBeforeSingleLine?: MessageFunction,

	/** `never-single-line`. */
	rejectedBeforeSingleLine?: MessageFunction,

	/** `always-multi-line`. */
	expectedBeforeMultiLine?: MessageFunction,

	/** `never-multi-line`. */
	rejectedBeforeMultiLine?: MessageFunction,

	/** `always-single-line`. */
	expectedAfterSingleLine?: MessageFunction,

	/** `never-single-line`. */
	rejectedAfterSingleLine?: MessageFunction,

	/** `always-multi-line`. */
	expectedAfterMultiLine?: MessageFunction,

	/** `never-multi-line`. */
	rejectedAfterMultiLine?: MessageFunction,
}
export interface WhitespaceCheckerArgs {

	/** The source. */
	source: string,

	/** The index checked around. */
	index: number,

	/** Called with a problem's message. */
	err: (message: string) => void,

	/** Named in the message instead of the character at `index`. */
	errTarget?: string,

	/** What the `-single-line` and `-multi-line` options ask lineness of; `source` by default. */
	lineCheckStr?: string,

	/** Checks one character only; otherwise `always-*` refuses whitespace beyond it too. */
	onlyOneChar?: boolean,

	/** Allows indentation between the newline and `index`. */
	allowIndentation?: boolean,
}

/** Checks the whitespace at one index. */
export type WhitespaceChecker = (args: WhitespaceCheckerArgs) => void

/** The checking functions. */
export type WhitespaceCheckers = {
	before: WhitespaceChecker,
	beforeAllowingIndentation: WhitespaceChecker,
	after: WhitespaceChecker,
	afterOneOnly: WhitespaceChecker,
}

/**
 * Creates a whitespace checker.
 * @param targetWhitespace - The whitespace asked for.
 * @param expectation - The primary option.
 * @param messages - The messages the expectation and the side checked need.
 * @returns The checking functions.
 */
export function whitespaceChecker (targetWhitespace: `space` | `newline`, expectation: `always` | `never` | `always-single-line` | `always-multi-line` | `never-single-line` | `never-multi-line`, messages: Messages): WhitespaceCheckers {
	// Set by every checking function
	let activeArgs: WhitespaceCheckerArgs

	/**
	 * Checks the whitespace before a character.
	 * @param args - Where to look.
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
	 * Checks the whitespace after a character.
	 * @param args - Where to look.
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
	 * `before` allowing indentation.
	 * @param args - Where to look.
	 */
	function beforeAllowingIndentation (args: WhitespaceCheckerArgs): void {
		before({ ...args, allowIndentation: true })
	}

	/**
	 * Expects whitespace before the character.
	 * @param messageFunc - Builds the warning text from the character checked.
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
	 * Expects a newline before the character, indentation allowed.
	 * @param messageFunc - Builds the warning text from the character checked.
	 */
	function expectBeforeAllowingIndentation (messageFunc: MessageFunction | undefined = messages.expectedBefore): void {
		let localActiveArgs2 = activeArgs
		let source = localActiveArgs2.source
		let index = localActiveArgs2.index
		let err = localActiveArgs2.err

		let isExpectedChar = targetWhitespace === `newline` ? isLineBreak : (): boolean => false
		let i = index - 1

		// The indentation is closed by a line feed, a Windows pair's too
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
	 * Rejects whitespace before the character.
	 * @param messageFunc - Builds the warning text from the character checked.
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
	 * `after` asking for one character only.
	 * @param args - Where to look.
	 */
	function afterOneOnly (args: WhitespaceCheckerArgs): void {
		after({ ...args, onlyOneChar: true })
	}

	/**
	 * Expects whitespace after the character.
	 * @param messageFunc - Builds the warning text from the character checked.
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
			// A Windows pair
			if (oneCharAfter === `\r` && twoCharsAfter === `\n` && (activeArgs.onlyOneChar || isNullish(threeCharsAfter) || !isWhitespace(threeCharsAfter))) return

			// A line feed alone
			if (isLineBreak(oneCharAfter) && (activeArgs.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))) return
		}

		if (
			targetWhitespace === `space` && oneCharAfter === ` ` && (activeArgs.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))
		) return

		assertFunction(messageFunc)
		activeArgs.err(messageFunc(activeArgs.errTarget || source.charAt(index)))
	}

	/**
	 * Rejects whitespace after the character.
	 * @param messageFunc - Builds the warning text from the character checked.
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
