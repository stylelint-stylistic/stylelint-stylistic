import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`lower`],

	accept: [
		{
			code: `@media not all and (monochrome) { }`,
			description: `a boolean feature name already in lower case`,
		},
		{
			code: `@media (min-width: 700px) { }`,
			description: `a lower-case feature name in a plain query`,
		},
		{
			code: `@media (min-width: 700PX) { }`,
			description: `an upper-case unit in the value, which the rule never looks at`,
		},
		{
			code: `@media (width < 100px) { }`,
			description: `a feature name in a range query`,
		},
		{
			code: `@media (width = 100px) { }`,
			description: `a feature name on the left of an equality operator`,
		},
		{
			code: `@media (width <= 100px) { }`,
			description: `a feature name on the left of a two-character range operator`,
		},
		{
			code: `@media (10px <= width <= 100px) { }`,
			description: `a feature name between the two bounds of a double-ended range`,
		},
		{
			code: `@media (min-width: 700px) and (orientation: landscape) { }`,
			description: `two lower-case feature names in one query`,
		},
		{
			code: `@media (min-width: 700px) /* comments */ and (orientation: landscape) {}`,
			description: `a comment standing between the two features`,
		},
		{
			code: `@media /* comments */ (min-width: 700px) and (orientation: landscape) {}`,
			description: `a comment standing in front of the first feature`,
		},
		{
			code: `@media (min-width: 700px), print and (orientation: landscape) { }`,
			description: `a lower-case feature name in a query list`,
		},
		{
			code: `@media (min-width: 700px), PRINT and (orientation: landscape) { }`,
			description: `an upper-case media type, which is not a feature name`,
		},
		{
			code: `@media (-webkit-min-device-pixel-ratio: 2) { }`,
			description: `a vendor-prefixed feature name in lower case`,
		},
		{
			code: `@not-media (MIN-WIDTH: 700px) { }`,
			description: `an upper-case feature name inside an at-rule that is not @media`,
		},
		{
			code: `@media (--viewport-medium) { }`,
			description: `a custom media query, whose name is the user's to spell`,
		},
		{
			code: `@media (--VIEWPORT-MEDIUM) { }`,
			description: `an upper-case custom media query, left alone for the same reason`,
		},
	],

	reject: [
		{
			code: `@media not all and (MONOCHROME) { }`,
			fixed: `@media not all and (monochrome) { }`,
			description: `an upper-case boolean feature name`,
			message: messages.expected(`MONOCHROME`, `monochrome`),
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 31,
		},
		{
			code: `@media not all and (mOnOcHrOmE) { }`,
			fixed: `@media not all and (monochrome) { }`,
			description: `a boolean feature name in mixed case`,
			message: messages.expected(`mOnOcHrOmE`, `monochrome`),
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 31,
		},
		{
			code: `@media (MIN-WIDTH: 700px) { }`,
			fixed: `@media (min-width: 700px) { }`,
			description: `an upper-case feature name in a plain query`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 18,
		},
		{
			code: `@media (mIn-WiDtH: 700px) { }`,
			fixed: `@media (min-width: 700px) { }`,
			description: `a feature name in mixed case`,
			message: messages.expected(`mIn-WiDtH`, `min-width`),
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 18,
		},
		{
			code: `@media (MIN-WIDTH: 700px) and (orientation: landscape) { }`,
			fixed: `@media (min-width: 700px) and (orientation: landscape) { }`,
			description: `the first of two feature names`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 18,
		},
		{
			code: `@media (min-width: 700px) and (ORIENTATION: landscape) { }`,
			fixed: `@media (min-width: 700px) and (orientation: landscape) { }`,
			description: `the second of two feature names`,
			message: messages.expected(`ORIENTATION`, `orientation`),
			line: 1,
			column: 32,
			endLine: 1,
			endColumn: 43,
		},
		{
			code: `@media (min-width: 700px) /* comments */ and (ORIENTATION: landscape) {}`,
			fixed: `@media (min-width: 700px) /* comments */ and (orientation: landscape) {}`,
			description: `a feature name standing after a comment`,
			message: messages.expected(`ORIENTATION`, `orientation`),
			line: 1,
			column: 47,
			endLine: 1,
			endColumn: 58,
		},
		{
			code: `@media /* comments */ (MIN-WIDTH: 700px) and (orientation: landscape) {}`,
			fixed: `@media /* comments */ (min-width: 700px) and (orientation: landscape) {}`,
			description: `a feature name standing after a leading comment`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 24,
			endLine: 1,
			endColumn: 33,
		},
		{
			code: `@media (-WEBKIT-MIN-DEVICE-PIXEL-RATION: 2) { }`,
			fixed: `@media (-webkit-min-device-pixel-ration: 2) { }`,
			description: `an upper-case vendor-prefixed feature name`,
			message: messages.expected(
				`-WEBKIT-MIN-DEVICE-PIXEL-RATION`,
				`-webkit-min-device-pixel-ration`,
			),
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 40,
		},
		{
			code: `@media (height: 50em) and (orientation: landscape) and (WIDTH: 25em) {}`,
			fixed: `@media (height: 50em) and (orientation: landscape) and (width: 25em) {}`,
			description: `the last of three feature names`,
			message: messages.expected(`WIDTH`, `width`),
			line: 1,
			column: 57,
			endLine: 1,
			endColumn: 62,
		},
		{
			code: `@media (WIDTH > 50em) {}`,
			fixed: `@media (width > 50em) {}`,
			description: `a feature name in a range query`,
			message: messages.expected(`WIDTH`, `width`),
			line: 1,
			column: 9,
			endLine: 1,
			endColumn: 14,
		},
		{
			code: `@media (10em < WIDTH <= 50em) {}`,
			fixed: `@media (10em < width <= 50em) {}`,
			description: `a feature name between the two bounds of a double-ended range`,
			message: messages.expected(`WIDTH`, `width`),
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 21,
		},
		{
			code: `@media (width > 10em) and (WIDTH < 50em) {}`,
			fixed: `@media (width > 10em) and (width < 50em) {}`,
			description: `an upper-case name in the second of two range queries`,
			message: messages.expected(`WIDTH`, `width`),
			line: 1,
			column: 28,
			endLine: 1,
			endColumn: 33,
		},
		{
			code: `@media (10em < WIDTH) {}`,
			fixed: `@media (10em < width) {}`,
			description: `a feature name standing to the right of the range operator`,
			message: messages.expected(`WIDTH`, `width`),
			line: 1,
			column: 16,
			endLine: 1,
			endColumn: 21,
		},
		{
			code: `@media not all and (\\MONOCHROME) {}`,
			fixed: `@media not all and (monochrome) {}`,
			description: `an escaped feature name, whose backslash the fix drops`,
			message: messages.expected(`MONOCHROME`, `monochrome`),
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 32,
		},
		{
			code: `@media not all and (\\@MONOCHROME) {}`,
			fixed: `@media not all and (\\40 monochrome) {}`,
			description: `a feature name escaping an at sign, which the fix rewrites as a hex escape`,
			message: messages.expected(`@MONOCHROME`, `@monochrome`),
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 33,
		},
		{
			code: `@media not all and (\\40MONOCHROME) {}`,
			fixed: `@media not all and (\\40 monochrome) {}`,
			description: `a feature name opening with a hex escape`,
			message: messages.expected(`@MONOCHROME`, `@monochrome`),
			line: 1,
			column: 21,
			endLine: 1,
			endColumn: 34,
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-less`,

	accept: [
		{
			code: `@media (min-width: @tablet) { }`,
			description: `a Less variable as the value`,
		},
		{
			code: `@media (min-width: (@value + 10px)) { }`,
			description: `a Less operation as the value`,
		},
		{
			code: `@media @smartphones and (orientation: landscape) { }`,
			description: `a Less variable standing for the whole first query`,
		},
		{
			code: `@media @smartphones { }`,
			description: `a Less variable standing for the whole query list`,
		},
		{
			code: `@media @smartphones /* comments */ and (orientation: landscape) {}`,
			description: `a Less variable, a comment and a lower-case feature name`,
		},
	],

	reject: [
		{
			code: `@media (MIN-WIDTH: @tablet) { }`,
			fixed: `@media (min-width: @tablet) { }`,
			description: `an upper-case feature name with a Less variable value`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (MIN-WIDTH: (@value + 10px)) { }`,
			fixed: `@media (min-width: (@value + 10px)) { }`,
			description: `an upper-case feature name with a Less operation value`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
		},
		{
			code: `@media @smartphones and (ORIENTATION: landscape) { }`,
			fixed: `@media @smartphones and (orientation: landscape) { }`,
			description: `an upper-case feature name after a Less variable query`,
			message: messages.expected(`ORIENTATION`, `orientation`),
			line: 1,
			column: 26,
		},
		{
			code: `@media @smartphones /* comments */ and (ORIENTATION: landscape) {}`,
			fixed: `@media @smartphones /* comments */ and (orientation: landscape) {}`,
			description: `an upper-case feature name after a Less variable query and a comment`,
			message: messages.expected(`ORIENTATION`, `orientation`),
			line: 1,
			column: 41,
		},
	],
})

