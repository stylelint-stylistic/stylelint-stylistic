import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			code: `input:not( [type='submit'] ) { }`,
		},
		{
			code: `input:not( [type='submit'], [type='text'] ) { }`,
		},
		{
			code: `input:not(  [type='submit'], [type='text']  ) { }`,
		},
		{
			code: `p:lang( it ) { }`,
		},
		{
			code: `section:not( :has( h1, h2 ) ) { }`,
		},
		{
			code: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
		},
		{
			code: `a:hover:not( .active ) { }`,
		},
		{
			code: `:root { --foo: 1px; }`,
			description: `custom property in root`,
		},
		{
			code: `html { --foo: 1px; }`,
			description: `custom property in selector`,
		},
		{
			code: `:root { --custom-property-set: {} }`,
			description: `custom property set in root`,
		},
		{
			code: `html { --custom-property-set: {} }`,
			description: `custom property set in selector`,
		},
		{
			code: `a[b=#{c}] { }`,
			description: `ignore "invalid" selector (see #3130)`,
		},
		{
			code: `a:not() { }`,
			description: `an argument with no node in it, which has no inside to space out`,
		},
		{
			code: `a:not( ) { }`,
			description: `the same, written with the space this option asks for, which the parser keeps nowhere`,
		},
		{
			code: `a:is() { }`,
			description: `the same, on another pseudo-class`,
		},
		{
			code: `a:nth-child() { }`,
			description: `the same, on a pseudo-class taking no selector at all`,
		},
		{
			code: `a:not( ,b ) { }`,
			description: `whitespace standing at an empty argument, which the parser hands to the node behind the comma`,
		},
		{
			code: `a:not( ,b) { }`,
			description: `the same, the other end asking for a space this rule may no longer write`,
		},
		{
			code: `a:not(b, ) { }`,
			description: `whitespace standing at an empty argument closing the list, which the parser keeps nowhere`,
		},
		{
			code: `a:not(b, ):is(c) { }`,
			description: `a pseudo-class the rule could fix beside a selector the parser does not give back as it took it`,
		},
		{
			code: `a::part() { }`,
			description: `an empty argument of a pseudo-element, which this rule walks alongside the pseudo-classes`,
		},
		{
			code: `a:not( /**/ ) { }`,
			description: `an argument holding nothing but a comment, spaced out as this option asks`,
		},
		{
			code: `a:not( /**/ /**/ ) { }`,
			description: `the same, with two comments and nothing else`,
		},
		{
			code: `a:not( /*c*/ ):is( b ) { }`,
			description: `a pseudo-class standing behind such an argument, both of them spaced out already`,
		},
		{
			code: `a:not(b, ,c) { }`,
			description: `an empty argument standing between two others, whose whitespace the parser hands to the node behind the comma`,
		},
		{
			code: `a:not(/*c*/ ,,d), e:not(f) { }`,
			description: `a comment the parser moves, in a pseudo-class an argument of which is missing, which passes the list over whatever moved the text`,
		},
	],

	reject: [
		{
			code: `input:not([type='submit'] ) { }`,
			fixed: `input:not( [type='submit'] ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 11,
		},
		{
			code: `input:not( [type='submit']) { }`,
			fixed: `input:not( [type='submit'] ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 26,
		},
		{
			code: `input:not([type='submit'], [type='text'] ) { }`,
			fixed: `input:not( [type='submit'], [type='text'] ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 11,
		},
		{
			code: `input:not( [type='submit'], [type='text']) { }`,
			fixed: `input:not( [type='submit'], [type='text'] ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 41,
		},
		{
			code: `input:not(  [type='submit']) { }`,
			fixed: `input:not(  [type='submit'] ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 27,
		},
		{
			code: `section:not(:has( h1, h2 ) ) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 13,
		},
		{
			code: `section:not( :has( h1, h2 )) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 27,
		},
		{
			code: `section:not( :has(h1, h2 ) ) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 19,
		},
		{
			code: `:matches( a, ul, :has(h1, h2 ) ) { }`,
			fixed: `:matches( a, ul, :has( h1, h2 ) ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 23,
		},
		{
			code: `section:not( :has( h1, h2) ) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `section:not(:has(h1, h2)) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 24,
				},
				{
					message: messages.expectedOpening,
					line: 1,
					column: 18,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 23,
				},
			],
		},
		{
			code: `input:not([type='radio'] ):not( [type='checkbox'] ) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 11,
		},
		{
			code: `input:not( [type='radio']):not( [type='checkbox'] ) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `input:not( [type='radio'] ):not([type='checkbox'] ) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 33,
		},
		{
			code: `input:not( [type='radio'] ):not( [type='checkbox']) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 50,
		},
		{
			code: `a:hover:not(.active ) { }`,
			fixed: `a:hover:not( .active ) { }`,
			message: messages.expectedOpening,
			line: 1,
			column: 13,
		},
		{
			code: `a:hover:not( .active) { }`,
			fixed: `a:hover:not( .active ) { }`,
			message: messages.expectedClosing,
			line: 1,
			column: 20,
		},
		{
			code: `a:not(b /**/) { }`,
			fixed: `a:not( b /**/ ) { }`,
			description: `a comment before the closing parenthesis`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 12,
				},
			],
		},
		{
			code: `section:not(/**/:has(/**/h1, h2/**/)/**/) { }`,
			fixed: `section:not( /**/:has( /**/h1, h2/**/ )/**/ ) { }`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 13,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 40,
				},
				{
					message: messages.expectedOpening,
					line: 1,
					column: 22,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 35,
				},
			],
		},
		{
			code: `a:not(,b) { }`,
			fixed: `a:not(,b ) { }`,
			description: `an empty argument opening the list, the end that has a node still being spaced out`,
			message: messages.expectedClosing,
			line: 1,
			column: 8,
		},
		{
			code: `a:not(b,) { }`,
			fixed: `a:not( b,) { }`,
			description: `an empty argument closing the list, the end that has a node still being spaced out`,
			message: messages.expectedOpening,
			line: 1,
			column: 7,
		},
		{
			code: `a:not(), b:not(c) { }`,
			fixed: `a:not(), b:not( c ) { }`,
			description: `an empty argument in one selector of a list, the other still being fixed`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 16,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 16,
				},
			],
		},
		{
			code: `a:not(/**/) { }`,
			fixed: `a:not( /**/ ) { }`,
			description: `an argument holding nothing but a comment, which the fix spaces out once and for all`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 10,
				},
			],
		},
		{
			code: `a:not(b, /**/) { }`,
			fixed: `a:not( b, /**/ ) { }`,
			description: `a comment closing the last argument of several`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not(b, /*c*/ , c) { }`,
			fixed: `a:not( b, /*c*/ , c ) { }`,
			description: `a comment closing an argument that is not the last, whose whitespace the fix leaves where it is`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 18,
				},
			],
		},
		{
			code: `a:not(/*c*/,) { }`,
			fixed: `a:not( /*c*/,) { }`,
			description: `a comment the parser does give back, beside an argument that is missing, which leaves the rule reading as usual`,
			message: messages.expectedOpening,
			line: 1,
			column: 7,
		},
		{
			code: `a:not(b):not() { }`,
			fixed: `a:not( b ):not() { }`,
			description: `an empty argument beside a pseudo-class of the same selector, which is still fixed`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 7,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`never`],

	accept: [
		{
			code: `input:not([type='submit']) { }`,
		},
		{
			code: `input:not([type='submit'], [type='text']) { }`,
		},
		{
			code: `input:not([type='submit'], [type='text']) { }`,
		},
		{
			code: `p:lang(it) { }`,
		},
		{
			code: `section:not(:has(h1, h2)) { }`,
		},
		{
			code: `input:not([type='radio']):not([type='checkbox']) { }`,
		},
		{
			code: `a:hover:not(.active) { }`,
		},
		{
			code: `:matches(a, ul, :has(h1, h2)) { }`,
		},
		{
			code: `.foo {
	&:has(
		h1,
		h2
	) {
		gap: 0;
	}
}`,
		},
		{
			code: `.foo {
    &:has(
        h1,
        h2
    ) {
        gap: 0;
    }
}`,
		},
		{
			code: `a:not() { }`,
			description: `an argument with no node in it, which has no inside to space out`,
		},
		{
			code: `a:not( ) { }`,
			description: `the same, written with a space the parser keeps nowhere`,
		},
		{
			code: `a:not(,b) { }`,
			description: `an empty argument opening the list, the whitespace at either end already as this option asks`,
		},
		{
			code: `a:not(b,) { }`,
			description: `an empty argument closing the list, the whitespace at either end already as this option asks`,
		},
		{
			code: `a:not( ,b ) { }`,
			description: `whitespace standing at an empty argument, which the parser hands to the node behind the comma`,
		},
		{
			code: `a:not( b, ) { }`,
			description: `whitespace standing at an empty argument closing the list, which the parser keeps nowhere`,
		},
		{
			code: `a:not(/**/) { }`,
			description: `an argument holding nothing but a comment, with no whitespace to take away`,
		},
		{
			code: `a:not(b, /*c*/ , c) { }`,
			description: `a comment closing an argument that is not the last, whose whitespace the parser drops`,
		},
		{
			code: `a:not( /*c*/ ) , , b { }`,
			description: `whitespace standing at a selector of the list that holds nothing, which nothing in the parsed selector can hold`,
		},
		{
			code: `a:not( ) , b:not( c ) { }`,
			description: `whitespace standing at an empty argument, which passes over every selector of the list, this one written back with them all`,
		},
		{
			code: `a:not(b, ,c) { }`,
			description: `an empty argument standing between two others, whose whitespace the parser hands to the node behind the comma`,
		},
	],

	reject: [
		{
			code: `input:not([type='submit'] ) { }`,
			fixed: `input:not([type='submit']) { }`,
			message: messages.rejectedClosing,
			line: 1,
			column: 26,
		},
		{
			code: `a:not(), b:is( /*c*/ ) { }`,
			fixed: `a:not(), b:is(/*c*/) { }`,
			description: `an empty argument holding no whitespace, which leaves the rest of the list to be read as usual`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 15,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 21,
				},
			],
		},
		{
			code: `a:not( /**/ ) { }`,
			fixed: `a:not(/**/) { }`,
			description: `an argument holding nothing but a comment, whose whitespace the parser drops`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 12,
				},
			],
		},
		{
			code: `a:not( /**/ /**/ ) { }`,
			fixed: `a:not(/**/ /**/) { }`,
			description: `the same, with two comments and nothing else`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 17,
				},
			],
		},
		{
			code: `a:not( /*c*/ ):is(b) { }`,
			fixed: `a:not(/*c*/):is(b) { }`,
			description: `a pseudo-class standing behind such an argument, which the fix leaves compounded to it`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not( /*c*/ ).foo { }`,
			fixed: `a:not(/*c*/).foo { }`,
			description: `a class standing behind such an argument, which the fix leaves compounded to it`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not( /*c*/ )>b { }`,
			fixed: `a:not(/*c*/)>b { }`,
			description: `a combinator standing behind such an argument, which the fix leaves where the author put it`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not( /*c*/ ) /*d*/ b { }`,
			fixed: `a:not(/*c*/) /*d*/ b { }`,
			description: `the same, the comment standing clear of the selector behind it`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not( :is( /*c*/ ) ):is(x) { }`,
			fixed: `a:not(:is(/*c*/)):is(x) { }`,
			description: `such an argument nested a pseudo-class deeper, the whitespace reaching out of both sets of parentheses`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 20,
				},
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 12,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 18,
				},
			],
		},
		{
			code: `a:not( /*c*/ ) /*d*/b { }`,
			fixed: `a:not(/*c*/) /*d*/b { }`,
			description: `a descendant combinator carrying a comment of its own behind such an argument`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not( /*c*/ ) *|b { }`,
			fixed: `a:not(/*c*/) *|b { }`,
			description: `a namespaced selector behind such an argument, whose own index stands at the name rather than at the namespace`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not( /*c*/ ),,b { }`,
			fixed: `a:not(/*c*/),,b { }`,
			description: `a selector of the list holding nothing standing between the two that do`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
		{
			code: `a:not( /*c*/ ),b:not( q ) { }`,
			fixed: `a:not(/*c*/),b:not(q) { }`,
			description: `a selector of the list opening right behind such an argument, which is where the parser hands the whitespace when nothing else follows`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 13,
				},
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 22,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 24,
				},
			],
		},
		{
			code: `input:not( [type='submit']) { }`,
			fixed: `input:not([type='submit']) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 11,
		},
		{
			code: `input:not([type='submit'], [type='text'] ) { }`,
			fixed: `input:not([type='submit'], [type='text']) { }`,
			message: messages.rejectedClosing,
			line: 1,
			column: 41,
		},
		{
			code: `input:not( [type='submit'], [type='text']) { }`,
			fixed: `input:not([type='submit'], [type='text']) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 11,
		},
		{
			code: `input:not(  [type='submit']) { }`,
			fixed: `input:not([type='submit']) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 11,
		},
		{
			code: `section:not( :has(h1, h2)) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 13,
		},
		{
			code: `section:not(:has( h1, h2)) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 18,
		},
		{
			code: `section:not(:has(h1, h2) ) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			message: messages.rejectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `section:not(:has(h1, h2 )) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			message: messages.rejectedClosing,
			line: 1,
			column: 24,
		},
		{
			code: `section:not( :has( h1, h2 ) ) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 13,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 28,
				},
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 19,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 26,
				},
			],
		},
		{
			code: `input:not( [type='radio']):not([type='checkbox']) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 11,
		},
		{
			code: `input:not([type='radio'] ):not([type='checkbox']) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			message: messages.rejectedClosing,
			line: 1,
			column: 25,
		},
		{
			code: `input:not([type='radio']):not( [type='checkbox']) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 31,
		},
		{
			code: `input:not([type='radio']):not([type='checkbox'] ) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			message: messages.rejectedClosing,
			line: 1,
			column: 48,
		},
		{
			code: `a:hover:not( .active) { }`,
			fixed: `a:hover:not(.active) { }`,
			message: messages.rejectedOpening,
			line: 1,
			column: 13,
		},
		{
			code: `a:hover:not(.active ) { }`,
			fixed: `a:hover:not(.active) { }`,
			message: messages.rejectedClosing,
			line: 1,
			column: 20,
		},
		{
			code: `a:not( b /**/ ) { }`,
			fixed: `a:not(b /**/) { }`,
			description: `a comment before the closing parenthesis`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 14,
				},
			],
		},
		{
			code: `section:not( /**/ :has( /**/ h1, h2 /**/ ) /**/ ) { }`,
			fixed: `section:not(/**/ :has(/**/ h1, h2 /**/) /**/) { }`,
			warnings: [
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 13,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 48,
				},
				{
					message: messages.rejectedOpening,
					line: 1,
					column: 24,
				},
				{
					message: messages.rejectedClosing,
					line: 1,
					column: 41,
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: [`always`],
	customSyntax: `postcss-scss`,

	accept: [
		{
			code: `a:not(\n\t// c\n) { }`,
			description: `a selector carrying an inline comment, which this syntax spells one way and prints another (see #163)`,
		},
	],

	reject: [
		{
			code: `a:not(/* c */) { }`,
			fixed: `a:not( /* c */ ) { }`,
			description: `a block comment under this syntax is read as it is under any other`,
			warnings: [
				{
					message: messages.expectedOpening,
					line: 1,
					column: 7,
				},
				{
					message: messages.expectedClosing,
					line: 1,
					column: 13,
				},
			],
		},
	],
})
