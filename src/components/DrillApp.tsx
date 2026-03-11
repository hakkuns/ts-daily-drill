import type React from "react";
import { useCallback, useEffect, useState } from "react";
import questionsData from "../data/questions.json";
import type { Progress } from "../lib/progress";
import {
	completeSession,
	loadProgress,
	recordAnswer,
	saveProgress,
	startSession,
	upgradeDifficultyIfEarned,
} from "../lib/progress";
import { hasRemainingQuestions, SESSION_SIZE, selectQuestions } from "../lib/questions";
import type { Question } from "../lib/types";

type AppState = "loading" | "quiz" | "answered" | "finished";

const allQuestions = questionsData as Question[];

// バッククォートで囲まれたコードをインラインコード要素に変換する
const renderText = (text: string): React.ReactNode => {
	const parts = text.split(/`([^`]+)`/);
	return parts.map((part, i) =>
		i % 2 === 1 ? (
			<code
				key={i}
				className="font-mono bg-slate-100 text-sky-700 px-1 py-0.5 rounded text-[0.9em] border border-slate-200 break-words"
			>
				{part}
			</code>
		) : (
			part
		)
	);
};

// コードが「ブロック表示」に値するかどうか判定
const isBlockCode = (code: string): boolean =>
	code.length >= 35 || code.includes("{") || code.includes("\n");

// 1行のTypeScriptコードを適切に改行・インデントする
const formatCode = (raw: string): string => {
	if (raw.includes("\n")) return raw;
	let depth = 0; // {} の深さ
	let out = "";
	let i = 0;
	while (i < raw.length) {
		const c = raw[i];
		if (c === "{") {
			depth++;
			out = out.trimEnd();
			out += ` {\n${"  ".repeat(depth)}`;
			if (raw[i + 1] === " ") i++;
			i++;
			continue;
		}
		if (c === "}") {
			out = out.trimEnd();
			depth = Math.max(0, depth - 1);
			out += `\n${"  ".repeat(depth)}}`;
			if (raw[i + 1] === ";") {
				out += ";";
				i++;
			} else if (raw[i + 1] === " ") {
				const upcoming = raw.slice(i + 2);
				if (upcoming.startsWith("catch") || upcoming.startsWith("else")) {
					out += " ";
				} else if (upcoming.length > 0) {
					out += `\n${"  ".repeat(depth)}`;
				}
				i++;
			}
			i++;
			continue;
		}
		if (c === ";") {
			out += ";";
			if (raw[i + 1] === " " && i + 2 < raw.length) {
				out += `\n${"  ".repeat(depth)}`;
				i++;
			}
			i++;
			continue;
		}
		// depth === 0 の && / || で改行（論理演算子チェーンを視覚的に分割）
		if (
			c === " " &&
			depth === 0 &&
			i + 3 < raw.length &&
			(raw.slice(i + 1, i + 3) === "&&" || raw.slice(i + 1, i + 3) === "||") &&
			raw[i + 3] === " "
		) {
			const op = raw.slice(i + 1, i + 3);
			out += ` ${op}\n  `;
			i += 4; // " && " or " || " の4文字をスキップ
			continue;
		}
		out += c;
		i++;
	}
	return out.trim();
};

// 選択肢テキスト専用レンダラー：長いコードはミニエディター風に表示
const renderOption = (text: string): React.ReactNode => {
	const parts = text.split(/`([^`]+)`/);
	return parts.map((part, i) => {
		if (i % 2 === 0) return part;
		if (!isBlockCode(part)) {
			return (
				<code
					key={i}
					className="font-mono bg-slate-100 text-sky-700 px-1 py-0.5 rounded text-[0.9em] border border-slate-200 break-words"
				>
					{part}
				</code>
			);
		}
		const lines = formatCode(part).split("\n");
		return (
			<span
				key={i}
				className="block mt-2 rounded-lg overflow-hidden border border-slate-600 text-left"
			>
				<span className="flex items-center gap-2 bg-slate-800 px-3 py-1">
					<span className="flex gap-1">
						<span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
						<span className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
						<span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
					</span>
					<span className="text-slate-500 text-xs font-mono">TypeScript</span>
				</span>
				<span className="block bg-[#1e1e1e] px-0 py-2 overflow-x-auto">
					{lines.map((line, li) => (
						<span key={li} className="flex leading-6">
							<span className="text-slate-600 select-none text-xs font-mono text-right w-8 shrink-0 px-2">
								{li + 1}
							</span>
							<span className="font-mono text-sm text-slate-200 whitespace-pre-wrap break-words pr-3">
								{line}
							</span>
						</span>
					))}
				</span>
			</span>
		);
	});
};

