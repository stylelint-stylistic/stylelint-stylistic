import { createRule } from "../../../../rules/indentation/index.ts"
import { styled } from "../../index.ts"

let { ruleName, messages } = createRule(styled)

let testRule = createTestRule({ ruleName })

testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [2],

	accept: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/453
			description: `a single-line template standing on a host line indented by one level, whose node stands on the line of the backtick and carries no indentation of the stylesheet`,
			code: `
				function f () {
				  const a = styled.div\`color: red;\`;
				}
			`,
		},
		{
			description: `an empty template with nothing in it`,
			code: `
				const StyledDiv = styled.div\`\`
			`,
		},
		{
			description: `an empty template broken over two lines`,
			code: `
				const StyledDiv = styled.div\`
				\`
			`,
		},
		{
			description: `a declaration indented with spaces inside the template`,
			code: `
				const StyledDiv = styled.div\`
				  background: white;
				\`
			`,
		},
		{
			description: `a declaration written on the template's own line`,
			code: `
				const StyledDiv = styled.div\`background: white;\`
			`,
		},
		{
			description: `a keyframes block indented with spaces`,
			code: `
				const rotate = css\`
				  from {
				    transform: rotate(0deg);
				  }

				  to {
				    transform: rotate(360deg);
				  }
				\`;
			`,
		},
		{
			description: `a media query nested in the template, indented with spaces`,
			code: `
				const styles = css\`
				  color: blue;

				  @media screen {
				    color: red;
				  }
				\`
			`,
		},
		{
			description: `an interpolated block inside the template`,
			code: `
				const Component = styled.p\`
				  \${(props) =>
				    props.isPrimary
				      ? css\`
				        background: green;
				        \`
				      : css\`
				        border: 1px solid blue;
				        \`
				  }
				\`;
			`,
		},
		{
			description: `a value carrying an interpolation, whose lines the rule leaves alone`,
			code: `
				const Option = styled.div\`
				  &:hover {
				    background-color: \${({ colours, isOptionSelected }) => (
				      isOptionSelected
				        ? colours.backgroundColour
				        : colours.backgroundColourOnHover
				    )};
				    gap: 8px \${({ isWide }) => (
				      isWide
				        ? '40px'
				        : '24px'
				    )};
				    grid-template-areas:
				      'foo  foo  foo'
				      'bar  bar  bar'
				  }
				\`;
			`,
		},
	],

	reject: [
		{
			description: `a declaration indented with the wrong number of spaces`,
			code: `
				const StyledDiv = styled.div\`
				background: white;
				\`
			`,
			fixed: `
				const StyledDiv = styled.div\`
				  background: white;
				\`
			`,
			line: 2,
			column: 1,
			message: messages.expected(`2 spaces`),
		},
		{
			description: `a single-line template carrying spaces around its declaration`,
			code: `
				const StyledDiv = styled.div\`  background: white;\`
			`,
			fixed: `
				const StyledDiv = styled.div\`background: white;\`
			`,
			line: 1,
			column: 32,
			message: messages.expected(`0 spaces`),
		},
		{
			description: `a keyframes block indented with the wrong number of spaces`,
			code: `
				const rotate = css\`
					from {
				      transform: rotate(0deg);
				  }

				    to {
				              transform: rotate(360deg);
				  }
				\`;
			`,
			fixed: `
				const rotate = css\`
				  from {
				    transform: rotate(0deg);
				  }

				  to {
				    transform: rotate(360deg);
				  }
				\`;
			`,
			warnings: [
				{
					line: 2,
					column: 2,
					message: messages.expected(`2 spaces`),
				},
				{
					line: 3,
					column: 7,
					message: messages.expected(`4 spaces`),
				},
				{
					line: 6,
					column: 5,
					message: messages.expected(`2 spaces`),
				},
				{
					line: 7,
					column: 15,
					message: messages.expected(`4 spaces`),
				},
			],
		},
		{
			description: `a template mixing wrong counts of spaces and tabs`,
			code: `
				const styles = css\`
					color: blue;

				  @media screen {
				      color: red;
				  }
				\`
			`,
			fixed: `
				const styles = css\`
				  color: blue;

				  @media screen {
				    color: red;
				  }
				\`
			`,
			warnings: [
				{
					// The tab the fixture is laid out on is column one, so the content of the line opens at two
					line: 2,
					column: 2,
					message: messages.expected(`2 spaces`),
				},
				{
					// The character behind the six spaces the line is indented by
					line: 5,
					column: 7,
					message: messages.expected(`4 spaces`),
				},
			],
		},
		{
			description: `an interpolated block indented wrongly`,
			code: `
				const Component = styled.p\`
				  \${(props) =>
				    props.isPrimary
				      ? css\`
				          background: green;
				        \`
				      : css\`
				border: 1px solid blue;
				        \`
				  }
				\`;
			`,
			fixed: `
				const Component = styled.p\`
				  \${(props) =>
				    props.isPrimary
				      ? css\`
				        background: green;
				        \`
				      : css\`
				        border: 1px solid blue;
				        \`
				  }
				\`;
			`,
			warnings: [
				{
					line: 5,
					column: 11,
					message: messages.expected(`2 spaces`),
				},
				{
					line: 8,
					column: 1,
					message: messages.expected(`2 spaces`),
				},
			],
		},
		{
			description: `the lines of a value carrying an interpolation that the rule does measure, indented wrongly`,
			code: `
				const Option = styled.div\`
				  width: \${({ isLarge }) => (
				    isLarge
				      ? '40px'
				      : '8px'
				  )};

				  gap: 8px \${({ isLarge }) => (
				    isLarge
				      ? '16px'
				      : '8px'
				  )};

				  &:hover {
				    background-color: \${({ colours, isOptionSelected }) => (
				    	isOptionSelected
				                          ? colours.backgroundColour
				      : colours.backgroundColourOnHover
				    )};
				    gap: 8px \${({ isWide }) => (
				      isWide
				         ? '40px'
				       : '24px'
				    )};
				    grid-template-areas:
				      'foo  foo  foo'
				       'bar  bar  bar'
				  }
				\`;
			`,
			fixed: `
				const Option = styled.div\`
				  width: \${({ isLarge }) => (
				    isLarge
				      ? '40px'
				      : '8px'
				  )};

				  gap: 8px \${({ isLarge }) => (
				    isLarge
				      ? '16px'
				      : '8px'
				  )};

				  &:hover {
				    background-color: \${({ colours, isOptionSelected }) => (
				    	isOptionSelected
				                          ? colours.backgroundColour
				      : colours.backgroundColourOnHover
				    )};
				    gap: 8px \${({ isWide }) => (
				      isWide
				         ? '40px'
				       : '24px'
				    )};
				    grid-template-areas:
				      'foo  foo  foo'
				      'bar  bar  bar'
				  }
				\`;
			`,
			warnings: [
				{
					line: 27,
					column: 8,
					message: messages.expected(`6 spaces`),
				},
			],
		},
	],
})

testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [`tab`],

	accept: [
		{
			description: `a declaration indented with tabs inside the template`,
			code: `
				const StyledDiv = styled.div\`
					background: white;
				\`
			`,
		},
		{
			description: `a declaration written on the template's own line`,
			code: `
				const StyledDiv = styled.div\`background: white;\`
			`,
		},
		{
			description: `a keyframes block indented with tabs`,
			code: `
				const rotate = css\`
					from {
						transform: rotate(0deg);
					}

					to {
						transform: rotate(360deg);
					}
				\`;
			`,
		},
		{
			description: `a media query nested in the template, indented with tabs`,
			code: `
				const styles = css\`
					color: blue;

					@media screen {
						color: red;
					}
				\`
			`,
		},
		{
			description: `an interpolated block indented with tabs`,
			code: `
				const Component = styled.p\`
					\${(props) =>
						props.isPrimary
							? css\`
								background: green;
								\`
							: css\`
								border: 1px solid blue;
								\`
					}
				\`;
			`,
		},
		{
			description: `a value carrying an interpolation, whose lines the rule leaves alone`,
			code: `
				const Option = styled.div\`
					&:hover {
						background-color: \${({ colours, isOptionSelected }) => (
							isOptionSelected
								? colours.backgroundColour
								: colours.backgroundColourOnHover
						)};
						gap: 8px \${({ isWide }) => (
							isWide
								? '40px'
								: '24px'
						)};
						grid-template-areas:
							'foo  foo  foo'
							'bar  bar  bar'
					}
				\`;
			`,
		},
	],

	reject: [
		{
			description: `a declaration indented with the wrong number of tabs`,
			code: `
				const StyledDiv = styled.div\`
				background: white;
				\`
			`,
			fixed: `
				const StyledDiv = styled.div\`
					background: white;
				\`
			`,
			line: 2,
			column: 1,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a declaration indented with spaces where the option asks for tabs`,
			code: `
				const StyledDiv = styled.div\`
				  background: white;
				\`
			`,
			fixed: `
				const StyledDiv = styled.div\`
					background: white;
				\`
			`,
			line: 2,
			column: 3,
			message: messages.expected(`1 tab`),
		},
		{
			description: `a single-line template carrying tabs and spaces around its declaration`,
			code: `
				const StyledDiv = styled.div\`  background: white;\`
			`,
			fixed: `
				const StyledDiv = styled.div\`background: white;\`
			`,
			line: 1,
			column: 32,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `a keyframes block indented with spaces where the option asks for tabs`,
			code: `
				const rotate = css\`
					from {
				      transform: rotate(0deg);
					}

				    to {
				              transform: rotate(360deg);
					}
				\`;
			`,
			fixed: `
				const rotate = css\`
					from {
						transform: rotate(0deg);
					}

					to {
						transform: rotate(360deg);
					}
				\`;
			`,
			warnings: [
				{
					line: 3,
					column: 7,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 6,
					column: 5,
					message: messages.expected(`1 tab`),
				},
				{
					line: 7,
					column: 15,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			description: `a template mixing wrong counts of spaces and tabs`,
			code: `
				const styles = css\`
				  color: blue;

					@media screen {
							color: red;
					}
				\`
			`,
			fixed: `
				const styles = css\`
					color: blue;

					@media screen {
						color: red;
					}
				\`
			`,
			warnings: [
				{
					line: 2,
					column: 3,
					message: messages.expected(`1 tab`),
				},
				{
					line: 5,
					column: 4,
					message: messages.expected(`2 tabs`),
				},
			],
		},
		{
			description: `an interpolated block indented wrongly`,
			code: `
				const Component = styled.p\`
					\${(props) =>
						props.isPrimary
							? css\`
				          background: green;
								\`
							: css\`
				border: 1px solid blue;
								\`
					}
				\`;
			`,
			fixed: `
				const Component = styled.p\`
					\${(props) =>
						props.isPrimary
							? css\`
								background: green;
								\`
							: css\`
								border: 1px solid blue;
								\`
					}
				\`;
			`,
			warnings: [
				{
					line: 5,
					column: 11,
					message: messages.expected(`1 tab`),
				},
				{
					line: 8,
					column: 1,
					message: messages.expected(`1 tab`),
				},
			],
		},
		{
			description: `the lines of a value carrying an interpolation that the rule does measure, indented wrongly`,
			code: `
				const Option = styled.div\`
					width: \${({ isLarge }) => (
						isLarge
							? '40px'
							: '24px'
					)};

					gap: 8px \${({ isLarge }) => (
						isLarge
							? '40px'
							: '24px'
					)};

					&:hover {
						background-color: \${({ colours, isOptionSelected }) => (
							isOptionSelected
											     ? colours.backgroundColour
							: colours.backgroundColourOnHover
						)};
							gap: 8px \${({ isWide }) => (
							isWide
								? '40px'
							: '24px'
						)};
						grid-template-areas:
							 'foo  foo  foo'
							'bar  bar  bar'
					}
				\`;
			`,
			fixed: `
				const Option = styled.div\`
					width: \${({ isLarge }) => (
						isLarge
							? '40px'
							: '24px'
					)};

					gap: 8px \${({ isLarge }) => (
						isLarge
							? '40px'
							: '24px'
					)};

					&:hover {
						background-color: \${({ colours, isOptionSelected }) => (
							isOptionSelected
											     ? colours.backgroundColour
							: colours.backgroundColourOnHover
						)};
						gap: 8px \${({ isWide }) => (
							isWide
								? '40px'
							: '24px'
						)};
						grid-template-areas:
							'foo  foo  foo'
							'bar  bar  bar'
					}
				\`;
			`,
			warnings: [
				{
					line: 20,
					column: 4,
					message: messages.expected(`2 tabs`),
				},
				{
					line: 26,
					column: 5,
					message: messages.expected(`3 tabs`),
				},
			],
		},
	],
})

