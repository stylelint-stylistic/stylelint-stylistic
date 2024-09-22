/* eslint-disable */
import { stripIndent } from "common-tags"
import { testRule } from "stylelint-test-rule-node"

import plugins from "../../index.js"
import { messages, ruleName } from "./index.js"

testRule({
	customSyntax: `postcss-styled-syntax`,
	plugins,
	ruleName,
	config: [2],
	fix: true,

	accept: [
		{
			description: `Single-line no value`,
			code: stripIndent(`
				const StyledDiv = styled.div\`\`
			`),
		},
		{
			description: `Multi-line no value`,
			code: stripIndent(`
				const StyledDiv = styled.div\`
				\`
			`),
		},
		{
			description: `The basic scenario using spaces`,
			code: stripIndent(`
				const StyledDiv = styled.div\`
				  background: white;
				\`
			`),
		},
		{
			description: `Single-line scenario (no extra spaces)`,
			code: stripIndent(`
				const StyledDiv = styled.div\`background: white;\`
			`),
		},
		{
			description: `Keyframes scenario using spaces`,
			code: stripIndent(`
				const rotate = css\`
				  from {
				    transform: rotate(0deg);
				  }

				  to {
				    transform: rotate(360deg);
				  }
				\`;
			`),
		},
		{
			description: `Custom CSS using spaces`,
			code: stripIndent(`
				const styles = css\`
				  color: blue;

				  @media screen {
				    color: red;
				  }
				\`
			`),
		},
		{
			description: `Conditional CSS using spaces`,
			code: stripIndent(`
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
			`),
		},
	],

	reject: [
		{
			description: `The basic scenario using wrong count of spaces`,
			code: stripIndent(`
				const StyledDiv = styled.div\`
				background: white;
				\`
			`),
			fixed: stripIndent(`
				const StyledDiv = styled.div\`
				  background: white;
				\`
			`),
			message: messages.expected(`2 spaces`),
			line: 2,
			column: 1,
		},
		{
			description: `Single-line scenario (should be no extra spaces)`,
			code: stripIndent(`
				const StyledDiv = styled.div\`  background: white;\`
			`),
			fixed: stripIndent(`
				const StyledDiv = styled.div\`background: white;\`
			`),
			message: messages.expected(`0 spaces`),
			line: 1,
			column: 32,
		},
		{
			description: `Keyframes scenario using wrong count of spaces`,
			code: stripIndent(`
				const rotate = css\`
					from {
				      transform: rotate(0deg);
				  }

				    to {
				              transform: rotate(360deg);
				  }
				\`;
			`),
			fixed: stripIndent(`
				const rotate = css\`
				  from {
				    transform: rotate(0deg);
				  }

				  to {
				    transform: rotate(360deg);
				  }
				\`;
			`),
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
			]
		},
		{
			description: `Custom CSS using wrong count of spaces/tabs`,
			code: stripIndent(`
				const styles = css\`
					color: blue;

				  @media screen {
				      color: red;
				  }
				\`
			`),
			fixed: stripIndent(`
				const styles = css\`
				  color: blue;

				  @media screen {
				    color: red;
				  }
				\`
			`),
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
			]
		},
		{
			description: `Conditional CSS using spaces`,
			code: stripIndent(`
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
			`),
			fixed: stripIndent(`
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
			`),
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
			]
		},
	],
})

testRule({
	customSyntax: `postcss-styled-syntax`,
	plugins,
	ruleName,
	config: [`tab`],
	fix: true,

	accept: [
		{
			description: `The basic scenario using tabs`,
			code: stripIndent(`
				const StyledDiv = styled.div\`
					background: white;
				\`
			`),
		},
		{
			description: `Single-line scenario (no extra tabs)`,
			code: stripIndent(`
				const StyledDiv = styled.div\`background: white;\`
			`),
		},
		{
			description: `Keyframes scenario using tabs`,
			code: stripIndent(`
				const rotate = css\`
					from {
						transform: rotate(0deg);
					}

					to {
						transform: rotate(360deg);
					}
				\`;
			`),
		},
		{
			description: `Custom CSS using tabs`,
			code: stripIndent(`
				const styles = css\`
					color: blue;

					@media screen {
						color: red;
					}
				\`
			`),
		},
		{
			description: `Conditional CSS using tabs`,
			code: stripIndent(`
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
			`),
		},
	],

	reject: [
		{
			description: `The basic scenario using wrong count of tabs`,
			code: stripIndent(`
				const StyledDiv = styled.div\`
				background: white;
				\`
			`),
			fixed: stripIndent(`
				const StyledDiv = styled.div\`
					background: white;
				\`
			`),
			message: messages.expected(`1 tab`),
			line: 2,
			column: 1,
		},
		{
			description: `The basic scenario using wrong spaces`,
			code: stripIndent(`
				const StyledDiv = styled.div\`
				  background: white;
				\`
			`),
			fixed: stripIndent(`
				const StyledDiv = styled.div\`
					background: white;
				\`
			`),
			message: messages.expected(`1 tab`),
			line: 2,
			column: 3,
		},
		{
			description: `Single-line scenario (should be no extra tabs or spaces)`,
			code: stripIndent(`
				const StyledDiv = styled.div\`  background: white;\`
			`),
			fixed: stripIndent(`
				const StyledDiv = styled.div\`background: white;\`
			`),
			message: messages.expected(`0 tabs`),
			line: 1,
			column: 32,
		},
		{
			description: `Keyframes scenario using wrong spaces`,
			code: stripIndent(`
				const rotate = css\`
					from {
				      transform: rotate(0deg);
					}

				    to {
				              transform: rotate(360deg);
					}
				\`;
			`),
			fixed: stripIndent(`
				const rotate = css\`
					from {
						transform: rotate(0deg);
					}

					to {
						transform: rotate(360deg);
					}
				\`;
			`),
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
			]
		},
		{
			description: `Custom CSS using wrong count of spaces/tabs`,
			code: stripIndent(`
				const styles = css\`
				  color: blue;

					@media screen {
							color: red;
					}
				\`
			`),
			fixed: stripIndent(`
				const styles = css\`
					color: blue;

					@media screen {
						color: red;
					}
				\`
			`),
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
			]
		},
		{
			description: `Conditional CSS using tabs`,
			code: stripIndent(`
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
			`),
			fixed: stripIndent(`
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
			`),
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
			]
		},
	],
})
