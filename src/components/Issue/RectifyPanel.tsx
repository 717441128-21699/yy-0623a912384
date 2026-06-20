import { X, Upload, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { Issue } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoUpload from '@/components/ui/PhotoUpload';
import PhotoGrid from '@/components/ui/PhotoGrid';

interface RectifyPanelProps {
  issue: Issue;
  onClose: () => void;
}

export default function RectifyPanel({ issue, onClose }: RectifyPanelProps) {
  const { submitRectification, closeIssue, batches, currentRole } = useStore();
  const [rectificationPhotos, setRectificationPhotos] = useState<string[]>(issue.rectificationPhotos);
  const [rectificationNote, setRectificationNote] = useState(issue.rectificationNote);

  const batch = batches.find((b) => b.id === issue.batchId);
  const canSubmit = currentRole === '材料员' && !issue.rectificationNote;
  const canClose = currentRole === '监理工程师' && issue.status === '整改中' && !!issue.rectificationNote;

  const handleSubmit = () => {
    if (!rectificationNote.trim()) return;
    submitRectification(issue.id, rectificationPhotos, rectificationNote);
    onClose();
  };

  const handleClose = () => {
    closeIssue(issue.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[480px] bg-white h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">整改单详情</h3>
            <p className="text-xs text-zinc-500">编号: {issue.id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">当前状态</span>
            <StatusBadge status={issue.status} />
          </div>

          {batch && (
            <div className="bg-zinc-50 rounded-lg p-3 text-xs space-y-1">
              <p className="font-semibold text-sm text-zinc-900">{batch.category} · {batch.specification}</p>
              <p className="text-zinc-600">供应商: {batch.supplier}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-1">问题描述</p>
            <p className="text-sm text-zinc-900">{issue.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-zinc-500">责任单位</p>
              <p className="text-zinc-900 font-medium">{issue.responsibleUnit}</p>
            </div>
            <div>
              <p className="text-zinc-500">复查日期</p>
              <p className="text-zinc-900 font-medium">{new Date(issue.reviewDate).toLocaleDateString('zh-CN')}</p>
            </div>
            <div>
              <p className="text-zinc-500">创建人</p>
              <p className="text-zinc-900 font-medium">{issue.createdBy}</p>
            </div>
            <div>
              <p className="text-zinc-500">创建时间</p>
              <p className="text-zinc-900 font-medium">{new Date(issue.createdAt).toLocaleString('zh-CN')}</p>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <p className="text-xs text-zinc-500 mb-3 flex items-center gap-1.5">
              <Upload size={12} />
              整改结果
            </p>

            {issue.rectificationNote ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-sm text-emerald-800">{issue.rectificationNote}</p>
                </div>
                {issue.rectificationPhotos.length > 0 && (
                  <PhotoGrid photos={issue.rectificationPhotos} maxPreview={4} />
                )}
                {issue.closedAt && (
                  <p className="text-[10px] text-zinc-400">
                    关闭时间: {new Date(issue.closedAt).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            ) : canSubmit ? (
              <div className="space-y-3">
                <PhotoUpload photos={rectificationPhotos} onChange={setRectificationPhotos} />
                <textarea
                  value={rectificationNote}
                  onChange={(e) => setRectificationNote(e.target.value)}
                  rows={3}
                  placeholder="请描述整改处理结果..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!rectificationNote.trim()}
                  className="w-full py-2.5 text-sm text-white bg-[#E8652A] hover:bg-[#d4581f] rounded-lg transition disabled:opacity-40"
                >
                  提交整改结果
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">等待材料员补传整改结果</p>
            )}
          </div>

          {canClose && (
            <button
              onClick={handleClose}
              className="w-full py-2.5 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} />
              确认关闭整改单
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