testRule({
	ruleName,
	config: `tab`,
	customSyntax: `postcss-styled-syntax`,

	accept: [
		{
			description: `a template standing on an indented line of a file broken with Windows pairs, the one spelling a widening of that reading would break`,
			code: `function f () {\r\n\tconst a = styled.div\`\r\n\t\tcolor: red;\r\n\t\`;\r\n}`,
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/453
			description: `a single-line template standing on an indented host line, whose node stands on the line of the backtick and carries no indentation of the stylesheet`,
			code: `
				function f () {
					const a = styled.div\`color: red;\`;
				}
			`,
		},
		{
			description: `the same template two levels deep in the host`,
			code: `
				function f () {
					if (x) {
						const a = styled.div\`color: red;\`;
					}
				}
			`,
		},
		{
			description: `a single-line template holding a rule`,
			code: `
				function f () {
					const a = styled.div\`a { color: red; }\`;
				}
			`,
		},
		{
			description: `a template whose first node stands on the line of the backtick and whose other lines stand a level deeper than the host`,
			code: `
				function f () {
					const a = styled.div\`color: red;
						background: blue;
					\`;
				}
			`,
		},
	],

	reject: [
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/377
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/452
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/453
			description: `a template of a carriage-return-broken file, reported at a position the file holds rather than ending the lint in a TypeError; the bare carriage return is whitespace to the stylesheet's parser, so the node stands on the line of the backtick to it, is asked for no indentation, and the fix takes the run away and joins the template's first line to that line`,
			code: `function f () {\r\tconst a = styled.div\`\r\t\tcolor: red;\r\t\`;\r}`,
			fixed: `function f () {\r\tconst a = styled.div\`color: red;\r\t\`;\r}`,
			line: 2,
			column: 26,
			endLine: 2,
			endColumn: 37,
			message: messages.expected(`0 tabs`),
		},
		{
			// https://github.com/stylelint-stylistic/stylelint-stylistic/issues/453
			description: `spaces between the backtick and the node of a single-line template on an indented host line, which are no indentation of the stylesheet and go, where the host's tab used to be written in their place`,
			code: `
				function f () {
					const a = styled.div\`  color: red;\`;
				}
			`,
			fixed: `
				function f () {
					const a = styled.div\`color: red;\`;
				}
			`,
			line: 2,
			column: 25,
			message: messages.expected(`0 tabs`),
		},
		{
			description: `the same spaces in front of a first node on the line of the backtick, the template's other lines standing at their level`,
			code: `
				function f () {
					const a = styled.div\`  color: red;
						background: blue;
					\`;
				}
			`,
			fixed: `
				function f () {
					const a = styled.div\`color: red;
						background: blue;
					\`;
				}
			`,
			line: 2,
			column: 25,
			message: messages.expected(`0 tabs`),
		},
	],
})
