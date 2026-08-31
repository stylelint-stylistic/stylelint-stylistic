/**
 * The regular expressions the rules and the utils read a stylesheet with, gathered so that a pattern is written once and explained once, and so that two rules asking the same question ask it in the same words.
 *
 * A name says what the expression matches rather than what a caller does with it, and a name opening with `EVERY_` carries the `g` flag. Every such expression is read here with `match`, `matchAll`, `replace`, `replaceAll` or `split`, none of which leaves `lastIndex` behind it; a `test` or an `exec` over one would carry state from one call to the next, so neither is written against a global expression.
 */

/** The name of the `aspect-ratio` property, in whatever case it is written. */
export const ASPECT_RATIO_PROPERTY = /^aspect-ratio$/iu

/** The first line break of a text, in either of the two spellings PostCSS reads one in, captured so that a replacement can write it back. A Windows pair is one break and is read as one, so that a replacement never lands between its two characters. Read by `addEmptyLineAfter` to put a break beside the one already standing, and by `getLineBreak` to read the first break a whole file spells. */
export const CAPTURED_LINE_BREAK = /(\r?\n)/u

/** A hex colour standing anywhere in a text. */
export const CONTAINS_HEX_COLOR = /#[\da-z]+/iu

/** A Windows line break. Read by `max-empty-lines` to tell a pair from a bare line feed, which is a question about the spelling and is meant, and by `indentation`, to ask of the line feed a search has stopped at whether a carriage return in front of it belongs to the same break — a question about the pair itself, so the narrowness is the whole of what is wanted there. */
export const CRLF = /\r\n/u

/** A run of Windows line breaks. Read by `max-empty-lines`, and narrow for the reason {@link CRLF} is. */
export const CRLF_RUN = /(?:\r\n)+/u

/** Two line breaks with nothing but horizontal whitespace between them, each in either of the two spellings PostCSS reads a break in. A Windows pair is one break and never two, since the carriage return is read only as the front of a pair. */
export const EMPTY_LINE = /\r?\n[\t ]*\r?\n/u

/** Every opening and closing pair of a block comment. */
export const EVERY_COMMENT_DELIMITER = /(\*\/|\/\*)/gu

/** Every run of Windows line breaks, the run captured whole. Read by `max-empty-lines`, and narrow for the reason {@link CRLF} is. */
export const EVERY_CRLF_RUN = /(\r\n)+/gu

/** Every run of line breaks that leaves an empty line behind it, the first break of the run captured so that it can be written in the whole run's place and the file keep the spelling it is written in. A stray semicolon may stand between two breaks of the run, since the readers of this question measure the whitespace with those taken out and would otherwise ask for an empty line to go that nothing here could take. Reads a break the way {@link EMPTY_LINE} does, a Windows pair counting as one. */
export const EVERY_EMPTY_LINE_RUN = /(\r?\n)(?:[\t ;]*\r?\n)+/gu

/** Every escape, quoted run and block comment of a selector, in the order they stand in it. */
export const EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT = /\\.|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu

/** The same as {@link EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT}, with the double slash of an inline comment among the alternatives. */
export const EVERY_ESCAPE_STRING_OR_COMMENT = /\\.|\/\/|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu

