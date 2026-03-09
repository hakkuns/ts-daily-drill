export type Question = {
	id: string;
	category: string;
	difficulty: 1 | 2 | 3;
	topic: string;
	question_format: "definition" | "why" | "review" | "best_impl";
	question: string;
	code: string;
	options: string[]; // ["A. ...", "B. ...", "C. ...", "D. ..."]
	correct: number; // 0-3 index
	explanation: string;
	java_trap: boolean;
	interview_likely: boolean;
};
