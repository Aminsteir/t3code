import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import ChatView from "../components/ChatView";
import { SidebarTrigger } from "../components/ui/sidebar";
import { isElectron } from "../env";
import { newThreadId } from "../lib/utils";
import { useStore } from "../store";
import { useComposerDraftStore } from "../composerDraftStore";

function ChatIndexRouteView() {
  const projects = useStore((store) => store.projects);
  const homeDraftThreadId = useComposerDraftStore((store) => store.homeDraftThreadId);
  const draftThreadsByThreadId = useComposerDraftStore((store) => store.draftThreadsByThreadId);
  const setHomeDraftThreadId = useComposerDraftStore((store) => store.setHomeDraftThreadId);
  const setHomeDraftProjectId = useComposerDraftStore((store) => store.setHomeDraftProjectId);

  const homeDraftThread = homeDraftThreadId ? (draftThreadsByThreadId[homeDraftThreadId] ?? null) : null;

  useEffect(() => {
    if (projects.length === 0) {
      return;
    }

    const fallbackProjectId = projects[0]?.id;
    if (!fallbackProjectId) {
      return;
    }

    if (!homeDraftThreadId || !homeDraftThread) {
      setHomeDraftThreadId(fallbackProjectId, newThreadId(), {
        createdAt: new Date().toISOString(),
      });
      return;
    }

    const hasSelectedProject = projects.some((project) => project.id === homeDraftThread.projectId);
    if (!hasSelectedProject) {
      setHomeDraftProjectId(fallbackProjectId);
    }
  }, [
    homeDraftThread,
    homeDraftThreadId,
    projects,
    setHomeDraftProjectId,
    setHomeDraftThreadId,
  ]);

  if (projects.length === 0) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background text-muted-foreground/40">
        {!isElectron && (
          <header className="border-b border-border px-3 py-2 md:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="size-7 shrink-0" />
              <span className="text-sm font-medium text-foreground">Threads</span>
            </div>
          </header>
        )}

        {isElectron && (
          <div className="drag-region flex h-[52px] shrink-0 items-center border-b border-border px-5">
            <span className="text-xs text-muted-foreground/50">No active thread</span>
          </div>
        )}

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <p className="text-sm text-foreground">Add a project to start a new thread.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!homeDraftThreadId || !homeDraftThread) {
    return <div className="flex min-h-0 min-w-0 flex-1 bg-background" />;
  }

  return <ChatView threadId={homeDraftThreadId} mode="home" />;
}

export const Route = createFileRoute("/_chat/")({
  component: ChatIndexRouteView,
});
