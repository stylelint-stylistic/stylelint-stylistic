/** A function called through a Sass module, as `namespace.function-name()` is. */
export const SCSS_MODULE_FUNCTION = /^.+\.[-\w]+\(/u

/** A variable read through a Sass module, as `namespace.$variable` is. */
export const SCSS_MODULE_VARIABLE = /^.+\.\$/u
