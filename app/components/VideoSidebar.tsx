import { Button } from "../../components/ui/button";
import { Badge, type BadgeProps } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { cn } from "../../lib/utils";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Video } from "lucide-react";
import type { VideoItem } from "../types/video";

type VideoSidebarProps = {
  videos: VideoItem[];
  selectedVideoId: string | null;
  onSelectVideo: (videoId: string) => void;
};

function getStatusVariant(status: VideoItem["status"]): BadgeProps["variant"] {
  if (status === "ready") {
    return "secondary";
  }
  if (status === "failed") {
    return "destructive";
  }
  if (status === "processing") {
    return "default";
  }
  return "outline";
}

function StatusIcon({ status }: { status: VideoItem["status"] }) {
  if (status === "ready") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />;
  }
  if (status === "processing") {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-300" aria-hidden="true" />;
  }
  if (status === "failed") {
    return <AlertTriangle className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />;
  }
  return <Clock3 className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />;
}

export function VideoSidebar({ videos, selectedVideoId, onSelectVideo }: VideoSidebarProps) {
  return (
    <aside className="videoSidebar">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">My videos</h2>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {videos.length}
        </Badge>
      </div>
      <ScrollArea className="h-[calc(78vh-92px)]">
        <ul className="space-y-1.5 pr-2">
          {videos.map((video) => {
            const isActive = video.id === selectedVideoId;
            return (
              <li key={video.id}>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-auto w-full justify-start rounded-lg border px-3 py-2 text-left",
                    "hover:bg-zinc-800/60",
                    isActive ? "border-zinc-500 bg-zinc-800 text-zinc-100" : "border-transparent"
                  )}
                  onClick={() => onSelectVideo(video.id)}
                  data-active={isActive}
                >
                  <div className="mr-2 mt-0.5">
                    <Video className="h-4 w-4 text-zinc-300" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{video.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <StatusIcon status={video.status} />
                      <Badge variant={getStatusVariant(video.status)} className="px-1.5 py-0 text-[10px] uppercase tracking-wide">
                        {video.status}
                      </Badge>
                    </div>
                  </div>
                </Button>
              </li>
            );
          })}
          {videos.length === 0 ? (
            <li className="rounded-lg border border-dashed border-zinc-700 p-3 text-xs text-zinc-400">No videos yet. Upload one to start.</li>
          ) : null}
        </ul>
      </ScrollArea>
    </aside>
  );
}
