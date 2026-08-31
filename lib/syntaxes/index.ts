import type { AtRule, Comment, Declaration, Node, Root, Rule as PostcssRule } from "postcss"
import type { Node as SelectorNode } from "postcss-selector-parser"
import type { FunctionNode } from "postcss-value-parser"
import type { PostcssResult } from "stylelint"

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
}

/** The syntaxes registered beside the core, each under a namespace of its own. A syntax is not registered until it is listed here. */
export let namespaces: Syntax[] = [styled]
