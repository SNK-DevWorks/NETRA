import type { ComponentProps } from "react";
import { EditorAnnouncementBanner } from "@/components/announcements/EditorAnnouncementBanner";
import { Toaster } from "@/components/ui/sonner";
import type { useI18n } from "@/contexts/I18nContext";
import { usePanelResize } from "@/hooks/usePanelResize";
import type { useEditorExportController } from "../export/useEditorExportController";
import type { useExportDimensions } from "../export/useExportDimensions";
import type { useExportSession } from "../export/useExportSession";
import type { useExportSettings } from "../export/useExportSettings";
import type { useTimelineEditingController } from "../hooks/useTimelineEditingController";
import type { useVideoEditorPresets } from "../presets/useVideoEditorPresets";
import type { useEditorProjectController } from "../project/useEditorProjectController";
import { SettingsPanel } from "../SettingsPanel";
import type { useAppearanceState } from "../state/useAppearanceState";
import type { useEditorUiState } from "../state/useEditorUiState";
import type { useProjectState } from "../state/useProjectState";
import type { useTimelineState } from "../state/useTimelineState";
import { CropEditorDialog } from "./CropEditorDialog";
import { EditorDialogs } from "./EditorDialogs";
import { EditorHeader } from "./EditorHeader";
import { EditorPreviewPanel } from "./EditorPreviewPanel";
import { EditorSidebar } from "./EditorSidebar";
import { EditorTimelinePanel } from "./EditorTimelinePanel";
import { EditorTimelineToolbar } from "./EditorTimelineToolbar";
import { PanelDivider } from "./PanelDivider";
import { useMediaDropHandler } from "../hooks/useMediaDropHandler";
// Inspector empty state icon
import { Gear } from "@phosphor-icons/react";

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	project: ReturnType<typeof useProjectState>;
	appearance: ReturnType<typeof useAppearanceState>;
	timeline: ReturnType<typeof useTimelineState>;
	ui: ReturnType<typeof useEditorUiState>;
	presets: ReturnType<typeof useVideoEditorPresets>;
	projectController: ReturnType<typeof useEditorProjectController>;
	editing: ReturnType<typeof useTimelineEditingController>;
	exportController: ReturnType<typeof useEditorExportController>;
	exportSettings: ReturnType<typeof useExportSettings>;
	exportSession: ReturnType<typeof useExportSession>;
	exportDimensions: ReturnType<typeof useExportDimensions>;
	settingsPanelProps: ComponentProps<typeof SettingsPanel>;
	headerLeftControlsPaddingClass: string;
	headerRightControlsPaddingClass: string;
	hasCaptionsForSidecar: boolean;
	nvidiaCudaExportAvailable: boolean;
	experimentalNvidiaCudaExport: boolean;
	setExperimentalNvidiaCudaExport: (enabled: boolean) => void;
	effectiveShowCursor: boolean;
	previewAspectRatioValue: number;
};

