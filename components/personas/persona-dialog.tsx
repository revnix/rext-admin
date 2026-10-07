"use client";

import { type ReactElement, useState } from "react";
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
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            setOpen(false);
            onCreated?.(personaId);
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
