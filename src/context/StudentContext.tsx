import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { Student, DeskPosition, SeatingPlan } from '../types';
import { INITIAL_STUDENTS, INITIAL_DESKS, INITIAL_SEATING_PLANS } from '../data/initialData';
import { useDebouncedLocalStorage } from '../hooks/useDebouncedLocalStorage';
import { sounds } from '../utils/audio';
import { getStudentNeutralAvatar, sanitizeStudentAvatar, isLegacyGenderedAvatar } from '../utils/studentAvatar';

export interface StudentContextType {
  students: Student[];
  desks: DeskPosition[];
  seatingPlans: SeatingPlan[];
  awardCoins: (studentId: string, amount: number, reason?: string) => void;
  updateDeskStudent: (deskId: string, studentId?: string) => void;
  addStudent: (student: Omit<Student, 'id' | 'coins' | 'stars' | 'badges'>) => void;
  bulkImportStudents: (names: string[]) => { count: number };
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  updateStudentAvatar: (studentId: string, avatarUrl: string) => void;
  saveSeatingPlan: (name: string, description?: string) => void;
  applySeatingPlan: (planId: string) => void;
  deleteSeatingPlan: (planId: string) => void;
  setStudentsDirectly: (students: Student[]) => void;
  setDesksDirectly: (desks: DeskPosition[]) => void;
  setSeatingPlansDirectly: (plans: SeatingPlan[]) => void;
}

const StudentContext = createContext<StudentContextType | null>(null);

const STORAGE_KEY_PREFIX = 'lop_hoc_5b2_v4_';

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawStudents, setStudents] = useDebouncedLocalStorage<Student[]>(
    STORAGE_KEY_PREFIX + 'students',
    () => INITIAL_STUDENTS
  );

  // Đảm bảo 100% học sinh dùng hình minh họa trung tính, thân thiện (hoa, lá, mây, mặt trời, ngôi sao...)
  const students = useMemo(() => {
    return rawStudents.map((s) => {
      const sanitizedAvatar = sanitizeStudentAvatar(s);
      if (sanitizedAvatar !== s.avatar) {
        return { ...s, avatar: sanitizedAvatar };
      }
      return s;
    });
  }, [rawStudents]);

  // Cập nhật lại localStorage nếu phát hiện avatar cũ phân biệt giới tính
  useEffect(() => {
    const hasLegacy = rawStudents.some((s) => isLegacyGenderedAvatar(s.avatar));
    if (hasLegacy) {
      setStudents(students);
    }
  }, [rawStudents, students, setStudents]);

  const [desks, setDesks] = useDebouncedLocalStorage<DeskPosition[]>(
    STORAGE_KEY_PREFIX + 'desks',
    () => INITIAL_DESKS
  );

  const [seatingPlans, setSeatingPlans] = useDebouncedLocalStorage<SeatingPlan[]>(
    STORAGE_KEY_PREFIX + 'seating_plans',
    () => INITIAL_SEATING_PLANS
  );

  const awardCoins = useCallback((studentId: string, amount: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const newCoins = Math.max(0, s.coins + amount);
          const newStars = amount > 0 ? s.stars + 1 : s.stars;
          return { ...s, coins: newCoins, stars: newStars };
        }
        return s;
      })
    );
    if (amount > 0) {
      sounds.playCoin();
    } else {
      sounds.playWrong();
    }
  }, [setStudents]);

  const updateDeskStudent = useCallback((deskId: string, studentId?: string) => {
    setDesks((prev) =>
      prev.map((d) => {
        if (d.id === deskId) {
          return { ...d, studentId };
        }
        if (studentId && d.studentId === studentId) {
          return { ...d, studentId: undefined };
        }
        return d;
      })
    );
    sounds.playCorrect();
  }, [setDesks]);

  const addStudent = useCallback((studentData: Omit<Student, 'id' | 'coins' | 'stars' | 'badges'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `s_${Date.now()}`,
      avatar: studentData.avatar || getStudentNeutralAvatar(studentData.name),
      coins: 20,
      stars: 5,
      badges: ['Chăm chỉ'],
      studentCode: `HS5B2-${String(Date.now()).slice(-2)}`,
    };
    setStudents((prev) => [...prev, newStudent]);
    sounds.playCorrect();
  }, [setStudents]);

  const bulkImportStudents = useCallback((names: string[]) => {
    const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);
    const newStudents: Student[] = validNames.map((name, idx) => ({
      id: `s_import_${Date.now()}_${idx}`,
      name,
      avatar: getStudentNeutralAvatar(`import_${name}_${idx}`),
      coins: 20,
      stars: 5,
      badges: ['Học sinh mới'],
      studentCode: `HS5B2-${String(idx + 1).padStart(2, '0')}`,
      group: `Tổ ${(idx % 4) + 1}`,
    }));

    setStudents((prev) => [...prev, ...newStudents]);
    sounds.playCorrect();
    return { count: newStudents.length };
  }, [setStudents]);

  const updateStudent = useCallback((updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    sounds.playCorrect();
  }, [setStudents]);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setDesks((prev) =>
      prev.map((d) => (d.studentId === studentId ? { ...d, studentId: undefined } : d))
    );
    sounds.playCorrect();
  }, [setStudents, setDesks]);

  const updateStudentAvatar = useCallback((studentId: string, avatarUrl: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, avatar: avatarUrl } : s))
    );
    sounds.playCorrect();
  }, [setStudents]);

  const saveSeatingPlan = useCallback((name: string, description?: string) => {
    const plan: SeatingPlan = {
      id: `plan_${Date.now()}`,
      name,
      description: description || 'Sơ đồ phân bố chỗ ngồi tối ưu',
      createdAt: new Date().toISOString(),
      desks: [...desks],
      rowsCount: 6,
      colsCount: 4,
      seatsPerDesk: 2,
      isCurrent: true,
    };
    setSeatingPlans((prev) => [...prev, plan]);
    sounds.playCorrect();
  }, [desks, setSeatingPlans]);

  const applySeatingPlan = useCallback((planId: string) => {
    const plan = seatingPlans.find((p) => p.id === planId);
    if (plan && plan.desks) {
      setDesks(plan.desks);
      sounds.playCorrect();
    }
  }, [seatingPlans, setDesks]);

  const deleteSeatingPlan = useCallback((planId: string) => {
    setSeatingPlans((prev) => prev.filter((p) => p.id !== planId));
    sounds.playCorrect();
  }, [setSeatingPlans]);

  const value = useMemo<StudentContextType>(() => ({
    students,
    desks,
    seatingPlans,
    awardCoins,
    updateDeskStudent,
    addStudent,
    bulkImportStudents,
    updateStudent,
    deleteStudent,
    updateStudentAvatar,
    saveSeatingPlan,
    applySeatingPlan,
    deleteSeatingPlan,
    setStudentsDirectly: setStudents,
    setDesksDirectly: setDesks,
    setSeatingPlansDirectly: setSeatingPlans,
  }), [
    students,
    desks,
    seatingPlans,
    awardCoins,
    updateDeskStudent,
    addStudent,
    bulkImportStudents,
    updateStudent,
    deleteStudent,
    updateStudentAvatar,
    saveSeatingPlan,
    applySeatingPlan,
    deleteSeatingPlan,
    setStudents,
    setDesks,
    setSeatingPlans,
  ]);

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};

export const useStudents = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
