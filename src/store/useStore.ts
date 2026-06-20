import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Batch, Inspection, Issue, UserRole, CheckItem, OperationLog, ReinspectionRecord, IssueTriggerSource } from '@/types';
import { mockBatches, mockInspections, mockIssues, DEFAULT_CHECK_ITEMS } from '@/data/mock';

interface AppState {
  currentRole: UserRole;
  batches: Batch[];
  inspections: Inspection[];
  issues: Issue[];
  counters: { batch: number; inspection: number; issue: number; log: number };

  setRole: (role: UserRole) => void;
  addBatch: (batch: Omit<Batch, 'id' | 'status' | 'createdAt'>) => void;
  updateBatchStatus: (id: string, status: Batch['status']) => void;
  addInspection: (batchId: string) => void;
  updateCheckItem: (inspectionId: string, itemIndex: number, passed: boolean | null, remark?: string) => void;
  submitInspection: (inspectionId: string) => void;
  signInspection: (inspectionId: string, opinion: string) => void;
  addIssue: (issue: Omit<Issue, 'id' | 'status' | 'createdAt' | 'closedAt' | 'rectificationPhotos' | 'rectificationNote'> & { isDraft?: boolean }) => void;
  submitRectification: (issueId: string, photos: string[], note: string) => void;
  closeIssue: (issueId: string) => void;
  startReinspection: (inspectionId: string) => void;
  submitReinspection: (inspectionId: string, note: string) => void;
  createIssueDraft: (inspectionId: string, triggerSource: IssueTriggerSource, triggerReinspectionCount: number) => Issue | null;
  updateIssueDraft: (issueId: string, data: Partial<Issue>) => void;
  addLog: (inspectionId: string, log: Omit<OperationLog, 'id' | 'timestamp'>) => void;
}

