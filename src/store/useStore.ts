import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Batch, Inspection, Issue, UserRole, CheckItem } from '@/types';
import { mockBatches, mockInspections, mockIssues, DEFAULT_CHECK_ITEMS } from '@/data/mock';

interface AppState {
  currentRole: UserRole;
  batches: Batch[];
  inspections: Inspection[];
  issues: Issue[];

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

let counter = 100;
const nextId = (prefix: string) => `${prefix}${String(++counter).padStart(3, '0')}`;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentRole: '材料员',
      batches: mockBatches,
      inspections: mockInspections,
      issues: mockIssues,

      setRole: (role) => set({ currentRole: role }),

      addBatch: (batch) => {
        const newBatch: Batch = {
          ...batch,
          id: nextId('B'),
          status: '待验收',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ batches: [newBatch, ...s.batches] }));
      },

      updateBatchStatus: (id, status) => {
        set((s) => ({
          batches: s.batches.map((b) => (b.id === id ? { ...b, status } : b)),
        }));
      },

      addInspection: (batchId) => {
        const newInspection: Inspection = {
          id: nextId('I'),
          batchId,
          checkItems: DEFAULT_CHECK_ITEMS.map((item) => ({ ...item })),
          result: null,
          inspector: get().currentRole,
          inspectedAt: null,
          supervisorOpinion: '',
          supervisor: '',
          signedAt: null,
        };
        set((s) => ({
          inspections: [newInspection, ...s.inspections],
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
          const failedCount = insp.checkItems.filter((c) => c.passed === false).length;
          const uncheckedCount = insp.checkItems.filter((c) => c.passed === null).length;
          let result: Inspection['result'] = '可接收';
          if (uncheckedCount > 0) result = null;
          else if (failedCount >= 2) result = '拒收';
          else if (failedCount === 1) result = '需复检';

          const updatedInspections = s.inspections.map((i) =>
            i.id === inspectionId
              ? { ...i, result, inspector: s.currentRole, inspectedAt: new Date().toISOString() }
              : i
          );

          const batchId = insp.batchId;
          const updatedBatches = s.batches.map((b) =>
            b.id === batchId && result !== null
              ? { ...b, status: '已完成' as const }
              : b
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
        const newIssue: Issue = {
          ...issue,
          id: nextId('Q'),
          rectificationPhotos: [],
          rectificationNote: '',
          status: '待整改',
          createdAt: new Date().toISOString(),
          closedAt: null,
        };
        set((s) => ({ issues: [newIssue, ...s.issues] }));
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
    }),
    {
      name: 'material-acceptance-storage',
    }
  )
);
