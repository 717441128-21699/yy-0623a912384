import { X, FileText, RefreshCw, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import { cn } from '@/lib/utils';
import type { OperationLog } from '@/types';

interface IssueDetailPanelProps {
  issueId: string;
  onClose: () => void;
}

const logIcons: Record<OperationLog['type'], React.ElementType> = {
  start_inspection: FileText,
  submit_result: CheckCircle2,
  sign: FileText,
  create_issue: AlertCircle,
  start_reinspection: RefreshCw,
  submit_reinspection: RefreshCw,
  close_issue: CheckCircle2,
};

const logColors: Record<OperationLog['type'], string> = {
  start_inspection: 'bg-blue-500',
  submit_result: 'bg-orange-500',
  sign: 'bg-purple-500',
  create_issue: 'bg-red-500',
  start_reinspection: 'bg-amber-400',
  submit_reinspection: 'bg-amber-600',
  close_issue: 'bg-emerald-500',
};

export default function IssueDetailPanel({ issueId, onClose }: IssueDetailPanelProps) {
  const issue = useStore((s) => s.issues.find((i) => i.id === issueId)!);
  const inspection = useStore((s) => s.inspections.find((i) => i.id === issue.inspectionId));
  const batch = useStore((s) => s.batches.find((b) => b.id === issue.batchId));
  const relatedIssues = useStore((s) => s.issues.filter((i) => i.inspectionId === issue.inspectionId && !i.isDraft));

  if (!inspection || !batch) return null;

  const failedItems = inspection.checkItems.filter((c) => c.passed === false);
  const sourceLabel = issue.triggerSource === 'reinspection'
    ? `第${issue.triggerReinspectionCount}次复检触发`
    : '首次验收触发';

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[580px] bg-white h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">整改单详情</h3>
            <p className="text-xs text-zinc-500">
              编号: {issue.id}
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-600">
                {sourceLabel}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">整改状态</span>
            <StatusBadge status={issue.status} />
          </div>

          <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900">{batch.category} · {batch.specification}</span>
              <StatusBadge status={batch.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600">
              <span>供应商: {batch.supplier}</span>
              <span>合同数量: {batch.contractQuantity.toLocaleString()} {batch.unit}</span>
              <span>车牌号: {batch.plateNumber}</span>
              <span>到场时间: {new Date(batch.arrivalTime).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>

          {batch.deliveryPhotos.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">送货单照片</p>
              <PhotoGrid photos={batch.deliveryPhotos} maxPreview={4} />
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2">关联验收单</p>
            <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#E8652A]">{inspection.id}</span>
                {inspection.result && <StatusBadge status={inspection.result} />}
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1.5">不符合项 <span className="text-red-500">({failedItems.length})</span></p>
                <div className="space-y-1.5">
                  {failedItems.length > 0 ? (
                    failedItems.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 px-3 py-2 bg-red-50 rounded text-sm">
                        <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-red-700 font-medium">{item.name}</span>
                          {item.remark && (
                            <p className="text-[11px] text-red-500 mt-0.5">{item.remark}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-400">无不符合项</p>
                  )}
                </div>
              </div>

              {inspection.supervisorOpinion && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-semibold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    监理意见
                  </p>
                  <p className="text-sm text-purple-900">{inspection.supervisorOpinion}</p>
                  {inspection.signedAt && (
                    <p className="text-[10px] text-purple-400 mt-1.5">
                      签署人: {inspection.supervisor} · {new Date(inspection.signedAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              )}

              {inspection.reinspectionCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-semibold mb-2 flex items-center gap-1.5">
                    <RefreshCw size={12} />
                    复检处理（共 {inspection.reinspectionCount} 次）
                  </p>
                  <div className="space-y-2">
                    {inspection.reinspectionHistory.map((record) => (
                      <div key={record.count} className="bg-white/70 rounded p-2.5 border border-amber-200/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-amber-700">第 {record.count} 次</span>
                          <StatusBadge status={record.result} />
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(record.inspectedAt).toLocaleString('zh-CN')}
                        </p>
                        {record.failedItems.length > 0 && (
                          <p className="text-[11px] text-amber-600 mt-1">
                            不符合: {record.failedItems.join('、')}
                          </p>
                        )}
                        {record.note && (
                          <p className="text-[11px] text-zinc-600 mt-1 bg-white rounded px-2 py-1">
                            说明: {record.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs text-zinc-500 mb-3 flex items-center gap-1.5">
              <AlertCircle size={12} className="text-red-500" />
              整改单信息
            </p>
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-600 font-semibold mb-1">问题描述</p>
                <p className="text-sm text-red-900">{issue.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-zinc-500 mb-0.5">责任单位</p>
                  <p className="text-zinc-900 font-medium">{issue.responsibleUnit}</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-zinc-500 mb-0.5">复查日期</p>
                  <p className="text-zinc-900 font-medium">{new Date(issue.reviewDate).toLocaleDateString('zh-CN')}</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-zinc-500 mb-0.5">创建人</p>
                  <p className="text-zinc-900 font-medium">{issue.createdBy}</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-zinc-500 mb-0.5">创建时间</p>
                  <p className="text-zinc-900 font-medium">{new Date(issue.createdAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <p className="text-xs text-zinc-500 mb-3 font-medium">整改进度</p>
            <div className="space-y-3">
              {issue.rectificationNote ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 font-semibold mb-1">整改结果</p>
                    <p className="text-sm text-emerald-900">{issue.rectificationNote}</p>
                  </div>
                  {issue.rectificationPhotos.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">整改凭证</p>
                      <PhotoGrid photos={issue.rectificationPhotos} maxPreview={4} />
                    </div>
                  )}
                  {issue.closedAt && (
                    <p className="text-[10px] text-zinc-400 text-center">
                      关闭时间: {new Date(issue.closedAt).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-lg p-6 text-center">
                  <p className="text-xs text-zinc-500">等待材料员补传整改结果...</p>
                </div>
              )}
            </div>
          </div>

          {relatedIssues.length > 1 && (
            <div className="border-t border-zinc-100 pt-4">
              <p className="text-xs text-zinc-500 mb-2">同验收单关联整改单</p>
              <div className="space-y-1.5">
                {relatedIssues.filter((i) => i.id !== issue.id).map((ri) => (
                  <div key={ri.id} className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded text-xs">
                    <div>
                      <span className="font-mono text-[#E8652A] mr-2">{ri.id}</span>
                      <span className="text-zinc-600">
                        {ri.triggerSource === 'reinspection' ? `第${ri.triggerReinspectionCount}次复检` : '首次验收'}
                      </span>
                    </div>
                    <StatusBadge status={ri.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {inspection.logs.length > 0 && (
            <div className="border-t border-zinc-100 pt-5">
              <p className="text-xs text-zinc-500 mb-3 font-medium">操作时间线</p>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-200" />
                {inspection.logs
                  .slice()
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((log) => {
                    const Icon = logIcons[log.type];
                    return (
                      <div key={log.id} className="relative">
                        <div
                          className={cn(
                            'absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white',
                            logColors[log.type]
                          )}
                        >
                          <Icon size={10} />
                        </div>
                        <div className="bg-zinc-50 rounded-lg px-3 py-2.5">
                          <p className="text-sm text-zinc-900 font-medium">{log.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              {log.operator}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(log.timestamp).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
