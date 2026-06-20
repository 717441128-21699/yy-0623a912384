import { X, Check, XCircle, Circle, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Inspection } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import { cn } from '@/lib/utils';

interface InspectionFormProps {
  inspection: Inspection;
  onClose: () => void;
}

export default function InspectionForm({ inspection, onClose }: InspectionFormProps) {
  const { updateCheckItem, submitInspection, batches, currentRole, addIssue } = useStore();
  const batch = batches.find((b) => b.id === inspection.batchId);
  const isEditable = currentRole === '质检员' && !inspection.result;

  const allChecked = inspection.checkItems.every((c) => c.passed !== null);
  const failedCount = inspection.checkItems.filter((c) => c.passed === false).length;

  const handleSubmit = () => {
    submitInspection(inspection.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[520px] bg-white h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">验收检查</h3>
            <p className="text-xs text-zinc-500">验收单号: {inspection.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
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

          <div>
            <p className="text-xs text-zinc-500 mb-3">检查项</p>
            <div className="space-y-2">
              {inspection.checkItems.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-lg border transition-colors',
                    item.passed === true && 'bg-emerald-50 border-emerald-200',
                    item.passed === false && 'bg-red-50 border-red-200',
                    item.passed === null && 'bg-white border-zinc-200'
                  )}
                >
                  <span className="text-sm text-zinc-900 font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {isEditable ? (
                      <>
                        <button
                          onClick={() => updateCheckItem(inspection.id, idx, true)}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                            item.passed === true
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-100 text-zinc-400 hover:bg-emerald-100 hover:text-emerald-500'
                          )}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => updateCheckItem(inspection.id, idx, false)}
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                            item.passed === false
                              ? 'bg-red-500 text-white'
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
                <p className="font-semibold mb-1">提交前请确认</p>
                <p>请逐项完成检查后提交验收。全部符合=可接收；1项不符合=需复检；2项及以上不符合=拒收。</p>
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
                {inspection.result === '需复检' && `${failedCount}项不符合，需复检确认`}
                {inspection.result === '拒收' && `${failedCount}项不符合，建议拒收`}
              </p>
            </div>
          )}

          {inspection.supervisorOpinion && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-xs text-purple-600 font-semibold mb-1">监理意见</p>
              <p className="text-sm text-purple-900">{inspection.supervisorOpinion}</p>
              {inspection.signedAt && (
                <p className="text-[10px] text-purple-400 mt-2">
                  签署人: {inspection.supervisor} · {new Date(inspection.signedAt).toLocaleString('zh-CN')}
                </p>
              )}
            </div>
          )}

          {isEditable && allChecked && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
              >
                暂存
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 text-sm text-white bg-[#E8652A] hover:bg-[#d4581f] rounded-lg transition"
              >
                提交验收
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
