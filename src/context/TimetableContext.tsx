import React, { createContext, useContext, useCallback, useMemo } from 'react';
import {
  TimetableSubjectConfig,
  TimetableSlot,
  TimetableAdminSettings,
  TimetableSubjectId,
} from '../types';
import {
  ALL_TIMETABLE_SUBJECTS,
  CORE_TIMETABLE_SUBJECT_IDS,
  INITIAL_TIMETABLE_SLOTS,
  DEFAULT_TIMETABLE_SETTINGS,
} from '../data/initialData';
import { useDebouncedLocalStorage } from '../hooks/useDebouncedLocalStorage';
import { sounds } from '../utils/audio';

export interface TimetableContextType {
  timetableSubjects: TimetableSubjectConfig[];
  timetableSlots: TimetableSlot[];
  timetableSettings: TimetableAdminSettings;
  updateTimetableSettings: (settings: Partial<TimetableAdminSettings>) => void;
  toggleSubjectVisibility: (subjectId: TimetableSubjectId) => void;
  setOnlyCoreSubjects: (onlyCore: boolean) => void;
  updateTimetableSlot: (slot: TimetableSlot) => void;
  bulkUpdateTimetableSlots: (slots: TimetableSlot[]) => void;
  resetTimetable: () => void;
  setTimetableSlotsDirectly: (slots: TimetableSlot[]) => void;
  setTimetableSettingsDirectly: (settings: TimetableAdminSettings) => void;
}

const TimetableContext = createContext<TimetableContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';

export const TimetableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timetableSlots, setTimetableSlots] = useDebouncedLocalStorage<TimetableSlot[]>(
    STORAGE_KEY_PREFIX + 'timetable_slots',
    () => INITIAL_TIMETABLE_SLOTS
  );

  const [timetableSettings, setTimetableSettings] = useDebouncedLocalStorage<TimetableAdminSettings>(
    STORAGE_KEY_PREFIX + 'timetable_settings',
    () => DEFAULT_TIMETABLE_SETTINGS
  );

  const [subjectConfigs, setSubjectConfigs] = useDebouncedLocalStorage<TimetableSubjectConfig[]>(
    STORAGE_KEY_PREFIX + 'timetable_subjects',
    () => ALL_TIMETABLE_SUBJECTS
  );

  const updateTimetableSettings = useCallback((newSettings: Partial<TimetableAdminSettings>) => {
    setTimetableSettings((prev) => ({ ...prev, ...newSettings }));
    sounds.playCorrect();
  }, [setTimetableSettings]);

  const toggleSubjectVisibility = useCallback((subjectId: TimetableSubjectId) => {
    setTimetableSettings((prev) => {
      const exists = prev.visibleSubjectIds.includes(subjectId);
      const nextVisible = exists
        ? prev.visibleSubjectIds.filter((id) => id !== subjectId)
        : [...prev.visibleSubjectIds, subjectId];
      return { ...prev, visibleSubjectIds: nextVisible };
    });
    sounds.playCorrect();
  }, [setTimetableSettings]);

  const setOnlyCoreSubjects = useCallback((onlyCore: boolean) => {
    setTimetableSettings((prev) => ({
      ...prev,
      showOnlyCore: onlyCore,
      visibleSubjectIds: onlyCore
        ? [...CORE_TIMETABLE_SUBJECT_IDS]
        : ALL_TIMETABLE_SUBJECTS.map((s) => s.id),
    }));
    sounds.playCorrect();
  }, [setTimetableSettings]);

  const updateTimetableSlot = useCallback((updatedSlot: TimetableSlot) => {
    setTimetableSlots((prev) =>
      prev.map((slot) => (slot.id === updatedSlot.id ? updatedSlot : slot))
    );
    sounds.playCorrect();
  }, [setTimetableSlots]);

  const bulkUpdateTimetableSlots = useCallback((newSlots: TimetableSlot[]) => {
    setTimetableSlots(newSlots);
    sounds.playCorrect();
  }, [setTimetableSlots]);

  const resetTimetable = useCallback(() => {
    setTimetableSlots(INITIAL_TIMETABLE_SLOTS);
    setTimetableSettings(DEFAULT_TIMETABLE_SETTINGS);
    setSubjectConfigs(ALL_TIMETABLE_SUBJECTS);
    sounds.playCorrect();
  }, [setTimetableSlots, setTimetableSettings, setSubjectConfigs]);

  const value = useMemo<TimetableContextType>(() => ({
    timetableSubjects: subjectConfigs,
    timetableSlots,
    timetableSettings,
    updateTimetableSettings,
    toggleSubjectVisibility,
    setOnlyCoreSubjects,
    updateTimetableSlot,
    bulkUpdateTimetableSlots,
    resetTimetable,
    setTimetableSlotsDirectly: setTimetableSlots,
    setTimetableSettingsDirectly: setTimetableSettings,
  }), [
    subjectConfigs,
    timetableSlots,
    timetableSettings,
    updateTimetableSettings,
    toggleSubjectVisibility,
    setOnlyCoreSubjects,
    updateTimetableSlot,
    bulkUpdateTimetableSlots,
    resetTimetable,
    setTimetableSlots,
    setTimetableSettings,
  ]);

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>;
};

export const useTimetable = (): TimetableContextType => {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};
