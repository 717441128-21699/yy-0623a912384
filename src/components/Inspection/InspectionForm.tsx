import { useState } from 'react';
import { X, Check, XCircle, AlertTriangle, CheckCircle2, Clock, FileCheck, User, PenLine, RefreshCw, AlertCircle, FileText, History } from 'lucide-react';
import { useStore, predictResult } from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import { cn } from '@/lib/utils';
import type { OperationLog } from '@/types';

interface InspectionFormProps {
  inspectionId: string;
  onClose: () => void;
}

const logIcons: Record<OperationLog['type'], React.ElementType> = {
  start_inspection: FileCheck,
  submit_result: CheckCircle2,
  sign: PenLine,
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

export default function InspectionForm({ inspectionId, onClose }: InspectionFormProps) {
  const inspection = useStore((s) => s.inspections.find((i) => i.id === inspectionId)!);
  const batches = useStore((s) => s.batches);
  const currentRole = useStore((s) => s.currentRole);
  const updateCheckItem = useStore((s) => s.updateCheckItem);
  const submitInspection = useStore((s) => s.submitInspection);
  const startReinspection = useStore((s) => s.startReinspection);
  const submitReinspection = useStore((s) => s.submitReinspection);
  const [reinspectionNote, setReinspectionNote] = useState('');

  const batch = batches.find((b) => b.id === inspection.batchId);
  const isInitialEditable = currentRole === '质检员' && !inspection.result && !inspection.isReinspecting;
  const isReinspecting = currentRole === '质检员' && inspection.isReinspecting;
  const isEditable = isInitialEditable || isReinspecting;
  const isReinspectable = currentRole === '质检员' && inspection.result === '需复检' && !inspection.isReinspecting;

  const totalItems = inspection.checkItems.length;
  const checkedItems = inspection.checkItems.filter((c) => c.passed !== null).length;
  const failedItems = inspection.checkItems.filter((c) => c.passed === false);
  const uncheckedItems = inspection.checkItems.filter((c) => c.passed === null);
  const allChecked = checkedItems === totalItems;

  const prediction = predictResult(inspection.checkItems);

  const handleSubmit = () => {
    if (!allChecked) return;
    if (isReinspecting) {
      submitReinspection(inspection.id, reinspectionNote);
      setReinspectionNote('');
    } else {
      submitInspection(inspection.id);
    }
  };

  const handleStartReinspection = () => {
    startReinspection(inspection.id);
    setReinspectionNote('');
  };

  const getPredictionStyle = () => {
    if (prediction.predicted === '可接收' || prediction.predicted === '预计可接收') {
      return 'bg-emerald-50 border-emerald-200';
    }
    if (prediction.predicted === '需复检' || prediction.predicted === '预计需复检') {
      return 'bg-amber-50 border-amber-200';
    }
    if (prediction.predicted === '拒收' || prediction.predicted === '预计拒收') {
      return 'bg-red-50 border-red-200';
    }
    return 'bg-zinc-50 border-zinc-200';
  };

  const getPredictionBadge = () => {
    if (prediction.predicted === '可接收' || prediction.predicted === '预计可接收') {
      return <StatusBadge status="可接收" className="text-sm px-4 py-1" />;
    }
    if (prediction.predicted === '需复检' || prediction.predicted === '预计需复检') {
      return <StatusBadge status="需复检" className="text-sm px-4 py-1" />;
    }
    if (prediction.predicted === '拒收' || prediction.predicted === '预计拒收') {
      return <StatusBadge status="拒收" className="text-sm px-4 py-1" />;
    }
    return <span className="text-sm text-zinc-400 font-medium">待完成全部检查</span>;
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[560px] bg-white h-full shadow-xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">
              {isReinspecting && (
                <span className="inline-flex items-center gap-1.5 mr-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full align-middle">
                  <RefreshCw size={12} /> 复检中
                </span>
              )}
              {inspection.result === null && inspection.reinspectionCount > 0 && !isReinspecting ? '复检检查' : '验收检查'}
            </h3>
            <p className="text-xs text-zinc-500">
              验收单号: {inspection.id}
              {inspection.reinspectionCount > 0 && ` · 已复检 ${inspection.reinspectionCount} 次`}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {batch && (
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
          )}

          {batch && batch.deliveryPhotos.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">送货单照片</p>
              <PhotoGrid photos={batch.deliveryPhotos} maxPreview={4} />
            </div>
          )}

          {isReinspectable && (
            <button
              onClick={handleStartReinspection}
              className="w-full py-3 bg-amber-50 border-2 border-dashed border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100 hover:border-amber-400 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              开始第 {inspection.reinspectionCount + 1} 次复检 · 重新确认检查项
            </button>
          )}

          {isEditable && (
            <div className={cn(
              'rounded-lg p-3.5 border',
              isReinspecting ? 'bg-amber-50 border-amber-200' : 'bg-[#FFF3ED] border-orange-200'
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  'text-xs font-semibold',
                  isReinspecting ? 'text-amber-700' : 'text-[#E8652A]'
                )}>
                  {isReinspecting ? `第 ${inspection.reinspectionCount + 1} 次复检进度` : '检查进度'}
                </span>
                <span className={cn(
                  'text-xs font-mono',
                  isReinspecting ? 'text-amber-700' : 'text-[#E8652A]'
                )}>{checkedItems} / {totalItems}</span>
              </div>
              <div className={cn(
                'w-full h-2 rounded-full overflow-hidden',
                isReinspecting ? 'bg-amber-100' : 'bg-orange-100'
              )}>
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    isReinspecting ? 'bg-amber-500' : 'bg-[#E8652A]'
                  )}
                  style={{ width: `${(checkedItems / totalItems) * 100}%` }}
                />
              </div>
              {uncheckedItems.length > 0 && (
                <p className={cn(
                  'text-[11px] mt-2',
                  isReinspecting ? 'text-amber-600' : 'text-orange-600'
                )}>
                  还差 {uncheckedItems.length} 项：{uncheckedItems.map((i) => i.name).join('、')}
                </p>
              )}
            </div>
          )}

          {isEditable && (
            <div
              className={cn(
                'rounded-lg p-3.5 text-center border transition-all',
                getPredictionStyle()
              )}
            >
              <p className="text-xs text-zinc-500 mb-1.5">
                {allChecked ? (isReinspecting ? '复检最终判定' : '最终判定') : (isReinspecting ? '复检预计去向' : '预计去向')}
              </p>
              {getPredictionBadge()}
              {failedItems.length > 0 && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  当前已有 {failedItems.length} 项不符合：{failedItems.map((i) => i.name).join('、')}
                </p>
              )}
              {!allChecked && failedItems.length === 0 && (
                <p className="text-[11px] text-emerald-600 mt-1.5">
                  继续检查，当前无不符合项
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-3">
              {isReinspecting ? `第 ${inspection.reinspectionCount + 1} 次复检项` : '检查项'}
            </p>
            <div className="space-y-2">
              {inspection.checkItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-lg border transition-all',
                    item.passed === true && 'bg-emerald-50 border-emerald-200',
                    item.passed === false && 'bg-red-50 border-red-200',
                    item.passed === null && 'bg-white border-zinc-200 hover:border-zinc-300'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                      item.passed === true && 'bg-emerald-500',
                      item.passed === false && 'bg-red-500',
                      item.passed === null && 'bg-zinc-200'
                    )}>
                      {item.passed === true && <Check size={12} />}
                      {item.passed === false && <XCircle size={12} />}
                      {item.passed === null && <span className="text-zinc-500 text-[10px]">{idx + 1}</span>}
                    </span>
                    <div>
                      <span className={cn(
                        'text-sm font-medium block',
                        item.passed === null && 'text-zinc-500',
                        item.passed !== null && 'text-zinc-900'
                      )}>
                        {item.name}
                      </span>
                      {item.remark && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">{item.remark}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditable ? (
                      <>
                        <button
                          onClick={() => updateCheckItem(inspection.id, idx, true)}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                            item.passed === true
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-zinc-100 text-zinc-400 hover:bg-emerald-100 hover:text-emerald-500'
                          )}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => updateCheckItem(inspection.id, idx, false)}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                            item.passed === false
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'bg-zinc-100 text-zinc-400 hover:bg-red-100 hover:text-red-500'
                          )}
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    ) : (
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          item.passed === true && 'text-emerald-600',
                          item.passed === false && 'text-red-600',
                          item.passed === null && 'text-zinc-400'
                        )}
                      >
                        {item.passed === true ? '符合' : item.passed === false ? '不符合' : '未检查'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isEditable && isReinspecting && (
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                <RefreshCw size={12} className="inline mr-1" />
                第 {inspection.reinspectionCount + 1} 次复检说明 <span className="text-zinc-400">（选填）</span>
              </label>
              <textarea
                value={reinspectionNote}
                onChange={(e) => setReinspectionNote(e.target.value)}
                rows={3}
                placeholder="请描述本次复检情况，如：供应商已补发正确检测报告..."
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
              />
            </div>
          )}

          {!inspection.result && isEditable && !isReinspecting && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold mb-1">验收规则</p>
                <ul className="space-y-0.5 text-amber-600">
                  <li>• 全部符合 → 可接收</li>
                  <li>• 1 项不符合 → 需复检</li>
                  <li>• 2 项及以上不符合 → 拒收</li>
                </ul>
              </div>
            </div>
          )}

          {!inspection.result && isReinspecting && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <RefreshCw size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold mb-1">复检规则</p>
                <ul className="space-y-0.5 text-amber-600">
                  <li>• 全部符合 → 转为可接收</li>
                  <li>• 1 项不符合 → 继续需复检</li>
                  <li>• 2 项及以上不符合 → 拒收</li>
                </ul>
              </div>
            </div>
          )}

          {inspection.result && (
            <div
              className={cn(
                'rounded-lg p-4 text-center',
                inspection.result === '可接收' && 'bg-emerald-50 border border-emerald-200',
                inspection.result === '需复检' && 'bg-amber-50 border border-amber-200',
                inspection.result === '拒收' && 'bg-red-50 border border-red-200'
              )}
            >
              <StatusBadge status={inspection.result} className="text-base px-4 py-1.5" />
              <p className="text-xs mt-2 text-zinc-500">
                {inspection.result === '可接收' && '全部检查项符合要求'}
                {inspection.result === '需复检' && `${failedItems.length} 项不符合，需复检确认`}
                {inspection.result === '拒收' && `${failedItems.length} 项不符合，建议拒收`}
              </p>
              {inspection.inspectedAt && (
                <p className="text-[10px] text-zinc-400 mt-2">
                  验收人: {inspection.inspector} · {new Date(inspection.inspectedAt).toLocaleString('zh-CN')}
                </p>
              )}
              {inspection.reinspectionCount > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-200/60 text-left space-y-2">
                  <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                    <History size={12} /> 复检记录（共 {inspection.reinspectionCount} 次）
                  </p>
                  {inspection.reinspectionHistory.map((record) => (
                    <div key={record.count} className="bg-white/60 rounded-lg p-2.5 border border-amber-200/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-amber-700">第 {record.count} 次复检</span>
                        <StatusBadge status={record.result} />
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(record.inspectedAt).toLocaleString('zh-CN')}
                      </p>
                      {record.failedItems.length > 0 && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          不符合项: {record.failedItems.join('、')}
                        </p>
                      )}
                      {record.note && (
                        <p className="text-[11px] text-zinc-600 mt-1 bg-white/80 rounded px-2 py-1">
                          说明: {record.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {inspection.supervisorOpinion && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs text-purple-600 font-semibold mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                监理意见
              </p>
              <p className="text-sm text-purple-900">{inspection.supervisorOpinion}</p>
              {inspection.signedAt && (
                <p className="text-[10px] text-purple-400 mt-2">
                  签署人: {inspection.supervisor} · {new Date(inspection.signedAt).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
          )}

          {inspection.logs.length > 0 && (
            <div className="border-t border-zinc-100 pt-5">
              <p className="text-xs text-zinc-500 mb-3 font-medium">操作记录</p>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-200" />
                {inspection.logs
                  .slice()
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((log, idx) => {
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

        {isEditable && (
          <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 shrink-0">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
              >
                暂存退出
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allChecked}
                className={cn(
                  'flex-1 py-2.5 text-sm text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5',
                  isReinspecting
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-[#E8652A] hover:bg-[#d4581f]'
                )}
              >
                {isReinspecting ? (
                  <><RefreshCw size={14} /> 提交第 {inspection.reinspectionCount + 1} 次复检</>
                ) : (
                  <><FileCheck size={14} /> 提交验收</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
