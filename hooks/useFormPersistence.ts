/**
 * useFormPersistence Hook
 *
 * A reusable hook for auto-saving form data to localStorage.
 * Useful for preserving form state across page refreshes or navigation.
 *
 * @example
 * ```tsx
 * const { values, setValues, setValue, clearDraft, hasDraft } = useFormPersistence(
 *   'contact-form',
 *   { name: '', email: '', message: '' }
 * );
 *
 * return (
 *   <form>
 *     {hasDraft && (
 *       <div>Draft found! <button onClick={clearDraft}>Clear</button></div>
 *     )}
 *     <input
 *       value={values.name}
 *       onChange={(e) => setValue('name', e.target.value)}
 *     />
 *   </form>
 * );
 * ```
 */

import { useCallback, useEffect, useState } from "react";

export interface FormPersistenceOptions<T> {
  /**
   * Auto-save delay in milliseconds (default: 500ms)
   */
  debounceDelay?: number;

  /**
   * Clear draft after successful submit (default: true)
   */
  clearOnSubmit?: boolean;

  /**
   * Version key for cache invalidation (optional)
   * Change this to invalidate old cached data
   */
  version?: string;

  /**
   * Callback when draft is loaded from storage
   */
  onDraftLoaded?: (draft: T) => void;

  /**
   * Callback when draft is saved to storage
   */
  onDraftSaved?: (draft: T) => void;
}

export interface FormPersistenceResult<T> {
  /**
   * Current form values
   */
  values: T;

  /**
   * Set all form values at once
   */
  setValues: (values: T | ((prev: T) => T)) => void;

  /**
   * Set a single field value
   */
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;

  /**
   * Clear the draft from storage
   */
  clearDraft: () => void;

  /**
   * Reset to default values
   */
  reset: () => void;

  /**
   * Whether a draft exists in storage
   */
  hasDraft: boolean;

  /**
   * Whether the form has been modified from defaults
   */
  isDirty: boolean;
}

/**
 * Hook for persisting form data to localStorage
 */
export function useFormPersistence<T extends Record<string, unknown>>(
  key: string,
  defaultValues: T,
  options: FormPersistenceOptions<T> = {},
): FormPersistenceResult<T> {
  const {
    debounceDelay = 500,
    version = "1",
    onDraftLoaded,
    onDraftSaved,
  } = options;

  const storageKey = `form-draft-${key}-v${version}`;

  // Initialize state from localStorage or default values
  const [values, setValuesInternal] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValues;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as T;
        onDraftLoaded?.(parsed);
        return parsed;
      }
    } catch (_error) {}
    return defaultValues;
  });

  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) !== null;
  });

  const [isDirty, setIsDirty] = useState(false);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(values));
        setHasDraft(true);
        onDraftSaved?.(values);
      } catch (_error) {}
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [values, storageKey, debounceDelay, onDraftSaved]);

  // Track if form has been modified
  useEffect(() => {
    const isModified = Object.keys(defaultValues).some(
      (key) => values[key] !== defaultValues[key],
    );
    setIsDirty(isModified);
  }, [values, defaultValues]);

  const setValues = useCallback((newValues: T | ((prev: T) => T)) => {
    setValuesInternal(newValues);
  }, []);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValuesInternal((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setValuesInternal(defaultValues);
      setIsDirty(false);
    } catch (_error) {}
  }, [storageKey, defaultValues]);

  const reset = useCallback(() => {
    setValuesInternal(defaultValues);
    setIsDirty(false);
  }, [defaultValues]);

  return {
    values,
    setValues,
    setValue,
    clearDraft,
    reset,
    hasDraft,
    isDirty,
  };
}

/**
 * Alternative hook that returns form handlers for easier integration with forms
 *
 * @example
 * ```tsx
 * const form = usePersistedForm('my-form', {
 *   name: '',
 *   email: ''
 * });
 *
 * <input {...form.getFieldProps('name')} />
 * ```
 */
export function usePersistedForm<T extends Record<string, unknown>>(
  key: string,
  defaultValues: T,
  options?: FormPersistenceOptions<T>,
) {
  const persistence = useFormPersistence(key, defaultValues, options);

  const getFieldProps = useCallback(
    (name: keyof T) => ({
      value: persistence.values[name],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => {
        persistence.setValue(name, e.target.value as T[keyof T]);
      },
    }),
    [persistence],
  );

  return {
    ...persistence,
    getFieldProps,
  };
}
