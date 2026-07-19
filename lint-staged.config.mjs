export default {
	"*.{ts,tsx,js,jsx,json,css,md}": ["biome lint --write"],
	"*.{ts,tsx}": () => "npm run typecheck",
	"tsconfig.json": () => "npm run typecheck",
	"package.json": () => "npm run typecheck",
};
