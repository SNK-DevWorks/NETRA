import {
	ArrowClockwise as Redo2,
	ArrowCounterClockwise as Undo2,
} from "@phosphor-icons/react";
import netraLogo from "@/assets/netra-logo.png";
import type { CSSProperties, FormEvent, RefObject } from "react";
import { Button } from "@/components/ui/button";
import type { useI18n } from "@/contexts/I18nContext";
import type { useExportDimensions } from "../export/useExportDimensions";
import type { useExportSession } from "../export/useExportSession";
import type { useExportSettings } from "../export/useExportSettings";
import type { useExportStatusViewModel } from "../export/useExportStatusViewModel";
import type { useVideoEditorPresets } from "../presets/useVideoEditorPresets";
import type { useProjectState } from "../state/useProjectState";

import { EditorExportMenu } from "./EditorExportMenu";
import { EditorPresetMenu } from "./EditorPresetMenu";

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	headerLeftControlsPaddingClass: string;
	headerRightControlsPaddingClass: string;
	project: ReturnType<typeof useProjectState>;
	projectBrowserTriggerRef: RefObject<HTMLButtonElement>;
	projectNameInputRef: RefObject<HTMLInputElement>;
	projectDisplayName: string;
	hasUnsavedChanges: boolean;
	canUndo: boolean;
	canRedo: boolean;
	handleOpenProjectBrowser: () => void;
	handleUndo: () => void;
	handleRedo: () => void;
	handleProjectNameSubmit: (event?: FormEvent<HTMLFormElement>) => void;
	closeProjectNameEditor: () => void;
	presets: ReturnType<typeof useVideoEditorPresets>;
	exportSettings: ReturnType<typeof useExportSettings>;
	exportSession: ReturnType<typeof useExportSession>;
	exportDimensions: ReturnType<typeof useExportDimensions>;
	exportStatus: ReturnType<typeof useExportStatusViewModel>;
	hasCaptionsForSidecar: boolean;
	nvidiaCudaExportAvailable: boolean;
	experimentalNvidiaCudaExport: boolean;
	setExperimentalNvidiaCudaExport: (enabled: boolean) => void;
	handleOpenExportDropdown: () => void;
	handleExportDropdownClose: () => void;
	handleCancelExport: () => void;
	handleRetrySaveExport: () => void;
	handleStartExportFromDropdown: () => void;
	revealExportedFile: () => void;
	exportMessage: string | null;
};

