import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ProjectBrowserDialog, { type ProjectLibraryEntry } from "../ProjectBrowserDialog";

export type UnsavedChangesDecision = "cancel" | "discard" | "save";

type Translator = (
	key: string,
	fallback?: string,
	params?: Record<string, string | number>,
) => string;

interface EditorDialogsProps {
	t: Translator;
	projectSaveDialogOpen: boolean;
	setProjectSaveDialogOpen: Dispatch<SetStateAction<boolean>>;
	projectSaveDialogDraft: string;
	setProjectSaveDialogDraft: Dispatch<SetStateAction<string>>;
	projectSaveDialogInputRef: RefObject<HTMLInputElement>;
	isSavingProjectDialog: boolean;
	resolveProjectSaveDialog: (saved: boolean) => void;
	handleProjectSaveDialogSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
	unsavedChangesDialogOpen: boolean;
	setUnsavedChangesDialogOpen: Dispatch<SetStateAction<boolean>>;
	unsavedChangesDialogActionLabel: string;
	resolveUnsavedChangesDialog: (decision: UnsavedChangesDecision) => void;
	projectBrowserOpen: boolean;
	setProjectBrowserOpen: Dispatch<SetStateAction<boolean>>;
	projectLibraryEntries: ProjectLibraryEntry[];
	projectBrowserAnchorRef: RefObject<HTMLButtonElement>;
	handleImportMediaOrProject: () => Promise<void>;
	handleOpenProjectFromLibrary: (projectPath: string) => Promise<void>;
	nativeCaptureUnavailableModalOpen: boolean;
	setNativeCaptureUnavailableModalOpen: Dispatch<SetStateAction<boolean>>;
}

