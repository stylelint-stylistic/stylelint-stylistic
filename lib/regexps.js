/**
 * The regular expressions the rules and the utils read a stylesheet with, gathered so that a pattern is written once and explained once, and so that two rules asking the same question ask it in the same words.
 *
 * A name says what the expression matches rather than what a caller does with it, and a name opening with `EVERY_` carries the `g` flag. Every such expression is read here with `match`, `matchAll`, `replace`, `replaceAll` or `split`, none of which leaves `lastIndex` behind it; a `test` or an `exec` over one would carry state from one call to the next, so neither is written against a global expression.
 */

/** A text holding nothing but whitespace, an empty text included. */
export const BLANK = /^\s*$/u

/** The first line break of a text, of either spelling, captured so that a replacement can write it back. */
export const CAPTURED_LF_OR_CRLF = /(\r?\n)/u

/** A carriage return. */
export const CARRIAGE_RETURN = /\r/u

/** A hex colour standing anywhere in a text. */
export const CONTAINS_HEX_COLOR = /#[\da-z]+/iu

/** A Windows line break. */
export const CRLF = /\r\n/u

/** A run of Windows line breaks. */
export const CRLF_RUN = /(?:\r\n)+/u

/** A line feed or a carriage return, the two breaks every syntax reads as one. */
export const CR_OR_LF = /[\r\n]/u

/** Two line breaks with nothing but horizontal whitespace between them. */
export const EMPTY_LINE = /\n[\r\t ]*\n/u

/** Every break that closes an inline comment anywhere but in both syntaxes at once: a form feed, which Sass ends a comment on and Less does not, and the two separators of Unicode, which one reading of Less's own parser ends one on though neither syntax the plugin runs under does. The question they are counted for is the one whose wrong answer lets a breaking fix through, so a break is counted here as soon as anything reads it as one — the form feed because a fix does break through it, the separators because nothing but the value parser's own reading of what a space is keeps them from it. */
export const EVERY_COMMENT_CLOSING_BREAK = /[\f\u2028\u2029]/gu

/** Every opening and closing pair of a block comment. */
export const EVERY_COMMENT_DELIMITER = /(\*\/|\/\*)/gu

/** Every run of Windows line breaks, the run captured whole. */
export const EVERY_CRLF_RUN = /(\r\n)+/gu

/** Every line feed and carriage return of a text, a Windows break counting as two. */
export const EVERY_CR_OR_LF = /[\n\r]/gu

/** Every run of line breaks that leaves an empty line behind it. */
export const EVERY_EMPTY_LINE_RUN = /(\r?\n\s*\n)+/gu

/** Every escape, quoted run and block comment of a selector, in the order they stand in it. */
export const EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT = /\\.|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu

/** The same as {@link EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT}, with the double slash of an inline comment among the alternatives. */
export const EVERY_ESCAPE_STRING_OR_COMMENT = /\\.|\/\/|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu

