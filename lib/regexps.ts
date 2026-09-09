/**
 * The regular expressions the rules and utils read a stylesheet with, written and explained once.
 *
 * A name says what the expression matches; one opening with `EVERY_` carries the `g` flag and is read only with `match`, `matchAll`, `replace`, `replaceAll` or `split`, never `test` or `exec`, which keep `lastIndex`.
 */

/** `aspect-ratio`, any case. */
export const ASPECT_RATIO_PROPERTY = /^aspect-ratio$/iu

/** The first line break, captured. */
export const CAPTURED_LINE_BREAK = /(\r?\n)/u

/** A hex colour anywhere. */
export const CONTAINS_HEX_COLOR = /#[\da-z]+/iu

/** A Windows break alone; narrow since `max-empty-lines` and `indentation` ask about the pair. */
export const CRLF = /\r\n/u

/** A run of Windows breaks; narrow as {@link CRLF} is. */
export const CRLF_RUN = /(?:\r\n)+/u

/** A break to the grammar, asking whether a backslash opens an escape: line feed, carriage return or form feed; a backslash before any is a delimiter, so `10PX\` and a break is the dimension `10PX`. */
export const CSS_LINE_BREAK = /[\n\r\f]/u

/** One decimal digit. */
export const DIGIT = /\d/u

/** Two breaks with only horizontal whitespace between them. */
export const EMPTY_LINE = /\r?\n[\t ]*\r?\n/u

/** Every backslash before a slash, which escapes nothing to the tokenizer: `\/*` opens a comment. */
export const EVERY_BACKSLASH_IN_FRONT_OF_A_SLASH = /\\(?=\/)/gu

/** Every block comment delimiter. */
export const EVERY_COMMENT_DELIMITER = /(\*\/|\/\*)/gu

/** Every run of Windows breaks, captured; narrow as {@link CRLF} is. */
export const EVERY_CRLF_RUN = /(\r\n)+/gu

/** The properties spelling grid rows as strings, any case ([#614](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/614)). */
export const GRID_AREAS_PROPERTY = /^(?:grid-template-areas|grid-template|grid)$/iu

/** Every run of tokenizer whitespace; a no-break space and a vertical tab are words ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494), [#401](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/401)). The narrowing of `\s+`. */
export const EVERY_CSS_WHITESPACE_RUN = /[ \t\n\r\f]+/gu

/** Every run of breaks leaving an empty line, the first break captured; a stray semicolon may stand between two breaks, since the readers measure whitespace with semicolons out. */
export const EVERY_EMPTY_LINE_RUN = /(\r?\n)(?:[\t ;]*\r?\n)+/gu

/** Every escape, quoted run and block comment. */
export const EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT = /\\.|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu

/** {@link EVERY_ESCAPE_STRING_OR_BLOCK_COMMENT} plus `//`. */
export const EVERY_ESCAPE_STRING_OR_COMMENT = /\\.|\/\/|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\/\*.*?\*\//gsu

/** {@link SCSS_INTERPOLATION}, {@link LESS_INTERPOLATION} and {@link PSV_INTERPOLATION} in one; only the Sass one crosses a break. {@link TPL_INTERPOLATION} is left out: bare braces in a value are likelier a string or a comment. */
export const EVERY_INTERPOLATION = /#\{[\s\S]+?\}|@\{.+?\}|\$\(.+?\)/gu

/** A line terminator as `postcss-styled-syntax` counts host lines: a Windows pair as one, a line feed, a bare carriage return or either Unicode separator, no form feed; PostCSS counts line feeds alone. */
export const EVERY_JS_LINE_TERMINATOR = /\r\n|[\n\r\u2028\u2029]/gu

/** Every run of Unix breaks, captured; narrow as {@link CRLF} is. */
export const EVERY_LF_RUN = /(\n)+/gu

/** Every line ending in a break, break included. */
export const EVERY_LINE_WITH_BREAK = /[^\n]*\n/gu

/** Every break, a pair's carriage return included; a split keeps neither. */
export const EVERY_LINE_BREAK = /\r?\n/gu

/** Every break and the indentation behind it, where content or the end follows, the break captured; the indentation is tokenizer whitespace short of a break, form feed and bare carriage return among it, which a fix stopping at spaces and tabs wrote nothing over ([#452](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452)). */
export const EVERY_LINE_BREAK_AND_INDENT = /(\r?\n)(?:[ \t\f]|\r(?!\n))*(?=\S|$)/gu

