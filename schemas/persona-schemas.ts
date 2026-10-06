import { z } from "zod";
import {
  type PersonaErrors,
  validatePersona,
} from "@/lib/validation/persona-validation";

/**
 * The persona form's values, as typed: every field is text, and the list fields are comma
 * separated (the page splits them before sending). The rules themselves are in
 * `lib/validation/persona-validation.ts`, which the persona detail view shares; this schema runs
 * them, so a rule is written once.
 */
export const personaFormSchema = z
  .object({
    name: z.string(),
    full_name: z.string(),
    description: z.string(),
    professional_title: z.string(),
    avatar_url: z.string(),
    email: z.string(),
    bio: z.string(),
    linkedin_url: z.string(),
    demographics: z.string(),
    areas_of_expertise: z.string(),
    tone_of_voice: z.string(),
    goals: z.string(),
    pain_points: z.string(),
    behaviors: z.string(),
  })
  .superRefine((values, ctx) => {
    const errors: PersonaErrors = validatePersona(values);
    for (const [field, message] of Object.entries(errors)) {
      if (message) ctx.addIssue({ code: "custom", path: [field], message });
    }
  });

export type PersonaFormValues = z.infer<typeof personaFormSchema>;

export const EMPTY_PERSONA_FORM: PersonaFormValues = {
  name: "",
  full_name: "",
  description: "",
  professional_title: "",
  avatar_url: "",
  email: "",
  bio: "",
  linkedin_url: "",
  demographics: "",
  areas_of_expertise: "",
  tone_of_voice: "",
  goals: "",
  pain_points: "",
  behaviors: "",
};
