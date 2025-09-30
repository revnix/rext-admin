/**
 * Export Template Management Hook
 *
 * Custom React hook and Zustand store for managing export templates
 * including CRUD operations, validation, and customization state.
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  cloneTemplate,
  DEFAULT_CUSTOMIZATIONS,
  generateTemplateId,
  SYSTEM_TEMPLATES,
  updateTemplateUsage,
  validateCsvCustomization,
  validateJsonCustomization,
  validatePdfCustomization,
  validateTemplate,
} from "@/lib/export-templates";
import type {
  CsvCustomization,
  ExportCustomizationActions,
  ExportCustomizationState,
  ExportTemplate,
  JsonCustomization,
  PdfCustomization,
  TemplateValidation,
} from "@/types/export-customization";

// ============================================================================
// ZUSTAND STORE
// ============================================================================

/**
 * Export customization store with persistence
 */
export const useExportTemplateStore = create<
  ExportCustomizationState & ExportCustomizationActions
>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: [...SYSTEM_TEMPLATES],
      selectedTemplate: null,
      currentFormat: "json",
      csvCustomization: DEFAULT_CUSTOMIZATIONS.csv,
      jsonCustomization: DEFAULT_CUSTOMIZATIONS.json,
      pdfCustomization: DEFAULT_CUSTOMIZATIONS.pdf,
      isCustomizing: false,
      previewVisible: false,
      isLoadingTemplates: false,
      isSavingTemplate: false,
      error: null,
      validation: null,

      // Template management actions
      loadTemplates: async () => {
        set({ isLoadingTemplates: true, error: null });
        try {
          // In a real app, this would load from an API
          // For now, we use system templates + any persisted custom templates
          const state = get();
          const systemTemplates = SYSTEM_TEMPLATES;
          const customTemplates = state.templates.filter(
            (template) => !template.isSystem,
          );

          set({
            templates: [...systemTemplates, ...customTemplates],
            isLoadingTemplates: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to load templates",
            isLoadingTemplates: false,
          });
          toast.error("Failed to load export templates");
        }
      },

      saveTemplate: async (templateData) => {
        set({ isSavingTemplate: true, error: null });
        try {
          const newTemplate: ExportTemplate = {
            ...templateData,
            id: generateTemplateId(),
            isDefault: false,
            isSystem: false,
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              usageCount: 0,
            },
          };

          // Validate the template
          const validation = validateTemplate(newTemplate);
          if (!validation.isValid) {
            set({
              validation,
              error: "Template validation failed",
              isSavingTemplate: false,
            });
            toast.error("Cannot save template: validation errors detected");
            return;
          }

          // Add to templates
          const state = get();
          set({
            templates: [...state.templates, newTemplate],
            selectedTemplate: newTemplate,
            isSavingTemplate: false,
            validation: null,
          });

          toast.success(`Template "${newTemplate.name}" saved successfully`);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to save template",
            isSavingTemplate: false,
          });
          toast.error("Failed to save export template");
        }
      },

      updateTemplate: async (id, updates) => {
        set({ isSavingTemplate: true, error: null });
        try {
          const state = get();
          const templateIndex = state.templates.findIndex((t) => t.id === id);

          if (templateIndex === -1) {
            throw new Error("Template not found");
          }

          const existingTemplate = state.templates[templateIndex];

          // Prevent updating system templates
          if (existingTemplate.isSystem) {
            throw new Error("Cannot update system templates");
          }

          const updatedTemplate: ExportTemplate = {
            ...existingTemplate,
            ...updates,
            metadata: {
              ...existingTemplate.metadata,
              ...updates.metadata,
              updatedAt: new Date().toISOString(),
            },
          };

          // Validate the updated template
          const validation = validateTemplate(updatedTemplate);
          if (!validation.isValid) {
            set({
              validation,
              error: "Template validation failed",
              isSavingTemplate: false,
            });
            toast.error("Cannot update template: validation errors detected");
            return;
          }

          // Update templates array
          const newTemplates = [...state.templates];
          newTemplates[templateIndex] = updatedTemplate;

          set({
            templates: newTemplates,
            selectedTemplate: updatedTemplate,
            isSavingTemplate: false,
            validation: null,
          });

          toast.success(
            `Template "${updatedTemplate.name}" updated successfully`,
          );
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update template",
            isSavingTemplate: false,
          });
          toast.error("Failed to update export template");
        }
      },

      deleteTemplate: async (id) => {
        try {
          const state = get();
          const template = state.templates.find((t) => t.id === id);

          if (!template) {
            throw new Error("Template not found");
          }

          // Prevent deleting system templates
          if (template.isSystem) {
            throw new Error("Cannot delete system templates");
          }

          const newTemplates = state.templates.filter((t) => t.id !== id);

          set({
            templates: newTemplates,
            selectedTemplate:
              state.selectedTemplate?.id === id ? null : state.selectedTemplate,
          });

          toast.success(`Template "${template.name}" deleted successfully`);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete template",
          });
          toast.error("Failed to delete export template");
        }
      },

      applyTemplate: (template) => {
        try {
          // Update usage statistics
          const updatedTemplate = updateTemplateUsage(template);
          const state = get();
          const templateIndex = state.templates.findIndex(
            (t) => t.id === template.id,
          );

          if (templateIndex !== -1) {
            const newTemplates = [...state.templates];
            newTemplates[templateIndex] = updatedTemplate;
            set({ templates: newTemplates });
          }

          // Apply customization based on format
          set({
            selectedTemplate: updatedTemplate,
            currentFormat: template.format,
          });

          switch (template.format) {
            case "csv":
              set({
                csvCustomization: template.customization as CsvCustomization,
              });
              break;
            case "json":
              set({
                jsonCustomization: template.customization as JsonCustomization,
              });
              break;
            case "pdf":
              set({
                pdfCustomization: template.customization as PdfCustomization,
              });
              break;
          }

          toast.success(`Applied template "${template.name}"`);
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to apply template",
          });
          toast.error("Failed to apply export template");
        }
      },

      // Customization management actions
      updateCsvCustomization: (customization) => {
        const state = get();
        const updated = { ...state.csvCustomization, ...customization };
        set({ csvCustomization: updated, selectedTemplate: null });

        // Validate changes
        const validation = validateCsvCustomization(updated);
        set({ validation });
      },

      updateJsonCustomization: (customization) => {
        const state = get();
        const updated = { ...state.jsonCustomization, ...customization };
        set({ jsonCustomization: updated, selectedTemplate: null });

        // Validate changes
        const validation = validateJsonCustomization(updated);
        set({ validation });
      },

      updatePdfCustomization: (customization) => {
        const state = get();
        const updated = { ...state.pdfCustomization, ...customization };
        set({ pdfCustomization: updated, selectedTemplate: null });

        // Validate changes
        const validation = validatePdfCustomization(updated);
        set({ validation });
      },

      resetCustomization: (format) => {
        switch (format) {
          case "csv":
            set({ csvCustomization: DEFAULT_CUSTOMIZATIONS.csv });
            break;
          case "json":
            set({ jsonCustomization: DEFAULT_CUSTOMIZATIONS.json });
            break;
          case "pdf":
            set({ pdfCustomization: DEFAULT_CUSTOMIZATIONS.pdf });
            break;
        }
        set({ selectedTemplate: null, validation: null });
        toast.success(
          `Reset ${format.toUpperCase()} customization to defaults`,
        );
      },

      // Validation
      validateCustomization: (format) => {
        const state = get();
        let validation: TemplateValidation;

        switch (format) {
          case "csv":
            validation = validateCsvCustomization(state.csvCustomization);
            break;
          case "json":
            validation = validateJsonCustomization(state.jsonCustomization);
            break;
          case "pdf":
            validation = validatePdfCustomization(state.pdfCustomization);
            break;
          default:
            validation = {
              isValid: false,
              errors: [
                {
                  field: "format",
                  message: "Invalid format",
                  severity: "error",
                },
              ],
              warnings: [],
            };
        }

        set({ validation });
        return validation;
      },

      // UI actions
      setPreviewVisible: (visible) => set({ previewVisible: visible }),
      setCustomizing: (customizing) => set({ isCustomizing: customizing }),
      clearError: () => set({ error: null, validation: null }),
    }),
    {
      name: "export-template-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        templates: state.templates.filter((template) => !template.isSystem),
        csvCustomization: state.csvCustomization,
        jsonCustomization: state.jsonCustomization,
        pdfCustomization: state.pdfCustomization,
        currentFormat: state.currentFormat,
      }),
    },
  ),
);