/** Every run of line feeds and carriage returns, a Windows pair counting as two, and the empty run everywhere else. */
export const EVERY_LINE_BREAK_RUN = /[\r\n]*/gu

/** The indentation of every content line, captured; the line start is spelled since `m` also begins a line after the two Unicode separators. */
export const EVERY_LINE_INDENT_WITH_CONTENT = /(?:^|\n)([\t ]*)\S/gu

/** The spaces each content line is indented by, tabs excluded; the line start is spelled as in {@link EVERY_LINE_INDENT_WITH_CONTENT}. */
export const EVERY_LINE_SPACE_INDENT = /(?<=^|\n) *(?=\S)/gu

/** Every semicolon. */
export const EVERY_SEMICOLON = /;/gu

/** Every space. */
export const EVERY_SPACE = / /gu

/** Every tab. */
export const EVERY_TAB = /\t/gu

/** Every whitespace character. */
export const EVERY_WHITESPACE = /\s/gu

/** A browser extension's `__MSG_…__`. */
export const EXTENSION_MESSAGE = /__MSG_\S+__/u

/** A fraction opening on its point. */
export const FRACTION_WITHOUT_LEADING_ZERO = /(?:\D|^)(\.\d+)/u

/** A fraction behind zeros, the zeros captured apart. */
export const FRACTION_WITH_LEADING_ZEROS = /(?:\D|^)(0+)(\.\d+)/u

/** A fraction ending in zeros, the kept digits captured apart. */
export const FRACTION_WITH_TRAILING_ZEROS = /\.(\d{0,100}?)(0+)(?:\D|$)/u

/** A leading hex colour. */
export const HEX_COLOR = /^#[\da-z]+/iu

/** The one whitespace character closing a hexadecimal escape; a Windows pair counts as one. */
export const HEX_ESCAPE_TERMINATOR = /^(?:\r\n|[ \t\n\r\f])$/u

/** One UTF-16 unit of a CSS identifier, an escape aside; a surrogate half answers for itself, so every character above the basic plane counts. */
export const IDENTIFIER_CODE_POINT = /[\w\-\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uD800-\uDFFF\uF900-\uFDCF\uFDF0-\uFFFD]/u

/** `import`, any case. */
export const IMPORT_AT_RULE = /^import$/iu

/** The last line, its break excluded; nothing where the text ends in one. */
export const LAST_LINE = /[^\r\n]+$/u

/** A leading block comment, breaks aside, its content captured. */
export const LEADING_BLOCK_COMMENT = /^[^\S\n]*\/\*([\s\S]*?)\*\//u

/** A leading `}`, spaces and tabs aside. */
export const LEADING_CLOSING_BRACE = /^[ \t]*\}/u

/** A leading `)`, spaces and tabs aside. */
export const LEADING_CLOSING_PARENTHESIS = /^[ \t]*\)/u

/** A leading colon and the tokenizer whitespace behind it ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). */
export const LEADING_COLON_AND_WHITESPACE = /^:[ \t\n\r\f]*/u

/** The leading tokenizer whitespace; a vertical tab and a no-break space are words ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). The narrowing of {@link LEADING_WHITESPACE}. */
export const LEADING_CSS_WHITESPACE = /^[ \t\n\r\f]*/u

/** The leading word, up to the first tokenizer whitespace, the complement of {@link LEADING_CSS_WHITESPACE}, for cutting a run `postcss-value-parser` read too wide ([#496](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/496)). */
export const LEADING_CSS_WORD = /^[^ \t\n\r\f]*/u

/** A leading hexadecimal escape with its one closing whitespace character; a Windows pair counts as one. */
export const LEADING_HEX_ESCAPE = /^\\[\da-f]{1,6}(?:\r\n|[ \t\n\r\f])?/iu

/** The leading indentation, captured, and the first content character. */
export const LEADING_INDENT_AND_CONTENT = /^([ \t]*)\S/u

/** A leading break with nothing in front, where {@link OPENS_WITH_LINE_BREAK} says yes too often. */
export const LEADING_LINE_BREAK = /^\r?\n/u

/** The leading breaks, nothing between them: what `max-empty-lines` counts from the start of a file and writes where it has no node ([#404](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/404)). */
export const LEADING_LINE_BREAK_RUN = /^(?:\r?\n)+/u

