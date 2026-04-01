"use client";
import { useProjectStore } from "@/lib/hooks/projectStore";
import type { PromptType, WordListType } from "@/lib/types/blather";
import { getListMaps } from "@/lib/util/list";
import { useMemo, useState } from "react";

export function TailoredWordSuggestionList({
	promptData,
	onSelect,
	onAdd,
	onRemove,
}: {
	promptData: PromptType;
	onSelect?: (list: string) => void;
	onAdd?: (word: string, list: string) => void;
	onRemove?: (word: string, list: string) => void;
}) {
	const sentenceStructures = useProjectStore(
		(state) => state.sentenceStructures,
	);
	const wordLists = useProjectStore((state) => state.wordLists);
	const { tailoredWords } = promptData;
	const listMap: Record<string, WordListType> = {};
	for (const wordList of wordLists) {
		listMap[wordList.name] = wordList;
	}

	const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

	const toggleList = (key: string) => {
		setExpandedLists((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const { topLevelListKeys, subLevelListKeys } = useMemo(() => {
		const { topLevelListKeys, subLevelListKeys } = getListMaps({
			promptData,
			wordLists,
			sentenceStructures,
		});
		return { topLevelListKeys, subLevelListKeys };
	}, [promptData, wordLists, sentenceStructures]);

	// Track which (word, list) pairs have already been added
	const addedWords = new Set<string>();
	for (const tw of tailoredWords) {
		addedWords.add(`${tw.word}::${tw.list.slice(1, -1)}`);
	}
	const isAdded = (word: string, list: string) =>
		addedWords.has(`${word}::${list}`);

	const sortedKeys = [
		...Array.from(subLevelListKeys).toSorted(),
		...Array.from(topLevelListKeys)
			.filter((k) => !subLevelListKeys.has(k))
			.toSorted(),
	];

	const expandableKeys = sortedKeys.filter(
		(k) => (listMap[k]?.words ?? []).length > 0,
	);
	const allExpanded =
		expandableKeys.length > 0 &&
		expandableKeys.every((k) => expandedLists.has(k));

	return (
		<div className="border-r-2 border-slate-600 mt-2 p-2 flex-1">
			<div className="flex items-center justify-between mb-1">
				<h4 className="font-semibold text-lg">Suggestions</h4>
				{expandableKeys.length > 0 && (
					<button
						type="button"
						className="text-xs text-blue-600 underline"
						onClick={() =>
							setExpandedLists(
								allExpanded ? new Set() : new Set(expandableKeys),
							)
						}
					>
						{allExpanded ? "Collapse all" : "Expand all"}
					</button>
				)}
			</div>
			<p className="text-sm text-slate-500 mb-2">
				Click or drag a list/word to add it to tailored words.
			</p>
			<div data-id="modal-tailored-suggestion-container">
				{sortedKeys.length === 0 ? (
					<span>No suggestions available.</span>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
						{sortedKeys.map((key) => {
							const wordsInList = listMap[key]?.words ?? [];
							const isExpanded = expandedLists.has(key);
							const listAlreadyAdded = isAdded(`<${key}>`, key);
							return (
								<div key={key} className="flex flex-col gap-1">
									{/* List chip */}
									<button
										type="button"
										draggable
										onDragStart={(e) => {
											e.dataTransfer.setData(
												"application/x-tailored-word",
												JSON.stringify({ word: `<${key}>`, list: key }),
											);
											e.dataTransfer.effectAllowed = "copy";
										}}
										className={`rounded-md truncate p-1 cursor-pointer text-left transition-opacity ${
											listAlreadyAdded
												? "bg-blue-200 text-blue-800 opacity-60"
												: "bg-blue-400 text-white"
										}`}
										title={
											listAlreadyAdded
												? `<${key}> already added — click/drag to add again`
												: `Click or drag to add <${key}> → ${key}`
										}
										onClick={() => {
											if (listAlreadyAdded) {
												onRemove?.(`<${key}>`, key);
											} else if (onAdd) {
												onAdd(`<${key}>`, key);
											} else {
												onSelect?.(key);
											}
										}}
									>
										{listAlreadyAdded ? "✓ " : ""}{key}
									</button>
									{/* Expand/collapse words */}
									{wordsInList.length > 0 && (
										<>
											<button
												type="button"
												className="text-xs text-blue-600 underline text-left px-1"
												onClick={() => toggleList(key)}
											>
												{isExpanded
													? "Hide words"
													: `Show ${wordsInList.length} word${wordsInList.length !== 1 ? "s" : ""}`}
											</button>
											{isExpanded && (
												<div className="flex flex-wrap gap-1 pl-1">
													{wordsInList.map((w, i) => {
														const wordAdded = isAdded(w.word, key);
														return (
															<span
																key={i}
																draggable
																onDragStart={(e) => {
																	e.dataTransfer.setData(
																		"application/x-tailored-word",
																		JSON.stringify({ word: w.word, list: key }),
																	);
																	e.dataTransfer.effectAllowed = "copy";
																}}
																onClick={() => wordAdded ? onRemove?.(w.word, key) : onAdd?.(w.word, key)}
																className={`text-xs rounded px-2 py-0.5 cursor-pointer transition-opacity ${
																	wordAdded
																		? "bg-slate-100 text-slate-400 opacity-60"
																		: "bg-slate-200 text-slate-800"
																}`}
																title={
																	wordAdded
																		? `"${w.word}" already added — click/drag to add again`
																		: `Click or drag to add "${w.word}" → ${key}`
																}
															>
																{wordAdded ? "✓ " : ""}{w.word}
															</span>
														);
													})}
												</div>
											)}
										</>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
