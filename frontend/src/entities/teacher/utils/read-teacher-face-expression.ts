export type TeacherFaceExpression = {
	emotion?: string;
	intensity?: string;
	speech?: string;
};

export function readTeacherFaceExpression(svg: Element): TeacherFaceExpression {
	return {
		emotion: classSuffix(svg, "emotion-"),
		intensity: classSuffix(svg, "intensity-"),
		speech: classSuffix(svg, "speech-"),
	};
}

function classSuffix(svg: Element, prefix: string): string | undefined {
	return [...svg.classList]
		.find((name) => name.startsWith(prefix))
		?.slice(prefix.length);
}