function extractNum(id: string): number {
  const m = id.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function initCounters(batches: Batch[], inspections: Inspection[], issues: Issue[]) {
  const b = batches.reduce((max, x) => Math.max(max, extractNum(x.id)), 0);
  const i = inspections.reduce((max, x) => Math.max(max, extractNum(x.id)), 0);
  const q = issues.reduce((max, x) => Math.max(max, extractNum(x.id)), 0);
  const l = inspections.reduce(
    (max, x) => Math.max(max, x.logs.reduce((m, log) => Math.max(m, extractNum(log.id)), 0)),
    0
  );
  return { batch: b, inspection: i, issue: q, log: l };
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

export const predictResult = (checkItems: CheckItem[]): { predicted: Inspection['result'] | '预计可接收' | '预计需复检' | '预计拒收'; failedCount: number; uncheckedCount: number } => {
  const failedCount = checkItems.filter((c) => c.passed === false).length;
  const uncheckedCount = checkItems.filter((c) => c.passed === null).length;

  if (uncheckedCount === 0) {
    if (failedCount >= 2) return { predicted: '拒收', failedCount, uncheckedCount };
    if (failedCount === 1) return { predicted: '需复检', failedCount, uncheckedCount };
    return { predicted: '可接收', failedCount, uncheckedCount };
  }

  if (failedCount >= 2) {
    return { predicted: '预计拒收', failedCount, uncheckedCount };
  }
  if (failedCount === 1) {
    return { predicted: '预计需复检', failedCount, uncheckedCount };
  }
  return { predicted: '预计可接收', failedCount, uncheckedCount };
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const initialCounters = initCounters(mockBatches, mockInspections, mockIssues);

      const addLog = (inspectionId: string, log: Omit<OperationLog, 'id' | 'timestamp'>) => {
        set((s) => {
          const newLogId = nextId('L', s.counters.log + 1);
          const newLog: OperationLog = {
            ...log,
            id: newLogId,
            timestamp: new Date().toISOString(),
          };
          return {
            counters: { ...s.counters, log: s.counters.log + 1 },
            inspections: s.inspections.map((insp) =>
              insp.id === inspectionId
                ? { ...insp, logs: [...insp.logs, newLog] }
                : insp
            ),
          };
        });
      };

      const createIssueDraft = (inspectionId: string, triggerSource: IssueTriggerSource, triggerReinspectionCount: number): Issue | null => {
        const state = get();
        const insp = state.inspections.find((i) => i.id === inspectionId);
        const batch = state.batches.find((b) => b.id === insp?.batchId);
        if (!insp || !batch) return null;

        const failedItems = insp.checkItems.filter((c) => c.passed === false);
        if (failedItems.length === 0) return null;

        const descriptions = failedItems
          .map((item) => `${item.name}${item.remark ? `（${item.remark}）` : ''}`)
          .join('；');

        const draft: Issue = {
          id: '',
          inspectionId,
          batchId: batch.id,
          description: `${batch.category} ${batch.specification}：${descriptions}`,
          responsibleUnit: '供应商',
          reviewDate: '',
          rectificationPhotos: [],
          rectificationNote: '',
          status: '待整改',
          createdBy: state.currentRole,
          createdAt: new Date().toISOString(),
          closedAt: null,
          isDraft: true,
          triggerSource,
          triggerReinspectionCount,
        };

        return draft;
      };

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
          const inspId = nextId('I', newNum);
          const logId = nextId('L', state.counters.log + 1);

          const newInspection: Inspection = {
            id: inspId,
            batchId,
            checkItems: DEFAULT_CHECK_ITEMS.map((item) => ({ ...item })),
            result: null,
            inspector: state.currentRole,
            inspectedAt: null,
            supervisorOpinion: '',
            supervisor: '',
            signedAt: null,
            reinspectionCount: 0,
            lastReinspectionAt: null,
            reinspectionNote: '',
            isReinspecting: false,
            reinspectionHistory: [],
            logs: [
              {
                id: logId,
                type: 'start_inspection',
                operator: state.currentRole,
                timestamp: new Date().toISOString(),
                description: '开始现场验收',
              },
            ],
          };
          set((s) => ({
            inspections: [newInspection, ...s.inspections],
            counters: { ...s.counters, inspection: newNum, log: s.counters.log + 1 },
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
          const state = get();
          const insp = state.inspections.find((i) => i.id === inspectionId);
          if (!insp) return;

          const result = calculateResult(insp.checkItems);
          if (!result) return;

          const failedItems = insp.checkItems.filter((c) => c.passed === false).map((c) => c.name);

          set((s) => {
            const newLogId = nextId('L', s.counters.log + 1);
            const newLog: OperationLog = {
              id: newLogId,
              type: 'submit_result',
              operator: s.currentRole,
              timestamp: new Date().toISOString(),
              description: `提交验收结论：${result}`,
              details: { failedItems },
            };

            const updatedInspections = s.inspections.map((i) =>
              i.id === inspectionId
                ? {
                    ...i,
                    result,
                    inspector: s.currentRole,
                    inspectedAt: new Date().toISOString(),
                    logs: [...i.logs, newLog],
                  }
                : i
            );

            const batchId = insp.batchId;
            const updatedBatches = s.batches.map((b) =>
              b.id === batchId ? { ...b, status: '已完成' as const } : b
            );

            let updatedIssues = s.issues;
            let newCounters = { ...s.counters, log: s.counters.log + 1 };

            if (result === '需复检' || result === '拒收') {
              const draft = createIssueDraft(inspectionId, 'initial_inspection', 0);
              if (draft) {
                const newIssueId = nextId('Q', newCounters.issue + 1);
                const newIssue: Issue = {
                  ...draft,
                  id: newIssueId,
                };
                updatedIssues = [newIssue, ...s.issues];
                newCounters = { ...newCounters, issue: newCounters.issue + 1 };
              }
            }

            return {
              inspections: updatedInspections,
              batches: updatedBatches,
              issues: updatedIssues,
              counters: newCounters,
            };
          });
        },

        signInspection: (inspectionId, opinion) => {
          const state = get();
          const insp = state.inspections.find((i) => i.id === inspectionId);
          if (!insp) return;

          set((s) => {
            const newLogId = nextId('L', s.counters.log + 1);
            const newLog: OperationLog = {
              id: newLogId,
              type: 'sign',
              operator: s.currentRole,
              timestamp: new Date().toISOString(),
              description: '监理签署意见',
            };

            const updatedInspections = s.inspections.map((i) =>
              i.id === inspectionId
                ? {
                    ...i,
                    supervisorOpinion: opinion,
                    supervisor: s.currentRole,
                    signedAt: new Date().toISOString(),
                    logs: [...i.logs, newLog],
                  }
                : i
            );

            return {
              inspections: updatedInspections,
              counters: { ...s.counters, log: s.counters.log + 1 },
            };
          });
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
            isDraft: issue.isDraft ?? false,
            triggerSource: issue.triggerSource ?? 'initial_inspection',
            triggerReinspectionCount: issue.triggerReinspectionCount ?? 0,
          };

          set((s) => {
            const newLogId = nextId('L', s.counters.log + 1);
            const newLog: OperationLog = {
              id: newLogId,
              type: 'create_issue',
              operator: s.currentRole,
              timestamp: new Date().toISOString(),
              description: `生成整改单 ${newIssue.id}`,
            };

            return {
              issues: [newIssue, ...s.issues],
              inspections: s.inspections.map((i) =>
                i.id === issue.inspectionId
                  ? { ...i, logs: [...i.logs, newLog] }
                  : i
              ),
              counters: { ...s.counters, issue: newNum, log: s.counters.log + 1 },
            };
          });
        },

        updateIssueDraft: (issueId, data) => {
          const state = get();
          const issue = state.issues.find((i) => i.id === issueId);
          if (!issue) return;

          set((s) => {
            const wasDraft = issue.isDraft;
            const updatedIssues = s.issues.map((iss) =>
              iss.id === issueId ? { ...iss, ...data, isDraft: false } : iss
            );

            if (!wasDraft) {
              return { issues: updatedIssues };
            }

            const newLogId = nextId('L', s.counters.log + 1);
            const newLog: OperationLog = {
              id: newLogId,
              type: 'create_issue',
              operator: s.currentRole,
              timestamp: new Date().toISOString(),
              description: `确认整改单 ${issueId}${issue.triggerSource === 'reinspection' ? `（第${issue.triggerReinspectionCount}次复检触发）` : ''}`,
            };

            return {
              issues: updatedIssues,
              inspections: s.inspections.map((i) =>
                i.id === issue.inspectionId
                  ? { ...i, logs: [...i.logs, newLog] }
                  : i
              ),
              counters: { ...s.counters, log: s.counters.log + 1 },
            };
          });
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
          const state = get();
          const issue = state.issues.find((i) => i.id === issueId);
          if (!issue) return;

          set((s) => {
            const newLogId = nextId('L', s.counters.log + 1);
            const newLog: OperationLog = {
              id: newLogId,
              type: 'close_issue',
              operator: s.currentRole,
              timestamp: new Date().toISOString(),
              description: `整改单 ${issueId} 已关闭`,
            };

            return {
              issues: s.issues.map((iss) =>
                iss.id === issueId
                  ? { ...iss, status: '已关闭' as const, closedAt: new Date().toISOString() }
                  : iss
              ),
              inspections: s.inspections.map((i) =>
                i.id === issue.inspectionId
                  ? { ...i, logs: [...i.logs, newLog] }
                  : i
              ),
              counters: { ...s.counters, log: s.counters.log + 1 },
            };
          });
        },

        startReinspection: (inspectionId) => {
          set((s) => {
            const insp = s.inspections.find((i) => i.id === inspectionId);
            if (!insp) return {};

            const newLogId = nextId('L', s.counters.log + 1);
            const nextCount = insp.reinspectionCount + 1;
            const newLog: OperationLog = {
              id: newLogId,
              type: 'start_reinspection',
              operator: s.currentRole,
              timestamp: new Date().toISOString(),
              description: `开始第 ${nextCount} 次复检`,
            };

            return {
              inspections: s.inspections.map((i) =>
                i.id === inspectionId
                  ? {
                      ...i,
                      result: null,
                      isReinspecting: true,
                      checkItems: DEFAULT_CHECK_ITEMS.map((item) => ({ ...item })),
                      logs: [...i.logs, newLog],
                    }
                  : i
              ),
              counters: { ...s.counters, log: s.counters.log + 1 },
            };
          });
        },

        submitReinspection: (inspectionId, note) => {
          const state = get();
          const insp = state.inspections.find((i) => i.id === inspectionId);
          if (!insp) return;

          const result = calculateResult(insp.checkItems);
          if (!result) return;

          const failedItems = insp.checkItems.filter((c) => c.passed === false).map((c) => c.name);
          const nextCount = insp.reinspectionCount + 1;

          set((s) => {
            const newLogId = nextId('L', s.counters.log + 1);
            const newLog: OperationLog = {
              id: newLogId,
              type: 'submit_reinspection',
              operator: s.currentRole,
              timestamp: new Date().toISOString(),
              description: `第 ${nextCount} 次复检结论：${result}${note ? ` - ${note}` : ''}`,
              details: { failedItems, note, count: nextCount },
            };

            const reinspectionRecord: ReinspectionRecord = {
              count: nextCount,
              result,
              note,
              inspectedAt: new Date().toISOString(),
              failedItems,
            };

            let updatedIssues = s.issues;
            let newCounters = { ...s.counters, log: s.counters.log + 1 };

            if (result === '需复检' || result === '拒收') {
              const draft = createIssueDraft(inspectionId, 'reinspection', nextCount);
              if (draft) {
                const existingDraft = s.issues.find(
                  (i) => i.inspectionId === inspectionId && i.isDraft && i.triggerReinspectionCount === nextCount
                );
                if (!existingDraft) {
                  const newIssueId = nextId('Q', newCounters.issue + 1);
                  const newIssue: Issue = {
                    ...draft,
                    id: newIssueId,
                  };
                  updatedIssues = [newIssue, ...s.issues];
                  newCounters = { ...newCounters, issue: newCounters.issue + 1 };
                }
              }
            }

            return {
              inspections: s.inspections.map((i) =>
                i.id === inspectionId
                  ? {
                      ...i,
                      result,
                      isReinspecting: false,
                      reinspectionCount: nextCount,
                      lastReinspectionAt: new Date().toISOString(),
                      reinspectionNote: note,
                      inspectedAt: new Date().toISOString(),
                      reinspectionHistory: [...i.reinspectionHistory, reinspectionRecord],
                      logs: [...i.logs, newLog],
                    }
                  : i
              ),
              issues: updatedIssues,
              counters: newCounters,
            };
          });
        },

        addLog,
        createIssueDraft,
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
