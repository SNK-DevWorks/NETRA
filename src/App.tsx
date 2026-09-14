import { lazy, Suspense, useEffect, useState } from "react";
import { useI18n } from "./contexts/I18nContext";

const HudWindow = lazy(() => import("./components/launch/HudWindow"));
const SourceSelector = lazy(() =>
	import("./components/launch/SourceSelector").then((module) => ({
		default: module.SourceSelector,
	})),
);
const CountdownOverlay = lazy(() =>
	import("./components/countdown/CountdownOverlay").then((module) => ({
		default: module.CountdownOverlay,
	})),
);
const UpdateToastWindow = lazy(() =>
	import("./components/launch/UpdateToastWindow").then((module) => ({
		default: module.UpdateToastWindow,
	})),
);
const EditorWindow = lazy(() => import("./components/video-editor/EditorWindow"));

export default function App() {
	const [windowType] = useState(
		() => new URLSearchParams(window.location.search).get("windowType") || "",
	);
	const { t } = useI18n();
	const appIconSrc = "/app-icons/netra-128.png";

	useEffect(() => {
		document.documentElement.dataset.windowType = windowType;

		if (
			windowType === "hud-overlay" ||
			windowType === "source-selector" ||
			windowType === "countdown" ||
			windowType === "update-toast"
		) {
			document.body.style.background = "transparent";
			document.documentElement.style.background = "transparent";
			document.getElementById("root")?.style.setProperty("background", "transparent");
		}

		if (windowType === "hud-overlay") {
			document.documentElement.classList.add("hud-overlay-window");
			document.body.classList.add("hud-overlay-window");
			document.getElementById("root")?.classList.add("hud-overlay-window");
			window.electronAPI?.hudOverlaySetIgnoreMouse?.(true);
		} else if (windowType === "update-toast") {
			document.documentElement.style.overflow = "visible";
			document.body.style.overflow = "visible";
			document.getElementById("root")?.style.setProperty("overflow", "visible");
		}
	}, [windowType]);

	useEffect(() => {
		document.title =
			windowType === "editor"
				? t("app.editorTitle", "Netra Studio")
				: t("app.name", "Netra");
	}, [windowType, t]);

	let content;
	switch (windowType) {
		case "hud-overlay":
			content = <HudWindow />;
			break;
		case "source-selector":
			content = <SourceSelector />;
			break;
		case "countdown":
			content = <CountdownOverlay />;
			break;
		case "update-toast":
			content = <UpdateToastWindow />;
			break;
		case "editor":
			content = <EditorWindow />;
			break;
		default:
			content = (
				<div className="flex h-full w-full flex-col items-center justify-center bg-editor-bg text-foreground gap-4">
					<div className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/5 px-6 py-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
						<img
							src={appIconSrc}
							alt={t("app.name", "Netra")}
							className="h-12 w-12 rounded-xl"
						/>
						<div>
							<h1 className="text-xl font-semibold tracking-tight">
								{t("app.name", "Netra")}
							</h1>
							<p className="text-sm text-foreground/65">
								{t("app.subtitle", "Studio by SNK DevWorks")}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<a
							href="?windowType=editor"
							className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-blue-600"
						>
							Open Video Editor
						</a>
						<a
							href="?windowType=hud-overlay"
							className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/10"
						>
							HUD Overlay
						</a>
						<a
							href="?windowType=source-selector"
							className="rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/10"
						>
							Source Selector
						</a>
					</div>
				</div>
			);
	}

	return <Suspense fallback={null}>{content}</Suspense>;
}
