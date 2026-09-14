/**
 * OpenCut-Style Media Panel
 *
 * Professional assets library panel with:
 * - Dnd from file explorer / system
 * - Grid and list views
 * - Video, audio, and image thumbnails
 * - Draggable items to timeline
 * - Quick "Add to Timeline" button
 * - Sort by name, date, type, duration
 */

import {
	FileAudio,
	FileImage,
	FileVideo,
	Funnel,
	GridFour,
	List,
	MagnifyingGlass,
	Plus,
	SpinnerGap,
	Trash,
	UploadSimple,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
	useMediaLibraryStore,
	mediaLibraryActions,
	importMediaFiles,
	processMediaFile,
	getSortedMediaItems,
	formatMediaDuration,
	formatFileSize,
	type MediaLibraryItem,
	type MediaSortBy,
} from "../state/useMediaLibraryStore";

interface MediaPanelProps {
	onAddToTimeline?: (item: MediaLibraryItem) => void;
	onImportMedia?: () => void;
	videoPath?: string | null;
}

export function MediaPanel({
	onAddToTimeline,
	onImportMedia,
	videoPath,
}: MediaPanelProps) {
	const { items, viewMode, sortBy, sortOrder, isImporting, selectedMediaId } =
		useMediaLibraryStore();
	const [isDragOver, setIsDragOver] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSortMenu, setShowSortMenu] = useState(false);

	// Filter and sort items
	const filteredItems = useMemo(() => {
		let list = items;
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((x) => x.name.toLowerCase().includes(q));
		}
		return getSortedMediaItems(list, sortBy, sortOrder);
	}, [items, searchQuery, sortBy, sortOrder]);

	// Handle native OS drag-over and drop
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);

		const files = e.dataTransfer.files;
		if (!files || files.length === 0) return;

		mediaLibraryActions.setIsImporting(true);
		let importedCount = 0;

		try {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const path = (file as unknown as { path?: string }).path;
				if (path) {
					const item = await processMediaFile(path);
					if (item) {
						mediaLibraryActions.addItem(item);
						importedCount++;
					}
				}
			}

			if (importedCount > 0) {
				toast.success(
					`Imported ${importedCount} file${importedCount > 1 ? "s" : ""}`,
				);
			} else {
				toast.error("Could not process dropped files");
			}
		} catch (err) {
			toast.error(`Import failed: ${String(err)}`);
		} finally {
			mediaLibraryActions.setIsImporting(false);
		}
	}, []);

	const handleImportClick = () => {
		if (onImportMedia && !videoPath) {
			onImportMedia();
		} else {
			importMediaFiles();
		}
	};

	return (
		<div
			className="relative flex h-full flex-col overflow-hidden bg-editor-panel select-none"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{/* Panel Header */}
			<div className="flex h-11 flex-shrink-0 items-center justify-between border-b border-foreground/[0.08] px-3">
				<div className="flex items-center gap-1.5">
					<span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
						Assets
					</span>
					{items.length > 0 && (
						<span className="rounded-full bg-foreground/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
							{items.length}
						</span>
					)}
				</div>

				{/* Header Actions */}
				<div className="flex items-center gap-1">
					{/* Sort dropdown toggle */}
					<div className="relative">
						<button
							type="button"
							title="Sort media"
							onClick={() => setShowSortMenu((v) => !v)}
							className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/80 hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
						>
							<Funnel className="h-3.5 w-3.5" />
						</button>

						{/* Sort dropdown menu */}
						{showSortMenu && (
							<div className="absolute right-0 top-8 z-30 w-36 rounded-lg border border-foreground/[0.12] bg-[#18181b] p-1 shadow-xl">
								{(["date", "name", "type", "duration"] as MediaSortBy[]).map(
									(key) => (
										<button
											key={key}
											type="button"
											className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-[11px] capitalize transition-colors ${
												sortBy === key
													? "bg-[#2563EB]/15 font-semibold text-[#2563EB]"
													: "text-foreground/80 hover:bg-foreground/[0.06]"
											}`}
											onClick={() => {
												mediaLibraryActions.setSortBy(key);
												setShowSortMenu(false);
											}}
										>
											<span>{key}</span>
											{sortBy === key && (
												<span className="text-[10px] opacity-70">
													{sortOrder === "asc" ? "↑" : "↓"}
												</span>
											)}
										</button>
									),
								)}
							</div>
						)}
					</div>

					{/* View mode toggle (Grid / List) */}
					<button
						type="button"
						title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
						onClick={() =>
							mediaLibraryActions.setViewMode(
								viewMode === "grid" ? "list" : "grid",
							)
						}
						className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/80 hover:bg-foreground/[0.06] hover:text-foreground transition-colors"
					>
						{viewMode === "grid" ? (
							<List className="h-3.5 w-3.5" />
						) : (
							<GridFour className="h-3.5 w-3.5" />
						)}
					</button>

					{/* Import Button */}
					<button
						type="button"
						title="Import media files"
						onClick={handleImportClick}
						disabled={isImporting}
						className="flex h-7 items-center gap-1.5 rounded-md bg-[#2563EB] px-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8] active:scale-[0.98] transition-all disabled:opacity-50"
					>
						{isImporting ? (
							<SpinnerGap className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Plus className="h-3.5 w-3.5" weight="bold" />
						)}
						<span>Import</span>
					</button>
				</div>
			</div>

			{/* Search input (visible when items > 3) */}
			{items.length > 3 && (
				<div className="border-b border-foreground/[0.06] px-3 py-1.5">
					<div className="flex items-center gap-2 rounded-lg bg-foreground/[0.04] px-2.5 py-1 text-xs text-muted-foreground">
						<MagnifyingGlass className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search assets..."
							className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
						/>
					</div>
				</div>
			)}

			{/* Processing banner */}
			{isImporting && (
				<div className="flex items-center gap-2 border-b border-[#2563EB]/20 bg-[#2563EB]/10 px-3 py-2 text-xs text-[#2563EB]">
					<SpinnerGap className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
					<span className="font-medium">Importing media...</span>
				</div>
			)}

			{/* Active Project Video Indicator */}
			{videoPath && (
				<div className="mx-3 mt-2.5 flex items-center gap-2 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/5 p-2">
					<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#2563EB]/20 text-[#2563EB]">
						<FileVideo className="h-4 w-4" weight="fill" />
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-1.5">
							<span className="rounded bg-[#2563EB]/20 px-1 py-0.2 text-[9px] font-bold text-[#2563EB]">
								PRIMARY
							</span>
							<p className="truncate text-[11px] font-medium text-foreground/90">
								{videoPath.split(/[\\/]/).pop()}
							</p>
						</div>
						<p className="text-[10px] text-muted-foreground/60">
							Active screen recording
						</p>
					</div>
				</div>
			)}

			{/* Main Content Area */}
			<div
				className="flex-1 overflow-y-auto p-3"
				style={{ scrollbarWidth: "none" }}
			>
				{items.length === 0 ? (
					/* OpenCut Empty Dropzone */
					<div
						onClick={handleImportClick}
						className={`group flex h-52 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed text-center transition-all ${
							isDragOver
								? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
								: "border-foreground/[0.14] bg-foreground/[0.02] hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5"
						}`}
					>
						<div
							className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-110 ${
								isDragOver ? "bg-[#2563EB]/20 text-[#2563EB]" : "bg-foreground/[0.06] text-muted-foreground"
							}`}
						>
							<UploadSimple className="h-6 w-6" weight="bold" />
						</div>
						<div className="flex flex-col gap-1 px-4">
							<p className="text-xs font-semibold text-foreground/85">
								Import media files
							</p>
							<p className="text-[11px] text-muted-foreground/70 leading-relaxed">
								Drag and drop videos, audio, or images here
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-center gap-1 px-4">
							{["MP4", "MOV", "MP3", "WAV", "PNG", "JPG"].map((ext) => (
								<span
									key={ext}
									className="rounded bg-foreground/[0.05] px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/70"
								>
									{ext}
								</span>
							))}
						</div>
					</div>
				) : viewMode === "grid" ? (
					/* Grid View (OpenCut Cards) */
					<div className="grid grid-cols-2 gap-2.5">
						{filteredItems.map((item) => (
							<MediaGridCard
								key={item.id}
								item={item}
								isSelected={item.id === selectedMediaId}
								onSelect={() => mediaLibraryActions.setSelectedMediaId(item.id)}
								onAddToTimeline={() => onAddToTimeline?.(item)}
								onDelete={() => mediaLibraryActions.removeItem(item.id)}
							/>
						))}
					</div>
				) : (
					/* List View */
					<div className="flex flex-col gap-1.5">
						{filteredItems.map((item) => (
							<MediaListRow
								key={item.id}
								item={item}
								isSelected={item.id === selectedMediaId}
								onSelect={() => mediaLibraryActions.setSelectedMediaId(item.id)}
								onAddToTimeline={() => onAddToTimeline?.(item)}
								onDelete={() => mediaLibraryActions.removeItem(item.id)}
							/>
						))}
					</div>
				)}
			</div>

			{/* Drag overlay feedback */}
			<AnimatePresence>
				{isDragOver && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-[#2563EB]/15 backdrop-blur-[2px] border-2 border-dashed border-[#2563EB]"
					>
						<UploadSimple className="h-10 w-10 text-[#2563EB] animate-bounce" weight="bold" />
						<span className="text-xs font-bold text-[#2563EB]">
							Drop to add to library
						</span>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ─── Grid Item Card ────────────────────────────────────────────────────────────

function MediaGridCard({
	item,
	isSelected,
	onSelect,
	onAddToTimeline,
	onDelete,
}: {
	item: MediaLibraryItem;
	isSelected: boolean;
	onSelect: () => void;
	onAddToTimeline: () => void;
	onDelete: () => void;
}) {
	const [isHovered, setIsHovered] = useState(false);

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData(
			"application/json",
			JSON.stringify({ type: "netra-media", mediaId: item.id, item }),
		);
		e.dataTransfer.setData("text/plain", item.id);
		e.dataTransfer.effectAllowed = "copy";
	};

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={onSelect}
			className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
				isSelected
					? "border-[#2563EB] ring-1 ring-[#2563EB] bg-foreground/[0.04]"
					: "border-foreground/[0.08] bg-foreground/[0.02] hover:border-foreground/[0.18] hover:bg-foreground/[0.04]"
			}`}
		>
			{/* Thumbnail Area (16:9) */}
			<div className="relative aspect-video w-full overflow-hidden bg-black/40">
				{item.thumbnailUrl ? (
					<img
						src={item.thumbnailUrl}
						alt={item.name}
						className="h-full w-full object-cover"
						draggable={false}
					/>
				) : item.type === "audio" ? (
					<div className="flex h-full w-full items-center justify-center bg-purple-950/40 text-purple-400">
						<FileAudio className="h-7 w-7" weight="fill" />
					</div>
				) : item.type === "image" ? (
					<div className="flex h-full w-full items-center justify-center bg-teal-950/40 text-teal-400">
						<FileImage className="h-7 w-7" weight="fill" />
					</div>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-blue-950/40 text-blue-400">
						<FileVideo className="h-7 w-7" weight="fill" />
					</div>
				)}

				{/* Type badge top-left */}
				<div className="absolute left-1.5 top-1.5 flex items-center rounded bg-black/70 px-1 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm">
					{item.type === "video" && <FileVideo className="h-2.5 w-2.5 mr-0.5 text-blue-400" />}
					{item.type === "audio" && <FileAudio className="h-2.5 w-2.5 mr-0.5 text-purple-400" />}
					{item.type === "image" && <FileImage className="h-2.5 w-2.5 mr-0.5 text-teal-400" />}
					<span className="uppercase">{item.type}</span>
				</div>

				{/* Duration badge bottom-right */}
				{item.duration !== undefined && item.duration > 0 && (
					<div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-mono font-medium text-white/90 backdrop-blur-sm">
						{formatMediaDuration(item.duration)}
					</div>
				)}

				{/* Hover Action Overlay */}
				<AnimatePresence>
					{isHovered && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 backdrop-blur-[1px]"
						>
							{/* Add to timeline button */}
							<button
								type="button"
								title="Add to timeline"
								onClick={(e) => {
									e.stopPropagation();
									onAddToTimeline();
								}}
								className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-md hover:scale-110 active:scale-95 transition-transform"
							>
								<Plus className="h-4 w-4" weight="bold" />
							</button>

							{/* Delete button */}
							<button
								type="button"
								title="Remove from library"
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/80 text-white shadow-md hover:scale-110 active:scale-95 transition-transform"
							>
								<Trash className="h-3.5 w-3.5" />
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Label & Details */}
			<div className="flex flex-col p-1.5">
				<p
					title={item.name}
					className="truncate text-[11px] font-medium text-foreground/90"
				>
					{item.name}
				</p>
				{item.size > 0 && (
					<p className="text-[10px] text-muted-foreground/60">
						{formatFileSize(item.size)}
					</p>
				)}
			</div>
		</div>
	);
}

// ─── List Item Row ─────────────────────────────────────────────────────────────

function MediaListRow({
	item,
	isSelected,
	onSelect,
	onAddToTimeline,
	onDelete,
}: {
	item: MediaLibraryItem;
	isSelected: boolean;
	onSelect: () => void;
	onAddToTimeline: () => void;
	onDelete: () => void;
}) {
	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData(
			"application/json",
			JSON.stringify({ type: "netra-media", mediaId: item.id, item }),
		);
		e.dataTransfer.setData("text/plain", item.id);
		e.dataTransfer.effectAllowed = "copy";
	};

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onClick={onSelect}
			className={`group flex items-center gap-2 rounded-lg border p-1.5 transition-all cursor-grab active:cursor-grabbing ${
				isSelected
					? "border-[#2563EB] bg-[#2563EB]/10"
					: "border-foreground/[0.06] bg-foreground/[0.02] hover:border-foreground/[0.14] hover:bg-foreground/[0.04]"
			}`}
		>
			{/* Thumbnail thumbnail */}
			<div className="relative h-10 w-14 flex-shrink-0 overflow-hidden rounded bg-black/40">
				{item.thumbnailUrl ? (
					<img
						src={item.thumbnailUrl}
						alt={item.name}
						className="h-full w-full object-cover"
						draggable={false}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
						{item.type === "audio" && <FileAudio className="h-5 w-5 text-purple-400" />}
						{item.type === "image" && <FileImage className="h-5 w-5 text-teal-400" />}
						{item.type === "video" && <FileVideo className="h-5 w-5 text-blue-400" />}
					</div>
				)}
			</div>

			{/* Details */}
			<div className="min-w-0 flex-1">
				<p
					title={item.name}
					className="truncate text-[11px] font-medium text-foreground/90"
				>
					{item.name}
				</p>
				<div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
					<span className="capitalize">{item.type}</span>
					{item.duration !== undefined && item.duration > 0 && (
						<>
							<span>·</span>
							<span>{formatMediaDuration(item.duration)}</span>
						</>
					)}
				</div>
			</div>

			{/* Actions on hover */}
			<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				<button
					type="button"
					title="Add to timeline"
					onClick={(e) => {
						e.stopPropagation();
						onAddToTimeline();
					}}
					className="flex h-6 w-6 items-center justify-center rounded bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
				>
					<Plus className="h-3 w-3" weight="bold" />
				</button>
				<button
					type="button"
					title="Delete"
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 hover:bg-red-500/10 hover:text-red-500"
				>
					<Trash className="h-3 w-3" />
				</button>
			</div>
		</div>
	);
}
