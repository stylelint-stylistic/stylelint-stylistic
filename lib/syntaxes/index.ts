import type { AtRule, Comment, Declaration, Node, Root, Rule as PostcssRule } from "postcss"
import type { Node as SelectorNode } from "postcss-selector-parser"
import type { FunctionNode, Node as ValueParserNode } from "postcss-value-parser"
import type { PostcssResult } from "stylelint"

import type { InlineComment } from "../preprocessor/findSelectorInlineComments/index.ts"
import type { InlineCommentReading } from "../preprocessor/readsInlineComments/index.ts"
import type { Edit } from "../utils/applyEditsFromEnd/index.ts"
import type { CommentSpan } from "../utils/findCommentSpans/index.ts"
import type { InterpolationSpan } from "../utils/findInterpolationSpans/index.ts"

import { less } from "./less/index.ts"
import { scss } from "./scss/index.ts"
import { styled } from "./styled/index.ts"

/** How a family of rules reads a stylesheet. `lib/index.ts` registers every rule once per syntax, as `@stylistic/<namespace>/<rule>`; plain CSS is the core's. No member derives from another. */
export type Syntax = {

	/** The segment between `@stylistic/` and the rule's name; none for the core. */
	namespace?: string,

	/**
	 * Asks whether the rules read the root; a refused root gets one warning and no check.
	 * @param root - The stylesheet the rules are asked to read.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns True where they do.
	 */
	accepts (root: Root, result: PostcssResult): boolean,

	/**
	 * Reads the host code around an embedded stylesheet: the indent of the line the embedding opens on, and whether it is broken over lines, which puts its content a level deeper.
	 * @param node - A node inside the embedded stylesheet.
	 * @returns Empty and unbroken for a stylesheet on its own.
	 */
	embedding (node: Node): { indent: string, multiline: boolean },

	/**
	 * Asks whether a declaration's value embeds host code.
	 * @param decl - The declaration.
	 * @returns True where it does.
	 */
	valueEmbedsHostCode (decl: Declaration): boolean,

	/**
	 * Asks whether an at-rule is standard CSS, not a preprocessor construct.
	 * @param atRule - The at-rule.
	 * @returns True where it is.
	 */
	isStandardAtRule (atRule: AtRule): boolean,

	/**
	 * Asks whether a rule is standard CSS, not a preprocessor construct.
	 * @param rule - The rule node asked about.
	 * @returns True where it is.
	 */
	isStandardRule (rule: PostcssRule): boolean,

	/**
	 * Asks whether a declaration is standard CSS, not a preprocessor construct.
	 * @param decl - The declaration.
	 * @returns True where it is.
	 */
	isStandardDeclaration (decl: Declaration): boolean,

	/**
	 * Asks whether a property is standard CSS, not a variable or an interpolation.
	 * @param property - The property's text.
	 * @returns True where it is.
	 */
	isStandardProperty (property: string): boolean,

	/**
	 * Asks whether a value is standard CSS, not a variable, an interpolation or an operation.
	 * @param value - The value's text.
	 * @returns True where it is.
	 */
	isStandardValue (value: string): boolean,

	/**
	 * Asks whether a selector is standard CSS, not a preprocessor construct.
	 * @param selector - The selector's text.
	 * @returns True where it is.
	 */
	isStandardSelector (selector: string): boolean,

	/**
	 * Asks whether a value function is standard CSS, not a Sass list or an interpolation.
	 * @param fn - The function node.
	 * @returns True where it is.
	 */
	isStandardFunction (fn: FunctionNode): boolean,

	/**
	 * Asks whether a comment is a CSS one, not a preprocessor's inline comment.
	 * @param comment - The comment node asked about.
	 * @returns True where it is.
	 */
	isStandardComment (comment: Comment): boolean,

	/**
	 * Asks whether a combinator of a parsed selector is standard CSS.
	 * @param combinator - The combinator node.
	 * @returns True where it is.
	 */
	isStandardCombinator (combinator: SelectorNode): boolean,

	/**
	 * Reads a node's value, selector or params as the file writes it.
	 * @param node - The declaration, rule or at-rule.
	 * @returns The text.
	 */
	read (node: AtRule | Declaration | PostcssRule): string,

	/**
	 * Writes a node's text into the copy the syntax prints and keeps its other copies in step.
	 * @param node - The declaration, rule or at-rule.
	 * @param text - The value, selector or params written over the node's own.
	 */
	write (node: AtRule | Declaration | PostcssRule, text: string): void,

	/**
	 * Reads what the node's syntax makes of `//`: whether it opens a comment, and whether one survives in the text a rule reads.
	 * @param node - The node whose syntax says what a double slash opens.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns The reading.
	 */
	inlineComments (node: Node, result: PostcssResult): InlineCommentReading,

	/**
	 * Finds the first colon token of a text; one inside a comment, a string, a parenthesised group, an at-word or an escape is none. The text in front is tokenized too, since a tokenizer carries state.
	 * @param before - The text in front, tokenized but not answered for: the property.
	 * @param text - The text searched for the colon, tokenized behind the text in front.
	 * @param node - The node the text is from, whose syntax tokenizes it.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns The index of the colon, or `-1`.
	 */
	colonTokenIndex (before: string, text: string, node: Node, result: PostcssResult): number,

	/**
	 * Finds the spans of every comment in a text: block ones, and inline ones where the syntax reads them.
	 * @param text - The text scanned for comments.
	 * @param node - The node the text is from, whose syntax says whether inline comments open.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns The spans, in the text's coordinates.
	 */
	commentSpans (text: string, node: Node, result: PostcssResult): CommentSpan[],

	/**
	 * Asks whether a text ends inside an inline comment under the reading.
	 * @param text - The text whose tail is asked about.
	 * @param reading - What the syntax makes of `//`.
	 * @returns True where it does.
	 */
	endsWithInlineComment (text: string, reading: InlineCommentReading): boolean,

	/**
	 * Asks whether a fix moves the end of a text into an inline comment.
	 * @param standingText - The text through the character the fix moves.
	 * @param fixedText - The same text after the fix.
	 * @param reading - What the syntax makes of `//`.
	 * @returns True where it does.
	 */
	movesEndIntoInlineComment (standingText: string, fixedText: string, reading: InlineCommentReading): boolean,

	/**
	 * Asks whether a write onto the node's trailing whitespace lands inside an inline comment.
	 * @param node - The node whose trailing whitespace the write lands on.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @param [spelledBetween] - The run between the node and a write off its own trailing whitespace.
	 * @returns True where it does.
	 */
	writesIntoInlineComment (node: Node, result: PostcssResult, spelledBetween?: string): boolean,

	/**
	 * Builds the copy of a text a search runs over, every `//` the syntax reads as code hidden.
	 * @param text - The text the search runs over.
	 * @param node - The node the text is from, whose syntax says which double slashes are code.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns The copy and the comment spans.
	 */
	searchCopy (text: string, node: Node, result: PostcssResult): { searchString: string, commentSpans: CommentSpan[] },

	/**
	 * Finds the spans of every comment in the text `read` returns: inline ones off the syntax's pair of copies while in step and from a scan once drifted, block ones from the scan always.
	 * @param node - The declaration or at-rule.
	 * @param text - The text `read` returns.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns The spans, in the text's coordinates.
	 */
	printedComments (node: AtRule | Declaration, text: string, result: PostcssResult): CommentSpan[],

	/**
	 * Opens a rule's selector for parsing. `postcss-scss` rewrites each inline comment into a block one in the raw, so the copies drift two characters per comment; the result maps between them and writes both.
	 * @param rule - The rule whose selector is opened.
	 * @returns The copies.
	 */
	selectorCopies (rule: PostcssRule): SelectorCopies,

	/**
	 * Asks whether the language requires the node's trailing semicolon, whatever an option says.
	 * @param node - The node whose trailing semicolon is asked about.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns True where it stays.
	 */
	requiresTrailingSemicolon (node: Node, result: PostcssResult): boolean,

	/**
	 * Asks whether the semicolon the node's block is flagged as closing on is the text of a `//` comment behind the node, which the parser read as code.
	 * @param node - The node closing the block.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns True where it is.
	 */
	semicolonFlagIsCommentText (node: Node, result: PostcssResult): boolean,

	/**
	 * Asks whether the node's syntax has arithmetic of its own, where whitespace in front of a sign makes it an operator.
	 *
	 * The tree cannot tell `foo($a) -2px`, a Sass list, from `foo($a)-2px`, a subtraction, so whether `//` opens a comment is asked instead: Sass and Less have both, plain CSS neither, an unknown syntax is answered yes. Sass reads a plus as an operator whatever stands beside it, so a plus behind a call is left alone under both. The node is asked, not the file: a page may hold a plain `<style>` beside a `<style lang="scss">`.
	 * @param node - The node whose own syntax is asked, not the file's.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns True where it has.
	 */
	spellsOwnArithmetic (node: Node, result: PostcssResult): boolean,

	/**
	 * Asks whether the syntax reads a solidus between two value nodes as division rather than the CSS separator.
	 *
	 * Plain CSS divides only inside a math function, which the separator rules skip. Sass divides where either operand is a variable or a call it evaluates, and keeps the solidus of plain values, `var()` and `env()`. Less divides only inside parentheses under its default `math`, a nameless call the rules skip. Whitespace beside the solidus changes nothing.
	 * @param left - The node in front, none where the solidus opens the text.
	 * @param right - The node behind, none where it closes the text.
	 * @returns True where the syntax divides.
	 */
	readsSlashAsOperator (left: ValueParserNode | undefined, right: ValueParserNode | undefined): boolean,

	/**
	 * Asks whether the syntax reads an exponent as part of a number.
	 *
	 * To CSS `1E5PX` is one dimension whose number is `1E5`; Less reads a number as digits and at most one period, so the same word is the dimension `1E` beside the dimension `5PX` ([#646](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/646)). Where the answer is no, a number and a percentage hold a unit as well: `1E5` is `1E` and `5`.
	 * @returns True where an exponent belongs to the number, false where the number is a sign, digits and at most one period.
	 */
	readsNumberWithExponent (): boolean,

	/**
	 * Asks whether the syntax reads a dimension's unit as the whole identifier behind the number.
	 *
	 * To CSS an escape and a hyphen are both code points of an identifier, so `10px\#fff` is one dimension with the unit `px#fff` and `10PX-2REM` one with the unit `PX-2REM`. Less takes a run of ASCII letters and underscores as the unit and opens an entity of its own behind it — a keyword at a backslash ([#527](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/527)), the signed operand of a subtraction at a hyphen ([#633](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/633)), a dimension at a digit ([#646](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/646)) — so recasing the whole identifier under Less would recase a value. A character it can open no entity with ends nothing: it compiles `10PXÄ` back unparted.
	 * @returns True where the unit runs to the end of the identifier, false where it ends in front of the first escape, hyphen or digit.
	 */
	readsUnitAsIdentifier (): boolean,

	/**
	 * Finds the spans of a preprocessor's interpolations in a text; no rule reads code beside one.
	 * @param text - The text, its comments blanked so a brace inside one cannot close an interpolation.
	 * @param node - The node, whose syntax says which spellings interpolate.
	 * @param result - The lint result naming the syntax the file was parsed with.
	 * @returns The spans, in the text's coordinates.
	 */
	interpolationSpans (text: string, node: Node, result: PostcssResult): InterpolationSpan[],

	/**
	 * Asks whether the rule carries a parameter list, a Less mixin definition, which `indentation` holds a level deeper than the selector.
	 * @param rule - The rule whose selector may carry a parameter list.
	 * @returns True where it does.
	 */
	readsRuleParams (rule: PostcssRule): boolean,

	/**
	 * Finds the value of an at-rule the syntax declares a variable with, `@foo: bar;` under Less, to be walked as a declaration's.
	 *
	 * Where the name ended in front of the colon the parser keeps the whole value in the params, opening them on that colon, which the value parser reads as a divider no rule of a value names ([#577](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/577)). Where the at-word ran on past it, the word behind the colon is welded into the name, so the text is gathered from both and written back to both ([#649](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/649)). Under Less the answer is a value for the directive Less falls back to where the text behind the colon parses as no expression as well.
	 * @param atRule - The at-rule.
	 * @returns The value, or `null` where the syntax declares no variable with this at-rule.
	 */
	atRuleVariableValue (atRule: AtRule): AtRuleVariableValue | null,
}

