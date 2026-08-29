import { messages, ruleName } from "./index.ts"

let testRule = createTestRule({ ruleName })

testRule({
	ruleName,
	config: [`always`],

	accept: [
		{
			description: `a space inside each parenthesis of a negation`,
			code: `input:not( [type='submit'] ) { }`,
		},
		{
			description: `the same negation taking two arguments`,
			code: `input:not( [type='submit'], [type='text'] ) { }`,
		},
		{
			description: `two spaces inside each parenthesis, which the option counts as spaced out all the same`,
			code: `input:not(  [type='submit'], [type='text']  ) { }`,
		},
		{
			description: `a space inside each parenthesis of a language pseudo-class`,
			code: `p:lang( it ) { }`,
		},
		{
			description: `nested pseudo-classes, each of them spaced out`,
			code: `section:not( :has( h1, h2 ) ) { }`,
		},
		{
			description: `two negations, each of them spaced out`,
			code: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
		},
		{
			description: `a negation standing behind another pseudo-class`,
			code: `a:hover:not( .active ) { }`,
		},
		{
			description: `a custom property under the root selector`,
			code: `:root { --foo: 1px; }`,
		},
		{
			description: `a custom property under a type selector`,
			code: `html { --foo: 1px; }`,
		},
		{
			description: `a custom property set under the root selector`,
			code: `:root { --custom-property-set: {} }`,
		},
		{
			description: `a custom property set under a type selector`,
			code: `html { --custom-property-set: {} }`,
		},
		{
			description: `an attribute selector the parser cannot read`,
			code: `a[b=#{c}] { }`,
		},
		{
			description: `an argument with no node in it, which has no inside to space out`,
			code: `a:not() { }`,
		},
		{
			description: `the same, written with the space this option asks for, which the parser keeps nowhere`,
			code: `a:not( ) { }`,
		},
		{
			description: `the same, on another pseudo-class`,
			code: `a:is() { }`,
		},
		{
			description: `the same, on a pseudo-class taking no selector at all`,
			code: `a:nth-child() { }`,
		},
		{
			description: `whitespace standing at an empty argument, which the parser hands to the node behind the comma`,
			code: `a:not( ,b ) { }`,
		},
		{
			description: `the same, the other end asking for a space this rule may no longer write`,
			code: `a:not( ,b) { }`,
		},
		{
			description: `whitespace standing at an empty argument closing the list, which the parser keeps nowhere`,
			code: `a:not(b, ) { }`,
		},
		{
			description: `a pseudo-class the rule could fix beside a selector the parser does not give back as it took it`,
			code: `a:not(b, ):is(c) { }`,
		},
		{
			description: `an empty argument of a pseudo-element, which this rule walks alongside the pseudo-classes`,
			code: `a::part() { }`,
		},
		{
			description: `an argument holding nothing but a comment, spaced out as this option asks`,
			code: `a:not( /**/ ) { }`,
		},
		{
			description: `the same, with two comments and nothing else`,
			code: `a:not( /**/ /**/ ) { }`,
		},
		{
			description: `a pseudo-class standing behind such an argument, both of them spaced out already`,
			code: `a:not( /*c*/ ):is( b ) { }`,
		},
		{
			description: `an empty argument standing between two others, whose whitespace the parser hands to the node behind the comma`,
			code: `a:not(b, ,c) { }`,
		},
		{
			description: `a comment the parser moves, in a pseudo-class an argument of which is missing, which passes the list over whatever moved the text`,
			code: `a:not(/*c*/ ,,d), e:not(f) { }`,
		},
	],

	reject: [
		{
			description: `no space inside the opening parenthesis`,
			code: `input:not([type='submit'] ) { }`,
			fixed: `input:not( [type='submit'] ) { }`,
			line: 1,
			column: 11,
			message: messages.expectedOpening,
		},
		{
			description: `no space inside the closing parenthesis`,
			code: `input:not( [type='submit']) { }`,
			fixed: `input:not( [type='submit'] ) { }`,
			line: 1,
			column: 26,
			message: messages.expectedClosing,
		},
		{
			description: `no space inside the opening parenthesis of a two-argument list`,
			code: `input:not([type='submit'], [type='text'] ) { }`,
			fixed: `input:not( [type='submit'], [type='text'] ) { }`,
			line: 1,
			column: 11,
			message: messages.expectedOpening,
		},
		{
			description: `no space inside its closing parenthesis`,
			code: `input:not( [type='submit'], [type='text']) { }`,
			fixed: `input:not( [type='submit'], [type='text'] ) { }`,
			line: 1,
			column: 41,
			message: messages.expectedClosing,
		},
		{
			description: `no space inside the closing parenthesis, with two inside the opening one`,
			code: `input:not(  [type='submit']) { }`,
			fixed: `input:not(  [type='submit'] ) { }`,
			line: 1,
			column: 27,
			message: messages.expectedClosing,
		},
		{
			description: `no space inside the opening parenthesis of the outer pseudo-class`,
			code: `section:not(:has( h1, h2 ) ) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			line: 1,
			column: 13,
			message: messages.expectedOpening,
		},
		{
			description: `no space inside its closing parenthesis`,
			code: `section:not( :has( h1, h2 )) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			line: 1,
			column: 27,
			message: messages.expectedClosing,
		},
		{
			description: `no space inside the opening parenthesis of the nested pseudo-class`,
			code: `section:not( :has(h1, h2 ) ) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			line: 1,
			column: 19,
			message: messages.expectedOpening,
		},
		{
			description: `the same nested inside a pseudo-class taking a list of three`,
			code: `:matches( a, ul, :has(h1, h2 ) ) { }`,
			fixed: `:matches( a, ul, :has( h1, h2 ) ) { }`,
			line: 1,
			column: 23,
			message: messages.expectedOpening,
		},
		{
			description: `no space inside the closing parenthesis of the nested pseudo-class`,
			code: `section:not( :has( h1, h2) ) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			line: 1,
			column: 25,
			message: messages.expectedClosing,
		},
		{
			description: `no space inside any of the four parentheses`,
			code: `section:not(:has(h1, h2)) { }`,
			fixed: `section:not( :has( h1, h2 ) ) { }`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 24,
					message: messages.expectedClosing,
				},
				{
					line: 1,
					column: 18,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 23,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `no space inside the opening parenthesis of the first of two negations`,
			code: `input:not([type='radio'] ):not( [type='checkbox'] ) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			line: 1,
			column: 11,
			message: messages.expectedOpening,
		},
		{
			description: `no space inside its closing parenthesis`,
			code: `input:not( [type='radio']):not( [type='checkbox'] ) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			line: 1,
			column: 25,
			message: messages.expectedClosing,
		},
		{
			description: `no space inside the opening parenthesis of the second negation`,
			code: `input:not( [type='radio'] ):not([type='checkbox'] ) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			line: 1,
			column: 33,
			message: messages.expectedOpening,
		},
		{
			description: `no space inside its closing parenthesis`,
			code: `input:not( [type='radio'] ):not( [type='checkbox']) { }`,
			fixed: `input:not( [type='radio'] ):not( [type='checkbox'] ) { }`,
			line: 1,
			column: 50,
			message: messages.expectedClosing,
		},
		{
			description: `no space inside the opening parenthesis of a negation behind another pseudo-class`,
			code: `a:hover:not(.active ) { }`,
			fixed: `a:hover:not( .active ) { }`,
			line: 1,
			column: 13,
			message: messages.expectedOpening,
		},
		{
			description: `no space inside its closing parenthesis`,
			code: `a:hover:not( .active) { }`,
			fixed: `a:hover:not( .active ) { }`,
			line: 1,
			column: 20,
			message: messages.expectedClosing,
		},
		{
			description: `a comment before the closing parenthesis`,
			code: `a:not(b /**/) { }`,
			fixed: `a:not( b /**/ ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `comments standing at every parenthesis of two nested pseudo-classes`,
			code: `section:not(/**/:has(/**/h1, h2/**/)/**/) { }`,
			fixed: `section:not( /**/:has( /**/h1, h2/**/ )/**/ ) { }`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 40,
					message: messages.expectedClosing,
				},
				{
					line: 1,
					column: 22,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 35,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `an empty argument opening the list, the end that has a node still being spaced out`,
			code: `a:not(,b) { }`,
			fixed: `a:not(,b ) { }`,
			line: 1,
			column: 8,
			message: messages.expectedClosing,
		},
		{
			description: `an empty argument closing the list, the end that has a node still being spaced out`,
			code: `a:not(b,) { }`,
			fixed: `a:not( b,) { }`,
			line: 1,
			column: 7,
			message: messages.expectedOpening,
		},
		{
			description: `an empty argument in one selector of a list, the other still being fixed`,
			code: `a:not(), b:not(c) { }`,
			fixed: `a:not(), b:not( c ) { }`,
			warnings: [
				{
					line: 1,
					column: 16,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 16,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `an argument holding nothing but a comment, which the fix spaces out once and for all`,
			code: `a:not(/**/) { }`,
			fixed: `a:not( /**/ ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 10,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a comment closing the last argument of several`,
			code: `a:not(b, /**/) { }`,
			fixed: `a:not( b, /**/ ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a comment closing an argument that is not the last, whose whitespace the fix leaves where it is`,
			code: `a:not(b, /*c*/ , c) { }`,
			fixed: `a:not( b, /*c*/ , c ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 18,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a comment the parser does give back, beside an argument that is missing, which leaves the rule reading as usual`,
			code: `a:not(/*c*/,) { }`,
			fixed: `a:not( /*c*/,) { }`,
			line: 1,
			column: 7,
			message: messages.expectedOpening,
		},
		{
			description: `an empty argument beside a pseudo-class of the same selector, which is still fixed`,
			code: `a:not(b):not() { }`,
			fixed: `a:not( b ):not() { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 7,
					message: messages.expectedClosing,
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
			description: `no space inside either parenthesis of a negation`,
			code: `input:not([type='submit']) { }`,
		},
		{
			description: `the same negation taking two arguments`,
			code: `input:not([type='submit'], [type='text']) { }`,
		},
		{
			description: `no space inside either parenthesis of a language pseudo-class`,
			code: `p:lang(it) { }`,
		},
		{
			description: `nested pseudo-classes, neither of them spaced out`,
			code: `section:not(:has(h1, h2)) { }`,
		},
		{
			description: `two negations, neither of them spaced out`,
			code: `input:not([type='radio']):not([type='checkbox']) { }`,
		},
		{
			description: `a negation standing behind another pseudo-class`,
			code: `a:hover:not(.active) { }`,
		},
		{
			description: `a pseudo-class taking a list of three, one of them a nested pseudo-class`,
			code: `:matches(a, ul, :has(h1, h2)) { }`,
		},
		{
			description: `a multi-line argument list, whose whitespace in front of the closing parenthesis is spared`,
			code: `a:not(b\n, c ) {}`,
		},
		{
			description: `a nested pseudo-class whose arguments stand on lines of their own`,
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
			description: `the same arguments indented deeper`,
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
			description: `an argument with no node in it, which has no inside to space out`,
			code: `a:not() { }`,
		},
		{
			description: `the same, written with a space the parser keeps nowhere`,
			code: `a:not( ) { }`,
		},
		{
			description: `an empty argument opening the list, the whitespace at either end already as this option asks`,
			code: `a:not(,b) { }`,
		},
		{
			description: `an empty argument closing the list, the whitespace at either end already as this option asks`,
			code: `a:not(b,) { }`,
		},
		{
			description: `whitespace standing at an empty argument, which the parser hands to the node behind the comma`,
			code: `a:not( ,b ) { }`,
		},
		{
			description: `whitespace standing at an empty argument closing the list, which the parser keeps nowhere`,
			code: `a:not( b, ) { }`,
		},
		{
			description: `an argument holding nothing but a comment, with no whitespace to take away`,
			code: `a:not(/**/) { }`,
		},
		{
			description: `a comment closing an argument that is not the last, whose whitespace the parser drops`,
			code: `a:not(b, /*c*/ , c) { }`,
		},
		{
			description: `whitespace standing at a selector of the list that holds nothing, which nothing in the parsed selector can hold`,
			code: `a:not( /*c*/ ) , , b { }`,
		},
		{
			description: `whitespace standing at an empty argument, which passes over every selector of the list, this one written back with them all`,
			code: `a:not( ) , b:not( c ) { }`,
		},
		{
			description: `an empty argument standing between two others, whose whitespace the parser hands to the node behind the comma`,
			code: `a:not(b, ,c) { }`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/173
			description: `a form feed inside the arguments, which is whitespace and no line break, so the list is single-line and the space in front of the closing parenthesis goes`,
			code: `a:not(b\f, c ) {}`,
			fixed: `a:not(b\f, c) {}`,
			line: 1,
			column: 12,
			message: messages.rejectedClosing,
		},
		{
			description: `two comments standing side by side, which spell no inline comment between them`,
			code: `a:not(  b  )/*one*//*two*/c { }`,
			fixed: `a:not(b)/*one*//*two*/c { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 11,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a space inside the closing parenthesis`,
			code: `input:not([type='submit'] ) { }`,
			fixed: `input:not([type='submit']) { }`,
			line: 1,
			column: 26,
			message: messages.rejectedClosing,
		},
		{
			description: `an empty argument holding no whitespace, which leaves the rest of the list to be read as usual`,
			code: `a:not(), b:is( /*c*/ ) { }`,
			fixed: `a:not(), b:is(/*c*/) { }`,
			warnings: [
				{
					line: 1,
					column: 15,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 21,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `an argument holding nothing but a comment, whose whitespace the parser drops`,
			code: `a:not( /**/ ) { }`,
			fixed: `a:not(/**/) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 12,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `the same, with two comments and nothing else`,
			code: `a:not( /**/ /**/ ) { }`,
			fixed: `a:not(/**/ /**/) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 17,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a pseudo-class standing behind such an argument, which the fix leaves compounded to it`,
			code: `a:not( /*c*/ ):is(b) { }`,
			fixed: `a:not(/*c*/):is(b) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a class standing behind such an argument, which the fix leaves compounded to it`,
			code: `a:not( /*c*/ ).foo { }`,
			fixed: `a:not(/*c*/).foo { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a combinator standing behind such an argument, which the fix leaves where the author put it`,
			code: `a:not( /*c*/ )>b { }`,
			fixed: `a:not(/*c*/)>b { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `the same, the comment standing clear of the selector behind it`,
			code: `a:not( /*c*/ ) /*d*/ b { }`,
			fixed: `a:not(/*c*/) /*d*/ b { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `such an argument nested a pseudo-class deeper, the whitespace reaching out of both sets of parentheses`,
			code: `a:not( :is( /*c*/ ) ):is(x) { }`,
			fixed: `a:not(:is(/*c*/)):is(x) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 20,
					message: messages.rejectedClosing,
				},
				{
					line: 1,
					column: 12,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 18,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a descendant combinator carrying a comment of its own behind such an argument`,
			code: `a:not( /*c*/ ) /*d*/b { }`,
			fixed: `a:not(/*c*/) /*d*/b { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a namespaced selector behind such an argument, whose own index stands at the name rather than at the namespace`,
			code: `a:not( /*c*/ ) *|b { }`,
			fixed: `a:not(/*c*/) *|b { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a selector of the list holding nothing standing between the two that do`,
			code: `a:not( /*c*/ ),,b { }`,
			fixed: `a:not(/*c*/),,b { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a selector of the list opening right behind such an argument, which is where the parser hands the whitespace when nothing else follows`,
			code: `a:not( /*c*/ ),b:not( q ) { }`,
			fixed: `a:not(/*c*/),b:not(q) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.rejectedClosing,
				},
				{
					line: 1,
					column: 22,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 24,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a space inside the opening parenthesis`,
			code: `input:not( [type='submit']) { }`,
			fixed: `input:not([type='submit']) { }`,
			line: 1,
			column: 11,
			message: messages.rejectedOpening,
		},
		{
			description: `a space inside the closing parenthesis of a two-argument list`,
			code: `input:not([type='submit'], [type='text'] ) { }`,
			fixed: `input:not([type='submit'], [type='text']) { }`,
			line: 1,
			column: 41,
			message: messages.rejectedClosing,
		},
		{
			description: `a space inside its opening parenthesis`,
			code: `input:not( [type='submit'], [type='text']) { }`,
			fixed: `input:not([type='submit'], [type='text']) { }`,
			line: 1,
			column: 11,
			message: messages.rejectedOpening,
		},
		{
			description: `two spaces inside the opening parenthesis`,
			code: `input:not(  [type='submit']) { }`,
			fixed: `input:not([type='submit']) { }`,
			line: 1,
			column: 11,
			message: messages.rejectedOpening,
		},
		{
			description: `a space inside the opening parenthesis of the outer pseudo-class`,
			code: `section:not( :has(h1, h2)) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			line: 1,
			column: 13,
			message: messages.rejectedOpening,
		},
		{
			description: `a space inside the opening parenthesis of the nested pseudo-class`,
			code: `section:not(:has( h1, h2)) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			line: 1,
			column: 18,
			message: messages.rejectedOpening,
		},
		{
			description: `a space inside the closing parenthesis of the outer pseudo-class`,
			code: `section:not(:has(h1, h2) ) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space inside the closing parenthesis of the nested pseudo-class`,
			code: `section:not(:has(h1, h2 )) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			line: 1,
			column: 24,
			message: messages.rejectedClosing,
		},
		{
			description: `spaces inside all four parentheses`,
			code: `section:not( :has( h1, h2 ) ) { }`,
			fixed: `section:not(:has(h1, h2)) { }`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 28,
					message: messages.rejectedClosing,
				},
				{
					line: 1,
					column: 19,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 26,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `a space inside the opening parenthesis of the first of two negations`,
			code: `input:not( [type='radio']):not([type='checkbox']) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			line: 1,
			column: 11,
			message: messages.rejectedOpening,
		},
		{
			description: `a space inside its closing parenthesis`,
			code: `input:not([type='radio'] ):not([type='checkbox']) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			line: 1,
			column: 25,
			message: messages.rejectedClosing,
		},
		{
			description: `a space inside the opening parenthesis of the second negation`,
			code: `input:not([type='radio']):not( [type='checkbox']) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			line: 1,
			column: 31,
			message: messages.rejectedOpening,
		},
		{
			description: `a space inside its closing parenthesis`,
			code: `input:not([type='radio']):not([type='checkbox'] ) { }`,
			fixed: `input:not([type='radio']):not([type='checkbox']) { }`,
			line: 1,
			column: 48,
			message: messages.rejectedClosing,
		},
		{
			description: `a space inside the opening parenthesis of a negation behind another pseudo-class`,
			code: `a:hover:not( .active) { }`,
			fixed: `a:hover:not(.active) { }`,
			line: 1,
			column: 13,
			message: messages.rejectedOpening,
		},
		{
			description: `a space inside its closing parenthesis`,
			code: `a:hover:not(.active ) { }`,
			fixed: `a:hover:not(.active) { }`,
			line: 1,
			column: 20,
			message: messages.rejectedClosing,
		},
		{
			description: `a comment before the closing parenthesis`,
			code: `a:not( b /**/ ) { }`,
			fixed: `a:not(b /**/) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 14,
					message: messages.rejectedClosing,
				},
			],
		},
		{
			description: `spaced-out comments standing at every parenthesis of two nested pseudo-classes`,
			code: `section:not( /**/ :has( /**/ h1, h2 /**/ ) /**/ ) { }`,
			fixed: `section:not(/**/ :has(/**/ h1, h2 /**/) /**/) { }`,
			warnings: [
				{
					line: 1,
					column: 13,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 48,
					message: messages.rejectedClosing,
				},
				{
					line: 1,
					column: 24,
					message: messages.rejectedOpening,
				},
				{
					line: 1,
					column: 41,
					message: messages.rejectedClosing,
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
			description: `an inline comment closing the arguments, whose line break is the whitespace in front of the parenthesis`,
			code: `a:not( // c\n) { }`,
		},
		{
			description: `the same, the comment folded into the raws of the node in front of it`,
			code: `a:not( b // c\n) { }`,
		},
	],

	reject: [
		{
			description: `the opening of a pseudo-class whose arguments an inline comment closes, which is asked about on its own`,
			code: `a:not(// c\n) { }`,
			fixed: `a:not( // c\n) { }`,
			line: 1,
			column: 7,
			message: messages.expectedOpening,
		},
		{
			description: `a selector carrying an inline comment, whose positions the source spells two characters short of the raw`,
			code: `a:not(b, // c\n d) { }`,
			fixed: `a:not( b, // c\n d ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 2,
					column: 2,
					message: messages.expectedClosing,
				},
			],
		},
		{
			description: `a block comment under this syntax is read as it is under any other`,
			code: `a:not(/* c */) { }`,
			fixed: `a:not( /* c */ ) { }`,
			warnings: [
				{
					line: 1,
					column: 7,
					message: messages.expectedOpening,
				},
				{
					line: 1,
					column: 13,
					message: messages.expectedClosing,
				},
			],
		},
	],
})
