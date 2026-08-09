import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.spec.ts"],
		setupFiles: ["./test/setup.ts"],
		root: "./",
	},
	plugins: [
		swc.vite({
			module: { type: "es6" },
		}),
	],
});
