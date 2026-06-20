import { X, Check, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStore, calculateResult } from '@/store/useStore';
import type { Inspection } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import { cn } from '@/lib/utils';

interface InspectionFormProps {
  inspectionId: string;
  onClose: () => void;
}

export default function InspectionForm({ inspectionId, onClose }: InspectionFormProps) {
  const inspection = useStore((s) => s.inspections.find((i) => i.id === inspectionId)!);
  const batches = useStore((s) => s.batches);
  const currentRole = useStore((s) => s.currentRole);
  const updateCheckItem = useStore((s) => s.updateCheckItem);
  const submitInspection = useStore((s) => s.submitInspection);
  const batch = batches.find((b) => b.id === inspection.batchId);
  const isEditable = currentRole === '质检员' && !inspection.result;

  const totalItems = inspection.checkItems.length;
  const checkedItems = inspection.checkItems.filter((c) => c.passed !== null).length;
  const failedItems = inspection.checkItems.filter((c) => c.passed === false).length;
  const uncheckedItems = inspection.checkItems.filter((c) => c.passed === null);
  const allChecked = checkedItems === totalItems;

  const liveResult = allChecked ? calculateResult(inspection.checkItems) : null;

  const handleSubmit = () => {
    if (!allChecked) return;
    submitInspection(inspection.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[520px] bg-white h-full shadow-xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">验收检查</h3>
            <p className="text-xs text-zinc-500">验收单号: {inspection.id}</p>
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

          {isEditable && (
            <div className="bg-[#FFF3ED] border border-orange-200 rounded-lg p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#E8652A]">检查进度</span>
                <span className="text-xs text-[#E8652A] font-mono">{checkedItems} / {totalItems}</span>
              </div>
              <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E8652A] rounded-full transition-all duration-300"
                  style={{ width: `${(checkedItems / totalItems) * 100}%` }}
                />
              </div>
              {uncheckedItems.length > 0 && (
                <p className="text-[11px] text-orange-600 mt-2">
                  还差 {uncheckedItems.length} 项：{uncheckedItems.map((i) => i.name).join('、')}
                </p>
              )}
            </div>
          )}

          {isEditable && (
            <div
              className={cn(
                'rounded-lg p-3.5 text-center border transition-all',
                allChecked && liveResult === '可接收' && 'bg-emerald-50 border-emerald-200',
                allChecked && liveResult === '需复检' && 'bg-amber-50 border-amber-200',
                allChecked && liveResult === '拒收' && 'bg-red-50 border-red-200',
                !allChecked && 'bg-zinc-50 border-zinc-200'
              )}
            >
              <p className="text-xs text-zinc-500 mb-1.5">
                {allChecked ? '最终判定' : '完成后预计判定'}
              </p>
              {allChecked && liveResult ? (
                <StatusBadge status={liveResult} className="text-sm px-4 py-1" />
              ) : (
                <span className="text-sm text-zinc-400 font-medium">待完成全部检查</span>
              )}
              {!allChecked && failedItems > 0 && (
                <p className="text-[11px] text-amber-600 mt-1.5">
                  当前已有 {failedItems} 项不符合，继续检查...
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-3">检查项</p>
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
                    <span className={cn(
                      'text-sm font-medium',
                      item.passed === null && 'text-zinc-500',
                      item.passed !== null && 'text-zinc-900'
                    )}>
                      {item.name}
                    </span>
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

          {!inspection.result && isEditable && (
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
                {inspection.result === '需复检' && `${failedItems} 项不符合，需复检确认`}
                {inspection.result === '拒收' && `${failedItems} 项不符合，建议拒收`}
              </p>
              {inspection.inspectedAt && (
                <p className="text-[10px] text-zinc-400 mt-2">
                  验收人: {inspection.inspector} · {new Date(inspection.inspectedAt).toLocaleString('zh-CN')}
                </p>
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
                className="flex-1 py-2.5 text-sm text-white bg-[#E8652A] hover:bg-[#d4581f] rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                提交验收
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
