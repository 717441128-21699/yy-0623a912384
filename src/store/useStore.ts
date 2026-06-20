import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Batch, Inspection, Issue, UserRole, CheckItem } from '@/types';
import { mockBatches, mockInspections, mockIssues, DEFAULT_CHECK_ITEMS } from '@/data/mock';

interface AppState {
  currentRole: UserRole;
  batches: Batch[];
  inspections: Inspection[];
  issues: Issue[];
  counters: { batch: number; inspection: number; issue: number };

  setRole: (role: UserRole) => void;
  addBatch: (batch: Omit<Batch, 'id' | 'status' | 'createdAt'>) => void;
  updateBatchStatus: (id: string, status: Batch['status']) => void;
  addInspection: (batchId: string) => void;
  updateCheckItem: (inspectionId: string, itemIndex: number, passed: boolean | null, remark?: string) => void;
  submitInspection: (inspectionId: string) => void;
  signInspection: (inspectionId: string, opinion: string) => void;
  addIssue: (issue: Omit<Issue, 'id' | 'status' | 'createdAt' | 'closedAt' | 'rectificationPhotos' | 'rectificationNote'>) => void;
  submitRectification: (issueId: string, photos: string[], note: string) => void;
  closeIssue: (issueId: string) => void;
}

function extractNum(id: string): number {
  const m = id.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function initCounters(batches: Batch[], inspections: Inspection[], issues: Issue[]) {
  const b = batches.reduce((max, x) => Math.max(max, extractNum(x.id)), 0);
  const i = inspections.reduce((max, x) => Math.max(max, extractNum(x.id)), 0);
  const q = issues.reduce((max, x) => Math.max(max, extractNum(x.id)), 0);
  return { batch: b, inspection: i, issue: q };
}

const nextId = (prefix: string, num: number) => `${prefix}${String(num).padStart(3, '0')}`;

export const calculateResult = (checkItems: CheckItem[]): Inspection['result'] => {
  const failedCount = checkItems.filter((c) => c.passed === false).length;
  const uncheckedCount = checkItems.filter((c) => c.passed === null).length;
  if (uncheckedCount > 0) return null;
  if (failedCount >= 2) return '拒收';
  if (failedCount === 1) return '需复检';
  return '可接收';
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const initialCounters = initCounters(mockBatches, mockInspections, mockIssues);
      return {
        currentRole: '材料员',
        batches: mockBatches,
        inspections: mockInspections,
        issues: mockIssues,
        counters: initialCounters,

        setRole: (role) => set({ currentRole: role }),

        addBatch: (batch) => {
          const state = get();
          const newNum = state.counters.batch + 1;
          const newBatch: Batch = {
            ...batch,
            id: nextId('B', newNum),
            status: '待验收',
            createdAt: new Date().toISOString(),
          };
          set((s) => ({
            batches: [newBatch, ...s.batches],
            counters: { ...s.counters, batch: newNum },
          }));
        },

        updateBatchStatus: (id, status) => {
          set((s) => ({
            batches: s.batches.map((b) => (b.id === id ? { ...b, status } : b)),
          }));
        },

        addInspection: (batchId) => {
          const state = get();
          const newNum = state.counters.inspection + 1;
          const newInspection: Inspection = {
            id: nextId('I', newNum),
            batchId,
            checkItems: DEFAULT_CHECK_ITEMS.map((item) => ({ ...item })),
            result: null,
            inspector: state.currentRole,
            inspectedAt: null,
            supervisorOpinion: '',
            supervisor: '',
            signedAt: null,
          };
          set((s) => ({
            inspections: [newInspection, ...s.inspections],
            counters: { ...s.counters, inspection: newNum },
            batches: s.batches.map((b) =>
              b.id === batchId ? { ...b, status: '验收中' as const } : b
            ),
          }));
        },

        updateCheckItem: (inspectionId, itemIndex, passed, remark) => {
          set((s) => ({
            inspections: s.inspections.map((insp) => {
              if (insp.id !== inspectionId) return insp;
              const newItems = [...insp.checkItems];
              newItems[itemIndex] = { ...newItems[itemIndex], passed, remark };
              return { ...insp, checkItems: newItems };
            }),
          }));
        },

        submitInspection: (inspectionId) => {
          set((s) => {
            const insp = s.inspections.find((i) => i.id === inspectionId);
            if (!insp) return s;
            const result = calculateResult(insp.checkItems);
            if (!result) return s;

            const updatedInspections = s.inspections.map((i) =>
              i.id === inspectionId
                ? { ...i, result, inspector: s.currentRole, inspectedAt: new Date().toISOString() }
                : i
            );

            const batchId = insp.batchId;
            const updatedBatches = s.batches.map((b) =>
              b.id === batchId ? { ...b, status: '已完成' as const } : b
            );

            return { inspections: updatedInspections, batches: updatedBatches };
          });
        },

        signInspection: (inspectionId, opinion) => {
          set((s) => ({
            inspections: s.inspections.map((i) =>
              i.id === inspectionId
                ? {
                    ...i,
                    supervisorOpinion: opinion,
                    supervisor: s.currentRole,
                    signedAt: new Date().toISOString(),
                  }
                : i
            ),
          }));
        },

        addIssue: (issue) => {
          const state = get();
          const newNum = state.counters.issue + 1;
          const newIssue: Issue = {
            ...issue,
            id: nextId('Q', newNum),
            rectificationPhotos: [],
            rectificationNote: '',
            status: '待整改',
            createdAt: new Date().toISOString(),
            closedAt: null,
          };
          set((s) => ({
            issues: [newIssue, ...s.issues],
            counters: { ...s.counters, issue: newNum },
          }));
        },

        submitRectification: (issueId, photos, note) => {
          set((s) => ({
            issues: s.issues.map((iss) =>
              iss.id === issueId
                ? { ...iss, rectificationPhotos: photos, rectificationNote: note, status: '整改中' as const }
                : iss
            ),
          }));
        },

        closeIssue: (issueId) => {
          set((s) => ({
            issues: s.issues.map((iss) =>
              iss.id === issueId
                ? { ...iss, status: '已关闭' as const, closedAt: new Date().toISOString() }
                : iss
            ),
          }));
        },
      };
    },
    {
      name: 'material-acceptance-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const counters = initCounters(state.batches, state.inspections, state.issues);
          state.counters = counters;
        }
      },
    }
  )
);