export function EditorHeader(props: Props) {
	const {
		t,
		headerLeftControlsPaddingClass,
		headerRightControlsPaddingClass,
		project,
		projectBrowserTriggerRef,
		projectNameInputRef,
		projectDisplayName,
		hasUnsavedChanges,
		canUndo,
		canRedo,
		handleOpenProjectBrowser,
		handleUndo,
		handleRedo,
		handleProjectNameSubmit,
		closeProjectNameEditor,
		presets,
		exportSettings,
		exportSession,
		exportDimensions,
		exportStatus,
		hasCaptionsForSidecar,
		nvidiaCudaExportAvailable,
		experimentalNvidiaCudaExport,
		setExperimentalNvidiaCudaExport,
		handleOpenExportDropdown,
		handleExportDropdownClose,
		handleCancelExport,
		handleRetrySaveExport,
		handleStartExportFromDropdown,
		revealExportedFile,
		exportMessage,
	} = props;
	const {
		isEditingProjectName,
		setIsEditingProjectName,
		projectNameDraft,
		setProjectNameDraft,
		isSavingProjectName,
	} = project;

	return (
		<div
			className={`relative z-50 flex h-11 flex-shrink-0 items-center justify-between border-b border-foreground/10 bg-editor-header/88 pl-4 backdrop-blur-md ${headerRightControlsPaddingClass || "pr-4"}`}
			style={{ WebkitAppRegion: "drag" } as CSSProperties}
		>
			{/* Left: Open projects + Project Name */}
			<div
				className={`flex items-center justify-self-start gap-2 ${headerLeftControlsPaddingClass}`}
				style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
			>
				<button
					ref={projectBrowserTriggerRef}
					type="button"
					onClick={handleOpenProjectBrowser}
					className="group relative flex h-8 w-8 items-center justify-center rounded-lg outline-none transition-transform hover:scale-105 active:scale-95 focus:outline-none"
					title={t("editor.project.projects", "Open projects")}
					aria-label={t("editor.project.projects", "Open projects")}
				>
					<img
						src={netraLogo}
						alt="Netra"
						className="h-6 w-6 rounded-md object-contain select-none"
						draggable={false}
					/>
				</button>

				{isEditingProjectName ? (
					<form
						onSubmit={(event) => void handleProjectNameSubmit(event)}
						className="flex max-w-[260px] items-baseline gap-1 rounded-md border border-foreground/15 bg-editor-panel/90 px-2 py-0.5 shadow-sm"
					>
						{hasUnsavedChanges ? (
							<span className="mt-[1px] size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
						) : null}
						<input
							ref={projectNameInputRef}
							type="text"
							value={projectNameDraft}
							onChange={(event) => setProjectNameDraft(event.target.value)}
							onBlur={() => {
								if (!isSavingProjectName) closeProjectNameEditor();
							}}
							onKeyDown={(event) => {
								if (event.key === "Escape") {
									event.preventDefault();
									closeProjectNameEditor();
								}
							}}
							disabled={isSavingProjectName}
							className="min-w-[8ch] max-w-[200px] bg-transparent text-xs font-semibold tracking-tight text-foreground/95 outline-none placeholder:text-muted-foreground/60 disabled:cursor-wait"
							style={{ width: `${Math.max(projectNameDraft.length, 8)}ch` }}
							aria-label={t("editor.project.renameInput", "Project name")}
						/>
						<span className="shrink-0 text-[10px] font-medium tracking-tight text-muted-foreground/60">
							.netra
						</span>
					</form>
				) : (
					<button
						type="button"
						onClick={() => setIsEditingProjectName(true)}
						className="inline-flex max-w-[260px] items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-foreground/5"
						title={t("editor.project.renameTitle", "Rename project")}
						aria-label={t("editor.project.renameTitle", "Rename project")}
					>
						{hasUnsavedChanges ? (
							<span className="size-1.5 shrink-0 rounded-full bg-[#2563EB]" />
						) : null}
						<span className="truncate text-xs font-semibold tracking-tight text-foreground/90">
							{projectDisplayName}
						</span>
						<span className="shrink-0 text-[10px] font-medium tracking-tight text-muted-foreground/50">
							.netra
						</span>
					</button>
				)}
			</div>

			{/* Center: Undo & Redo (OpenCut style) */}
			<div
				className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1"
				style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
			>
				<Button
					type="button"
					variant="ghost"
					onClick={handleUndo}
					disabled={!canUndo}
					className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 bg-foreground/5 p-0 text-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
					title={t("common.actions.undo", "Undo")}
					aria-label={t("common.actions.undo", "Undo")}
				>
					<Undo2 className="h-3.5 w-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					onClick={handleRedo}
					disabled={!canRedo}
					className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-foreground/10 bg-foreground/5 p-0 text-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
					title={t("common.actions.redo", "Redo")}
					aria-label={t("common.actions.redo", "Redo")}
				>
					<Redo2 className="h-3.5 w-3.5" />
				</Button>
			</div>

			{/* Right: Presets + Export Button */}
			<div
				className="flex items-center gap-1.5 justify-self-end"
				style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
			>
				<EditorPresetMenu t={t} presets={presets} />
				<EditorExportMenu
					t={t}
					exportSettings={exportSettings}
					exportSession={exportSession}
					exportDimensions={exportDimensions}
					exportStatus={exportStatus}
					hasCaptionsForSidecar={hasCaptionsForSidecar}
					nvidiaCudaExportAvailable={nvidiaCudaExportAvailable}
					experimentalNvidiaCudaExport={experimentalNvidiaCudaExport}
					setExperimentalNvidiaCudaExport={setExperimentalNvidiaCudaExport}
					handleOpenExportDropdown={handleOpenExportDropdown}
					handleExportDropdownClose={handleExportDropdownClose}
					handleCancelExport={handleCancelExport}
					handleRetrySaveExport={handleRetrySaveExport}
					handleStartExportFromDropdown={handleStartExportFromDropdown}
					revealExportedFile={revealExportedFile}
					exportMessage={exportMessage}
				/>
			</div>
		</div>
	);
}
