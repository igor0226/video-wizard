export default {
	"*.{ts,js,json}": ["npm run lint:fix"],
	"*.{ts,tsx}": () => "npm run typecheck",
	"tsconfig.json": () => "npm run typecheck",
	"package.json": () => "npm run typecheck",
};
