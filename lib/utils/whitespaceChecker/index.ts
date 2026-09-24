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

	/** What the file holds in front of `source`, which the parser filed away from it — `rawInFrontOfText` answers for a node. Only `beforeAllowingIndentation` reads it; `before` and `after` ignore it, and the delimiter opening a text is invisible to them either way. */
	textBefore?: string,
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

/** What the whitespace looked for is: a space or a line break. */
type TargetWhitespace = `space` | `newline`

/**
 * Reports a problem at the character checked.
 * @param args - Where the check looked.
 * @param messageFunc - Builds the warning text from the character checked.
 */
function complain (args: WhitespaceCheckerArgs, messageFunc: MessageFunction | undefined): void {
	assertFunction(messageFunc)
	args.err(messageFunc(args.errTarget || args.source.charAt(args.index)))
}

/**
 * Expects a newline before the character, indentation allowed.
 * @param args - Where to look.
 * @param targetWhitespace - The whitespace asked for.
 * @param messageFunc - Builds the warning text from the character checked.
 */
function expectBeforeAllowingIndentation (args: WhitespaceCheckerArgs, targetWhitespace: TargetWhitespace, messageFunc: MessageFunction | undefined): void {
	let textBefore = args.textBefore ?? ``
	// The run in front of a delimiter opening the text lies in the raw the parser filed it in, so the walk goes on into it rather than stopping at the head of the text
	let source = textBefore + args.source
	let index = args.index + textBefore.length

	let isExpectedChar = targetWhitespace === `newline` ? isLineBreak : (): boolean => false
	let i = index - 1

	// The indentation is closed by a line feed, a Windows pair's too
	while (!isExpectedChar(source[i])) {
		if (source[i] === `\t` || source[i] === ` `) {
			i -= 1
			continue
		}

		assertFunction(messageFunc)
		args.err(messageFunc(args.errTarget || source.charAt(index)))

		return
	}
}

/**
 * Expects whitespace before the character.
 * @param args - Where to look.
 * @param targetWhitespace - The whitespace asked for.
 * @param messageFunc - Builds the warning text from the character checked.
 */
function expectBefore (args: WhitespaceCheckerArgs, targetWhitespace: TargetWhitespace, messageFunc: MessageFunction | undefined): void {
	if (args.allowIndentation) {
		expectBeforeAllowingIndentation(args, targetWhitespace, messageFunc)

		return
	}

	let { source, index } = args

	let oneCharBefore = source[index - 1]
	let twoCharsBefore = source[index - 2]

	if (isNullish(oneCharBefore)) return

	if (targetWhitespace === `space` && oneCharBefore === ` ` && (args.onlyOneChar || isNullish(twoCharsBefore) || !isWhitespace(twoCharsBefore))) return

	complain(args, messageFunc)
}

/**
 * Rejects whitespace before the character.
 * @param args - Where to look.
 * @param messageFunc - Builds the warning text from the character checked.
 */
function rejectBefore (args: WhitespaceCheckerArgs, messageFunc: MessageFunction | undefined): void {
	let oneCharBefore = args.source[args.index - 1]

	if (!isNullish(oneCharBefore) && isWhitespace(oneCharBefore)) complain(args, messageFunc)
}

/**
 * Expects whitespace after the character.
 * @param args - Where to look.
 * @param targetWhitespace - The whitespace asked for.
 * @param messageFunc - Builds the warning text from the character checked.
 */
function expectAfter (args: WhitespaceCheckerArgs, targetWhitespace: TargetWhitespace, messageFunc: MessageFunction | undefined): void {
	let { source, index } = args

	let oneCharAfter = source[index + 1]
	let twoCharsAfter = source[index + 2]
	let threeCharsAfter = source[index + 3]

	if (isNullish(oneCharAfter)) return

	if (targetWhitespace === `newline`) {
		// A Windows pair
		if (oneCharAfter === `\r` && twoCharsAfter === `\n` && (args.onlyOneChar || isNullish(threeCharsAfter) || !isWhitespace(threeCharsAfter))) return

		// A line feed alone
		if (isLineBreak(oneCharAfter) && (args.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))) return
	}

	if (
		targetWhitespace === `space` && oneCharAfter === ` ` && (args.onlyOneChar || isNullish(twoCharsAfter) || !isWhitespace(twoCharsAfter))
	) return

	complain(args, messageFunc)
}