// コードエディター風のコードブロック
const CodeBlock = ({ code }: { code: string }) => {
	const lines = code.split("\n");
	return (
		<div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg">
			<div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
				<div className="flex gap-1.5">
					<div className="w-3 h-3 rounded-full bg-red-500" />
					<div className="w-3 h-3 rounded-full bg-yellow-400" />
					<div className="w-3 h-3 rounded-full bg-green-500" />
				</div>
				<span className="text-slate-400 text-xs font-mono ml-2">TypeScript</span>
			</div>
			<div className="bg-[#1e1e1e] px-0 py-3 overflow-x-auto">
				<table className="w-full border-collapse">
					<tbody>
						{lines.map((line, i) => (
							<tr key={i} className="leading-6">
								<td className="text-slate-600 select-none text-right pr-4 pl-4 text-xs font-mono w-8 align-top">
									{i + 1}
								</td>
								<td className="text-slate-200 text-sm font-mono whitespace-pre pr-4">{line}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const DifficultyStars = ({ level }: { level: 1 | 2 | 3 }) => (
	<span className="text-yellow-400 text-sm">
		{"★".repeat(level)}
		{"☆".repeat(3 - level)}
	</span>
);

const CategoryBadge = ({ category }: { category: string }) => (
	<span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full truncate max-w-[160px]">
		{category}
	</span>
);

// 問題ごとの正解/不正解をドットで表示
const ProgressDots = ({
	answers,
	current,
	total,
}: {
	answers: (boolean | null)[];
	current: number;
	total: number;
}) => (
	<div className="flex gap-2 justify-center items-center">
		{Array.from({ length: total }, (_, i) => {
			const ans = answers[i];
			if (ans === true)
				return (
					<div
						key={i}
						className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
					>
						✓
					</div>
				);
			if (ans === false)
				return (
					<div
						key={i}
						className="w-7 h-7 rounded-full bg-red-400 flex items-center justify-center text-white text-xs font-bold shadow-sm"
					>
						✗
					</div>
				);
			if (i === current)
				return (
					<div
						key={i}
						className="w-7 h-7 rounded-full bg-blue-500 border-2 border-blue-600 shadow-sm"
					/>
				);
			return <div key={i} className="w-7 h-7 rounded-full bg-slate-300" />;
		})}
	</div>
);

export const DrillApp = () => {
	const [appState, setAppState] = useState<AppState>("loading");
	const [progress, setProgress] = useState<Progress>(() => loadProgress());
	const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [isCorrect, setIsCorrect] = useState(false);
	const [sessionStartDifficulty, setSessionStartDifficulty] = useState<1 | 2 | 3>(
		() => loadProgress().difficultyLevel
	);
	const [sessionAnswers, setSessionAnswers] = useState<(boolean | null)[]>(
		Array(SESSION_SIZE).fill(null)
	);
	const [questionKey, setQuestionKey] = useState(0);

	const currentQuestion = sessionQuestions[currentIndex];
	const isLastQuestion = currentIndex === SESSION_SIZE - 1;

	const computeScore = useCallback((p: Progress, questions: Question[]): number => {
		if (!p.currentSession) return 0;
		return questions.filter((q) => p.currentSession?.answers[q.id]?.correct === true).length;
	}, []);

	const startNewSession = useCallback((p: Progress) => {
		const effectiveProgress = hasRemainingQuestions(allQuestions, p) ? p : { ...p, questions: {} };
		const selected = selectQuestions(allQuestions, effectiveProgress);
		const ids = selected.map((q) => q.id);
		const newProgress = startSession(effectiveProgress, ids);
		saveProgress(newProgress);
		setSessionStartDifficulty(effectiveProgress.difficultyLevel);
		setProgress(newProgress);
		setSessionQuestions(selected);
		setCurrentIndex(0);
		setSelectedAnswer(null);
		setIsCorrect(false);
		setSessionAnswers(Array(SESSION_SIZE).fill(null));
		setQuestionKey(0);
		setAppState("quiz");
	}, []);

	useEffect(() => {
		startNewSession(loadProgress());
	}, [startNewSession]);

	const handleAnswer = useCallback(
		(optionIndex: number) => {
			if (appState !== "quiz" || !currentQuestion) return;
			const correct = optionIndex === currentQuestion.correct;
			setSelectedAnswer(optionIndex);
			setIsCorrect(correct);
			setSessionAnswers((prev) => {
				const next = [...prev];
				next[currentIndex] = correct;
				return next;
			});

			const newProgress = recordAnswer(progress, currentQuestion.id, optionIndex, correct);
			saveProgress(newProgress);
			setProgress(newProgress);
			setAppState("answered");
		},
		[appState, currentQuestion, progress, currentIndex]
	);

	const handleNext = useCallback(() => {
		if (isLastQuestion) {
			let newProgress = completeSession(progress);
			newProgress = upgradeDifficultyIfEarned(
				newProgress,
				allQuestions.map((q) => ({ id: q.id, difficulty: q.difficulty }))
			);
			saveProgress(newProgress);
			setProgress(newProgress);
			setAppState("finished");
		} else {
			window.scrollTo({ top: 0, behavior: "instant" });
			setQuestionKey((k) => k + 1);
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

	if (appState === "finished") {
		const score = computeScore(progress, sessionQuestions);
		const percentage = Math.round((score / SESSION_SIZE) * 100);
		const questionResults = sessionQuestions.map((q) => ({
			topic: q.topic,
			category: q.category,
			correct: progress.currentSession?.answers[q.id]?.correct ?? false,
			java_trap: q.java_trap,
			interview_likely: q.interview_likely,
		}));

		return (
			<div className="flex flex-col gap-5 px-4 py-6">
				{/* ヘッダー */}
				<div className="text-center">
					<div className="text-5xl mb-2">🎉</div>
					<h1 className="text-xl font-bold text-slate-800">お疲れ様でした！</h1>
				</div>

				{/* スコアカード */}
				<div className="bg-white rounded-2xl shadow-sm p-5">
					<div className="flex items-end justify-between mb-3">
						<div>
							<p className="text-slate-500 text-xs mb-0.5">スコア</p>
							<p className="text-4xl font-bold text-slate-800">
								{score}
								<span className="text-lg text-slate-400 font-normal"> / {SESSION_SIZE}</span>
							</p>
						</div>
						<p className="text-3xl font-bold text-blue-600">{percentage}%</p>
					</div>
					{/* スコアバー */}
					<div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
						<div
							className={`h-full rounded-full transition-all duration-700 ${
								percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-blue-500" : "bg-red-400"
							}`}
							style={{ width: `${percentage}%` }}
						/>
					</div>
				</div>

				{/* 難易度アップ通知 */}
				{progress.difficultyLevel > sessionStartDifficulty && (
					<div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium text-center">
						難易度がアップしました！{" "}
						<DifficultyStars level={progress.difficultyLevel as 1 | 2 | 3} />
					</div>
				)}

				{/* 問題ごとの結果 */}
				<div>
					<p className="text-xs font-medium text-slate-500 mb-2 px-1">問題の結果</p>
					<div className="flex flex-col gap-2">
						{questionResults.map((r, i) => (
							<div
								key={i}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
									r.correct ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
								}`}
							>
								<div
									className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
										r.correct ? "bg-green-500" : "bg-red-400"
									}`}
								>
									{r.correct ? "✓" : "✗"}
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-slate-700 truncate">{r.topic}</p>
									<p className="text-xs text-slate-400 truncate">{r.category}</p>
								</div>
								<div className="flex gap-1 shrink-0">
									{r.java_trap && (
										<span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
											⚠
										</span>
									)}
									{r.interview_likely && (
										<span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
											🎯
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				<button
					type="button"
					onClick={() => startNewSession(progress)}
					className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl text-base transition-colors duration-200 min-h-[52px]"
				>
					もう1セットやる
				</button>
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
		<div className={`flex flex-col gap-4 px-4 py-4 ${appState === "answered" ? "pb-24" : ""}`}>
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

			{/* Progress dots */}
			<ProgressDots answers={sessionAnswers} current={currentIndex} total={SESSION_SIZE} />

			{/* Question (key でフェードアニメーション) */}
			<div key={questionKey} className="question-fade-in">
				<div className="bg-white rounded-2xl shadow-sm p-5">
					<p className="text-slate-800 text-base font-medium leading-relaxed">
						{renderText(currentQuestion.question)}
					</p>
				</div>

				{/* Code block */}
				{currentQuestion.code !== "" && (
					<div className="mt-3">
						<CodeBlock code={currentQuestion.code} />
					</div>
				)}
			</div>

			{/* Options */}
			<div className="flex flex-col gap-3">
				{currentQuestion.options.map((option, index) => {
					const optionLetter = ["A", "B", "C", "D"][index] ?? String(index);
					let buttonClass =
						"w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 min-h-[52px] ";

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
							<div className="flex items-start justify-between gap-2">
								<div className="flex-1">{renderOption(option)}</div>
								{appState === "answered" && index === currentQuestion.correct && (
									<span className="mt-0.5 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0 answer-pop">
										✓
									</span>
								)}
								{appState === "answered" &&
									index === selectedAnswer &&
									index !== currentQuestion.correct && (
										<span className="mt-0.5 w-6 h-6 rounded-full bg-red-400 flex items-center justify-center text-white text-xs font-bold shrink-0 answer-pop">
											✗
										</span>
									)}
							</div>
						</button>
					);
				})}
			</div>

			{/* 解説（スライドイン） */}
			{appState === "answered" && (
				<div
					className={`rounded-xl p-4 border-l-4 explanation-slide-in ${
						isCorrect ? "bg-green-50 border-green-500" : "bg-red-50 border-red-400"
					}`}
				>
					<p className="text-sm font-semibold mb-1.5 text-slate-700">
						{isCorrect ? "✅ 正解！" : "❌ 不正解"}
					</p>
					<p className="text-sm text-slate-600 leading-relaxed">
						{renderText(currentQuestion.explanation)}
					</p>
					<div className="flex gap-1.5 mt-2 flex-wrap">
						{currentQuestion.java_trap && (
							<span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
								⚠ Java罠に注意
							</span>
						)}
						{currentQuestion.interview_likely && (
							<span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
								🎯 面接頻出
							</span>
						)}
					</div>
				</div>
			)}

			{/* 次へボタン（固定フッター） */}
			{appState === "answered" && (
				<div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pt-3 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent">
					<div className="max-w-lg mx-auto">
						<button
							type="button"
							onClick={handleNext}
							className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 rounded-xl text-base transition-colors duration-200 min-h-[52px] shadow-lg"
						>
							{isLastQuestion ? "結果を見る" : "次へ →"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
};