/** A text opening on non-whitespace. */
export const LEADING_NON_WHITESPACE = /^\S/u

/** The leading number Less reads: a sign, digits and at most one period, no exponent ([#646](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/646)). */
export const LEADING_NUMBER_WITHOUT_EXPONENT = /^[+-]?\d*\.?\d+/u

/** A leading arithmetic operator, as in `-$variable`. */
export const LEADING_OPERATOR = /^[-+*/]/u

/** Leading whitespace and a `+` or `-`, whatever follows: the preprocessor reading, where the whitespace makes a sign an operator even before a number. Sass reads a plus as an operator always, so one reading for both leaves a warning unsaid there; {@link LEADING_SPACED_SUM_OPERATOR} is the CSS reading. */
export const LEADING_SPACED_SIGN = /^[ \t\n\r\f]+[+-]/u

/** Leading whitespace and a `+` or `-` opening no number, the CSS reading: a sign belongs to a number only where a digit, or a point and a digit, follows, `-.x` refused too. No whitespace is asked for behind it, since some engines read `calc(1px +(2px))`. */
export const LEADING_SPACED_SUM_OPERATOR = /^[ \t\n\r\f]+[+-](?![\d.])/u

/** The leading spaces and tabs, the empty run included. */
export const LEADING_SPACES_AND_TABS = /^[ \t]*/u

/** The leading whitespace, the empty run included so a replacement always lands. */
export const LEADING_WHITESPACE = /^\s*/u

/** The leading whitespace and the rest, captured apart. */
export const LEADING_WHITESPACE_AND_REST = /^(\s*)([\s\S]*)$/u

/** Leading whitespace or a block comment, whichever comes first. */
export const LEADING_WHITESPACE_OR_BLOCK_COMMENT = /^(?:\s+|\/\*.*?\*\/)/su

/** The leading whitespace, where there is any. */
export const LEADING_WHITESPACE_RUN = /^\s+/u

/** The leading whitespace up to the first break, a Windows pair left whole; a vertical tab and a no-break space are words ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). */
export const LEADING_WHITESPACE_WITHOUT_BREAK = /^(?:[ \t\f]|\r(?!\n))*/u

/** Less's `@{…}`. */
export const LESS_INTERPOLATION = /@\{.+?\}/u

/** A break as PostCSS reads one: a line feed, a carriage return optional in front. A bare carriage return or form feed is no line to PostCSS's counter, so a rule reading one reports a position the file lacks; {@link CSS_LINE_BREAK} is the grammar's. */
export const LINE_BREAK = /\r?\n/u

/** `media`, any case. */
export const MEDIA_AT_RULE = /^media$/iu

/** Anything but a space. */
export const NON_SPACE = /[^ ]/u

/** A CSS number without sign or exponent as the whole text; `aspect-ratio-notation` leaves a word carrying either alone. */
export const NUMBER_WITHOUT_SIGN_OR_EXPONENT = /^(?:\d+(?:\.\d+)?|\.\d+)$/u