/** The quoted address of every `@import`, captured without the at-rule around it. */
export const EVERY_IMPORT_ADDRESS = /@import\s+(['"].*['"])/gui

/** Every run of the characters an interpolation is spelled with, so that something harmless can be put in their place. */
export const EVERY_INTERPOLATION_CHARACTER = /[#@{}]+/gu

/** Every run of Unix line breaks, the run captured whole. */
export const EVERY_LF_RUN = /(\n)+/gu

/** Every line break of a text, one at a time. */
export const EVERY_LINE_BREAK = /[\n\r\f]/gu

/** Every line break with the indentation behind it, where content or the end of the text follows. */
export const EVERY_LINE_BREAK_AND_INDENT = /\n[ \t]*(?=\S|$)/gu

/** Every run of line feeds and carriage returns, a Windows break counting as two of them, and the empty run wherever none stands. */
export const EVERY_LINE_BREAK_RUN = /[\r\n]*/gu

/** The spaces and tabs every line that holds content is indented by. */
export const EVERY_LINE_INDENT = /^[ \t]*(?=\S)/gmu

/** The indentation of every line that holds content, captured apart from the character that ends it. */
export const EVERY_LINE_INDENT_WITH_CONTENT = /(?:^|\n)([\t ]*)\S/gmu

/** The spaces every line that holds content is indented by, tabs not among them. */
export const EVERY_LINE_SPACE_INDENT = /^ *(?=\S)/gmu

/** Every space of a text, one at a time. */
export const EVERY_SPACE = / /gu

/** Every tab of a text. */
export const EVERY_TAB = /\t/gu

/** What every `url()` of a text holds, captured without the whitespace at its edges. */
export const EVERY_URL_CONTENT = /url\(\s*(\S.*\S)\s*\)/gui

/** Every character of whitespace, one at a time. */
export const EVERY_WHITESPACE = /\s/gu

/** Every run of whitespace, however wide. */
export const EVERY_WHITESPACE_RUN = /\s+/gu

/** The `__MSG_…__` a browser extension replaces at load time. */
export const EXTENSION_MESSAGE = /__MSG_\S+__/u

/** The first line of a text, the break that ends it aside. */
export const FIRST_LINE = /^[^\r\n]+/u

/** A fraction opening straight on its point, with no digit in front of it. */
export const FRACTION_WITHOUT_LEADING_ZERO = /(?:\D|^)(\.\d+)/u

/** A fraction with zeros in front of its point, the zeros captured apart from the fraction. */
export const FRACTION_WITH_LEADING_ZEROS = /(?:\D|^)(0+)(\.\d+)/u

/** A fraction ending in zeros, the digits that are kept captured apart from the zeros that are not. */
export const FRACTION_WITH_TRAILING_ZEROS = /\.(\d{0,100}?)(0+)(?:\D|$)/u

/** A hex colour opening a text. */
export const HEX_COLOR = /^#[\da-z]+/iu

/** The name of an `@import`, in whatever case it is written. */
export const IMPORT_AT_RULE = /^import$/iu

/** The indentation of the last line of a text, where that line holds nothing else. */
export const INDENT_AT_END = /(?:^|\n)([ \t]*)$/u

/** The last line of a text, the break in front of it aside, and nothing at all where the text ends in a break. */
export const LAST_LINE = /[^\r\n]+$/u

/** A block comment opening a text, line breaks aside, with what it holds captured. */
export const LEADING_BLOCK_COMMENT = /^[^\S\n\r\f]*\/\*([\s\S]*?)\*\//u

/** A closing brace opening a text, spaces and tabs aside. */
export const LEADING_CLOSING_BRACE = /^[ \t]*\}/u

/** A closing parenthesis opening a text, spaces and tabs aside. */
export const LEADING_CLOSING_PARENTHESIS = /^[ \t]*\)/u

/** A colon opening a text, with whatever whitespace follows it. */
export const LEADING_COLON_AND_WHITESPACE = /^:\s*/u

/** The indentation a text opens with, captured, up to the first character of content. */
export const LEADING_INDENT_AND_CONTENT = /^([ \t]*)\S/u

/** A text opening on anything but whitespace. */
export const LEADING_NON_WHITESPACE = /^\S/u

/** An arithmetic operator opening a text, as the one in front of `-$variable` is. */
export const LEADING_OPERATOR = /^[-+*/]/u

/** The spaces and tabs a text opens with, and the empty run where it opens with none. */
export const LEADING_SPACES_AND_TABS = /^[ \t]*/u

/** The whitespace a text opens with, the empty run included, so that a replacement over it always lands. */
export const LEADING_WHITESPACE = /^\s*/u

/** A text cut in two: the whitespace it opens with, and everything behind that. */
export const LEADING_WHITESPACE_AND_REST = /^(\s*)([\s\S]*)$/u

/** Whitespace or a block comment opening a text, whichever of the two comes first. */
export const LEADING_WHITESPACE_OR_BLOCK_COMMENT = /^(?:\s+|\/\*.*?\*\/)/su

/** The whitespace a text opens with, where it opens with any. */
export const LEADING_WHITESPACE_RUN = /^\s+/u

/** The whitespace a text opens with, up to its first line break, which is left standing. */
export const LEADING_WHITESPACE_WITHOUT_BREAK = /^[^\S\n\r\f]*/u

/** The Less `:extend`, with or without the selector list it takes. */
export const LESS_EXTEND = /:extend(?:\(.*?\))?/u

/** A Less `:extend(…)` carrying a selector list, in whatever case it is written. */
export const LESS_EXTEND_CALL = /:extend\(.+\)/iu

/** The `when` of a Less CSS guard, read in lower case only, as Less reads its keywords. */
export const LESS_GUARD = /\swhen\s*(?:not\s*)?\(/u

/** The `@{…}` Less interpolates a value with. */
export const LESS_INTERPOLATION = /@\{.+?\}/u

/** The parameter list of a Less parametric mixin, closing the selector it is written on. */
export const LESS_PARAMETRIC_MIXIN = /\(@.*\)$/u

/** A Less mixin call with something written after it, as `.foo().bar` and `.foo(@a, @b)[bar]` are. */
export const LESS_RESOLVED_MIXIN = /\.[\w-]+\(.*\).+/u

/** A line break of either spelling, Unix or Windows. */
export const LF_OR_CRLF = /\r?\n/u

/** A line break, each of the three one character long — a form feed among them, since Sass ends an inline comment on one. */
export const LINE_BREAK = /[\n\r\f]/u

/** The name of a `@media`, in whatever case it is written. */
export const MEDIA_AT_RULE = /^media$/iu

/** Anything that is not a space. */
export const NON_SPACE = /[^ ]/u

/** An opening brace at the end of a text, spaces and tabs aside. */
export const OPENING_BRACE_AT_END = /\{[ \t]*$/u

/** An opening parenthesis at the end of a text, with nothing behind it but spaces, tabs and block comments. */
export const OPENING_PARENTHESIS_AT_END = /\([ \t]*(?:\/\*(?:[^*]|\*(?!\/))*\*\/[ \t]*)*$/u

/** A block comment opening a text, line breaks aside. */
export const OPENS_WITH_BLOCK_COMMENT = /^[^\S\n\r\f]*\/\*/u

/** A text whose first line holds nothing but whitespace, a form feed not counting as the break that ends it. */
export const OPENS_WITH_CR_OR_LF = /^\s*[\r\n]/u

/** An inline comment opening a text, line breaks aside. */
export const OPENS_WITH_INLINE_COMMENT = /^[^\S\n\r\f]*\/\//u

/** A text whose first line holds nothing but whitespace. */
export const OPENS_WITH_LINE_BREAK = /^\s*[\n\r\f]/u

/** A text opening on a quote, whitespace aside. */
export const OPENS_WITH_QUOTE = /^\s*["']/u

/** A text opening on a tag, whitespace aside, as a stylesheet read out of a page does. */
export const OPENS_WITH_TAG = /^\s*</u

/** The `$(…)` postcss-simple-vars interpolates a value with. */
export const PSV_INTERPOLATION = /\$\(.+?\)/u

/** An operator of a range media feature. */
export const RANGE_FEATURE_OPERATOR = /[<>=]/u

/** The `#{…}` Sass interpolates a value with. */
export const SCSS_INTERPOLATION = /#\{.+?\}/su

/** A function called through a Sass module, as `namespace.function-name()` is. */
export const SCSS_MODULE_FUNCTION = /^.+\.[-\w]+\(/u

/** A variable read through a Sass module, as `namespace.$variable` is. */
export const SCSS_MODULE_VARIABLE = /^.+\.\$/u

/** A run of semicolons. */
export const SEMICOLON_RUN = /;+/u

/** The spaces and tabs a text opens with, where content or the end of the text follows them directly — so a text whose first line break comes before its content matches nothing at all. */
export const SPACES_AND_TABS_BEFORE_CONTENT = /^[ \t]*(?=\S|$)/u

/** A text made of spaces and tabs, and of at least one of them. */
export const SPACES_AND_TABS_ONLY = /^[ \t]+$/u

/** A block comment opening a text, spaces and tabs aside. */
export const SPACES_THEN_BLOCK_COMMENT = /^[ \t]*\/\*/u

/** An inline comment opening a text, spaces and tabs aside. */
export const SPACES_THEN_INLINE_COMMENT = /^[ \t]*\/\//u

/** A single space or tab. */
export const SPACE_OR_TAB = /[ \t]/u

/** The `{…}` a template literal or an HTML-like template interpolates a value with. */
export const TPL_INTERPOLATION = /\{.+?\}/su

/** The name a call is opened by, read back from its parenthesis, and the empty string where nothing nameable stands there. */
export const TRAILING_FUNCTION_NAME = /[\w-]*$/u

/** The spaces a text ends in, tabs and line breaks aside, and the empty run where it ends in none. */
export const TRAILING_SPACES = / *$/u

/** The spaces and tabs a line ends in, where it ends in any. */
export const TRAILING_SPACES_AND_TABS = /[ \t]+$/u

/** The star or underscore an old hack writes in front of a property, standing at the end of whatever precedes it. */
export const TRAILING_STAR_OR_UNDERSCORE = /[*_]$/u

/** The whitespace a text ends in, the empty run included, so that a replacement over it always lands. */
export const TRAILING_WHITESPACE = /\s*$/u

/** The whitespace a text ends in, where it ends in any: a search answers -1 on a text that does not. */
export const TRAILING_WHITESPACE_RUN = /\s+$/u

/** A `url(` at the end of a text, with nothing in front of it that a longer name could reach into. */
export const URL_CALL_AT_END = /(?:^|[^\w-])url\($/iu

/** A single character of whitespace. */
export const WHITESPACE = /\s/u

/** A text made of whitespace, and of at least one character of it. */
export const WHITESPACE_ONLY = /^\s+$/u

/** A block comment opening a text behind whitespace, of which there must be some. */
export const WHITESPACE_THEN_BLOCK_COMMENT = /^\s+\/\*/u

/** An inline comment opening a text behind whitespace, of which there must be some. */
export const WHITESPACE_THEN_INLINE_COMMENT = /^\s+\/\//u

/** A character an identifier or an interpolation can end on, which a slash behind it may therefore belong to rather than open anything. */
export const WORD_BRACE_OR_HYPHEN = /[\w}-]/u
