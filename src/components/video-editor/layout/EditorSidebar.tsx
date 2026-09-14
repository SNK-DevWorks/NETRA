import {
	Camera,
	ClosedCaptioning,
	Cursor,
	Gear,
	PuzzlePiece,
	Sparkle,
	FolderOpen,
	SpeakerHigh,
	type Icon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import type { useI18n } from "@/contexts/I18nContext";
import ExtensionManager from "../ExtensionManager";
import { MediaPanel } from "../panels/MediaPanel";
import { SettingsPanel } from "../SettingsPanel";
import type { MediaLibraryItem } from "../state/useMediaLibraryStore";
import type { EditorEffectSection } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SidebarTab =
	| "media"
	| "audio"
	| "captions"
	| "scene"
	| "cursor"
	| "webcam"
	| "settings"
	| "extensions";

type Props = {
	t: ReturnType<typeof useI18n>["t"];
	activeSection: EditorEffectSection;
	setActiveSection: Dispatch<SetStateAction<EditorEffectSection>>;
	settingsPanelProps: ComponentProps<typeof SettingsPanel>;
	width: number;
	/** Callback to open the native file picker and import a video/project */
	onImportMedia: () => void;
	/** Currently loaded video path (null if nothing is loaded) */
	videoPath: string | null;
	/** Optional callback when user adds an imported media item to the timeline */
	onAddToTimeline?: (item: MediaLibraryItem) => void;
};

// ─── Tab Config ───────────────────────────────────────────────────────────────

type TabConfig = {
	id: SidebarTab;
	label: string;
	icon: Icon;
	effectSection?: EditorEffectSection;
};

// ─── Tab Rail Scroll Fades ─────────────────────────────────────────────────────

function FadeOverlay({
	direction,
	show,
}: {
	direction: "top" | "bottom";
	show: boolean;
}) {
	if (!show) return null;
	return (
		<div
			className={[
				"pointer-events-none absolute left-0 right-0 h-5 z-10",
				direction === "top"
					? "top-0 bg-gradient-to-b from-editor-panel to-transparent"
					: "bottom-0 bg-gradient-to-t from-editor-panel to-transparent",
			].join(" ")}
		/>
	);
}

// ─── Single Tab Button ─────────────────────────────────────────────────────────

function TabButton({
	tab,
	isActive,
	onClick,
}: {
	tab: TabConfig;
	isActive: boolean;
	onClick: () => void;
}) {
	const Icon = tab.icon;
	return (
		<div className="flex items-center" title={tab.label}>
			<motion.button
				type="button"
				onClick={onClick}
				aria-label={tab.label}
				aria-pressed={isActive}
				className="group relative flex h-9 w-9 items-center justify-center rounded-lg outline-none focus:outline-none focus-visible:outline-none"
				animate={{ opacity: isActive ? 1 : 0.5 }}
				whileHover={{ opacity: 0.85 }}
				transition={{ duration: 0.13 }}
			>
				{isActive && (
					<motion.span
						layoutId="sidebar-rail-active-bg"
						className="absolute inset-0 rounded-lg bg-foreground/[0.08]"
						transition={{ type: "spring", stiffness: 460, damping: 36 }}
					/>
				)}
				<motion.span
					className="relative z-10"
					animate={{
						color: isActive ? "#2563EB" : "hsl(var(--foreground))",
					}}
					transition={{ duration: 0.13 }}
				>
					<Icon
						className="h-[22px] w-[22px]"
						weight={isActive ? "fill" : "regular"}
					/>
				</motion.span>
			</motion.button>

			{/* Active indicator dot */}
			<div className="ml-1.5 h-1.5 w-1.5 flex-shrink-0">
				<AnimatePresence>
					{isActive && (
						<motion.span
							key="dot"
							layoutId="sidebar-rail-dot"
							className="block h-1.5 w-1.5 rounded-full bg-[#2563EB]"
							initial={{ opacity: 0, scale: 0.4 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.4 }}
							transition={{ type: "spring", stiffness: 500, damping: 32 }}
						/>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

// ─── Icon Tab Rail ─────────────────────────────────────────────────────────────

function SidebarTabRail({
	tabs,
	activeTab,
	onTabChange,
}: {
	tabs: TabConfig[];
	activeTab: SidebarTab;
	onTabChange: (tab: SidebarTab) => void;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showTopFade, setShowTopFade] = useState(false);
	const [showBottomFade, setShowBottomFade] = useState(false);

	const checkScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		setShowTopFade(el.scrollTop > 0);
		setShowBottomFade(el.scrollTop < el.scrollHeight - el.clientHeight - 1);
	}, []);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		checkScroll();
		el.addEventListener("scroll", checkScroll, { passive: true });
		const ro = new ResizeObserver(checkScroll);
		ro.observe(el);
		return () => {
			el.removeEventListener("scroll", checkScroll);
			ro.disconnect();
		};
	}, [checkScroll]);

	return (
		<div className="relative flex flex-shrink-0 flex-col border-r border-foreground/[0.06] bg-editor-panel">
			<div
				ref={scrollRef}
				className="flex flex-col items-center gap-0.5 overflow-y-auto px-1.5 py-2"
				style={{ scrollbarWidth: "none" }}
			>
				{tabs.map((tab) => (
					<TabButton
						key={tab.id}
						tab={tab}
						isActive={activeTab === tab.id}
						onClick={() => onTabChange(tab.id)}
					/>
				))}
			</div>
			<FadeOverlay direction="top" show={showTopFade} />
			<FadeOverlay direction="bottom" show={showBottomFade} />
		</div>
	);
}

// ─── Panel View Wrapper (matches OpenCut PanelView) ────────────────────────────

function PanelView({
	title,
	children,
	actions,
}: {
	title?: string;
	children: React.ReactNode;
	actions?: React.ReactNode;
}) {
	return (
		<div className="relative flex h-full flex-col overflow-hidden">
			{title && (
				<div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-foreground/[0.06] bg-foreground/[0.02] pl-3 pr-2">
					<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						{title}
					</span>
					{actions}
				</div>
			)}
			<div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
				{children}
			</div>
		</div>
	);
}

// ─── Main EditorSidebar ────────────────────────────────────────────────────────

export function EditorSidebar({
	t,
	activeSection,
	setActiveSection,
	settingsPanelProps,
	width,
	onImportMedia,
	videoPath,
	onAddToTimeline,
}: Props) {
	const [activeTab, setActiveTab] = useState<SidebarTab>("scene");

	const tabs: TabConfig[] = useMemo(
		() => [
			{
				id: "media",
				label: t("sidebar.tabs.media", "Media"),
				icon: FolderOpen,
			},
			{
				id: "audio",
				label: t("sidebar.tabs.audio", "Audio"),
				icon: SpeakerHigh,
			},
			{
				id: "captions",
				label: t("sidebar.tabs.captions", "Captions"),
				icon: ClosedCaptioning,
			},
			{
				id: "scene",
				label: t("settings.sections.scene", "Scene"),
				icon: Sparkle,
				effectSection: "scene",
			},
			{
				id: "cursor",
				label: t("settings.sections.cursor", "Cursor"),
				icon: Cursor,
				effectSection: "cursor",
			},
			{
				id: "webcam",
				label: t("settings.sections.webcam", "Webcam"),
				icon: Camera,
				effectSection: "webcam",
			},
			{
				id: "settings",
				label: t("settings.sections.settings", "Settings"),
				icon: Gear,
				effectSection: "settings",
			},
			{
				id: "extensions",
				label: t("settings.sections.extensions", "Extensions"),
				icon: PuzzlePiece,
			},
		],
		[t],
	);

	// When a tab that maps to an effectSection is selected, keep activeSection in sync
	const handleTabChange = useCallback(
		(tab: SidebarTab) => {
			setActiveTab(tab);
			const found = tabs.find((x) => x.id === tab);
			if (found?.effectSection) {
				setActiveSection(found.effectSection as EditorEffectSection);
			} else if (tab === "captions") {
				setActiveSection("captions" as EditorEffectSection);
			}
		},
		[tabs, setActiveSection],
	);

	// Keep activeTab in sync if the parent changes activeSection externally
	useEffect(() => {
		const matching = tabs.find((t) => t.effectSection === activeSection);
		if (matching) {
			setActiveTab(matching.id);
		} else if (activeSection === "captions") {
			setActiveTab("captions");
		}
	}, [activeSection, tabs]);

	// Decide what content to render for the active tab
	const panelContent = useMemo(() => {
		if (activeTab === "media") {
			return (
				<MediaPanel
					onAddToTimeline={onAddToTimeline}
					onImportMedia={onImportMedia}
					videoPath={videoPath}
				/>
			);
		}
		if (activeTab === "extensions") {
			return (
				<PanelView title={t("settings.sections.extensions", "Extensions")}>
					<ExtensionManager />
				</PanelView>
			);
		}
		// All other tabs (audio, captions, scene, cursor, webcam, settings) go through SettingsPanel
		// The activeSection on the SettingsPanel controls which sub-section is shown
		return <SettingsPanel {...settingsPanelProps} />;
	}, [activeTab, t, settingsPanelProps, onAddToTimeline, onImportMedia, videoPath]);

	return (
		<div
			className="flex flex-shrink-0 h-full min-h-0 overflow-hidden rounded-2xl border border-foreground/[0.08] bg-editor-panel shadow-sm"
			style={{ width }}
		>
			{/* Left: icon tab rail */}
			<SidebarTabRail
				tabs={tabs}
				activeTab={activeTab}
				onTabChange={handleTabChange}
			/>

			{/* Right: panel content */}
			<div className="relative flex flex-1 min-w-0 flex-col overflow-hidden">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={activeTab}
						className="flex h-full flex-col"
						initial={{ opacity: 0, x: -6 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 6 }}
						transition={{ duration: 0.13, ease: "easeOut" }}
					>
						{panelContent}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
