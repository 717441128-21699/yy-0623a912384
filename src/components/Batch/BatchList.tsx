import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Search, Filter } from 'lucide-react';
import type { BatchStatus, MaterialCategory } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import BatchForm from './BatchForm';
import BatchDetail from './BatchDetail';
import { CATEGORIES } from '@/data/mock';

const statusOptions: (BatchStatus | '全部')[] = ['全部', '待验收', '验收中', '已完成'];

export default function BatchList() {
  const { batches, currentRole } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BatchStatus | '全部'>('全部');
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | '全部'>('全部');
  const [search, setSearch] = useState('');

  const filtered = batches.filter((b) => {
    if (statusFilter !== '全部' && b.status !== statusFilter) return false;
    if (categoryFilter !== '全部' && b.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        b.supplier.toLowerCase().includes(s) ||
        b.specification.toLowerCase().includes(s) ||
        b.plateNumber.toLowerCase().includes(s) ||
        b.id.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">待验收批次</h2>
          <p className="text-sm text-zinc-500 mt-0.5">共 {filtered.length} 条记录</p>
        </div>
        {currentRole === '材料员' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#E8652A] hover:bg-[#d4581f] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            录入批次
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
        <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-500">状态</span>
          </div>
          <div className="flex gap-1">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  statusFilter === s
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-zinc-200" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | '全部')}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-600 focus:outline-none focus:border-orange-400"
          >
            <option value="全部">全部类别</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索供应商/规格/车牌"
              className="pl-8 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg w-52 focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs">
                <th className="text-left px-4 py-3 font-medium">批次号</th>
                <th className="text-left px-4 py-3 font-medium">材料类别</th>
                <th className="text-left px-4 py-3 font-medium">供应商</th>
                <th className="text-left px-4 py-3 font-medium">规格型号</th>
                <th className="text-right px-4 py-3 font-medium">合同数量</th>
                <th className="text-left px-4 py-3 font-medium">车牌号</th>
                <th className="text-left px-4 py-3 font-medium">到场时间</th>
                <th className="text-left px-4 py-3 font-medium">送货单</th>
                <th className="text-center px-4 py-3 font-medium">状态</th>
                <th className="text-center px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-zinc-400">
                    暂无批次数据
                  </td>
                </tr>
              ) : (
                filtered.map((batch, idx) => (
                  <tr
                    key={batch.id}
                    className={`border-t border-zinc-50 hover:bg-orange-50/30 transition-colors cursor-pointer ${
                      idx % 2 === 1 ? 'bg-zinc-50/50' : ''
                    }`}
                    onClick={() => setSelectedBatchId(batch.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#E8652A]">{batch.id}</td>
                    <td className="px-4 py-3">{batch.category}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate">{batch.supplier}</td>
                    <td className="px-4 py-3">{batch.specification}</td>
                    <td className="px-4 py-3 text-right">
                      {batch.contractQuantity.toLocaleString()} {batch.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{batch.plateNumber}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(batch.arrivalTime).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <PhotoGrid photos={batch.deliveryPhotos} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedBatchId(batch.id)}
                        className="text-xs text-[#E8652A] hover:underline"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <BatchForm onClose={() => setShowForm(false)} />}
      {selectedBatchId && (
        <BatchDetail batchId={selectedBatchId} onClose={() => setSelectedBatchId(null)} />
      )}
    </div>
  );
}
