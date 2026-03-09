import { useCallback, useEffect, useState } from "react";
import questionsData from "../data/questions.json";
import type { Progress } from "../lib/progress";
import {
	completeSession,
	isTodayCompleted,
	isTodayStarted,
	loadProgress,
	recordAnswer,
	saveProgress,
	startSession,
	upgradeDifficultyIfEarned,
} from "../lib/progress";
import { getSessionQuestions, SESSION_SIZE, selectQuestions } from "../lib/questions";
import type { Question } from "../lib/types";

type AppState = "loading" | "completed-today" | "quiz" | "answered" | "finished";

const allQuestions = questionsData as Question[];

const DifficultyStars = ({ level }: { level: 1 | 2 | 3 }) => {
	return (
		<span className="text-yellow-400 text-sm">
			{"★".repeat(level)}
			{"☆".repeat(3 - level)}
		</span>
	);
};

const CategoryBadge = ({ category }: { category: string }) => {
	return (
		<span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[160px]">
			{category}
		</span>
	);
};

export const DrillApp = () => {
	const [appState, setAppState] = useState<AppState>("loading");
	const [progress, setProgress] = useState<Progress>(() => loadProgress());
	const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [isCorrect, setIsCorrect] = useState(false);

	const currentQuestion = sessionQuestions[currentIndex];
	const isLastQuestion = currentIndex === SESSION_SIZE - 1;

	// Compute score for finished/completed screens
	const computeScore = useCallback((p: Progress, questions: Question[]): number => {
		if (!p.currentSession) return 0;
		return questions.filter((q) => p.currentSession?.answers[q.id]?.correct === true).length;
	}, []);

	useEffect(() => {
		const p = loadProgress();

		if (isTodayCompleted(p)) {
			setProgress(p);
			if (p.currentSession) {
				const qs = getSessionQuestions(allQuestions, p.currentSession.questionIds);
				setSessionQuestions(qs);
			}
			setAppState("completed-today");
			return;
		}

		if (isTodayStarted(p)) {
			// Resume session
			const qs = getSessionQuestions(allQuestions, p.currentSession?.questionIds ?? []);
			const answeredCount = Object.keys(p.currentSession?.answers ?? {}).length;
			setProgress(p);
			setSessionQuestions(qs);
			setCurrentIndex(answeredCount);
			setAppState("quiz");
			return;
		}

		// Start new session
		const selected = selectQuestions(allQuestions, p);
		const ids = selected.map((q) => q.id);
		const newProgress = startSession(p, ids);
		saveProgress(newProgress);
		setProgress(newProgress);
		setSessionQuestions(selected);
		setCurrentIndex(0);
		setAppState("quiz");
	}, []);

	const handleAnswer = useCallback(
		(optionIndex: number) => {
			if (appState !== "quiz" || !currentQuestion) return;
			const correct = optionIndex === currentQuestion.correct;
			setSelectedAnswer(optionIndex);
			setIsCorrect(correct);

			const newProgress = recordAnswer(progress, currentQuestion.id, optionIndex, correct);
			saveProgress(newProgress);
			setProgress(newProgress);
			setAppState("answered");
		},
		[appState, currentQuestion, progress]
	);

	const handleNext = useCallback(() => {
		if (isLastQuestion) {
			// Complete session
			let newProgress = completeSession(progress);
			newProgress = upgradeDifficultyIfEarned(
				newProgress,
				allQuestions.map((q) => ({ id: q.id, difficulty: q.difficulty }))
			);
			saveProgress(newProgress);
			setProgress(newProgress);
			setAppState("finished");
		} else {
			setCurrentIndex((i) => i + 1);
			setSelectedAnswer(null);
			setIsCorrect(false);
			setAppState("quiz");
		}
	}, [isLastQuestion, progress]);

	if (appState === "loading") {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-slate-400 text-lg">読み込み中...</div>
			</div>
		);
	}

	if (appState === "completed-today") {
		const score = computeScore(progress, sessionQuestions);
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 py-8 text-center">
				<div className="text-5xl">✅</div>
				<h1 className="text-2xl font-bold text-slate-800">今日の5問は完了しています</h1>
				<div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm">
					<p className="text-slate-500 text-sm mb-2">本日のスコア</p>
					<p className="text-4xl font-bold text-blue-600">
						{score}
						<span className="text-xl text-slate-500 font-normal"> / {SESSION_SIZE}問正解</span>
					</p>
				</div>
				<p className="text-slate-400 text-sm">また明日チャレンジしましょう！</p>
			</div>
		);
	}

	if (appState === "finished") {
		const score = computeScore(progress, sessionQuestions);
		const javaTrapCount = sessionQuestions.filter((q) => q.java_trap).length;
		const interviewCount = sessionQuestions.filter((q) => q.interview_likely).length;
		return (
			<div className="flex flex-col items-center gap-6 px-4 py-8 text-center">
				<div className="text-6xl">🎉</div>
				<h1 className="text-2xl font-bold text-slate-800">お疲れ様でした！</h1>
				<div className="bg-white rounded-2xl shadow p-6 w-full">
					<p className="text-slate-500 text-sm mb-2">本日のスコア</p>
					<p className="text-5xl font-bold text-blue-600">
						{score}
						<span className="text-xl text-slate-500 font-normal"> / {SESSION_SIZE}</span>
					</p>
					<p className="text-slate-500 mt-1">問正解</p>
				</div>
				<div className="flex gap-3 flex-wrap justify-center">
					{javaTrapCount > 0 && (
						<span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-sm px-3 py-1.5 rounded-full font-medium">
							⚠ Java罠 {javaTrapCount}問含む
						</span>
					)}
					{interviewCount > 0 && (
						<span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-sm px-3 py-1.5 rounded-full font-medium">
							🎯 面接頻出 {interviewCount}問含む
						</span>
					)}
				</div>
				{progress.difficultyLevel > loadProgress().difficultyLevel && (
					<div className="bg-green-50 border border-green-200 rounded-xl p-4 w-full text-green-700 text-sm font-medium">
						難易度がアップしました！{" "}
						<DifficultyStars level={progress.difficultyLevel as 1 | 2 | 3} />
					</div>
				)}
			</div>
		);
	}

	if (!currentQuestion) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<div className="text-slate-400">問題を読み込めませんでした</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 px-4 py-4">
			{/* Top bar */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<CategoryBadge category={currentQuestion.category} />
					<DifficultyStars level={currentQuestion.difficulty} />
				</div>
				<span className="text-slate-500 text-sm font-medium shrink-0">
					{currentIndex + 1} / {SESSION_SIZE}
				</span>
			</div>

			{/* Progress bar */}
			<div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
				<div
					className="h-full bg-blue-500 rounded-full transition-all duration-300"
					style={{ width: `${(currentIndex / SESSION_SIZE) * 100}%` }}
				/>
			</div>

			{/* Question */}
			<div className="bg-white rounded-2xl shadow-sm p-5">
				<p className="text-slate-800 text-base font-medium leading-relaxed">
					{currentQuestion.question}
				</p>
			</div>

			{/* Code block */}
			{currentQuestion.code !== "" && (
				<div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
					<pre className="text-green-300 text-sm font-mono leading-relaxed whitespace-pre">
						{currentQuestion.code}
					</pre>
				</div>
			)}

			{/* Options */}
			<div className="flex flex-col gap-3">
				{currentQuestion.options.map((option, index) => {
					const optionLetter = ["A", "B", "C", "D"][index] ?? String(index);
					let buttonClass =
						"w-full text-left px-4 py-4 rounded-xl border-2 text-sm font-medium transition-colors duration-200 min-h-[52px] ";

					if (appState === "answered") {
						if (index === currentQuestion.correct) {
							buttonClass += "border-green-500 bg-green-50 text-green-800";
						} else if (index === selectedAnswer && !isCorrect) {
							buttonClass += "border-red-400 bg-red-50 text-red-800";
						} else {
							buttonClass += "border-slate-200 bg-white text-slate-400";
						}
					} else {
						buttonClass +=
							"border-slate-200 bg-white text-slate-700 active:bg-slate-50 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
					}

					return (
						<button
							key={`${currentQuestion.id}-option-${optionLetter}`}
							type="button"
							className={buttonClass}
							onClick={() => handleAnswer(index)}
							disabled={appState === "answered"}
						>
							{option}
						</button>
					);
				})}
			</div>

			{/* Explanation */}
			{appState === "answered" && (
				<div
					className={`rounded-xl p-4 border-l-4 ${
						isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-400"
					}`}
				>
					<p className="text-sm font-semibold mb-1 text-slate-700">
						{isCorrect ? "✅ 正解！" : "❌ 不正解"}
					</p>
					<p className="text-sm text-slate-600 leading-relaxed">{currentQuestion.explanation}</p>
					{currentQuestion.java_trap && (
						<span className="inline-block mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
							⚠ Java罠に注意
						</span>
					)}
					{currentQuestion.interview_likely && (
						<span className="inline-block mt-2 ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
							🎯 面接頻出
						</span>
					)}
				</div>
			)}

			{/* Next button */}
			{appState === "answered" && (
				<button
					type="button"
					onClick={handleNext}
					className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl text-base transition-colors duration-200 min-h-[52px]"
				>
					{isLastQuestion ? "結果を見る" : "次へ →"}
				</button>
			)}
		</div>
	);
};