export function EditorDialogs({
	t,
	projectSaveDialogOpen,
	setProjectSaveDialogOpen,
	projectSaveDialogDraft,
	setProjectSaveDialogDraft,
	projectSaveDialogInputRef,
	isSavingProjectDialog,
	resolveProjectSaveDialog,
	handleProjectSaveDialogSubmit,
	unsavedChangesDialogOpen,
	setUnsavedChangesDialogOpen,
	unsavedChangesDialogActionLabel,
	resolveUnsavedChangesDialog,
	projectBrowserOpen,
	setProjectBrowserOpen,
	projectLibraryEntries,
	projectBrowserAnchorRef,
	handleImportMediaOrProject,
	handleOpenProjectFromLibrary,
	nativeCaptureUnavailableModalOpen,
	setNativeCaptureUnavailableModalOpen,
}: EditorDialogsProps) {
	return (
		<>
			<Dialog
				open={projectSaveDialogOpen}
				onOpenChange={(open) => {
					if (open) setProjectSaveDialogOpen(true);
					else if (!isSavingProjectDialog) resolveProjectSaveDialog(false);
				}}
			>
				<DialogContent className="max-w-sm border-foreground/10 bg-editor-dialog text-foreground">
					<form onSubmit={(event) => void handleProjectSaveDialogSubmit(event)}>
						<DialogHeader>
							<DialogTitle>
								{t("editor.project.saveTitle", "Save Project")}
							</DialogTitle>
							<DialogDescription className="text-muted-foreground">
								{t(
									"editor.project.saveDescription",
									"Name this project. It will be saved in your NETRA Projects folder.",
								)}
							</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<label className="mb-2 block text-xs font-medium text-muted-foreground">
								{t("editor.project.saveNameLabel", "Project name")}
							</label>
							<div className="flex items-center overflow-hidden rounded-md border border-foreground/10 bg-editor-panel">
								<Input
									ref={projectSaveDialogInputRef}
									value={projectSaveDialogDraft}
									onChange={(event) =>
										setProjectSaveDialogDraft(event.target.value)
									}
									disabled={isSavingProjectDialog}
									className="h-10 flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
									aria-label={t("editor.project.saveNameLabel", "Project name")}
								/>
								<span className="shrink-0 px-3 text-xs font-medium text-muted-foreground/70">
									.netra
								</span>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => resolveProjectSaveDialog(false)}
								disabled={isSavingProjectDialog}
							>
								{t("common.actions.cancel", "Cancel")}
							</Button>
							<Button type="submit" disabled={isSavingProjectDialog}>
								{isSavingProjectDialog
									? t("editor.project.saving", "Saving...")
									: t("common.actions.save", "Save")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={unsavedChangesDialogOpen}
				onOpenChange={(open) => {
					if (open) setUnsavedChangesDialogOpen(true);
					else resolveUnsavedChangesDialog("cancel");
				}}
			>
				<DialogContent className="max-w-[270px] border-none bg-transparent p-0 shadow-none overflow-visible [&>button:last-child]:hidden">
					<div className="flex w-full flex-col select-none">
						{/* Top Confirmation Card */}
						<div className="overflow-hidden rounded-[14px] border border-black/[0.08] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.38)] dark:border-white/[0.12] dark:bg-[#1e1e20] dark:shadow-[0_20px_50px_rgba(0,0,0,0.75)]">
							<div className="px-4 py-3.5 text-center">
								<DialogTitle className="text-[13px] font-semibold text-[#8e8e93] tracking-normal leading-tight dark:text-[#a1a1a6]">
									{unsavedChangesDialogActionLabel === "close the editor" || !unsavedChangesDialogActionLabel
										? t("editor.project.unsavedChangesHeading", "Save changes before closing?")
										: t("editor.project.unsavedChangesHeading", "Save changes?")}
								</DialogTitle>
								<DialogDescription className="sr-only">
									{t("editor.project.unsavedChangesTitle", "Unsaved changes")}
								</DialogDescription>
							</div>
							<div className="h-[0.5px] bg-[#3c3c43]/[0.18] dark:bg-white/[0.1]" />
							<button
								type="button"
								onClick={() => resolveUnsavedChangesDialog("save")}
								className="flex h-11 w-full items-center justify-center text-[17px] font-normal text-[#007AFF] transition-colors hover:bg-black/[0.04] active:bg-black/[0.08] dark:text-[#0A84FF] dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1] focus:outline-none"
							>
								{t("editor.project.save", "Save")}
							</button>
							<div className="h-[0.5px] bg-[#3c3c43]/[0.18] dark:bg-white/[0.1]" />
							<button
								type="button"
								onClick={() => resolveUnsavedChangesDialog("discard")}
								className="flex h-11 w-full items-center justify-center text-[17px] font-normal text-[#FF3B30] transition-colors hover:bg-black/[0.04] active:bg-black/[0.08] dark:text-[#FF453A] dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1] focus:outline-none"
							>
								{t("editor.project.dontSave", "Don't Save")}
							</button>
						</div>

						{/* Separate Bottom Cancel Card */}
						<div className="mt-2 overflow-hidden rounded-[14px] border border-black/[0.08] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.38)] dark:border-white/[0.12] dark:bg-[#1e1e20] dark:shadow-[0_20px_50px_rgba(0,0,0,0.75)]">
							<button
								type="button"
								onClick={() => resolveUnsavedChangesDialog("cancel")}
								className="flex h-11 w-full items-center justify-center text-[17px] font-semibold text-[#007AFF] transition-colors hover:bg-black/[0.04] active:bg-black/[0.08] dark:text-[#0A84FF] dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1] focus:outline-none"
							>
								{t("common.actions.cancel", "Cancel")}
							</button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<ProjectBrowserDialog
				open={projectBrowserOpen}
				onOpenChange={setProjectBrowserOpen}
				entries={projectLibraryEntries}
				anchorRef={projectBrowserAnchorRef}
				onImportFile={() => void handleImportMediaOrProject()}
				onOpenProject={(projectPath) => void handleOpenProjectFromLibrary(projectPath)}
			/>

			<Dialog
				open={nativeCaptureUnavailableModalOpen}
				onOpenChange={setNativeCaptureUnavailableModalOpen}
			>
				<DialogContent className="max-w-md bg-editor-dialog border-foreground/10 text-foreground">
					<DialogHeader>
						<DialogTitle>
							{t(
								"editor.nativeCaptureUnavailable.title",
								"Nothing’s broken, but we won’t be able to render an animated cursor overlay.",
							)}
						</DialogTitle>
						<DialogDescription className="text-muted-foreground">
							{t(
								"editor.nativeCaptureUnavailable.description",
								"Your device does not support native capture. This could be for a variety of reasons we haven’t figured out yet. This doesn’t break NETRA, but it does make cursor smoothing impossible.",
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={() => setNativeCaptureUnavailableModalOpen(false)}>
							{t("editor.nativeCaptureUnavailable.confirm", "Okay")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
