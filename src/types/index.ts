export type MaterialCategory = '钢筋' | '水泥' | '防水卷材' | '混凝土' | '砖块' | '砂石' | '其他';

export type BatchStatus = '待验收' | '验收中' | '已完成';

export type InspectionResult = '可接收' | '需复检' | '拒收';

export type IssueStatus = '待整改' | '整改中' | '已关闭';

export type UserRole = '材料员' | '质检员' | '监理工程师';

export type LogType = 'start_inspection' | 'submit_result' | 'sign' | 'create_issue' | 'start_reinspection' | 'submit_reinspection' | 'close_issue';

export type IssueTriggerSource = 'initial_inspection' | 'reinspection';

export interface CheckItem {
  name: string;
  passed: boolean | null;
  remark?: string;
}

export interface OperationLog {
  id: string;
  type: LogType;
  operator: string;
  timestamp: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface Batch {
  id: string;
  category: MaterialCategory;
  supplier: string;
  specification: string;
  contractQuantity: number;
  unit: string;
  plateNumber: string;
  arrivalTime: string;
  deliveryPhotos: string[];
  status: BatchStatus;
  createdBy: string;
  createdAt: string;
}

export interface ReinspectionRecord {
  count: number;
  result: InspectionResult;
  note: string;
  inspectedAt: string;
  failedItems: string[];
}

export interface Inspection {
  id: string;
  batchId: string;
  checkItems: CheckItem[];
  result: InspectionResult | null;
  inspector: string;
  inspectedAt: string | null;
  supervisorOpinion: string;
  supervisor: string;
  signedAt: string | null;
  reinspectionCount: number;
  lastReinspectionAt: string | null;
  reinspectionNote: string;
  isReinspecting: boolean;
  reinspectionHistory: ReinspectionRecord[];
  logs: OperationLog[];
}

export interface Issue {
  id: string;
  inspectionId: string;
  batchId: string;
  description: string;
  responsibleUnit: string;
  reviewDate: string;
  rectificationPhotos: string[];
  rectificationNote: string;
  status: IssueStatus;
  createdBy: string;
  createdAt: string;
  closedAt: string | null;
  isDraft: boolean;
  triggerSource: IssueTriggerSource;
  triggerReinspectionCount: number;
}