/** A `{` ending a text, spaces and tabs aside. */
export const OPENING_BRACE_AT_END = /\{[ \t]*$/u

/** A `(` ending a text, only spaces, tabs and block comments behind it. */
export const OPENING_PARENTHESIS_AT_END = /\([ \t]*(?:\/\*(?:[^*]|\*(?!\/))*\*\/[ \t]*)*$/u

/** The head of an identifier-character run that is no identifier: a digit, a hyphen and a digit, or a lone hyphen; `--` opens one whatever follows. */
export const OPENS_NO_IDENTIFIER = /^-?\d|^-$/u

/** A leading block comment, breaks aside; a vertical tab or no-break space in front is a word ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). */
export const OPENS_WITH_BLOCK_COMMENT = /^(?:[ \t\f]|\r(?!\n))*\/\*/u

/** A leading `//` comment, breaks aside. */
export const OPENS_WITH_INLINE_COMMENT = /^[^\S\n]*\/\//u

/** A first line of whitespace alone, with `\s` on purpose: `no-empty-first-line` replaces by it over every leading empty line, which a tokenizer-true spelling stops short of ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)); a fix reads {@link OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE}. */
export const OPENS_WITH_LINE_BREAK = /^\s*\n/u

/** A break behind the leading tokenizer non-break whitespace; a vertical tab and a no-break space stop the run ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)), where {@link OPENS_WITH_LINE_BREAK} reads over them. */
export const OPENS_WITH_LINE_BREAK_PAST_CSS_WHITESPACE = /^(?:[ \t\f]|\r(?!\n))*\r?\n/u

/** A leading quote, whitespace aside. */
export const OPENS_WITH_QUOTE = /^\s*["']/u

/** A leading tag, whitespace aside. */
export const OPENS_WITH_TAG = /^\s*</u

/** postcss-simple-vars' `$(…)`, a plugin's spelling over plain CSS, read by the core beside the preprocessors' two. */
export const PSV_INTERPOLATION = /\$\(.+?\)/u

/** A range media feature operator. */
export const RANGE_FEATURE_OPERATOR = /[<>=]/u

/** A run of semicolons. */
export const SEMICOLON_RUN = /;+/u

/** Spaces and tabs only, at least one. */
export const SPACES_AND_TABS_ONLY = /^[ \t]+$/u

/** A leading block comment, spaces and tabs aside. */
export const SPACES_THEN_BLOCK_COMMENT = /^[ \t]*\/\*/u

/** A leading `//` comment, spaces and tabs aside. */
export const SPACES_THEN_INLINE_COMMENT = /^[ \t]*\/\//u

/** Sass's `#{…}`. */
export const SCSS_INTERPOLATION = /#\{.+?\}/su

/** A space or a tab. */
export const SPACE_OR_TAB = /[ \t]/u

/** A template's `{…}`. */
export const TPL_INTERPOLATION = /\{.+?\}/su

/** The trailing whitespace as the tokenizer reads it ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)); the narrowing of {@link TRAILING_WHITESPACE}. */
export const TRAILING_CSS_WHITESPACE = /[ \t\n\r\f]*$/u

/** A trailing hexadecimal escape, its closing whitespace aside, which `postcss-value-parser` returns as a divider. */
export const TRAILING_HEX_ESCAPE = /\\[\da-f]{1,6}$/iu

/** The break a text ends in: against `a\r\n` the line feed alone, answering whether and never which. */
export const TRAILING_LINE_BREAK = /\n$/u

/** The trailing spaces, the empty run included. */
export const TRAILING_SPACES = / *$/u

/** The trailing spaces and tabs, where there are any. */
export const TRAILING_SPACES_AND_TABS = /[ \t]+$/u

/** The star or underscore of an old property hack, at the end. */
export const TRAILING_STAR_OR_UNDERSCORE = /[*_]$/u

/** The trailing whitespace, the empty run included, so a replacement always lands. */
export const TRAILING_WHITESPACE = /\s*$/u

/** The trailing whitespace, where there is any; a search answers -1 otherwise. */
export const TRAILING_WHITESPACE_RUN = /\s+$/u

/** The trailing whitespace down to the last break, a Windows pair left whole; a bare carriage return and a form feed go with it, a vertical tab and a no-break space are words ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). The twin of {@link LEADING_WHITESPACE_WITHOUT_BREAK}. */
export const TRAILING_WHITESPACE_WITHOUT_BREAK = /(?:[ \t\f]|\r(?!\n))+$/u

/** A leading vendor prefix, any case. */
export const VENDOR_PREFIX = /^-[a-z]+-/iu

/** One whitespace character. */
export const WHITESPACE = /\s/u

/** Tokenizer whitespace only, at least one character ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). */
export const WHITESPACE_ONLY = /^[ \t\n\r\f]+$/u

/** Tokenizer whitespace or nothing; a vertical tab or no-break space is a word ([#494](https://github.com/stylelint-stylistic/stylelint-stylistic/issues/494)). */
export const WHITESPACE_OR_NOTHING = /^[ \t\n\r\f]*$/u

/** A block comment behind some leading whitespace. */
export const WHITESPACE_THEN_BLOCK_COMMENT = /^\s+\/\*/u

/** A `//` comment behind some leading whitespace. */
export const WHITESPACE_THEN_INLINE_COMMENT = /^\s+\/\//u

/** The leading whitespace short of a break, where content or the end follows directly; nothing where the first break precedes the content. Tokenizer whitespace, as {@link EVERY_LINE_BREAK_AND_INDENT} is. */
export const WHITESPACE_WITHOUT_BREAK_BEFORE_CONTENT = /^(?:[ \t\f]|\r(?!\n))*(?=\S|$)/u