/** An at-rule's value as the syntax that declares a variable with it keeps one: see {@link Syntax#atRuleVariableValue}. */
export type AtRuleVariableValue = {

	/** The value as the file spells it, comments and all. */
	text: string,

	/** Where that text opens in the at-rule. */
	index: number,

	/**
	 * Writes the text back into the copies the parser split it over.
	 *
	 * A value welded into the name is written to the name and the params both, and the raw standing between them is left as the file spells it: that run is whitespace and comments, which no rule of a value writes into, so no edit spans it. Where a copy ends is read off the edits rather than off the text, since recasing a run does not always keep its length — `ß` uppercases to `SS`.
	 * @param fixed - The value as the fix leaves it.
	 * @param edits - The edits that made it, indexed in the text as it was read.
	 */
	write (fixed: string, edits: Edit[]): void,
}

/** A rule's selector opened for parsing: see {@link Syntax#selectorCopies}. */
export type SelectorCopies = {

	/** The parseable copy, every inline comment rewritten into a block one. */
	selector: string,

	/** The inline comments, each with its span in both copies. */
	comments: InlineComment[],

	/**
	 * Maps a position of the parsed copy into the file.
	 * @param index - The index in the parsed copy.
	 * @returns The index in the file.
	 */
	toSourceIndex (index: number): number,

	/**
	 * Returns the file's spelling of a stretch of the parsed copy.
	 * @param text - The stretch in the parsed copy.
	 * @param rawIndex - Its index there.
	 * @returns The stretch in the file.
	 */
	sourceSpelling (text: string, rawIndex: number): string,

	/**
	 * Writes a fixed selector into every copy, inline comments in the file's spelling.
	 * @param fixedSelector - The fixed parsed copy.
	 */
	write (fixedSelector: string): void,
}

export type { InlineComment } from "../preprocessor/findSelectorInlineComments/index.ts"
export type { InlineCommentReading } from "../preprocessor/readsInlineComments/index.ts"

/** The syntaxes registered beside the core; one not listed is not registered. */
export let namespaces: Syntax[] = [less, scss, styled]
