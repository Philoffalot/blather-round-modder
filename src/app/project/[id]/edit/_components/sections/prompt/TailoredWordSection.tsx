import type { PromptType } from "@/lib/types/blather";
import { produce } from "immer";
import { useRef, useState } from "react";
import { TailoredWordEditSection } from "../../TailoredWordEditSection";
import { TailoredWordSuggestionList } from "./TailoredWordSuggestionList";
import { TailoredWordTileList } from "./TailoredWordTileList";

export function TailoredWordSection({
	setPromptData,
	promptData,
}: { setPromptData: (data: PromptType) => void; promptData: PromptType }) {
	const [list, setList] = useState("");
	const [isDragOver, setIsDragOver] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const addTailoredWord = (word: string, list: string) => {
		setPromptData(
			produce(promptData, (draft) => {
				draft.tailoredWords.push({ word, list: `<${list}>` });
			}),
		);
	};

	const removeTailoredWord = (word: string, list: string) => {
		setPromptData(
			produce(promptData, (draft) => {
				draft.tailoredWords = draft.tailoredWords.filter(
					(tw) => !(tw.word === word && tw.list === `<${list}>`),
				);
			}),
		);
	};

	return (
		<>
			<TailoredWordEditSection
				list={list}
				inputRef={inputRef}
				setList={setList}
				onSubmit={(word, list) => addTailoredWord(word, list)}
			/>
			<div className="flex flex-col-reverse md:flex-row gap-2 overflow-hidden">
				<TailoredWordSuggestionList
					promptData={promptData}
					onSelect={(data) => {
						setList(data);
						inputRef.current?.focus();
					}}
					onAdd={(word, list) => addTailoredWord(word, list)}
					onRemove={(word, list) => removeTailoredWord(word, list)}
				/>
				{/* Drop zone wrapping the tile list */}
				<div
					className={`flex-1 rounded-md transition-colors ${
						isDragOver
							? "outline-dashed outline-2 outline-blue-400 bg-blue-50"
							: ""
					}`}
					onDragOver={(e) => {
						if (e.dataTransfer.types.includes("application/x-tailored-word")) {
							e.preventDefault();
							e.dataTransfer.dropEffect = "copy";
							setIsDragOver(true);
						}
					}}
					onDragLeave={() => setIsDragOver(false)}
					onDrop={(e) => {
						e.preventDefault();
						setIsDragOver(false);
						const raw = e.dataTransfer.getData("application/x-tailored-word");
						if (!raw) return;
						try {
							const { word, list } = JSON.parse(raw) as {
								word: string;
								list: string;
							};
							if (word && list) addTailoredWord(word, list);
						} catch {
							// ignore malformed drag data
						}
					}}
				>
					{isDragOver && (
						<div className="text-blue-500 text-sm text-center pt-2 pointer-events-none">
							Drop to add tailored word
						</div>
					)}
					<TailoredWordTileList
						promptData={promptData}
						setPromptData={setPromptData}
					/>
				</div>
			</div>
		</>
	);
}
