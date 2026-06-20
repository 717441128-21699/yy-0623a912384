import { useState } from 'react';
import { X, PenLine } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Inspection } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';

interface SignPanelProps {
  inspection: Inspection;
  onClose: () => void;
}

export default function SignPanel({ inspection, onClose }: SignPanelProps) {
  const { signInspection, batches, addIssue } = useStore();
  const [opinion, setOpinion] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [responsibleUnit, setResponsibleUnit] = useState('供应商');
  const [reviewDate, setReviewDate] = useState('');

  const batch = batches.find((b) => b.id === inspection.batchId);

  const handleSign = () => {
    if (!opinion.trim()) return;
    signInspection(inspection.id, opinion);
    onClose();
  };

  const handleCreateIssue = () => {
    if (!issueDesc.trim() || !reviewDate) return;
    addIssue({
      inspectionId: inspection.id,
      batchId: inspection.batchId,
      description: issueDesc,
      responsibleUnit,
      reviewDate: new Date(reviewDate).toISOString(),
      createdBy: '监理工程师',
    });
    setShowIssueForm(false);
    signInspection(inspection.id, opinion || '发现问题，已生成整改单');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] bg-white h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">监理签署</h3>
            <p className="text-xs text-zinc-500">验收单号: {inspection.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {batch && (
            <div className="bg-zinc-50 rounded-lg p-3 space-y-1 text-xs">
              <p className="font-semibold text-sm text-zinc-900">{batch.category} · {batch.specification}</p>
              <p className="text-zinc-600">供应商: {batch.supplier} | 数量: {batch.contractQuantity.toLocaleString()} {batch.unit}</p>
            </div>
          )}

          {batch && batch.deliveryPhotos.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">送货单照片</p>
              <PhotoGrid photos={batch.deliveryPhotos} maxPreview={4} />
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2">检查项结果</p>
            <div className="space-y-1.5">
              {inspection.checkItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded text-sm">
                  <span className="text-zinc-700">{item.name}</span>
                  <span className={item.passed ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                    {item.passed ? '符合' : '不符合'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {inspection.result && (
            <div className="text-center">
              <StatusBadge status={inspection.result} className="text-sm px-4 py-1" />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              <PenLine size={12} className="inline mr-1" />
              签署意见
            </label>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              rows={4}
              placeholder="请输入监理签署意见..."
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>

          {!showIssueForm && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
              >
                取消
              </button>
              {inspection.result !== '可接收' && (
                <button
                  onClick={() => setShowIssueForm(true)}
                  className="px-4 py-2.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                >
                  生成整改单
                </button>
              )}
              <button
                onClick={handleSign}
                disabled={!opinion.trim()}
                className="flex-1 py-2.5 text-sm text-white bg-[#E8652A] hover:bg-[#d4581f] rounded-lg transition disabled:opacity-40"
              >
                确认签署
              </button>
            </div>
          )}

          {showIssueForm && (
            <div className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50/50">
              <p className="text-sm font-semibold text-red-700">生成整改单</p>
              <div>
                <label className="block text-xs text-zinc-600 mb-1">问题描述</label>
                <textarea
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  rows={2}
                  placeholder="描述发现的问题..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">责任单位</label>
                  <select
                    value={responsibleUnit}
                    onChange={(e) => setResponsibleUnit(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="供应商">供应商</option>
                    <option value="运输方">运输方</option>
                    <option value="总包项目部">总包项目部</option>
                    <option value="分包单位">分包单位</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">复查日期</label>
                  <input
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowIssueForm(false)}
                  className="flex-1 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateIssue}
                  disabled={!issueDesc.trim() || !reviewDate}
                  className="flex-1 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-40"
                >
                  提交整改单
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
