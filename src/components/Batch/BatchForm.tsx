import { useState } from 'react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/ui/Modal';
import PhotoUpload from '@/components/ui/PhotoUpload';
import { CATEGORIES } from '@/data/mock';
import type { MaterialCategory } from '@/types';

interface BatchFormProps {
  onClose: () => void;
}

export default function BatchForm({ onClose }: BatchFormProps) {
  const { addBatch } = useStore();
  const [category, setCategory] = useState<MaterialCategory>('钢筋');
  const [supplier, setSupplier] = useState('');
  const [specification, setSpecification] = useState('');
  const [contractQuantity, setContractQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [plateNumber, setPlateNumber] = useState('');
  const [arrivalTime, setArrivalTime] = useState(new Date().toISOString().slice(0, 16));
  const [deliveryPhotos, setDeliveryPhotos] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!supplier || !specification || !contractQuantity || !plateNumber) return;
    addBatch({
      category,
      supplier,
      specification,
      contractQuantity: Number(contractQuantity),
      unit,
      plateNumber,
      arrivalTime: new Date(arrivalTime).toISOString(),
      deliveryPhotos,
      createdBy: '材料员',
    });
    onClose();
  };

  const isValid = supplier && specification && contractQuantity && plateNumber;

  return (
    <Modal open title="录入到场批次" onClose={onClose} width="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">材料类别</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MaterialCategory)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">单位</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            >
              <option value="kg">kg</option>
              <option value="吨">吨</option>
              <option value="m²">m²</option>
              <option value="m³">m³</option>
              <option value="块">块</option>
              <option value="批">批</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">供应商</label>
          <input
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="请输入供应商名称"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">规格型号</label>
          <input
            value={specification}
            onChange={(e) => setSpecification(e.target.value)}
            placeholder="如 HRB400 Φ12"
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">合同数量</label>
            <input
              type="number"
              value={contractQuantity}
              onChange={(e) => setContractQuantity(e.target.value)}
              placeholder="0"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">车牌号</label>
            <input
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="如 辽A88567"
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">到场时间</label>
          <input
            type="datetime-local"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 mb-1">送货单照片</label>
          <PhotoUpload photos={deliveryPhotos} onChange={setDeliveryPhotos} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="px-4 py-2 text-sm text-white bg-[#E8652A] hover:bg-[#d4581f] rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            提交录入
          </button>
        </div>
      </div>
    </Modal>
  );
}
