import type { AtRule, Comment, Declaration, Node, Root, Rule as PostcssRule } from "postcss"
import type { Node as SelectorNode } from "postcss-selector-parser"
import type { FunctionNode } from "postcss-value-parser"
import type { PostcssResult } from "stylelint"

import type { CommentSpan } from "../utils/findCommentSpans/index.ts"
import type { InlineCommentSpan } from "../utils/findInlineCommentSpans/index.ts"
import type { InterpolationSpan } from "../utils/findInterpolationSpans/index.ts"
import type { InlineComment } from "../utils/findSelectorInlineComments/index.ts"
import type { InlineCommentReading } from "../utils/readsInlineComments/index.ts"

import { styled } from "./styled/index.ts"

/**
 * How a family of the plugin's rules reads a stylesheet: the namespace the family is registered under, and the syntaxes it answers for.
 *
 * Every rule module exports a factory taking one of these, and `lib/index.ts` registers the factory's rule once per syntax listed below beside the core, under `@stylistic/<namespace>/<rule>`. What a syntax adds to this contract as the rules come to ask it more — where the comments of a text stand, what a construct of a preprocessor is — is added here, and answered for plain CSS by the core's own syntax.
 */
export type Syntax = {

	/** The segment between `@stylistic/` and the rule's name — `scss` for `@stylistic/scss/color-hex-case` — and nothing for the rules of the core. */
	namespace?: string,

	/**
	 * Asks whether the rules read the given root, by the shape its parser left on it and by the syntax the file was opened with.
	 * @param root - The root a check was handed.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns True where the rules are written for it; a root refused here is answered by one warning naming the rule, and checked by nothing.
	 */
	accepts (root: Root, result: PostcssResult): boolean,

	/**
	 * Reads what the code around an embedded stylesheet gives a node of it: the indentation of the line the embedding expression opens on, and whether the expression is broken over lines, which puts what it holds one level deeper.
	 * @param node - The node whose stylesheet may be embedded.
	 * @returns The indentation and the spread; an empty indent, unbroken, for a stylesheet standing on its own.
	 */
	embedding (node: Node): { indent: string, multiline: boolean },

	/**
	 * Asks whether a declaration's value embeds an expression of the host language, whose lines are the host's rather than the stylesheet's.
	 * @param decl - The declaration.
	 * @returns True where the value holds such an expression.
	 */
	valueEmbedsHostCode (decl: Declaration): boolean,

	/**
	 * Asks whether an at-rule is standard CSS rather than a construct of a preprocessor.
	 * @param atRule - The at-rule.
	 * @returns True where it is standard.
	 */
	isStandardAtRule (atRule: AtRule): boolean,

	/**
	 * Asks whether a rule is standard CSS rather than a construct of a preprocessor.
	 * @param rule - The rule.
	 * @returns True where it is standard.
	 */
	isStandardRule (rule: PostcssRule): boolean,

	/**
	 * Asks whether a declaration is standard CSS rather than a construct of a preprocessor.
	 * @param decl - The declaration.
	 * @returns True where it is standard.
	 */
	isStandardDeclaration (decl: Declaration): boolean,

	/**
	 * Asks whether a property is standard CSS rather than a variable or an interpolation.
	 * @param property - The property's text.
	 * @returns True where it is standard.
	 */
	isStandardProperty (property: string): boolean,

	/**
	 * Asks whether a value is standard CSS rather than a variable, an interpolation or an operation.
	 * @param value - The value's text.
	 * @returns True where it is standard.
	 */
	isStandardValue (value: string): boolean,

	/**
	 * Asks whether a selector is standard CSS rather than a construct of a preprocessor.
	 * @param selector - The selector's text.
	 * @returns True where it is standard.
	 */
	isStandardSelector (selector: string): boolean,

	/**
	 * Asks whether a function of a value is standard CSS rather than a list of Sass or an interpolation.
	 * @param fn - The function node, as the value parser hands it over.
	 * @returns True where it is standard.
	 */
	isStandardFunction (fn: FunctionNode): boolean,

	/**
	 * Asks whether a comment is one CSS spells, rather than an inline comment of a preprocessor.
	 * @param comment - The comment.
	 * @returns True where it is standard.
	 */
	isStandardComment (comment: Comment): boolean,

	/**
	 * Asks whether a combinator of a parsed selector is standard CSS.
	 * @param combinator - The combinator node, as the selector parser hands it over.
	 * @returns True where it is standard.
	 */
	isStandardCombinator (combinator: SelectorNode): boolean,

	/**
	 * Reads the text of a node as the file spells it — a declaration's value, a rule's selector, an at-rule's params — whichever copies the syntax keeps of it.
	 * @param node - The declaration, rule or at-rule.
	 * @returns The text, in the file's own spelling.
	 */
	read (node: AtRule | Declaration | PostcssRule): string,

	/**
	 * Writes the text of a node into the copy of it the syntax prints, keeping whatever other copies it holds in step.
	 * @param node - The declaration, rule or at-rule.
	 * @param text - The text to write.
	 */
	write (node: AtRule | Declaration | PostcssRule, text: string): void,

	/**
	 * Reads what the node's own syntax makes of a comment opened by a double slash: whether it opens one at all, and whether such a comment survives in the text the rule reads.
	 * @param node - The node whose stylesheet's syntax is asked.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns The reading.
	 */
	inlineComments (node: Node, result: PostcssResult): InlineCommentReading,

	/**
	 * Asks whether the text a rule reads of the node spells inline comments — whether the syntax both opens one on a double slash and keeps it in that text.
	 * @param node - The node whose stylesheet's syntax is asked.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns True where it does.
	 */
	readsInlineComments (node: Node, result: PostcssResult): boolean,

	/**
	 * Asks whether the node's own syntax keeps an inline comment in the text a rule reads, whatever it does about opening one.
	 * @param node - The node whose stylesheet's syntax is asked.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns True where it keeps them.
	 */
	keepsInlineComments (node: Node, result: PostcssResult): boolean,

	/**
	 * Finds the spans every comment occupies in a text of the node's stylesheet — the block comments, and the inline ones where the node's syntax reads them there.
	 * @param text - The text, as the rule reads it.
	 * @param node - The node the text belongs to.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns The spans, in the text's own coordinates.
	 */
	commentSpans (text: string, node: Node, result: PostcssResult): CommentSpan[],

	/**
	 * Finds the spans the inline comments alone occupy in a text of the node's stylesheet, where the node's syntax reads them there.
	 * @param text - The text, as the rule reads it.
	 * @param node - The node the text belongs to.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns The spans, in the text's own coordinates.
	 */
	inlineCommentSpans (text: string, node: Node, result: PostcssResult): InlineCommentSpan[],

	/**
	 * Asks whether a text ends inside an inline comment, under the reading given.
	 * @param text - The text.
	 * @param [reading] - What the syntax makes of a double slash; nothing read where none is given.
	 * @returns True where the end of the text stands inside such a comment.
	 */
	endsWithInlineComment (text: string, reading?: InlineCommentReading): boolean,

	/**
	 * Asks whether a fix would take the end of a text from outside an inline comment into one, under the reading given.
	 * @param standingText - The text as it stands, up to and including the character the fix moves.
	 * @param fixedText - The same text as the fix would leave it.
	 * @param reading - What the syntax makes of a double slash.
	 * @returns True where the end moves into a comment.
	 */
	movesEndIntoInlineComment (standingText: string, fixedText: string, reading: InlineCommentReading): boolean,

	/**
	 * Asks whether a write onto the whitespace the node ends with would land inside an inline comment.
	 * @param node - The node the write is about.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @param [spelledBetween] - The run that will stand between the node and the write once the fix has run, where the write does not land on the node's own trailing whitespace.
	 * @returns True where such a write would land inside an inline comment.
	 */
	writesIntoInlineComment (node: Node, result: PostcssResult, spelledBetween?: string): boolean,

	/**
	 * Builds the copy of a text a search runs over: the double slashes the node's syntax reads as code are hidden, so a scan finds only the comments the syntax reads.
	 * @param text - The text, as the rule reads it.
	 * @param node - The node the text belongs to.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns The copy, with the spans of the comments the syntax reads.
	 */
	searchCopy (text: string, node: Node, result: PostcssResult): { searchString: string, commentSpans: CommentSpan[] },

	/**
	 * Opens a rule's selector for a rule that parses it.
	 *
	 * `postcss-scss` rewrites every inline comment of a selector into a block comment in the raw copy a parser can read, keeps the source spelling beside it and prints that one, so the two copies drift apart by two characters per comment. What comes back holds the parsed copy, the map from its positions into the file's own coordinates, the file's own spelling of a stretch of it, and the writer that lands a fixed selector in every copy the syntax keeps.
	 * @param rule - The rule whose selector is opened.
	 * @returns The copies.
	 */
	selectorCopies (rule: PostcssRule): SelectorCopies,

	/**
	 * Asks whether the node must keep its trailing semicolon whatever an option says, because the language will not part with it.
	 * @param node - The node the semicolon stands behind.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns True where the semicolon has to stay.
	 */
	requiresTrailingSemicolon (node: Node, result: PostcssResult): boolean,

	/**
	 * Asks whether the syntax that spelled a node reads arithmetic of its own, in which the whitespace in front of every sign is what makes the sign an operator.
	 *
	 * Nothing in the tree can answer this: `foo($a) -2px`, which Sass reads as a list of two values, and `foo($a)-2px`, which it reads as a subtraction, are one declaration node either way, and the difference lives in the compiler of the language rather than in what PostCSS hands over. What can be asked is whether a double slash opens a comment in that syntax, and the two answers coincide: Sass and Less spell arithmetic of their own and comments of their own both, and plain CSS spells neither. A syntax the probe learns nothing about is answered yes, which leaves the whitespace standing and costs a warning rather than a file.
	 *
	 * What this question cannot do is tell Sass from Less, and one place where those two differ is the plus: Less reads the whitespace in front of it as it reads the whitespace in front of a minus, and Sass reads a plus as an operator whatever whitespace stands beside it. So one reading answers for both syntaxes, and a plus behind a call is left alone under Sass as well, where closing it up would have been safe. That is a warning left unsaid, which is the side of the answer this whole question is decided on. A probe telling those two apart is there to be written — `postcss-less` reads `@a: 1;` as an at-rule it marks a variable and `postcss-scss` reads a plain one — so this is one reading chosen for two languages rather than a wall.
	 *
	 * The question is put to the node rather than to the file, since a page may hold a plain `<style>` beside a `<style lang="scss">` and each block carries the syntax that spelled it.
	 * @param node - The node whose text is being read.
	 * @param result - The Stylelint result, which holds the syntax the file was opened with.
	 * @returns True where the syntax that spelled that node spells arithmetic of its own.
	 */
	spellsOwnArithmetic (node: Node, result: PostcssResult): boolean,

	/**
	 * Finds the spans the interpolations of a preprocessor occupy in a text — a stretch written in a language of its own, which no rule reads code beside.
	 * @param text - The text, with its comments blanked where a brace inside one must not close an interpolation.
	 * @returns The spans, in the text's own coordinates.
	 */
	interpolationSpans (text: string): InterpolationSpan[],
}

/** A rule's selector, opened for parsing and writing: see {@link Syntax#selectorCopies}. */
export type SelectorCopies = {

	/** The copy a parser can read, every inline comment rewritten into a block one. */
	selector: string,

	/** The inline comments the pair of copies holds, each with its span in both. */
	comments: InlineComment[],

	/**
	 * Maps a position of the parsed copy into the file's own coordinates.
	 * @param index - The index in the parsed copy.
	 * @returns The index in the file's spelling.
	 */
	toSourceIndex (index: number): number,

	/**
	 * Gives back the way the file spells a stretch of the parsed copy.
	 * @param text - The text as the parsed copy spells it.
	 * @param rawIndex - The index that text stands at in the parsed copy.
	 * @returns The same stretch, spelled as the file spells it.
	 */
	sourceSpelling (text: string, rawIndex: number): string,

	/**
	 * Writes a fixed selector into every copy the syntax keeps, the inline comments of the printed one spelled the way the file spells them.
	 * @param fixedSelector - The selector, as the fix leaves the parsed copy.
	 */
	write (fixedSelector: string): void,
}

/** The syntaxes registered beside the core, each under a namespace of its own. A syntax is not registered until it is listed here. */
export let namespaces: Syntax[] = [styled]
