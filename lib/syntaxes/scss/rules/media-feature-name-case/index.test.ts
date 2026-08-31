import { createRule } from "../../../../rules/media-feature-name-case/index.ts"
import { scss } from "../../index.ts"

let { ruleName, messages } = createRule(scss)

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS variable standing for the whole feature`,
			code: `@media not all and ($monochrome) { }`,
		},
		{
			description: `an upper-case SCSS variable, whose name is not a feature name`,
			code: `@media not all and ($MONOCHROME) { }`,
		},
		{
			description: `an interpolation standing for the whole feature`,
			code: `@media not all and (#{$monochrome}) { }`,
		},
		{
			description: `an upper-case interpolation, whose contents the rule cannot read`,
			code: `@media not all and (#{$MONOCHROME}) { }`,
		},
		{
			description: `an interpolated feature standing after a comment`,
			code: `@media not all /* comments */ and (#{$MONOCHROME}) { }`,
		},
		{
			description: `an SCSS variable as the value`,
			code: `@media (min-width: $var) { }`,
		},
		{
			description: `an SCSS sum as the value`,
			code: `@media (min-width: $var + 10px) { }`,
		},
		{
			description: `a parenthesised SCSS sum as the value`,
			code: `@media (min-width: ($var + 10px)) { }`,
		},
		{
			description: `an SCSS variable in place of the feature name`,
			code: `@media ($feature-name: $value) { }`,
		},
		{
			description: `an upper-case SCSS variable in place of the feature name`,
			code: `@media ($FEATURE-NAME: $value) { }`,
		},
		{
			description: `an interpolation in place of the feature name`,
			code: `@media (#{$feature-name}: $value) { }`,
		},
		{
			description: `an upper-case interpolation in place of the feature name`,
			code: `@media (#{$FEATURE-NAME}: $value) { }`,
		},
		{
			description: `a feature name built by concatenating a string and a variable`,
			code: `@media ('min-' + $width: $value) { }`,
		},
		{
			description: `the same concatenation written in upper case`,
			code: `@media ('MIN-' + $WIDTH: $value) { }`,
		},
		{
			description: `a feature name built by concatenating a variable and a string`,
			code: `@media ($value + 'width': $value) { }`,
		},
		{
			description: `the same concatenation written in upper case`,
			code: `@media ($VALUE + 'WIDTH': $value) { }`,
		},
		{
			description: `a feature name that is an interpolation alone`,
			code: `@media (#{$width}: $value) { }`,
		},
		{
			description: `an upper-case feature name that is an interpolation alone`,
			code: `@media (#{$WIDTH}: $value) { }`,
		},
		{
			description: `an interpolation standing for the whole params`,
			code: `@media #{$feature-name} { }`,
		},
	],

	reject: [
		{
			description: `an upper-case feature name with an SCSS variable value`,
			code: `@media (MIN-WIDTH: $var) { }`,
			fixed: `@media (min-width: $var) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
		},
		{
			description: `an upper-case feature name with an SCSS sum value`,
			code: `@media (MIN-WIDTH: $var + 10px) { }`,
			fixed: `@media (min-width: $var + 10px) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
		},
		{
			description: `an upper-case feature name with a parenthesised SCSS sum value`,
			code: `@media (MIN-WIDTH: ($var + 10px)) { }`,
			fixed: `@media (min-width: ($var + 10px)) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
		},
		{
			description: `an upper-case feature name in a query whose second feature is an interpolation behind a comment`,
			code: `@media (MIN-WIDTH: ($var + 10px)) and /* comments */ (#{$MONOCHROME}) { }`,
			fixed: `@media (min-width: ($var + 10px)) and /* comments */ (#{$MONOCHROME}) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
		},
	],
})
testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			description: `an SCSS variable standing for the whole feature`,
			code: `@media not all and ($monochrome) { }`,
		},
		{
			description: `an upper-case SCSS variable, whose name is not a feature name`,
			code: `@media not all and ($MONOCHROME) { }`,
		},
		{
			description: `an interpolation standing for the whole feature`,
			code: `@media not all and (#{$monochrome}) { }`,
		},
		{
			description: `an upper-case interpolation, whose contents the rule cannot read`,
			code: `@media not all and (#{$MONOCHROME}) { }`,
		},
		{
			description: `an interpolated feature standing after a comment`,
			code: `@media not all and /* comments */ (#{$MONOCHROME}) { }`,
		},
		{
			description: `an upper-case feature name with an SCSS variable value`,
			code: `@media (MIN-WIDTH: $var) { }`,
		},
		{
			description: `an upper-case feature name with an SCSS sum value`,
			code: `@media (MIN-WIDTH: $var + 10px) { }`,
		},
		{
			description: `an upper-case feature name with a parenthesised SCSS sum value`,
			code: `@media (MIN-WIDTH: ($var + 10px)) { }`,
		},
		{
			description: `an SCSS variable in place of the feature name`,
			code: `@media ($feature-name: $value) { }`,
		},
		{
			description: `an upper-case SCSS variable in place of the feature name`,
			code: `@media ($FEATURE-NAME: $value) { }`,
		},
		{
			description: `an interpolation in place of the feature name`,
			code: `@media (#{$feature-name}: $value) { }`,
		},
		{
			description: `an upper-case interpolation in place of the feature name`,
			code: `@media (#{$FEATURE-NAME}: $value) { }`,
		},
		{
			description: `a feature name built by concatenating a string and a variable`,
			code: `@media ('min-' + $width: $value) { }`,
		},
		{
			description: `the same concatenation written in upper case`,
			code: `@media ('MIN-' + $WIDTH: $value) { }`,
		},
		{
			description: `a feature name built by concatenating a variable and a string`,
			code: `@media ($value + 'width': $value) { }`,
		},
		{
			description: `the same concatenation written in upper case`,
			code: `@media ($VALUE + 'WIDTH': $value) { }`,
		},
		{
			description: `a feature name that is an interpolation alone`,
			code: `@media (#{$width}: $value) { }`,
		},
		{
			description: `an upper-case feature name that is an interpolation alone`,
			code: `@media (#{$WIDTH}: $value) { }`,
		},
		{
			description: `an interpolation standing for the whole params`,
			code: `@media #{$feature-name} { }`,
		},
	],

	reject: [
		{
			description: `a lower-case feature name with an SCSS variable value`,
			code: `@media (min-width: $var) { }`,
			fixed: `@media (MIN-WIDTH: $var) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
		},
		{
			description: `a lower-case feature name with an SCSS sum value`,
			code: `@media (min-width: $var + 10px) { }`,
			fixed: `@media (MIN-WIDTH: $var + 10px) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
		},
		{
			description: `a lower-case feature name with a parenthesised SCSS sum value`,
			code: `@media (min-width: ($var + 10px)) { }`,
			fixed: `@media (MIN-WIDTH: ($var + 10px)) { }`,
			line: 1,
			column: 9,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
		},
		{
			description: `a lower-case feature name standing behind a comment, the first name already upper-case`,
			code: `@media (MIN-WIDTH: ($var + 10px)) and /* comments */ (orientation: landscape){ }`,
			fixed: `@media (MIN-WIDTH: ($var + 10px)) and /* comments */ (ORIENTATION: landscape){ }`,
			line: 1,
			column: 55,
			message: messages.expected(`orientation`, `ORIENTATION`),
		},
	],
})
