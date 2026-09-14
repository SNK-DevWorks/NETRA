import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { ShortcutsProvider } from "../../contexts/ShortcutsContext";
import { loadAllCustomFonts } from "../../lib/customFonts";
import { AnnouncementDialog } from "../announcements/AnnouncementDialog";
import { LiveAnnouncementNotifications } from "../announcements/LiveAnnouncementNotifications";
import { ShortcutsConfigDialog } from "./ShortcutsConfigDialog";
import VideoEditor from "./VideoEditor";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

class EditorErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("VideoEditor encountered an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex h-screen w-screen flex-col items-center justify-center bg-editor-bg p-6 text-foreground">
					<div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center shadow-xl backdrop-blur-md">
						<div className="rounded-full bg-destructive/10 p-3 text-destructive">
							<svg
								className="h-8 w-8"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<h2 className="text-lg font-semibold tracking-tight">Editor Failed to Load</h2>
						<p className="text-xs text-muted-foreground break-all">
							{this.state.error?.message || "An unexpected error occurred while rendering the video editor."}
						</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="mt-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
						>
							Reload Editor
						</button>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

export default function EditorWindow() {
	useEffect(() => {
		loadAllCustomFonts().catch((error) => {
			console.error("Failed to load custom fonts:", error);
		});
	}, []);

	return (
		<EditorErrorBoundary>
			<ShortcutsProvider>
				<VideoEditor />
				<ShortcutsConfigDialog />
			</ShortcutsProvider>
			<AnnouncementDialog audience="editor" />
			<LiveAnnouncementNotifications audience="editor" />
		</EditorErrorBoundary>
	);
}
