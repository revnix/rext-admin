"use client";

import { type ReactElement, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PersonaForm } from "./persona-form";

/**
 * The persona-creation form in a dialog (FB2.20; the founder chose the full form here over the
 * four-field rule), so a persona can be made without leaving the page: Generate's step 5 and the
 * Personas page. On save it closes and passes the new persona's id; the persona lists refresh
 * through useCreatePersona.
 */
export function PersonaDialog({
  trigger,
  onCreated,
}: {
  trigger: ReactElement;
  onCreated?: (personaId: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const close = () => {
    setOpen(false);
    setUnsaved(false);
    setSaving(false);
    setConfirming(false);
  };
  // Escape, a click outside or the close button: with anything entered, ask before discarding it.
  // (The form's own Cancel asks through FormShell's leave guard first.) While the save is under
  // way the dialog stays: the request can't be taken back, so its persona must not be "discarded".
  const requestClose = () => {
    if (saving) return;
    if (unsaved) setConfirming(true);
    else close();
  };
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : requestClose())}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-dvh overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create persona</DialogTitle>
            <DialogDescription>
              An author with real experience and a voice of their own.
            </DialogDescription>
          </DialogHeader>
          <PersonaForm
            onSaved={(personaId) => {
              close();
              onCreated?.(personaId);
            }}
            onCancel={close}
            onDirtyChange={setUnsaved}
            onSubmittingChange={setSaving}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this persona?</AlertDialogTitle>
            <AlertDialogDescription>
              What you've entered isn't saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={close}>
              Discard persona
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
