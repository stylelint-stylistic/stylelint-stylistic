import { messages, ruleName } from "./index.js"

const testRule = createTestRule({ ruleName })

testRule({
	customSyntax: `postcss-styled-syntax`,
	ruleName,
	config: [2],

	accept: [
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
			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
			description: `a single-line template carrying spaces around its declaration`,
			code: `
				const StyledDiv = styled.div\`  background: white;\`
			`,
			fixed: `
				const StyledDiv = styled.div\`background: white;\`
			`,
			message: messages.expected(`0 spaces`),
			line: 1,
			column: 32,
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
					line: 2,
					column: 2, // because tab is 1
					message: messages.expected(`2 spaces`),
				},
				{
					line: 5,
					column: 7, // next char after 6 spaces
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
			message: messages.expected(`1 tab`),
			line: 2,
			column: 1,
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
			message: messages.expected(`1 tab`),
			line: 2,
			column: 3,
		},
		{
			description: `a single-line template carrying tabs and spaces around its declaration`,
			code: `
				const StyledDiv = styled.div\`  background: white;\`
			`,
			fixed: `
				const StyledDiv = styled.div\`background: white;\`
			`,
			message: messages.expected(`0 tabs`),
			line: 1,
			column: 32,
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
