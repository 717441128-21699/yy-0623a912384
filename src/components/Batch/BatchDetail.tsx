import { X, Truck, Calendar, Hash, Building2, Ruler } from 'lucide-react';
import type { Batch } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import { useStore } from '@/store/useStore';

interface BatchDetailProps {
  batchId: string;
  onClose: () => void;
}

export default function BatchDetail({ batchId, onClose }: BatchDetailProps) {
  const batch = useStore((s) => s.batches.find((b) => b.id === batchId)!);
  const inspections = useStore((s) => s.inspections);
  const currentRole = useStore((s) => s.currentRole);
  const addInspection = useStore((s) => s.addInspection);
  const existingInspection = inspections.find((i) => i.batchId === batch.id);

  const handleStartInspection = () => {
    if (!existingInspection) {
      addInspection(batch.id);
    }
    onClose();
  };

  const fields = [
    { icon: Hash, label: '批次号', value: batch.id },
    { icon: Building2, label: '材料类别', value: batch.category },
    { icon: Building2, label: '供应商', value: batch.supplier },
    { icon: Ruler, label: '规格型号', value: batch.specification },
    { icon: Hash, label: '合同数量', value: `${batch.contractQuantity.toLocaleString()} ${batch.unit}` },
    { icon: Truck, label: '车牌号', value: batch.plateNumber },
    { icon: Calendar, label: '到场时间', value: new Date(batch.arrivalTime).toLocaleString('zh-CN') },
    { icon: Calendar, label: '录入时间', value: new Date(batch.createdAt).toLocaleString('zh-CN') },
  ];

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[440px] bg-white h-full shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900">批次详情</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">当前状态</span>
            <StatusBadge status={batch.status} />
          </div>

          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.label} className="flex items-start gap-3">
                <field.icon size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-zinc-500">{field.label}</p>
                  <p className="text-sm text-zinc-900 font-medium">{field.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">送货单照片</p>
            <PhotoGrid photos={batch.deliveryPhotos} maxPreview={4} />
          </div>

          {currentRole === '质检员' && batch.status === '待验收' && !existingInspection && (
            <button
              onClick={handleStartInspection}
              className="w-full py-2.5 bg-[#E8652A] hover:bg-[#d4581f] text-white text-sm font-medium rounded-lg transition-colors"
            >
              开始验收
            </button>
          )}

          {existingInspection && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              已创建验收单 {existingInspection.id}，请在「现场验收单」页面继续操作
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