/**
 * Rejects whitespace after the character.
 * @param args - Where to look.
 * @param messageFunc - Builds the warning text from the character checked.
 */
function rejectAfter (args: WhitespaceCheckerArgs, messageFunc: MessageFunction | undefined): void {
	let oneCharAfter = args.source[args.index + 1]

	if (!isNullish(oneCharAfter) && isWhitespace(oneCharAfter)) complain(args, messageFunc)
}

/** The primary options a checker takes. */
type Expectation = `always` | `never` | `always-single-line` | `always-multi-line` | `never-single-line` | `never-multi-line`

/** Every primary option a checker takes, which a configuration may spell otherwise. */
const EXPECTATIONS: Set<string> = new Set([`always`, `never`, `always-single-line`, `always-multi-line`, `never-single-line`, `never-multi-line`])

/**
 * Asks whether an option asks anything of a text: the `-single-line` forms of a single-line one alone, the `-multi-line` forms of a multi-line one.
 * @param expectation - The primary option.
 * @param lineCheckStr - The text whose lineness is asked.
 * @returns True where it does.
 */
function asksOf (expectation: Expectation, lineCheckStr: string): boolean {
	if (expectation.endsWith(`-single-line`)) return isSingleLineString(lineCheckStr)

	if (expectation.endsWith(`-multi-line`)) return !isSingleLineString(lineCheckStr)

	return true
}

/**
 * The message an option reports a side with: the lineness's own where the rule carries one, and the plain one otherwise.
 * @param messages - The rule's messages.
 * @param expectation - The primary option.
 * @param side - The side checked.
 * @returns The message.
 */
function messageOf (messages: Messages, expectation: Expectation, side: `Before` | `After`): MessageFunction | undefined {
	let verb = expectation.startsWith(`always`) ? `expected` : `rejected`
	let lineness = expectation.endsWith(`-single-line`) ? `SingleLine` : (expectation.endsWith(`-multi-line`) ? `MultiLine` : ``)

	return messages[`${verb}${side}${lineness}` as keyof Messages] ?? messages[`${verb}${side}` as keyof Messages]
}

/**
 * Creates a whitespace checker.
 * @param targetWhitespace - The whitespace asked for.
 * @param expectation - The primary option.
 * @param messages - The messages the expectation and the side checked need.
 * @returns The checking functions.
 */
export function whitespaceChecker (targetWhitespace: TargetWhitespace, expectation: Expectation, messages: Messages): WhitespaceCheckers {
	/**
	 * Checks the whitespace before a character.
	 * @param args - Where to look.
	 */
	function before (args: WhitespaceCheckerArgs): void {
		let { source, lineCheckStr, onlyOneChar = false, allowIndentation = false } = args

		if (!EXPECTATIONS.has(expectation)) throw configurationError(`Unknown expectation "${expectation}"`)

		if (!asksOf(expectation, lineCheckStr ?? source)) return

		let checked = { ...args, onlyOneChar, allowIndentation }
		let message = messageOf(messages, expectation, `Before`)

		if (expectation.startsWith(`always`)) expectBefore(checked, targetWhitespace, message)
		else rejectBefore(checked, message)
	}

	/**
	 * Checks the whitespace after a character.
	 * @param args - Where to look.
	 */
	function after (args: WhitespaceCheckerArgs): void {
		let { source, lineCheckStr, onlyOneChar = false } = args

		if (!EXPECTATIONS.has(expectation)) throw configurationError(`Unknown expectation "${expectation}"`)

		if (!asksOf(expectation, lineCheckStr ?? source)) return

		let checked = { ...args, onlyOneChar, allowIndentation: false }
		let message = messageOf(messages, expectation, `After`)

		if (expectation.startsWith(`always`)) expectAfter(checked, targetWhitespace, message)
		else rejectAfter(checked, message)
	}

	/**
	 * `before` allowing indentation.
	 * @param args - Where to look.
	 */
	function beforeAllowingIndentation (args: WhitespaceCheckerArgs): void {
		before({ ...args, allowIndentation: true })
	}

	/**
	 * `after` asking for one character only.
	 * @param args - Where to look.
	 */
	function afterOneOnly (args: WhitespaceCheckerArgs): void {
		after({ ...args, onlyOneChar: true })
	}

	return {
		before,
		beforeAllowingIndentation,
		after,
		afterOneOnly,
	}
}
