import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
  ShieldCheck,
  Clock,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  BookOpen,
  Sparkles,
  Lock,
  Users,
  Download,
  Search,
  Settings,
  CheckSquare,
  Square,
  Palmtree,
  History,
  KeyRound
} from 'lucide-react';

// ==========================================
// FIREBASE INITIALIZATION
// ==========================================
const RUNTIME_CONFIG = (typeof window !== 'undefined' && window.APP_CONFIG) || {};
const firebaseConfig = RUNTIME_CONFIG.firebase || {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const appId = 'student-attendance-tracker';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// EXCLUSIVE MAKER / ADMIN CREDENTIALS (from .env)
// ==========================================
const EXCLUSIVE_ADMIN_ID = RUNTIME_CONFIG.adminId || import.meta.env.VITE_ADMIN_ID || '1357';
const EXCLUSIVE_ADMIN_PW = RUNTIME_CONFIG.adminPassword || import.meta.env.VITE_ADMIN_PW || '';

// ==========================================
// DEFAULT TIMETABLE CONFIGURATION
// ==========================================
const DEFAULT_TIMETABLE = {
  1: [
    { slotId: 'mon-1', period: 1, subject: 'IND CONS', defaultTime: '09:30 AM - 10:30 AM' },
    { slotId: 'mon-2', period: 2, subject: 'MATH', defaultTime: '10:30 AM - 11:30 AM' },
    { slotId: 'mon-3', period: 3, subject: 'EE THEORY', defaultTime: '12:00 PM - 01:00 PM' },
    { slotId: 'mon-4', period: 4, subject: 'AUTOCAD', defaultTime: '02:00 PM - 03:00 PM' }
  ],
  2: [
    { slotId: 'tue-1', period: 1, subject: 'PHY THEORY', defaultTime: '09:30 AM - 10:30 AM' },
    { slotId: 'tue-2', period: 2, subject: 'ENG', defaultTime: '10:30 AM - 11:30 AM' },
    { slotId: 'tue-3', period: 3, subject: 'EE LAB', defaultTime: '12:00 PM - 01:00 PM' },
    { slotId: 'tue-4', period: 4, subject: 'MATH', defaultTime: '02:00 PM - 03:00 PM' }
  ],
  3: [
    { slotId: 'wed-1', period: 1, subject: 'PH LAB', defaultTime: '09:30 AM - 10:30 AM' },
    { slotId: 'wed-2', period: 2, subject: 'PHY THEORY', defaultTime: '10:30 AM - 11:30 AM' }
  ],
  4: [
    { slotId: 'thu-1', period: 1, subject: 'PHY THEORY', defaultTime: '09:30 AM - 10:30 AM' },
    { slotId: 'thu-2', period: 2, subject: 'EE THEORY', defaultTime: '10:30 AM - 11:30 AM' },
    { slotId: 'thu-3', period: 3, subject: 'MATH', defaultTime: '12:00 PM - 01:00 PM' }
  ],
  5: [
    { slotId: 'fri-1', period: 1, subject: 'MATH', defaultTime: '09:30 AM - 10:30 AM' },
    { slotId: 'fri-2', period: 2, subject: 'ENG', defaultTime: '10:30 AM - 11:30 AM' },
    { slotId: 'fri-3', period: 3, subject: 'GRAPH LAB', defaultTime: '12:00 PM - 01:00 PM' }
  ],
  6: [],
  0: []
};

const ALL_SUBJECTS = [
  { code: 'IND CONS', fullName: 'Indian Constitution', category: 'Theory' },
  { code: 'MATH', fullName: 'Mathematics', category: 'Theory' },
  { code: 'EE THEORY', fullName: 'Electrical Engineering Theory', category: 'Theory' },
  { code: 'AUTOCAD', fullName: 'AutoCAD Design Lab', category: 'Lab / Practical' },
  { code: 'PHY THEORY', fullName: 'Physics Theory', category: 'Theory' },
  { code: 'ENG', fullName: 'English Communication', category: 'Theory' },
  { code: 'EE LAB', fullName: 'Electrical Engineering Lab', category: 'Lab / Practical' },
  { code: 'PH LAB', fullName: 'Physics Lab', category: 'Lab / Practical' },
  { code: 'GRAPH LAB', fullName: 'Engineering Graphics Lab', category: 'Lab / Practical' }
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIMEFRAME_OPTIONS = [
  { id: 'weekly', label: 'Weekly (7 Days)', days: 7 },
  { id: '1m', label: '1 Month', months: 1 },
  { id: '2m', label: '2 Months', months: 2 },
  { id: '3m', label: '3 Months', months: 3 },
  { id: '4m', label: '4 Months', months: 4 },
  { id: '5m', label: '5 Months', months: 5 },
  { id: '6m', label: '6 Months', months: 6 },
  { id: '7m', label: '7 Months', months: 7 },
  { id: '8m', label: '8 Months', months: 8 },
  { id: '9m', label: '9 Months', months: 9 },
  { id: '10m', label: '10 Months', months: 10 },
  { id: '11m', label: '11 Months', months: 11 },
  { id: 'yearly', label: 'Yearly (12 Months)', months: 12 },
  { id: 'all', label: 'All-Time Record', all: true }
];

// ==========================================
// DATE UTILITY FUNCTIONS
// ==========================================
function toDateKey(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatReadableDate(dateStr) {
  const dateObj = parseDateKey(dateStr);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getMondayOfWeek(dateStr) {
  const d = parseDateKey(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function sanitizeId(rawId) {
  return String(rawId || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '_');
}

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [studentSession, setStudentSession] = useState(null);
  const [loginName, setLoginName] = useState('');
  const [loginStudentId, setLoginStudentId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('daily');

  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [attendanceRecords, setAttendanceRecords] = useState({});

  const [customTimings, setCustomTimings] = useState({});
  const [showTimingModal, setShowTimingModal] = useState(false);
  const [tempTimings, setTempTimings] = useState({});

  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState('ALL');
  const [customMonthInput, setCustomMonthInput] = useState(1);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [studentRegistry, setStudentRegistry] = useState([]);
  const [registrySearch, setRegistrySearch] = useState('');

  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.msg === msg ? null : prev));
    }, 3000);
  };

  // 1. FIREBASE AUTHENTICATION
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Firebase Auth initialization error:', err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. LISTEN TO STUDENT'S PERSONAL DATA
  useEffect(() => {
    if (!user || !studentSession?.cleanId) return;

    const studentDocRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'student_attendance_records',
      studentSession.cleanId
    );

    const unsubscribe = onSnapshot(
      studentDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.recordsJson) {
            try {
              setAttendanceRecords(JSON.parse(data.recordsJson));
            } catch (e) {
              console.error('Error parsing attendance JSON:', e);
            }
          } else {
            setAttendanceRecords({});
          }
          if (data.customTimingsJson) {
            try {
              setCustomTimings(JSON.parse(data.customTimingsJson));
            } catch (e) {
              console.error('Error parsing custom timings JSON:', e);
            }
          }
        } else {
          setAttendanceRecords({});
        }
      },
      (error) => {
        console.error('Error listening to personal attendance record:', error);
      }
    );

    return () => unsubscribe();
  }, [user, studentSession]);

  // 3. LISTEN TO OWNER ADMIN STUDENT REGISTRY
  useEffect(() => {
    if (!user) return;

    const registryColRef = collection(db, 'artifacts', appId, 'public', 'data', 'student_registry');
    const unsubRegistry = onSnapshot(
      registryColRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => (b.lastActiveIso || '').localeCompare(a.lastActiveIso || ''));
        setStudentRegistry(list);
      },
      (err) => console.error('Student registry listener error:', err)
    );

    return () => {
      unsubRegistry();
    };
  }, [user]);

  // 4. STUDENT LOGIN & REGISTRY RECORDING
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const trimmedName = loginName.trim();
    const trimmedId = loginStudentId.trim().toUpperCase();
    const cleanId = sanitizeId(trimmedId);

    if (!trimmedName || trimmedName.length < 2) {
      setLoginError('Please enter your Full Name.');
      return;
    }
    if (!cleanId || cleanId.length < 2) {
      setLoginError('Please enter a valid Student ID / Roll Number.');
      return;
    }
    if (!user) {
      setLoginError('Connecting to cloud database... Please try again in a moment.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const nowIso = new Date().toISOString();

      const registryDocRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'student_registry',
        cleanId
      );
      const existingSnap = await getDoc(registryDocRef);
      const firstJoinedIso = existingSnap.exists()
        ? existingSnap.data().firstJoinedIso || nowIso
        : nowIso;
      const loginCount = existingSnap.exists()
        ? (existingSnap.data().loginCount || 1) + 1
        : 1;

      await setDoc(
        registryDocRef,
        {
          studentName: trimmedName,
          studentId: trimmedId,
          cleanId,
          firstJoinedIso,
          lastActiveIso: nowIso,
          loginCount,
          uid: user.uid
        },
        { merge: true }
      );

      setStudentSession({
        name: trimmedName,
        studentId: trimmedId,
        cleanId
      });
      triggerToast(`Welcome, ${trimmedName}! Your personal tracker is ready.`);
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Could not sign in. Please check your connection and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setStudentSession(null);
    setAttendanceRecords({});
    setCustomTimings({});
    setLoginName('');
    setLoginStudentId('');
  };

  // 5. SAVE ATTENDANCE CHANGES TO FIRESTORE
  const persistAttendanceToCloud = async (updatedRecords, updatedTimings = customTimings) => {
    if (!user || !studentSession?.cleanId) return;

    try {
      const studentDocRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'student_attendance_records',
        studentSession.cleanId
      );

      await setDoc(
        studentDocRef,
        {
          studentName: studentSession.name,
          studentId: studentSession.studentId,
          recordsJson: JSON.stringify(updatedRecords),
          customTimingsJson: JSON.stringify(updatedTimings),
          updatedAtIso: new Date().toISOString()
        },
        { merge: true }
      );

      const registryDocRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'student_registry',
        studentSession.cleanId
      );
      await setDoc(
        registryDocRef,
        { lastActiveIso: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.error('Failed saving attendance:', err);
      triggerToast('Saved locally in session; retrying cloud sync...', 'error');
    }
  };

  const handleToggleHoliday = () => {
    const currentDayRecord = attendanceRecords[selectedDate] || {
      isHoliday: false,
      holidayNote: '',
      classes: {}
    };
    const nextHolidayState = !currentDayRecord.isHoliday;

    const updatedRecords = {
      ...attendanceRecords,
      [selectedDate]: {
        ...currentDayRecord,
        isHoliday: nextHolidayState
      }
    };

    setAttendanceRecords(updatedRecords);
    persistAttendanceToCloud(updatedRecords);
    triggerToast(
      nextHolidayState
        ? `${selectedDate} marked as HOLIDAY (excluded from attendance calculations).`
        : `Holiday removed for ${selectedDate}.`
    );
  };

  const handleHolidayNoteChange = (noteText) => {
    const currentDayRecord = attendanceRecords[selectedDate] || {
      isHoliday: true,
      holidayNote: '',
      classes: {}
    };
    const updatedRecords = {
      ...attendanceRecords,
      [selectedDate]: {
        ...currentDayRecord,
        holidayNote: noteText
      }
    };
    setAttendanceRecords(updatedRecords);
    persistAttendanceToCloud(updatedRecords);
  };

  const handleToggleClassCancelled = (slotId, subjectName) => {
    const currentDayRecord = attendanceRecords[selectedDate] || {
      isHoliday: false,
      holidayNote: '',
      classes: {}
    };
    const currentSlot = currentDayRecord.classes?.[slotId] || {
      status: null,
      cancelled: false
    };
    const nextCancelled = !currentSlot.cancelled;

    const updatedRecords = {
      ...attendanceRecords,
      [selectedDate]: {
        ...currentDayRecord,
        classes: {
          ...(currentDayRecord.classes || {}),
          [slotId]: {
            ...currentSlot,
            cancelled: nextCancelled
          }
        }
      }
    };

    setAttendanceRecords(updatedRecords);
    persistAttendanceToCloud(updatedRecords);
    triggerToast(
      nextCancelled
        ? `${subjectName} marked as CLASS CANCELLED (excluded from calculation).`
        : `${subjectName} restored to active class.`
    );
  };

  const handleMarkAttendance = (slotId, statusValue, subjectName) => {
    const currentDayRecord = attendanceRecords[selectedDate] || {
      isHoliday: false,
      holidayNote: '',
      classes: {}
    };
    const currentSlot = currentDayRecord.classes?.[slotId] || {
      status: null,
      cancelled: false
    };

    const nextStatus = currentSlot.status === statusValue ? null : statusValue;

    const updatedRecords = {
      ...attendanceRecords,
      [selectedDate]: {
        ...currentDayRecord,
        isHoliday: false,
        classes: {
          ...(currentDayRecord.classes || {}),
          [slotId]: {
            status: nextStatus,
            cancelled: false
          }
        }
      }
    };

    setAttendanceRecords(updatedRecords);
    persistAttendanceToCloud(updatedRecords);
    if (nextStatus === 'present') {
      triggerToast(`Marked PRESENT for ${subjectName}`);
    } else if (nextStatus === 'absent') {
      triggerToast(`Marked ABSENT for ${subjectName}`, 'warning');
    }
  };

  const handleMarkAllPresentToday = (daySchedule) => {
    if (!daySchedule || daySchedule.length === 0) return;
    const currentDayRecord = attendanceRecords[selectedDate] || {
      isHoliday: false,
      holidayNote: '',
      classes: {}
    };
    const updatedClasses = { ...(currentDayRecord.classes || {}) };

    daySchedule.forEach((cls) => {
      if (!updatedClasses[cls.slotId]?.cancelled) {
        updatedClasses[cls.slotId] = {
          status: 'present',
          cancelled: false
        };
      }
    });

    const updatedRecords = {
      ...attendanceRecords,
      [selectedDate]: {
        ...currentDayRecord,
        isHoliday: false,
        classes: updatedClasses
      }
    };

    setAttendanceRecords(updatedRecords);
    persistAttendanceToCloud(updatedRecords);
    triggerToast('All active classes for this day marked PRESENT!');
  };

  // 6. DERIVED SCHEDULE & WEEK NAVIGATION
  const selectedDateObj = useMemo(() => parseDateKey(selectedDate), [selectedDate]);
  const selectedDayOfWeek = selectedDateObj.getDay();

  const todaysClasses = useMemo(() => {
    const rawSlots = DEFAULT_TIMETABLE[selectedDayOfWeek] || [];
    return rawSlots.map((slot) => ({
      ...slot,
      time: customTimings[slot.slotId] || slot.defaultTime
    }));
  }, [selectedDayOfWeek, customTimings]);

  const currentDayData = attendanceRecords[selectedDate] || {
    isHoliday: false,
    holidayNote: '',
    classes: {}
  };

  const weekStripDays = useMemo(() => {
    const monday = getMondayOfWeek(selectedDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = toDateKey(d);
      const dayOfWeek = d.getDay();
      const scheduled = DEFAULT_TIMETABLE[dayOfWeek] || [];
      const rec = attendanceRecords[key];

      let statusIndicator = 'none';
      if (rec?.isHoliday) {
        statusIndicator = 'holiday';
      } else if (scheduled.length > 0 && rec?.classes) {
        const statuses = scheduled.map((s) => rec.classes[s.slotId]);
        const anyRecorded = statuses.some(
          (st) => st?.status === 'present' || st?.status === 'absent' || st?.cancelled
        );
        const allPresentOrCancelled =
          anyRecorded && statuses.every((st) => st?.status === 'present' || st?.cancelled);
        const anyAbsent = statuses.some((st) => st?.status === 'absent');
        if (anyAbsent) statusIndicator = 'absent';
        else if (allPresentOrCancelled) statusIndicator = 'complete';
        else if (anyRecorded) statusIndicator = 'partial';
      }

      days.push({
        dateKey: key,
        dayName: SHORT_DAY_NAMES[dayOfWeek],
        dayNum: d.getDate(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        statusIndicator
      });
    }
    return days;
  }, [selectedDate, attendanceRecords]);

  const stepDateByDays = (delta) => {
    const d = parseDateKey(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(toDateKey(d));
  };

  // 7. ANALYTICS ENGINE
  const analyticsData = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const anchorKey = selectedDate > todayKey ? selectedDate : todayKey;
    const anchorDate = parseDateKey(anchorKey);

    let cutoffDate = null;
    const tfOption = TIMEFRAME_OPTIONS.find((t) => t.id === selectedTimeframe);

    if (selectedTimeframe === 'custom_months') {
      cutoffDate = new Date(anchorDate);
      cutoffDate.setMonth(cutoffDate.getMonth() - Number(customMonthInput || 1));
    } else if (tfOption) {
      if (tfOption.days) {
        cutoffDate = new Date(anchorDate);
        cutoffDate.setDate(cutoffDate.getDate() - (tfOption.days - 1));
      } else if (tfOption.months) {
        cutoffDate = new Date(anchorDate);
        cutoffDate.setMonth(cutoffDate.getMonth() - tfOption.months);
      }
    }

    const cutoffKey = cutoffDate ? toDateKey(cutoffDate) : null;

    const subjectMap = {};
    ALL_SUBJECTS.forEach((subj) => {
      subjectMap[subj.code] = {
        code: subj.code,
        fullName: subj.fullName,
        category: subj.category,
        attended: 0,
        missed: 0,
        cancelled: 0,
        holidayExcluded: 0,
        totalHeld: 0,
        percentage: null,
        isBelow75: false,
        classesNeededFor75: 0,
        canMissSafely: 0,
        history: []
      };
    });

    let overallAttended = 0;
    let overallMissed = 0;
    let overallCancelled = 0;
    let overallHolidaysCount = 0;

    const allDateKeys = Object.keys(attendanceRecords).sort();

    allDateKeys.forEach((dateKey) => {
      if (cutoffKey && (dateKey < cutoffKey || dateKey > anchorKey)) {
        return;
      }

      const dayRecord = attendanceRecords[dateKey];
      if (!dayRecord) return;

      const dObj = parseDateKey(dateKey);
      const dayOfWeek = dObj.getDay();
      const daySlots = DEFAULT_TIMETABLE[dayOfWeek] || [];
      if (daySlots.length === 0) return;

      if (dayRecord.isHoliday) {
        overallHolidaysCount += 1;
        daySlots.forEach((slot) => {
          if (subjectMap[slot.subject]) {
            subjectMap[slot.subject].holidayExcluded += 1;
            subjectMap[slot.subject].history.unshift({
              dateKey,
              slotTime: customTimings[slot.slotId] || slot.defaultTime,
              period: slot.period,
              state: 'HOLIDAY',
              note: dayRecord.holidayNote || 'Holiday'
            });
          }
        });
        return;
      }

      daySlots.forEach((slot) => {
        const slotState = dayRecord.classes?.[slot.slotId];
        if (!slotState) return;

        const subjStats = subjectMap[slot.subject];
        if (!subjStats) return;

        if (slotState.cancelled) {
          subjStats.cancelled += 1;
          overallCancelled += 1;
          subjStats.history.unshift({
            dateKey,
            slotTime: customTimings[slot.slotId] || slot.defaultTime,
            period: slot.period,
            state: 'CANCELLED'
          });
        } else if (slotState.status === 'present') {
          subjStats.attended += 1;
          subjStats.totalHeld += 1;
          overallAttended += 1;
          subjStats.history.unshift({
            dateKey,
            slotTime: customTimings[slot.slotId] || slot.defaultTime,
            period: slot.period,
            state: 'PRESENT'
          });
        } else if (slotState.status === 'absent') {
          subjStats.missed += 1;
          subjStats.totalHeld += 1;
          overallMissed += 1;
          subjStats.history.unshift({
            dateKey,
            slotTime: customTimings[slot.slotId] || slot.defaultTime,
            period: slot.period,
            state: 'ABSENT'
          });
        }
      });
    });

    Object.values(subjectMap).forEach((st) => {
      if (st.totalHeld > 0) {
        const pct = (st.attended / st.totalHeld) * 100;
        st.percentage = Number(pct.toFixed(1));
        st.isBelow75 = pct < 75;

        if (st.isBelow75) {
          const needed = Math.ceil(3 * st.totalHeld - 4 * st.attended);
          st.classesNeededFor75 = Math.max(1, needed);
        } else {
          const margin = Math.floor((4 * st.attended - 3 * st.totalHeld) / 3);
          st.canMissSafely = Math.max(0, margin);
        }
      }
    });

    const overallTotalHeld = overallAttended + overallMissed;
    const overallPercentage =
      overallTotalHeld > 0
        ? Number(((overallAttended / overallTotalHeld) * 100).toFixed(1))
        : null;
    const overallBelow75 = overallPercentage !== null && overallPercentage < 75;
    const overallClassesNeeded = overallBelow75
      ? Math.max(1, Math.ceil(3 * overallTotalHeld - 4 * overallAttended))
      : 0;
    const overallCanMiss =
      overallPercentage !== null && !overallBelow75
        ? Math.max(0, Math.floor((4 * overallAttended - 3 * overallTotalHeld) / 3))
        : 0;

    const subjectsBelow75List = Object.values(subjectMap).filter((s) => s.isBelow75);

    return {
      cutoffKey,
      anchorKey,
      overallAttended,
      overallMissed,
      overallTotalHeld,
      overallCancelled,
      overallHolidaysCount,
      overallPercentage,
      overallBelow75,
      overallClassesNeeded,
      overallCanMiss,
      subjects: Object.values(subjectMap),
      subjectsBelow75List
    };
  }, [attendanceRecords, selectedTimeframe, customMonthInput, selectedDate, customTimings]);

  // 8. OWNER / ADMIN PORTAL FUNCTIONS
  const handleAdminUnlock = (e) => {
    e.preventDefault();
    setAdminAuthError('');

    if (
      EXCLUSIVE_ADMIN_PW &&
      adminIdInput.trim() === EXCLUSIVE_ADMIN_ID &&
      adminPasswordInput === EXCLUSIVE_ADMIN_PW
    ) {
      setAdminUnlocked(true);
      setAdminIdInput('');
      setAdminPasswordInput('');
    } else {
      setAdminAuthError('Invalid Admin ID or Password. Access Denied.');
    }
  };

  const handleCloseAdminModal = () => {
    setShowAdminModal(false);
    setAdminAuthError('');
    setAdminIdInput('');
    setAdminPasswordInput('');
  };

  const handleLockAdminSession = () => {
    setAdminUnlocked(false);
    setAdminIdInput('');
    setAdminPasswordInput('');
    setShowAdminModal(false);
  };

  const handleExportRegistryCSV = () => {
    if (studentRegistry.length === 0) return;
    const headers = ['Student Name,Student ID,First Joined,Last Active,Total Logins'];
    const rows = studentRegistry.map((st) => {
      const safeName = `"${(st.studentName || '').replace(/"/g, '""')}"`;
      const safeId = `"${(st.studentId || '').replace(/"/g, '""')}"`;
      const joined = st.firstJoinedIso ? new Date(st.firstJoinedIso).toLocaleString() : '';
      const active = st.lastActiveIso ? new Date(st.lastActiveIso).toLocaleString() : '';
      return `${safeName},${safeId},"${joined}","${active}",${st.loginCount || 1}`;
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student_login_registry_${toDateKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredRegistry = useMemo(() => {
    const q = registrySearch.trim().toLowerCase();
    if (!q) return studentRegistry;
    return studentRegistry.filter(
      (s) =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.studentId || '').toLowerCase().includes(q)
    );
  }, [studentRegistry, registrySearch]);

  // 9. SAVE CUSTOM TIMINGS
  const openCustomizeTimings = () => {
    setTempTimings({ ...customTimings });
    setShowTimingModal(true);
  };

  const handleSaveCustomTimings = async (e) => {
    e.preventDefault();
    setCustomTimings(tempTimings);
    setShowTimingModal(false);
    await persistAttendanceToCloud(attendanceRecords, tempTimings);
    triggerToast('Class timings updated!');
  };

  const adminModalProps = {
    onClose: handleCloseAdminModal,
    onLockSession: handleLockAdminSession,
    adminUnlocked,
    adminIdInput,
    setAdminIdInput,
    adminPasswordInput,
    setAdminPasswordInput,
    adminAuthError,
    handleAdminUnlock,
    studentRegistry: filteredRegistry,
    totalCount: studentRegistry.length,
    registrySearch,
    setRegistrySearch,
    handleExportRegistryCSV
  };

  // ==========================================
  // RENDER: LOGIN SCREEN
  // ==========================================
  if (!studentSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">AttendTrack Pro</h1>
              <p className="text-xs text-slate-400">Personal Class Attendance &amp; 75% Alert System</p>
            </div>
          </div>

          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition shadow-sm cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Portal</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Personal &amp; Self-Controlled</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Student Portal Login
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Enter your Name and Student ID to access your personal timetable and attendance tracker. Your attendance is completely private to you.
            </p>

            <form onSubmit={handleStudentLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Student ID / Roll Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your Student ID"
                  value={loginStudentId}
                  onChange={(e) => setLoginStudentId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm font-mono uppercase"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !authReady}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isLoggingIn ? 'Opening Your Tracker...' : 'Access My Attendance Tracker'}</span>
              </button>
            </form>

            <div className="mt-7 pt-6 border-t border-slate-800/80">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Pre-Loaded Weekly Timetable Subjects (Mon – Fri)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SUBJECTS.map((s) => (
                  <span
                    key={s.code}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium"
                  >
                    {s.code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center py-4 text-xs text-slate-500 z-10">
          Personal Student Attendance Tracker • Saturday &amp; Sunday No Classes • 75% Red Alert Protection
        </footer>

        {showAdminModal && <OwnerAdminModal {...adminModalProps} />}
      </div>
    );
  }

  // ==========================================
  // RENDER: LOGGED-IN DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium ${
              toastMessage.type === 'warning'
                ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/95 border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toastMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white">
                  {studentSession.name}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs">
                  {studentSession.studentId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personal Attendance Record • Minimum Target: 75%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCustomizeTimings}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Edit Class Timings"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Class Timings</span>
            </button>

            <button
              onClick={() => setShowAdminModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
              title="Admin Portal"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch ID</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 py-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Daily Class Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports (Weekly / Monthly / Yearly)</span>
              {analyticsData.subjectsBelow75List.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full animate-pulse">
                  {analyticsData.subjectsBelow75List.length} ALERT
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Full Schedule</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {analyticsData.overallPercentage !== null ? (
              <div
                className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${
                  analyticsData.overallBelow75
                    ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {analyticsData.overallBelow75 ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  Overall ({TIMEFRAME_OPTIONS.find((t) => t.id === selectedTimeframe)?.label || 'Custom'}):{' '}
                  {analyticsData.overallPercentage}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-500">No classes marked in period yet</span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {analyticsData.subjectsBelow75List.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/85 to-rose-950/90 border-2 border-rose-500/80 p-4 sm:p-5 shadow-xl shadow-rose-950/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-600/30 border border-rose-500 flex items-center justify-center shrink-0 animate-pulse">
                  <AlertTriangle className="w-6 h-6 text-rose-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[11px] uppercase tracking-wider">
                      RED ALERT • BELOW 75% ATTENDANCE
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    Warning! {analyticsData.subjectsBelow75List.length} Subject
                    {analyticsData.subjectsBelow75List.length > 1 ? 's have' : ' has'} dropped below the mandatory 75% requirement:
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {analyticsData.subjectsBelow75List.map((sub) => (
                      <span
                        key={sub.code}
                        className="px-3 py-1 rounded-xl bg-rose-900/70 border border-rose-400/50 text-rose-100 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span className="font-bold text-white">{sub.code}:</span>
                        <span className="text-rose-300 font-extrabold">{sub.percentage}%</span>
                        <span className="text-rose-200/80">
                          (Attend next {sub.classesNeededFor75} class{sub.classesNeededFor75 > 1 ? 'es' : ''})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {activeTab !== 'analytics' && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 transition shadow-md cursor-pointer self-start sm:self-center"
                >
                  View Full Breakdown →
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: DAILY ATTENDANCE */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Daily Class Attendance Sheet
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    {formatReadableDate(selectedDate)}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => stepDateByDays(-1)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    onClick={() => stepDateByDays(1)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedDate(toDateKey(new Date()))}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-4">
                {weekStripDays.map((item) => {
                  const isSelected = item.dateKey === selectedDate;
                  const isToday = item.dateKey === toDateKey(new Date());
                  return (
                    <button
                      key={item.dateKey}
                      onClick={() => setSelectedDate(item.dateKey)}
                      className={`p-2 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/25'
                          : item.isWeekend
                          ? 'bg-slate-950/60 border-slate-800/70 text-slate-500 hover:bg-slate-800/50'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs font-medium uppercase opacity-80">
                        {item.dayName}
                      </span>
                      <span className="text-sm sm:text-base font-bold">{item.dayNum}</span>
                      <div className="h-2 flex items-center justify-center">
                        {item.statusIndicator === 'holiday' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Holiday" />
                        )}
                        {item.statusIndicator === 'complete' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="All Present" />
                        )}
                        {item.statusIndicator === 'absent' && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="Has Absence" />
                        )}
                        {item.statusIndicator === 'partial' && (
                          <span className="w-2 h-2 rounded-full bg-sky-400" title="Partially Marked" />
                        )}
                        {item.statusIndicator === 'none' && isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDayOfWeek !== 0 && selectedDayOfWeek !== 6 && (
              <div
                className={`rounded-3xl border p-4 sm:p-5 transition ${
                  currentDayData.isHoliday
                    ? 'bg-amber-950/40 border-amber-500/70 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div
                    onClick={handleToggleHoliday}
                    className="flex items-start sm:items-center gap-3.5 cursor-pointer select-none"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={currentDayData.isHoliday}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition shrink-0 mt-0.5 sm:mt-0 ${
                        currentDayData.isHoliday
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'bg-slate-950 border-slate-600 text-transparent hover:border-amber-400'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base tracking-wide text-amber-300 flex items-center gap-1.5">
                          <Palmtree className="w-4 h-4" />
                          HOLIDAY (National / College Holiday)
                        </span>
                        {currentDayData.isHoliday && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] uppercase">
                            Active Holiday
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tick this box if today is a National Holiday or College Holiday. All classes for {selectedDate} will be excluded from attendance calculations.
                      </p>
                    </div>
                  </div>

                  {currentDayData.isHoliday && (
                    <input
                      type="text"
                      placeholder="Optional Holiday Name (e.g., National Holiday)"
                      value={currentDayData.holidayNote || ''}
                      onChange={(e) => handleHolidayNoteChange(e.target.value)}
                      className="sm:w-72 px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-100 placeholder-amber-300/40 text-xs focus:outline-none focus:border-amber-400"
                    />
                  )}
                </div>
              </div>
            )}

            {selectedDayOfWeek === 0 || selectedDayOfWeek === 6 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                  <Palmtree className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {DAY_NAMES[selectedDayOfWeek]} — Weekend (No Classes Scheduled)
                </h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  According to your timetable, there are no classes on Saturday and Sunday. Enjoy your weekend or select a weekday (Monday – Friday) above!
                </p>
              </div>
            ) : currentDayData.isHoliday ? (
              <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-300">
                  <Palmtree className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-amber-200">
                  Marked as Official Holiday {currentDayData.holidayNote ? `(${currentDayData.holidayNote})` : ''}
                </h3>
                <p className="text-sm text-slate-300 max-w-lg mx-auto">
                  None of the {todaysClasses.length} scheduled classes on {DAY_NAMES[selectedDayOfWeek]} ({selectedDate}) will count toward or against your attendance percentage. Untick the <strong>HOLIDAY</strong> box above if you wish to record classes for this day.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <span>{DAY_NAMES[selectedDayOfWeek]}&apos;s Scheduled Classes</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                        {todaysClasses.length} Classes
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Click <strong>Present</strong> or <strong>Absent</strong> as you attend each class, or tick <strong>CLASS CANCELLED</strong> beside the class name if it was cancelled.
                    </p>
                  </div>

                  <button
                    onClick={() => handleMarkAllPresentToday(todaysClasses)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark All Active Present</span>
                  </button>
                </div>

                <div className="space-y-3.5">
                  {todaysClasses.map((cls) => {
                    const slotRecord = currentDayData.classes?.[cls.slotId] || {
                      status: null,
                      cancelled: false
                    };
                    const isCancelled = Boolean(slotRecord.cancelled);
                    const status = slotRecord.status;

                    const subjStat = analyticsData.subjects.find((s) => s.code === cls.subject);

                    return (
                      <div
                        key={cls.slotId}
                        className={`rounded-2xl border p-4 sm:p-5 transition ${
                          isCancelled
                            ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                            : status === 'present'
                            ? 'bg-emerald-950/25 border-emerald-500/50'
                            : status === 'absent'
                            ? 'bg-rose-950/25 border-rose-500/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1">
                            <div
                              className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 border ${
                                isCancelled
                                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                                  : status === 'present'
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                  : status === 'absent'
                                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                              }`}
                            >
                              <span className="text-[10px] uppercase leading-none opacity-75">
                                Period
                              </span>
                              <span className="text-base leading-tight">{cls.period}</span>
                            </div>

                            <div className="space-y-1 flex-1">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h4
                                  className={`text-base sm:text-lg font-extrabold tracking-tight ${
                                    isCancelled ? 'line-through text-slate-500' : 'text-white'
                                  }`}
                                >
                                  {cls.subject}
                                </h4>

                                <div
                                  onClick={() => handleToggleClassCancelled(cls.slotId, cls.subject)}
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold cursor-pointer select-none transition ${
                                    isCancelled
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                                  }`}
                                  title="Tick if this specific class was cancelled today"
                                >
                                  {isCancelled ? (
                                    <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                  )}
                                  <span>CLASS CANCELLED</span>
                                </div>

                                {subjStat && subjStat.percentage !== null && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                                      subjStat.isBelow75
                                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                                        : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                                    }`}
                                  >
                                    {cls.subject} Avg: {subjStat.percentage}%
                                    {subjStat.isBelow75 ? ' ⚠️ <75%' : ''}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                <span className="inline-flex items-center gap-1.5 font-medium text-indigo-300">
                                  <Clock className="w-3.5 h-3.5" />
                                  {cls.time}
                                </span>
                                <span>•</span>
                                <span>
                                  {ALL_SUBJECTS.find((s) => s.code === cls.subject)?.fullName}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                            {isCancelled ? (
                              <div className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
                                <Ban className="w-4 h-4" />
                                <span>Class Cancelled — Excluded from Calculation</span>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMarkAttendance(cls.slotId, 'present', cls.subject)
                                  }
                                  className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition cursor-pointer ${
                                    status === 'present'
                                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                                      : 'bg-slate-900 hover:bg-emerald-950/50 border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-200'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Present</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMarkAttendance(cls.slotId, 'absent', cls.subject)
                                  }
                                  className={`flex-1 lg:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition cursor-pointer ${
                                    status === 'absent'
                                      ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-600/30'
                                      : 'bg-slate-900 hover:bg-rose-950/50 border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200'
                                  }`}
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Absent</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Flexible Attendance Period Filter
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    Weekly, Monthly (1, 2, 3, 4, 5... Months) &amp; Yearly Record
                  </h2>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-2xl">
                  <span className="text-xs text-slate-400 font-medium">Custom Months:</span>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={customMonthInput}
                    onChange={(e) => {
                      setCustomMonthInput(e.target.value);
                      setSelectedTimeframe('custom_months');
                    }}
                    className="w-14 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold text-center"
                  />
                  <button
                    onClick={() => setSelectedTimeframe('custom_months')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      selectedTimeframe === 'custom_months'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Apply ({customMonthInput}M)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setSelectedTimeframe(tf.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedTimeframe === tf.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`rounded-3xl border-2 p-5 sm:p-6 shadow-xl ${
                analyticsData.overallBelow75
                  ? 'bg-rose-950/30 border-rose-500/80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                <div className="lg:col-span-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Overall Combined Attendance
                    </span>
                    {analyticsData.overallPercentage !== null && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          analyticsData.overallBelow75
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {analyticsData.overallBelow75 ? 'RED ALERT < 75%' : 'SAFE >= 75%'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span
                      className={`text-4xl sm:text-5xl font-black tracking-tight ${
                        analyticsData.overallPercentage === null
                          ? 'text-slate-500'
                          : analyticsData.overallBelow75
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {analyticsData.overallPercentage !== null
                        ? `${analyticsData.overallPercentage}%`
                        : '—'}
                    </span>
                    <span className="text-xs text-slate-400">Target: 75.0%</span>
                  </div>

                  {analyticsData.overallBelow75 ? (
                    <p className="text-xs text-rose-300 font-semibold pt-1">
                      ⚠️ You must attend the next{' '}
                      <span className="underline font-extrabold">
                        {analyticsData.overallClassesNeeded} consecutive classes
                      </span>{' '}
                      to bring overall attendance back to 75%.
                    </p>
                  ) : (
                    analyticsData.overallPercentage !== null && (
                      <p className="text-xs text-emerald-300 font-medium pt-1">
                        ✓ You are above 75%. You can safely miss up to{' '}
                        <strong>{analyticsData.overallCanMiss}</strong> upcoming class
                        {analyticsData.overallCanMiss === 1 ? '' : 'es'}.
                      </p>
                    )
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block">Total Classes Held</span>
                  <span className="text-2xl font-extrabold text-white mt-1 block">
                    {analyticsData.overallTotalHeld}
                  </span>
                  <span className="text-[11px] text-slate-500">Excl. Cancelled &amp; Holidays</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                  <span className="text-xs text-emerald-300 block">Classes Attended</span>
                  <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                    {analyticsData.overallAttended}
                  </span>
                  <span className="text-[11px] text-emerald-400/70">Present</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center">
                  <span className="text-xs text-rose-300 block">Classes Missed / Cancelled</span>
                  <span className="text-2xl font-extrabold text-rose-400 mt-1 block">
                    {analyticsData.overallMissed}{' '}
                    <span className="text-xs font-normal text-amber-300">
                      ({analyticsData.overallCancelled} Cancelled)
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {analyticsData.overallHolidaysCount} Holiday Day(s)
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Each Class Separate Attendance Record (Subject-Wise)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Any class below 75% triggers an automatic Red Alert. Cancelled classes and Holidays are automatically excluded from calculations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.subjects.map((subj) => {
                  const hasData = subj.totalHeld > 0;
                  const pct = subj.percentage ?? 0;

                  return (
                    <div
                      key={subj.code}
                      className={`rounded-3xl border-2 p-5 transition flex flex-col justify-between ${
                        subj.isBelow75
                          ? 'bg-gradient-to-b from-rose-950/50 to-slate-900 border-rose-500 shadow-lg shadow-rose-950/50'
                          : hasData
                          ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
                          : 'bg-slate-900/70 border-slate-800/80'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {subj.category}
                            </span>
                            <h4 className="text-lg font-extrabold text-white mt-1.5">
                              {subj.code}
                            </h4>
                            <p className="text-xs text-slate-400">{subj.fullName}</p>
                          </div>

                          {subj.isBelow75 ? (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-md animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>RED ALERT</span>
                            </span>
                          ) : hasData ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>SAFE &ge; 75%</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 font-medium text-xs">
                              No Classes Yet
                            </span>
                          )}
                        </div>

                        <div className="mt-5">
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span
                              className={`text-3xl font-black ${
                                !hasData
                                  ? 'text-slate-500'
                                  : subj.isBelow75
                                  ? 'text-rose-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {hasData ? `${subj.percentage}%` : '—'}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {subj.attended} / {subj.totalHeld} Attended
                            </span>
                          </div>

                          <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 relative">
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                              style={{ left: '75%' }}
                              title="75% Threshold"
                            />
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                !hasData
                                  ? 'w-0'
                                  : subj.isBelow75
                                  ? 'bg-gradient-to-r from-rose-600 to-amber-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              }`}
                              style={{ width: `${hasData ? Math.min(100, pct) : 0}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Present</span>
                            <span className="text-sm font-bold text-emerald-400">
                              {subj.attended}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Absent</span>
                            <span className="text-sm font-bold text-rose-400">{subj.missed}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Cancelled</span>
                            <span className="text-sm font-bold text-amber-300">
                              {subj.cancelled}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="text-xs">
                          {subj.isBelow75 ? (
                            <span className="text-rose-300 font-semibold">
                              Attend next <strong>{subj.classesNeededFor75}</strong> class
                              {subj.classesNeededFor75 > 1 ? 'es' : ''} for 75%
                            </span>
                          ) : hasData ? (
                            <span className="text-emerald-300/90">
                              Can miss <strong>{subj.canMissSafely}</strong> class
                              {subj.canMissSafely === 1 ? '' : 'es'} safely
                            </span>
                          ) : (
                            <span className="text-slate-500">Mark attendance to calculate</span>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedSubjectDetail(subj.code)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 flex items-center gap-1 transition cursor-pointer shrink-0"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Log ({subj.history.length})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedSubjectDetail !== 'ALL' && (
              <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-indigo-400">
                      Date-by-Date Class Log
                    </span>
                    <h4 className="text-lg font-bold text-white">
                      History for {selectedSubjectDetail}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedSubjectDetail('ALL')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                  >
                    Close Log
                  </button>
                </div>

                {(() => {
                  const target = analyticsData.subjects.find(
                    (s) => s.code === selectedSubjectDetail
                  );
                  if (!target || target.history.length === 0) {
                    return (
                      <p className="text-sm text-slate-400 py-4">
                        No recorded entries for {selectedSubjectDetail} in this time period yet.
                      </p>
                    );
                  }
                  return (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {target.history.map((item, idx) => (
                        <div
                          key={`${item.dateKey}-${idx}`}
                          onClick={() => {
                            setSelectedDate(item.dateKey);
                            setActiveTab('daily');
                          }}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-white">
                              {formatReadableDate(item.dateKey)}
                            </span>
                            <span className="text-slate-400 ml-2">
                              (Period {item.period} • {item.slotTime})
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold ${
                              item.state === 'PRESENT'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.state === 'ABSENT'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {item.state}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FULL TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Master Weekly Class Schedule
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  Monday to Friday Timetable (Saturday &amp; Sunday No Class)
                </h2>
              </div>
              <button
                onClick={openCustomizeTimings}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 self-start sm:self-center cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Customize Class Timings</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((dayNum) => {
                const slots = DEFAULT_TIMETABLE[dayNum] || [];
                return (
                  <div
                    key={dayNum}
                    className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-white text-sm">{DAY_NAMES[dayNum]}</h3>
                      <span className="text-[11px] text-indigo-400 font-semibold">
                        {slots.length} Classes
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {slots.map((s) => (
                        <div
                          key={s.slotId}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800/90 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase text-indigo-400">
                              Period {s.period}
                            </span>
                          </div>
                          <p className="font-extrabold text-sm text-white">{s.subject}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{customTimings[s.slotId] || s.defaultTime}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
              <strong>Saturday &amp; Sunday:</strong> Official Weekend — No Classes Scheduled
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CUSTOMIZE CLASS TIMINGS */}
      {showTimingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Customize Class Timings</h3>
                <p className="text-xs text-slate-400">
                  Adjust the time display for any class slot on your personal timetable.
                </p>
              </div>
              <button
                onClick={() => setShowTimingModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveCustomTimings} className="p-5 overflow-y-auto space-y-5 flex-1">
              {[1, 2, 3, 4, 5].map((dayNum) => (
                <div key={dayNum} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    {DAY_NAMES[dayNum]}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DEFAULT_TIMETABLE[dayNum].map((slot) => (
                      <div
                        key={slot.slotId}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5"
                      >
                        <span className="text-xs font-bold text-white">
                          {slot.period}) {slot.subject}
                        </span>
                        <input
                          type="text"
                          value={
                            tempTimings[slot.slotId] !== undefined
                              ? tempTimings[slot.slotId]
                              : slot.defaultTime
                          }
                          onChange={(e) =>
                            setTempTimings({
                              ...tempTimings,
                              [slot.slotId]: e.target.value
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTempTimings({})}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Reset to Default Times
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer"
                >
                  Save Timings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && <OwnerAdminModal {...adminModalProps} />}
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: ADMIN MODAL
// ==========================================
function OwnerAdminModal({
  onClose,
  onLockSession,
  adminUnlocked,
  adminIdInput,
  setAdminIdInput,
  adminPasswordInput,
  setAdminPasswordInput,
  adminAuthError,
  handleAdminUnlock,
  studentRegistry,
  totalCount,
  registrySearch,
  setRegistrySearch,
  handleExportRegistryCSV
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Admin &amp; Website Owner Portal
              </h3>
              <p className="text-xs text-slate-400">
                Restricted exclusively to the Website Maker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminUnlocked && (
              <button
                onClick={onLockSession}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 cursor-pointer"
              >
                Lock Admin
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {!adminUnlocked ? (
          <form onSubmit={handleAdminUnlock} className="p-6 sm:p-8 space-y-4 max-w-md mx-auto w-full">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Enter your exclusive Administrator ID and Password to view the registry of students who have entered the website.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Admin ID
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder="Enter Admin ID"
                value={adminIdInput}
                onChange={(e) => setAdminIdInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="Enter Admin Password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {adminAuthError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Sign In to Admin Portal
            </button>
          </form>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Student Name or Student ID..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Total Students: {totalCount}</span>
                </span>

                <button
                  onClick={handleExportRegistryCSV}
                  disabled={studentRegistry.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
              {studentRegistry.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  No students matching your filter have logged into the website yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Student Full Name</th>
                        <th className="py-3 px-4">Student ID</th>
                        <th className="py-3 px-4">First Entered</th>
                        <th className="py-3 px-4">Last Active</th>
                        <th className="py-3 px-4 text-center">Sessions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {studentRegistry.map((st, index) => (
                        <tr key={st.id} className="hover:bg-slate-900/50">
                          <td className="py-3 px-4 text-slate-500 font-mono">{index + 1}</td>
                          <td className="py-3 px-4 font-bold text-white">{st.studentName}</td>
                          <td className="py-3 px-4 font-mono text-indigo-300">{st.studentId}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">
                            {st.firstJoinedIso
                              ? new Date(st.firstJoinedIso).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-xs">
                            {st.lastActiveIso
                              ? new Date(st.lastActiveIso).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-emerald-400">
                            {st.loginCount || 1}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
