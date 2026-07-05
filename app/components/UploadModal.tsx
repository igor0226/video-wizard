import { type FormEvent } from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Progress } from "../../components/ui/progress";
import { Loader2, Upload } from "lucide-react";

type UploadModalProps = {
  isOpen: boolean;
  uploadTitle: string;
  uploadProgress: number;
  isUploading: boolean;
  uploadError: string | null;
  selectedFileName: string | null;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function UploadModal({
  isOpen,
  uploadTitle,
  uploadProgress,
  isUploading,
  uploadError,
  selectedFileName,
  onClose,
  onTitleChange,
  onFileChange,
  onSubmit
}: UploadModalProps) {
  const showProgress = isUploading || uploadProgress > 0;

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="modalCard">
        <DialogHeader>
          <DialogTitle id="upload-title">Upload video</DialogTitle>
          <DialogDescription>Choose a video file, set a title, then submit for processing.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="uploadForm">
          <div className="grid gap-2">
            <Label htmlFor="upload-title-input">Video name</Label>
            <Input
              id="upload-title-input"
              type="text"
              value={uploadTitle}
              onChange={(event) => onTitleChange(event.target.value)}
              disabled={isUploading}
              placeholder="Type a clear name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="upload-file-input">Video file</Label>
            <Input
              id="upload-file-input"
              type="file"
              accept="video/*"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              disabled={isUploading}
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => document.getElementById("upload-file-input")?.click()}>
              <div className="flex items-center gap-2"> <Upload className="h-4 w-4" /> Select a video file </div>
            </Button>
            {selectedFileName ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Selected file:</span>
                <Badge variant="outline" className="max-w-fit truncate">
                  {selectedFileName}
                </Badge>
              </div>
            ) : null}
          </div>

          {showProgress ? (
            <div className="grid gap-2">
              <Progress value={uploadProgress} />
              <p className="note">Upload progress: {Math.round(uploadProgress)}%</p>
            </div>
          ) : null}

          {uploadError ? <p className="errorText">{uploadError}</p> : null}

          <DialogFooter className="formActions">
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
