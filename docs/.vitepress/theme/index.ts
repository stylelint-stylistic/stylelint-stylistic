import DefaultTheme from "vitepress/theme"

// @ts-expect-error CSS is resolved by Vite at runtime.
import "./style.css"

export default DefaultTheme