testRule({
	ruleName,
	config: [`lower`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `@media not all and ($monochrome) { }`,
			description: `an SCSS variable standing for the whole feature`,
		},
		{
			code: `@media not all and ($MONOCHROME) { }`,
			description: `an upper-case SCSS variable, whose name is not a feature name`,
		},
		{
			code: `@media not all and (#{$monochrome}) { }`,
			description: `an interpolation standing for the whole feature`,
		},
		{
			code: `@media not all and (#{$MONOCHROME}) { }`,
			description: `an upper-case interpolation, whose contents the rule cannot read`,
		},
		{
			code: `@media not all /* comments */ and (#{$MONOCHROME}) { }`,
			description: `an interpolated feature standing after a comment`,
		},
		{
			code: `@media (min-width: $var) { }`,
			description: `an SCSS variable as the value`,
		},
		{
			code: `@media (min-width: $var + 10px) { }`,
			description: `an SCSS sum as the value`,
		},
		{
			code: `@media (min-width: ($var + 10px)) { }`,
			description: `a parenthesised SCSS sum as the value`,
		},
		{
			code: `@media ($feature-name: $value) { }`,
			description: `an SCSS variable in place of the feature name`,
		},
		{
			code: `@media ($FEATURE-NAME: $value) { }`,
			description: `an upper-case SCSS variable in place of the feature name`,
		},
		{
			code: `@media (#{$feature-name}: $value) { }`,
			description: `an interpolation in place of the feature name`,
		},
		{
			code: `@media (#{$FEATURE-NAME}: $value) { }`,
			description: `an upper-case interpolation in place of the feature name`,
		},
		{
			code: `@media ('min-' + $width: $value) { }`,
			description: `a feature name built by concatenating a string and a variable`,
		},
		{
			code: `@media ('MIN-' + $WIDTH: $value) { }`,
			description: `the same concatenation written in upper case`,
		},
		{
			code: `@media ($value + 'width': $value) { }`,
			description: `a feature name built by concatenating a variable and a string`,
		},
		{
			code: `@media ($VALUE + 'WIDTH': $value) { }`,
			description: `the same concatenation written in upper case`,
		},
		{
			code: `@media (#{$width}: $value) { }`,
			description: `a feature name that is an interpolation alone`,
		},
		{
			code: `@media (#{$WIDTH}: $value) { }`,
			description: `an upper-case feature name that is an interpolation alone`,
		},
		{
			code: `@media #{$feature-name} { }`,
			description: `an interpolation standing for the whole params`,
		},
	],

	reject: [
		{
			code: `@media (MIN-WIDTH: $var) { }`,
			fixed: `@media (min-width: $var) { }`,
			description: `an upper-case feature name with an SCSS variable value`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (MIN-WIDTH: $var + 10px) { }`,
			fixed: `@media (min-width: $var + 10px) { }`,
			description: `an upper-case feature name with an SCSS sum value`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (MIN-WIDTH: ($var + 10px)) { }`,
			fixed: `@media (min-width: ($var + 10px)) { }`,
			description: `an upper-case feature name with a parenthesised SCSS sum value`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (MIN-WIDTH: ($var + 10px)) and /* comments */ (#{$MONOCHROME}) { }`,
			fixed: `@media (min-width: ($var + 10px)) and /* comments */ (#{$MONOCHROME}) { }`,
			description: `an upper-case feature name in a query whose second feature is an interpolation behind a comment`,
			message: messages.expected(`MIN-WIDTH`, `min-width`),
			line: 1,
			column: 9,
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],

	accept: [
		{
			code: `@media not all and (MONOCHROME) { }`,
			description: `a boolean feature name already in upper case`,
		},
		{
			code: `@media (MIN-WIDTH: 700px) { }`,
			description: `an upper-case feature name in a plain query`,
		},
		{
			code: `@media (MIN-WIDTH: 700PX) { }`,
			description: `an upper-case unit in the value, which the rule never looks at`,
		},
		{
			code: `@media (MIN-WIDTH: 700px) and (ORIENTATION: landscape) { }`,
			description: `two upper-case feature names in one query`,
		},
		{
			code: `@media (MIN-WIDTH: 700px), print and (ORIENTATION: landscape) { }`,
			description: `a lower-case media type, which is not a feature name`,
		},
		{
			code: `@media (MIN-WIDTH: 700px), PRINT and (ORIENTATION: landscape) { }`,
			description: `an upper-case media type, which is not a feature name either`,
		},
		{
			code: `@media (MIN-WIDTH: 700px), PRINT and /* comments */ (ORIENTATION: landscape) { }`,
			description: `a comment standing in front of the second feature`,
		},
		{
			code: `@media (MIN-WIDTH: 700px), /* comments */ PRINT and (ORIENTATION: landscape) { }`,
			description: `a comment standing in front of the media type`,
		},
		{
			code: `@media (-WEBKIT-MIN-DEVICE-PIXEL-RATION: 2) { }`,
			description: `a vendor-prefixed feature name in upper case`,
		},
		{
			code: `@not-media (min-width: 700px) { }`,
			description: `a lower-case feature name inside an at-rule that is not @media`,
		},
		{
			code: `@media (--viewport-medium) { }`,
			description: `a custom media query, whose name is the user's to spell`,
		},
		{
			code: `@media (--VIEWPORT-MEDIUM) { }`,
			description: `an upper-case custom media query, left alone for the same reason`,
		},
	],

	reject: [
		{
			code: `@media not all and (monochrome) { }`,
			fixed: `@media not all and (MONOCHROME) { }`,
			description: `a lower-case boolean feature name`,
			message: messages.expected(`monochrome`, `MONOCHROME`),
			line: 1,
			column: 21,
		},
		{
			code: `@media not all and (mOnOcHrOmE) { }`,
			fixed: `@media not all and (MONOCHROME) { }`,
			description: `a boolean feature name in mixed case`,
			message: messages.expected(`mOnOcHrOmE`, `MONOCHROME`),
			line: 1,
			column: 21,
		},
		{
			code: `@media (min-width: 700px) { }`,
			fixed: `@media (MIN-WIDTH: 700px) { }`,
			description: `a lower-case feature name in a plain query`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (mIn-WiDtH: 700px) { }`,
			fixed: `@media (MIN-WIDTH: 700px) { }`,
			description: `a feature name in mixed case`,
			message: messages.expected(`mIn-WiDtH`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (min-width: 700px) and (ORIENTATION: landscape) { }`,
			fixed: `@media (MIN-WIDTH: 700px) and (ORIENTATION: landscape) { }`,
			description: `the first of two feature names, the second already upper-case`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (min-width: 700px), PRINT and /* comments */ (ORIENTATION: landscape) { }`,
			fixed: `@media (MIN-WIDTH: 700px), PRINT and /* comments */ (ORIENTATION: landscape) { }`,
			description: `a lower-case feature name standing after a comma`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (MIN-WIDTH: 700px), /* comments */ PRINT and (orientation: landscape) { }`,
			fixed: `@media (MIN-WIDTH: 700px), /* comments */ PRINT and (ORIENTATION: landscape) { }`,
			description: `a lower-case feature name standing after a comment`,
			message: messages.expected(`orientation`, `ORIENTATION`),
			line: 1,
			column: 54,
		},
		{
			code: `@media (MIN-WIDTH: 700px) and (orientation: landscape) { }`,
			fixed: `@media (MIN-WIDTH: 700px) and (ORIENTATION: landscape) { }`,
			description: `the second of two feature names`,
			message: messages.expected(`orientation`, `ORIENTATION`),
			line: 1,
			column: 32,
		},
		{
			code: `@media (-webkit-min-device-pixel-ration: 2) { }`,
			fixed: `@media (-WEBKIT-MIN-DEVICE-PIXEL-RATION: 2) { }`,
			description: `a lower-case vendor-prefixed feature name`,
			message: messages.expected(
				`-webkit-min-device-pixel-ration`,
				`-WEBKIT-MIN-DEVICE-PIXEL-RATION`,
			),
			line: 1,
			column: 9,
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-less`,

	accept: [
		{
			code: `@media (MIN-WIDTH: @tablet) { }`,
			description: `an upper-case feature name with a Less variable value`,
		},
		{
			code: `@media (MIN-WIDTH: (@value + 10px)) { }`,
			description: `an upper-case feature name with a Less operation value`,
		},
		{
			code: `@media @smartphones and (ORIENTATION: landscape) { }`,
			description: `an upper-case feature name after a Less variable query`,
		},
		{
			code: `@media @smartphones /* comments */ and (ORIENTATION: landscape) { }`,
			description: `an upper-case feature name after a Less variable query and a comment`,
		},
		{
			code: `@media @smartphones { }`,
			description: `a Less variable standing for the whole query list`,
		},
	],

	reject: [
		{
			code: `@media (min-width: @tablet) { }`,
			fixed: `@media (MIN-WIDTH: @tablet) { }`,
			description: `a lower-case feature name with a Less variable value`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (min-width: (@value + 10px)) { }`,
			fixed: `@media (MIN-WIDTH: (@value + 10px)) { }`,
			description: `a lower-case feature name with a Less operation value`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media @smartphones and (orientation: landscape) { }`,
			fixed: `@media @smartphones and (ORIENTATION: landscape) { }`,
			description: `a lower-case feature name after a Less variable query`,
			message: messages.expected(`orientation`, `ORIENTATION`),
			line: 1,
			column: 26,
		},
		{
			code: `@media @smartphones /* comments */ and (orientation: landscape) { }`,
			fixed: `@media @smartphones /* comments */ and (ORIENTATION: landscape) { }`,
			description: `a lower-case feature name after a Less variable query and a comment`,
			message: messages.expected(`orientation`, `ORIENTATION`),
			line: 1,
			column: 41,
		},
		{
			code: `@media @@smartphones /* comments */ and (orientation: landscape) { }`,
			fixed: `@media @@smartphones /* comments */ and (ORIENTATION: landscape) { }`,
			description: `a lower-case feature name after a Less variable variable`,
			message: messages.expected(`orientation`, `ORIENTATION`),
			line: 1,
			column: 42,
			endLine: 1,
			endColumn: 53,
		},
	],
})

testRule({
	ruleName,
	config: [`upper`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `@media not all and ($monochrome) { }`,
			description: `an SCSS variable standing for the whole feature`,
		},
		{
			code: `@media not all and ($MONOCHROME) { }`,
			description: `an upper-case SCSS variable, whose name is not a feature name`,
		},
		{
			code: `@media not all and (#{$monochrome}) { }`,
			description: `an interpolation standing for the whole feature`,
		},
		{
			code: `@media not all and (#{$MONOCHROME}) { }`,
			description: `an upper-case interpolation, whose contents the rule cannot read`,
		},
		{
			code: `@media not all and /* comments */ (#{$MONOCHROME}) { }`,
			description: `an interpolated feature standing after a comment`,
		},
		{
			code: `@media (MIN-WIDTH: $var) { }`,
			description: `an upper-case feature name with an SCSS variable value`,
		},
		{
			code: `@media (MIN-WIDTH: $var + 10px) { }`,
			description: `an upper-case feature name with an SCSS sum value`,
		},
		{
			code: `@media (MIN-WIDTH: ($var + 10px)) { }`,
			description: `an upper-case feature name with a parenthesised SCSS sum value`,
		},
		{
			code: `@media ($feature-name: $value) { }`,
			description: `an SCSS variable in place of the feature name`,
		},
		{
			code: `@media ($FEATURE-NAME: $value) { }`,
			description: `an upper-case SCSS variable in place of the feature name`,
		},
		{
			code: `@media (#{$feature-name}: $value) { }`,
			description: `an interpolation in place of the feature name`,
		},
		{
			code: `@media (#{$FEATURE-NAME}: $value) { }`,
			description: `an upper-case interpolation in place of the feature name`,
		},
		{
			code: `@media ('min-' + $width: $value) { }`,
			description: `a feature name built by concatenating a string and a variable`,
		},
		{
			code: `@media ('MIN-' + $WIDTH: $value) { }`,
			description: `the same concatenation written in upper case`,
		},
		{
			code: `@media ($value + 'width': $value) { }`,
			description: `a feature name built by concatenating a variable and a string`,
		},
		{
			code: `@media ($VALUE + 'WIDTH': $value) { }`,
			description: `the same concatenation written in upper case`,
		},
		{
			code: `@media (#{$width}: $value) { }`,
			description: `a feature name that is an interpolation alone`,
		},
		{
			code: `@media (#{$WIDTH}: $value) { }`,
			description: `an upper-case feature name that is an interpolation alone`,
		},
		{
			code: `@media #{$feature-name} { }`,
			description: `an interpolation standing for the whole params`,
		},
	],

	reject: [
		{
			code: `@media (min-width: $var) { }`,
			fixed: `@media (MIN-WIDTH: $var) { }`,
			description: `a lower-case feature name with an SCSS variable value`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (min-width: $var + 10px) { }`,
			fixed: `@media (MIN-WIDTH: $var + 10px) { }`,
			description: `a lower-case feature name with an SCSS sum value`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (min-width: ($var + 10px)) { }`,
			fixed: `@media (MIN-WIDTH: ($var + 10px)) { }`,
			description: `a lower-case feature name with a parenthesised SCSS sum value`,
			message: messages.expected(`min-width`, `MIN-WIDTH`),
			line: 1,
			column: 9,
		},
		{
			code: `@media (MIN-WIDTH: ($var + 10px)) and /* comments */ (orientation: landscape){ }`,
			fixed: `@media (MIN-WIDTH: ($var + 10px)) and /* comments */ (ORIENTATION: landscape){ }`,
			description: `a lower-case feature name standing behind a comment, the first name already upper-case`,
			message: messages.expected(`orientation`, `ORIENTATION`),
			line: 1,
			column: 55,
		},
	],
})