export function EditorShell(props: Props) {
	const {
		t,
		project,
		appearance,
		timeline,
		ui,
		presets,
		projectController,
		editing,
		exportController,
		exportSettings,
		exportSession,
		exportDimensions,
		settingsPanelProps,
		headerLeftControlsPaddingClass,
		headerRightControlsPaddingClass,
		hasCaptionsForSidecar,
		nvidiaCudaExportAvailable,
		experimentalNvidiaCudaExport,
		setExperimentalNvidiaCudaExport,
		effectiveShowCursor,
		previewAspectRatioValue,
	} = props;
	const {
		snapshot,
		history,
		lifecycle,
		autoCaption,
		saveActions,
		openActions,
		hasUnsavedChanges,
	} = projectController;
	const {
		cursor,
		projection,
		audio,
		playback,
		captionCommands,
		zoomCommands,
		clipCommands,
		audioCommands,
		annotationCommands,
		handleSelectAnnotation,
		handleAutoSuggestZoomsConsumed,
	} = editing;
	const { dialogActions, status: exportStatus, exportMessage } = exportController;

	const { addMediaToTimeline, handleDropOnTimeline } = useMediaDropHandler({
		currentTime: ui.currentTime,
		timelineDuration: projection.timelineDuration,
		videoPath: project.videoPath,
		setAudioRegions: timeline.setAudioRegions,
		setAnnotationRegions: timeline.setAnnotationRegions,
		setSelectedAudioId: audioCommands.handleSelectAudio,
		setSelectedAnnotationId: handleSelectAnnotation,
		onImportMedia: openActions.handleImportMediaOrProject,
	});

	const { size: leftWidth, isDragging: leftDragging, dividerProps: leftDividerProps } = usePanelResize({
		storageKey: "netra:panel:left",
		defaultSize: 300,
		min: 240,
		max: 460,
		direction: "horizontal",
	});

	const { size: rightWidth, isDragging: rightDragging, dividerProps: rightDividerProps } = usePanelResize({
		storageKey: "netra:panel:right",
		defaultSize: 270,
		min: 220,
		max: 400,
		direction: "horizontal",
		reverse: true,
	});

	const { size: timelineHeight, isDragging: timelineDragging, dividerProps: timelineDividerProps } = usePanelResize({
		storageKey: "netra:panel:timeline",
		defaultSize: 210,
		min: 150,
		max: 480,
		direction: "vertical",
		reverse: true,
	});

	const editorDialogs = (
		<EditorDialogs
			t={t}
			projectSaveDialogOpen={project.projectSaveDialogOpen}
			setProjectSaveDialogOpen={project.setProjectSaveDialogOpen}
			projectSaveDialogDraft={project.projectSaveDialogDraft}
			setProjectSaveDialogDraft={project.setProjectSaveDialogDraft}
			projectSaveDialogInputRef={ui.projectSaveDialogInputRef}
			isSavingProjectDialog={project.isSavingProjectDialog}
			resolveProjectSaveDialog={lifecycle.resolveProjectSaveDialog}
			handleProjectSaveDialogSubmit={saveActions.handleProjectSaveDialogSubmit}
			unsavedChangesDialogOpen={project.unsavedChangesDialogOpen}
			setUnsavedChangesDialogOpen={project.setUnsavedChangesDialogOpen}
			unsavedChangesDialogActionLabel={project.unsavedChangesDialogActionLabel}
			resolveUnsavedChangesDialog={lifecycle.resolveUnsavedChangesDialog}
			projectBrowserOpen={project.projectBrowserOpen}
			setProjectBrowserOpen={project.setProjectBrowserOpen}
			projectLibraryEntries={project.projectLibraryEntries}
			projectBrowserAnchorRef={
				project.error ? ui.projectBrowserFallbackTriggerRef : ui.projectBrowserTriggerRef
			}
			handleImportMediaOrProject={openActions.handleImportMediaOrProject}
			handleOpenProjectFromLibrary={openActions.handleOpenProjectFromLibrary}
			nativeCaptureUnavailableModalOpen={ui.nativeCaptureUnavailableModalOpen}
			setNativeCaptureUnavailableModalOpen={ui.setNativeCaptureUnavailableModalOpen}
		/>
	);
	if (project.loading)
		return (
			<div className="flex h-screen items-center justify-center bg-background">
				<div className="text-foreground">Loading video...</div>
				{editorDialogs}
				<Toaster className="pointer-events-auto" />
			</div>
		);
	if (project.error)
		return (
			<div className="flex h-screen items-center justify-center bg-editor-bg p-6 text-foreground">
				<div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-8 text-center shadow-2xl backdrop-blur-xl">
					<div className="rounded-full bg-foreground/10 p-3.5 text-foreground">
						<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div>
						<h2 className="text-base font-semibold text-foreground">No Video Loaded</h2>
						<p className="mt-1 text-xs text-muted-foreground">{project.error}</p>
					</div>
					<div className="flex items-center gap-2 mt-2">
						<button
							type="button"
							onClick={openActions.handleImportMediaOrProject}
							className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-blue-600"
						>
							Open Video File
						</button>
						<button
							ref={ui.projectBrowserFallbackTriggerRef}
							type="button"
							onClick={openActions.handleOpenProjectBrowser}
							className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/10"
						>
							Open Projects
						</button>
					</div>
				</div>
				{editorDialogs}
				<Toaster className="pointer-events-auto" />
			</div>
		);

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-editor-bg text-foreground selection:bg-[#2563EB]/30">
			<EditorHeader
				t={t}
				headerLeftControlsPaddingClass={headerLeftControlsPaddingClass}
				headerRightControlsPaddingClass={headerRightControlsPaddingClass}
				project={project}
				projectBrowserTriggerRef={ui.projectBrowserTriggerRef}
				projectNameInputRef={ui.projectNameInputRef}
				projectDisplayName={snapshot.projectDisplayName}
				hasUnsavedChanges={hasUnsavedChanges}
				canUndo={history.canUndo}
				canRedo={history.canRedo}
				handleOpenProjectBrowser={openActions.handleOpenProjectBrowser}
				handleUndo={history.handleUndo}
				handleRedo={history.handleRedo}
				handleProjectNameSubmit={saveActions.handleProjectNameSubmit}
				closeProjectNameEditor={saveActions.closeProjectNameEditor}
				presets={presets}
				exportSettings={exportSettings}
				exportSession={exportSession}
				exportDimensions={exportDimensions}
				exportStatus={exportStatus}
				hasCaptionsForSidecar={hasCaptionsForSidecar}
				nvidiaCudaExportAvailable={nvidiaCudaExportAvailable}
				experimentalNvidiaCudaExport={experimentalNvidiaCudaExport}
				setExperimentalNvidiaCudaExport={setExperimentalNvidiaCudaExport}
				handleOpenExportDropdown={dialogActions.handleOpenExportDropdown}
				handleExportDropdownClose={dialogActions.handleExportDropdownClose}
				handleCancelExport={dialogActions.handleCancelExport}
				handleRetrySaveExport={dialogActions.handleRetrySaveExport}
				handleStartExportFromDropdown={dialogActions.handleStartExportFromDropdown}
				revealExportedFile={dialogActions.revealExportedFile}
				exportMessage={exportMessage}
			/>
			<EditorAnnouncementBanner />

			{/* ── Main workspace: top row (sidebar | preview) + bottom (timeline) ── */}
			<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-2.5 pb-2.5 gap-1.5">

				{/* Top row: left sidebar | drag handle | video preview | drag handle | inspector */}
				<div className="relative z-10 flex min-h-0 flex-1 gap-1 overflow-hidden">
					<EditorSidebar
						t={t}
						activeSection={ui.activeEffectSection}
						setActiveSection={ui.setActiveEffectSection}
						settingsPanelProps={settingsPanelProps}
						width={leftWidth}
						onImportMedia={openActions.handleImportMediaOrProject}
						videoPath={project.videoPath}
						onAddToTimeline={addMediaToTimeline}
					/>

					<PanelDivider
						direction="horizontal"
						isDragging={leftDragging}
						{...leftDividerProps}
					/>

					<EditorPreviewPanel
						t={t}
						videoPath={project.videoPath}
						previewVersion={ui.previewVersion}
						aspectRatio={ui.aspectRatio}
						setAspectRatio={ui.setAspectRatio}
						previewAspectRatioValue={previewAspectRatioValue}
						videoPlaybackRef={ui.videoPlaybackRef}
						timelineRef={ui.timelineRef}
						currentTime={ui.currentTime}
						isPlaying={ui.isPlaying}
						previewVolume={ui.previewVolume}
						setPreviewVolume={ui.setPreviewVolume}
						suspendRendering={exportStatus.shouldSuspendPreviewRendering}
						appearance={appearance}
						timeline={timeline}
						audio={audio}
						projection={projection}
						playback={playback}
						zoomCommands={zoomCommands}
						annotationCommands={annotationCommands}
						effectiveCursorTelemetry={cursor.effectiveCursorTelemetry}
						effectiveShowCursor={effectiveShowCursor}
						isCropped={ui.isCropped}
						handleOpenCropEditor={ui.handleOpenCropEditor}
						handleSaveAutoCaptionEdit={autoCaption.handleSaveAutoCaptionEdit}
						handleSelectAnnotation={handleSelectAnnotation}
						setDuration={ui.setDuration}
						setIsPreviewReady={ui.setIsPreviewReady}
						setCurrentTime={ui.setCurrentTime}
						setIsPlaying={ui.setIsPlaying}
						setError={project.setError}
					/>

					{/* Right drag handle | Inspector panel */}
					<PanelDivider
						direction="horizontal"
						isDragging={rightDragging}
						{...rightDividerProps}
					/>
					<EditorInspectorPanel width={rightWidth} />
				</div>

				{/* Vertical drag handle between top row and timeline card */}
				<PanelDivider
					direction="vertical"
					isDragging={timelineDragging}
					{...timelineDividerProps}
				/>

				{/* Timeline section: toolbar + tracks in a dedicated CapCut-style card */}
				<div
					className="flex flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-foreground/[0.08] bg-editor-panel shadow-sm"
					style={{ height: timelineHeight }}
				>
					<EditorTimelineToolbar
						t={t}
						currentTime={ui.currentTime}
						duration={projection.timelineDuration}
						timelineRef={ui.timelineRef}
						clipCommands={clipCommands}
						timeline={timeline}
					/>
					<EditorTimelinePanel
						timelineRef={ui.timelineRef}
						timeline={timeline}
						projection={projection}
						playback={playback}
						audio={audio}
						zoomCommands={zoomCommands}
						clipCommands={clipCommands}
						audioCommands={audioCommands}
						captionCommands={captionCommands}
						annotationCommands={annotationCommands}
						videoPath={project.videoPath}
						videoSourcePath={project.videoSourcePath}
						cursorTelemetrySourcePath={timeline.cursorTelemetrySourcePath}
						normalizedCursorTelemetry={cursor.normalizedCursorTelemetry}
						autoSuggestZoomsTrigger={ui.autoSuggestZoomsTrigger}
						handleAutoSuggestZoomsConsumed={handleAutoSuggestZoomsConsumed}
						disableSuggestedZooms={!appearance.autoApplyFreshRecordingAutoZooms}
						currentTime={ui.currentTime}
						handleSelectAnnotation={handleSelectAnnotation}
						onDropMedia={handleDropOnTimeline}
					/>
				</div>
			</div>

			{editorDialogs}
			<CropEditorDialog
				open={ui.showCropModal}
				t={t}
				videoElement={ui.videoPlaybackRef.current?.video ?? null}
				cropRegion={appearance.cropRegion}
				setCropRegion={appearance.setCropRegion}
				aspectRatio={ui.aspectRatio}
				onCancel={ui.handleCancelCropEditor}
				onDone={ui.handleCloseCropEditor}
			/>
			<Toaster className="pointer-events-auto" />
		</div>
	);
}

// ─── Inspector Panel (right column, OpenCut-style) ─────────────────────────────

function EditorInspectorPanel({ width }: { width: number }) {
	return (
		<div
			className="flex flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-foreground/[0.08] bg-editor-panel shadow-sm"
			style={{ width }}
		>
			{/* Header */}
			<div className="flex h-10 flex-shrink-0 items-center border-b border-foreground/[0.06] bg-foreground/[0.02] px-3">
				<Gear className="mr-2 h-3.5 w-3.5 text-muted-foreground/60" />
				<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Inspector
				</span>
			</div>

			{/* Empty state — shows until a timeline element is selected */}
			<div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/[0.05]">
					<Gear className="h-6 w-6 text-muted-foreground/40" weight="regular" />
				</div>
				<div className="flex flex-col gap-1.5">
					<p className="text-sm font-medium text-foreground/70">It&apos;s empty here</p>
					<p className="text-xs text-muted-foreground/60 leading-relaxed">
						Click an element on the timeline to edit its properties
					</p>
				</div>
			</div>
		</div>
	);
}
