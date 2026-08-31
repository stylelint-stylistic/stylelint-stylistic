/** Every interpolation a preprocessor writes, placed rather than tallied: the three spellings {@link SCSS_INTERPOLATION}, {@link LESS_INTERPOLATION} and {@link PSV_INTERPOLATION} read one at a time. Each alternative reads what its own name reads, the line break the Sass one crosses and the two others do not included, and the run handed back opens at the character in front of the delimiter where the spelling carries one. Narrow of the four an interpolation is spelled in: the `{…}` of the core's `TPL_INTERPOLATION` is not among them, since in a value a pair of bare braces is far likelier to be a pair of characters than an interpolation — the braces of a string, of a comment, or of the block a custom property is allowed to carry — and reading such a pair as one would carry off the code standing between them. */
export const EVERY_INTERPOLATION = /#\{[\s\S]+?\}|@\{.+?\}|\$\(.+?\)/gu

/** The `@{…}` Less interpolates a value with. */
export const LESS_INTERPOLATION = /@\{.+?\}/u

/** The `$(…)` postcss-simple-vars interpolates a value with — a plugin's spelling rather than a syntax's, which the namespaces read beside the two the preprocessors write. */
export const PSV_INTERPOLATION = /\$\(.+?\)/u

/** The `#{…}` Sass interpolates a value with. */
export const SCSS_INTERPOLATION = /#\{.+?\}/su

/** A function called through a Sass module, as `namespace.function-name()` is. */
export const SCSS_MODULE_FUNCTION = /^.+\.[-\w]+\(/u

/** A variable read through a Sass module, as `namespace.$variable` is. */
export const SCSS_MODULE_VARIABLE = /^.+\.\$/u
