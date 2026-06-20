import { useState, useEffect } from 'react';
import { X, PenLine, FileText, RefreshCw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import { RESPONSIBLE_UNITS } from '@/data/mock';
import { cn } from '@/lib/utils';

interface SignPanelProps {
  inspectionId: string;
  onClose: () => void;
}

export default function SignPanel({ inspectionId, onClose }: SignPanelProps) {
  const inspection = useStore((s) => s.inspections.find((i) => i.id === inspectionId)!);
  const batches = useStore((s) => s.batches);
  const issues = useStore((s) => s.issues);
  const signInspection = useStore((s) => s.signInspection);
  const addIssue = useStore((s) => s.addIssue);
  const updateIssueDraft = useStore((s) => s.updateIssueDraft);
  const currentRole = useStore((s) => s.currentRole);

  const [opinion, setOpinion] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [responsibleUnit, setResponsibleUnit] = useState('供应商');
  const [reviewDate, setReviewDate] = useState('');
  const [draftIssueId, setDraftIssueId] = useState<string | null>(null);

  const batch = batches.find((b) => b.id === inspection.batchId);

  useEffect(() => {
    const draft = issues.find((i) => i.inspectionId === inspectionId && i.isDraft);
    if (draft) {
      setDraftIssueId(draft.id);
      setIssueDesc(draft.description);
      setResponsibleUnit(draft.responsibleUnit);
      if (draft.reviewDate) {
        setReviewDate(draft.reviewDate.slice(0, 10));
      }
      setShowIssueForm(true);
    }
  }, [inspectionId, issues]);

  const handleSign = () => {
    if (!opinion.trim()) return;
    signInspection(inspection.id, opinion);
    if (draftIssueId && (issueDesc.trim() || reviewDate)) {
      updateIssueDraft(draftIssueId, {
        description: issueDesc,
        responsibleUnit,
        reviewDate: new Date(reviewDate).toISOString(),
        isDraft: false,
      });
    }
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
      createdBy: currentRole,
      isDraft: false,
    });
    setShowIssueForm(false);
    signInspection(inspection.id, opinion || '发现问题，已生成整改单');
    onClose();
  };

  const defaultIssueDesc = batch && inspection
    ? `${batch.category} ${batch.specification}：${inspection.checkItems
        .filter((c) => c.passed === false)
        .map((i) => `${i.name}${i.remark ? `（${i.remark}）` : ''}`)
        .join('；')}`
    : '';

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[520px] bg-white h-full shadow-xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">监理签署</h3>
            <p className="text-xs text-zinc-500">验收单号: {inspection.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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

          {inspection.reinspectionNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-700 font-semibold mb-1">复检说明</p>
              <p className="text-sm text-amber-900">{inspection.reinspectionNote}</p>
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

          {(inspection.result === '需复检' || inspection.result === '拒收') && !showIssueForm && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
              <FileText size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700 mb-1">待处理问题</p>
                <p className="text-[11px] text-amber-600 mb-2">{defaultIssueDesc}</p>
                <button
                  onClick={() => setShowIssueForm(true)}
                  className="text-[11px] text-amber-700 underline hover:text-amber-900"
                >
                  生成整改单 →
                </button>
              </div>
            </div>
          )}

          {showIssueForm && (
            <div className="border border-red-200 rounded-lg p-4 space-y-3 bg-red-50/50">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                <FileText size={14} />
                整改单 {draftIssueId ? '(草稿已预填)' : ''}
              </p>
              <div>
                <label className="block text-xs text-zinc-600 mb-1">问题描述 <span className="text-red-500">*</span></label>
                <textarea
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  rows={3}
                  placeholder="描述发现的问题..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">责任单位 <span className="text-red-500">*</span></label>
                  <select
                    value={responsibleUnit}
                    onChange={(e) => setResponsibleUnit(e.target.value)}
                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  >
                    {RESPONSIBLE_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-600 mb-1">复查日期 <span className="text-red-500">*</span></label>
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
                  onClick={draftIssueId ? handleSign : handleCreateIssue}
                  disabled={!issueDesc.trim() || !reviewDate}
                  className="flex-1 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-40"
                >
                  {draftIssueId ? '确认提交' : '提交整改单'}
                </button>
              </div>
            </div>
          )}
        </div>

        {!showIssueForm && (
          <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-6 py-4 shrink-0">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSign}
                disabled={!opinion.trim()}
                className="flex-1 py-2.5 text-sm text-white bg-[#E8652A] hover:bg-[#d4581f] rounded-lg transition disabled:opacity-40"
              >
                确认签署
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
