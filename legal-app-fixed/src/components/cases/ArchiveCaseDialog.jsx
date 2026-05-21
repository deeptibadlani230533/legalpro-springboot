import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

export default function ArchiveCaseDialog({
  open,

  onOpenChange,

  caseTitle,

  onArchive,

  isArchiving,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Archive Matter</DialogTitle>

        <DialogDescription>
          You are about to archive <strong>{caseTitle}</strong>. This action
          cannot be undone.
        </DialogDescription>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={onArchive}
            disabled={isArchiving}
          >
            {isArchiving ? "Archiving..." : "Confirm Archive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
