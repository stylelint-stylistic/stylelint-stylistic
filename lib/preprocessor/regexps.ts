/** A function called through a Sass module: `namespace.function-name()`. */
export const SCSS_MODULE_FUNCTION = /^.+\.[-\w]+\(/u

/** A variable read through a Sass module: `namespace.$variable`. */
export const SCSS_MODULE_VARIABLE = /^.+\.\$/u