// ============================================================================
// REACT HOOK
// ============================================================================

/**
 * React hook for export template management
 */
export function useExportTemplates() {
  const store = useExportTemplateStore();

  // Initialize templates on first load
  const initializeTemplates = useCallback(async () => {
    if (store.templates.length === 0) {
      await store.loadTemplates();
    }
  }, [store]);

  // Get templates by format
  const getTemplatesByFormat = useCallback(
    (format: "csv" | "json" | "pdf") => {
      return store.templates.filter((template) => template.format === format);
    },
    [store.templates],
  );

  // Get current customization for format
  const getCurrentCustomization = useCallback(
    (format: "csv" | "json" | "pdf") => {
      switch (format) {
        case "csv":
          return store.csvCustomization;
        case "json":
          return store.jsonCustomization;
        case "pdf":
          return store.pdfCustomization;
        default:
          return null;
      }
    },
    [store.csvCustomization, store.jsonCustomization, store.pdfCustomization],
  );

  // Create template from current customization
  const createTemplateFromCurrent = useCallback(
    (name: string, description?: string, tags?: string[]) => {
      const currentCustomization = getCurrentCustomization(store.currentFormat);
      if (!currentCustomization) {
        toast.error("No customization available for current format");
        return;
      }

      return store.saveTemplate({
        name,
        description,
        format: store.currentFormat,
        customization: currentCustomization,
        tags,
        isDefault: false,
        isSystem: false,
      });
    },
    [store, getCurrentCustomization],
  );

  // Duplicate template
  const duplicateTemplate = useCallback(
    (template: ExportTemplate, newName?: string) => {
      const duplicated = cloneTemplate(template, {
        name: newName || `${template.name} (Copy)`,
        description: `Copy of ${template.name}`,
      });

      return store.saveTemplate(duplicated);
    },
    [store],
  );

  return {
    // State
    ...store,

    // Computed
    templatesByFormat: getTemplatesByFormat,
    currentCustomization: getCurrentCustomization(store.currentFormat),

    // Actions
    initializeTemplates,
    createTemplateFromCurrent,
    duplicateTemplate,
  };
}