/** The quoted address of every `@import`, captured without the at-rule around it. */
export const EVERY_IMPORT_ADDRESS = /@import\s+(['"].*['"])/gui

/** Every interpolation a preprocessor writes, placed rather than tallied: the three spellings {@link SCSS_INTERPOLATION}, {@link LESS_INTERPOLATION} and {@link PSV_INTERPOLATION} read one at a time. Each alternative reads what its own name reads, the line break the Sass one crosses and the two others do not included, and the run handed back opens at the character in front of the delimiter where the spelling carries one. Narrow of the four an interpolation is spelled in: the `{…}` of {@link TPL_INTERPOLATION} is not among them, since in a value a pair of bare braces is far likelier to be a pair of characters than an interpolation — the braces of a string, of a comment, or of the block a custom property is allowed to carry — and reading such a pair as one would carry off the code standing between them. */
export const EVERY_INTERPOLATION = /#\{[\s\S]+?\}|@\{.+?\}|\$\(.+?\)/gu

/** Every run of the characters an interpolation is spelled with, so that something harmless can be put in their place. */
export const EVERY_INTERPOLATION_CHARACTER = /[#@{}]+/gu

/** Every run of Unix line breaks, the run captured whole. Read by `max-empty-lines`, and narrow for the reason {@link CRLF} is. */
// A line terminator of the JavaScript around a styled template, as `postcss-styled-syntax` counts the host file's lines: a Windows pair as one, then a line feed, a bare carriage return, or either separator of Unicode — and no form feed. This is a reading of the host, measured of that parser itself, and no stylesheet reading: PostCSS counts a line feed alone.
export const EVERY_JS_LINE_TERMINATOR = /\r\n|[\n\r\u2028\u2029]/gu

export const EVERY_LF_RUN = /(\n)+/gu

/** Every line of a text that a break ends, the break included, so that a line is read together with the character that ends it. Read by `linebreaks`, which asks of each line which of the two spellings its break is written in. */
export const EVERY_LINE_WITH_BREAK = /[^\n]*\n/gu

/** Every line break of a text, one at a time: a line feed, with the carriage return of a Windows pair in front of it where there is one. A text split on it keeps neither character of a pair. */
export const EVERY_LINE_BREAK = /\r?\n/gu

/** Every line break with the indentation behind it, where content or the end of the text follows, the break captured so that a replacement can write it back and the file keep the spelling it is written in. A Windows pair is one break and is read as one, so that a replacement never lands between its two characters. Read by `indentation`, whose fix writes the indentation an option asks for behind every break of a text. */
export const EVERY_LINE_BREAK_AND_INDENT = /(\r?\n)[ \t]*(?=\S|$)/gu

/** Every run of line feeds and carriage returns, a Windows break counting as two of them, and the empty run wherever none stands. Read by `named-grid-areas-alignment`, which counts the lines a run of them spans. */
export const EVERY_LINE_BREAK_RUN = /[\r\n]*/gu

/** The spaces and tabs every line that holds content is indented by. Where a line begins is named here rather than left to the `m` flag, whose set is a different one: it begins a line after the two separators of Unicode, which end a line to JavaScript and to no stylesheet. */
export const EVERY_LINE_INDENT = /(?<=^|\n)[ \t]*(?=\S)/gu

/** The indentation of every line that holds content, captured apart from the break that opens the line and from the character that ends the run. Where a line begins is named here for the reason it is in {@link EVERY_LINE_INDENT}. */
export const EVERY_LINE_INDENT_WITH_CONTENT = /(?:^|\n)([\t ]*)\S/gu

/** The spaces every line that holds content is indented by, tabs not among them. Where a line begins is named here for the reason it is in {@link EVERY_LINE_INDENT}. */
export const EVERY_LINE_SPACE_INDENT = /(?<=^|\n) *(?=\S)/gu

/** Every semicolon of a text, one at a time. */
export const EVERY_SEMICOLON = /;/gu

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

/** The first line of a text, the break that ends it aside — the carriage return of a Windows pair aside with it. */
export const FIRST_LINE = /^[^\n\r]+/u

/** A fraction opening straight on its point, with no digit in front of it. */
export const FRACTION_WITHOUT_LEADING_ZERO = /(?:\D|^)(\.\d+)/u

/** A fraction with zeros in front of its point, the zeros captured apart from the fraction. */
export const FRACTION_WITH_LEADING_ZEROS = /(?:\D|^)(0+)(\.\d+)/u

/** A fraction ending in zeros, the digits that are kept captured apart from the zeros that are not. */
export const FRACTION_WITH_TRAILING_ZEROS = /\.(\d{0,100}?)(0+)(?:\D|$)/u

/** A hex colour opening a text. */
export const HEX_COLOR = /^#[\da-z]+/iu

/** The whitespace closing a hexadecimal escape, and nothing else: one character, or the Windows pair, which CSS counts as the one. */
export const HEX_ESCAPE_TERMINATOR = /^(?:\r\n|[ \t\n\r\f])$/u

/** One character an identifier of CSS is spelled with, an escape aside: a letter, a digit, an underscore, a hyphen, or one of the code points outside ASCII the grammar names. Read one UTF-16 code unit at a time, so each half of a surrogate pair answers for itself and every character above the basic plane is a code point of an identifier, which is what the grammar has of them anyway. */
export const IDENTIFIER_CODE_POINT = /[\w\-\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]/u

/** The name of an `@import`, in whatever case it is written. */
export const IMPORT_AT_RULE = /^import$/iu

/** The indentation of the last line of a text, where that line holds nothing else. A Windows pair opens that line the way its line feed alone does, the carriage return in front of it belonging to the break rather than to the indentation. */
export const INDENT_AT_END = /(?:^|\n)([ \t]*)$/u

/** The last line of a text, the break in front of it aside — the carriage return of a Windows pair aside with it — and nothing at all where the text ends in a break. Read by `named-grid-areas-alignment`. */
export const LAST_LINE = /[^\r\n]+$/u

/** A block comment opening a text, line breaks aside, with what it holds captured. */
export const LEADING_BLOCK_COMMENT = /^[^\S\n]*\/\*([\s\S]*?)\*\//u

/** A closing brace opening a text, spaces and tabs aside. */
export const LEADING_CLOSING_BRACE = /^[ \t]*\}/u

/** A closing parenthesis opening a text, spaces and tabs aside. */
export const LEADING_CLOSING_PARENTHESIS = /^[ \t]*\)/u

/** A colon opening a text, with whatever whitespace follows it. */
export const LEADING_COLON_AND_WHITESPACE = /^:\s*/u

/** The hexadecimal escape a text opens with, the whitespace closing it included: a backslash, up to six hexadecimal digits, and the one whitespace character that ends the digits whether they would run on or not, a Windows pair counting as the one break it is. */
export const LEADING_HEX_ESCAPE = /^\\[\da-f]{1,6}(?:\r\n|[ \t\n\r\f])?/iu

/** The indentation a text opens with, captured, up to the first character of content. */
export const LEADING_INDENT_AND_CONTENT = /^([ \t]*)\S/u

/** A line break opening a text, with nothing whatever in front of it — the question a rule asks where a run of spaces before the break is exactly what it is about, and where {@link OPENS_WITH_LINE_BREAK} would therefore answer yes too often. */
export const LEADING_LINE_BREAK = /^\r?\n/u

/** A text opening on anything but whitespace. */
export const LEADING_NON_WHITESPACE = /^\S/u

/** An arithmetic operator opening a text, as the one in front of `-$variable` is. */
export const LEADING_OPERATOR = /^[-+*/]/u

/** The whitespace a text opens with, followed by a `+` or a `-`, whatever stands behind the sign. This is the reading for a syntax spelling arithmetic of its own, where a sign opening a number is no exception and the whitespace in front of it is what makes the sign an operator: Less reads `foo(@a) -2px` as two values and `foo(@a)-2px` as a subtraction, its parser taking a sign for an operator only where whitespace follows it or none precedes it, and Sass reads a minus the same way. Sass reads a plus as an operator whatever whitespace stands beside it, so the plus is taken along here rather than answered for: the question the caller puts to a syntax tells a preprocessor from plain CSS and does not tell Sass from Less, and one reading for the two is chosen over a second probe. What that costs under Sass is a warning left unsaid. {@link LEADING_SPACED_SUM_OPERATOR} is the reading CSS has, and this parts from it over the sign that opens a number. The five characters are the ones CSS calls whitespace, which `isWhitespace` reads by hand — `\s` would take in twenty more, a vertical tab and a no-break space and a line separator among them, that no stylesheet spells a space with. */
export const LEADING_SPACED_SIGN = /^[ \t\n\r\f]+[+-]/u

/** The whitespace a text opens with, followed by the `+` or the `-` of a sum standing on its own rather than opening a number. A sign is part of the number behind it only where a digit follows it, or a decimal point and a digit; anywhere else the sign stands alone, and with whitespace in front of it that is the operator of a sum. That is the reading CSS has, and CSS alone: a syntax spelling arithmetic of its own reads the whitespace in front of every sign, and {@link LEADING_SPACED_SIGN} is that reading. A point with no digit behind it is refused here all the same, `-.x` being nothing any stylesheet spells, and refusing it is what keeps this to one reading of one character: taking the whitespace away leaves a text no calculation can be read out of. The grammar asks for whitespace behind the operator as well, and this does not, engines differing on that side — `calc(1px +(2px))` is read by some and by the grammar is read by none, and closing it up would take a calculation away from the first while giving the second nothing. The five characters are the ones CSS calls whitespace, which `isWhitespace` reads by hand — `\s` would take in twenty more, a vertical tab and a no-break space and a line separator among them, that no stylesheet spells a space with. */
export const LEADING_SPACED_SUM_OPERATOR = /^[ \t\n\r\f]+[+-](?![\d.])/u

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

/** The whitespace a text opens with, up to its first line break, which is left standing whole — the carriage return of a Windows pair with it. */
export const LEADING_WHITESPACE_WITHOUT_BREAK = /^(?:(?!\r?\n)\s)*/u

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

/** A line break, as PostCSS reads one: a line feed, with or without the carriage return of a Windows pair in front of it. A bare carriage return and a form feed are whitespace to PostCSS's tokenizer and no line to its line counter, so a rule reading a line in either would report a position the file does not have, and every reading of a break in this file follows PostCSS rather than the grammar of CSS, which folds all four into one. */
export const LINE_BREAK = /\r?\n/u

/** The name of a `@media`, in whatever case it is written. */
export const MEDIA_AT_RULE = /^media$/iu

/** Anything that is not a space. */
export const NON_SPACE = /[^ ]/u

/** A number of CSS spelling the whole of a text, written with neither a sign nor an exponent. It is narrow on purpose: `aspect-ratio-notation`, the one rule that reads it, rewrites the number it matches, and rewriting the spelling of a sign or of an exponent is nothing that rule was asked to do — a word carrying either is left alone by not matching here. */
export const NUMBER_WITHOUT_SIGN_OR_EXPONENT = /^(?:\d+(?:\.\d+)?|\.\d+)$/u

/** An opening brace at the end of a text, spaces and tabs aside. */
export const OPENING_BRACE_AT_END = /\{[ \t]*$/u

/** An opening parenthesis at the end of a text, with nothing behind it but spaces, tabs and block comments. */
export const OPENING_PARENTHESIS_AT_END = /\([ \t]*(?:\/\*(?:[^*]|\*(?!\/))*\*\/[ \t]*)*$/u

/** The head of a run of identifier code points where the run is no identifier of CSS: a digit opens it, or a hyphen and a digit, or a hyphen stands there alone. Everything else a run of those characters can be is an identifier, `--` and `--1` among them, since two hyphens open one whatever follows. */
export const OPENS_NO_IDENTIFIER = /^-?\d|^-$/u

/** A block comment opening a text, line breaks aside. */
export const OPENS_WITH_BLOCK_COMMENT = /^[^\S\n]*\/\*/u

/** An inline comment opening a text, line breaks aside. */
export const OPENS_WITH_INLINE_COMMENT = /^[^\S\n]*\/\//u

/** A text whose first line holds nothing but whitespace. Read by `no-empty-first-line` as well, whose fix takes that first line away. */
export const OPENS_WITH_LINE_BREAK = /^\s*\n/u

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

/** A hexadecimal escape at the end of a text, the one whitespace character closing it aside — which `postcss-value-parser` hands back as a divider of its own, cutting the name of a call in two. */
export const TRAILING_HEX_ESCAPE = /\\[\da-f]{1,6}$/iu

/** The line break a text ends in, where it ends in one. Read by `no-missing-end-of-source-newline`, which asks whether a file has ended its last line, and by `indentation`, which asks the same of the code in front of an embedded stylesheet and of the whitespace behind one. A Windows pair ends in a line feed, so the pair needs no alternative of its own — which is why this answers whether a text ends in a break and never which break that is: matched against `a\r\n` it hands back the line feed alone. */
export const TRAILING_LINE_BREAK = /\n$/u

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
