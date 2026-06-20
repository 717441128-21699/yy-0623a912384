import { useState } from 'react';
import { useStore } from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';
import RectifyPanel from './RectifyPanel';
import type { Issue, IssueStatus } from '@/types';
import { Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusFilter = IssueStatus | '全部';
const statusFilters: StatusFilter[] = ['全部', '待整改', '整改中', '已关闭'];

const statusIcons: Record<IssueStatus, React.ElementType> = {
  '待整改': AlertCircle,
  '整改中': Clock,
  '已关闭': CheckCircle2,
};

export default function IssueList() {
  const { issues, batches, inspections, currentRole, closeIssue } = useStore();
  const [filter, setFilter] = useState<StatusFilter>('全部');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const filtered = issues.filter((i) => filter === '全部' || i.status === filter);

  const getBatch = (batchId: string) => batches.find((b) => b.id === batchId);
  const getInspection = (inspectionId: string) => inspections.find((i) => i.id === inspectionId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">问题闭环</h2>
        <p className="text-sm text-zinc-500 mt-0.5">共 {issues.length} 条整改单</p>
      </div>

      <div className="flex gap-1.5">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-xs rounded-full transition-colors ${
              filter === s
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 py-16 text-center text-zinc-400 text-sm">
          暂无整改单数据
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => {
            const batch = getBatch(issue.batchId);
            const insp = getInspection(issue.inspectionId);
            const Icon = statusIcons[issue.status];

            return (
              <div
                key={issue.id}
                className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                      issue.status === '待整改' && 'bg-red-100 text-red-500',
                      issue.status === '整改中' && 'bg-amber-100 text-amber-500',
                      issue.status === '已关闭' && 'bg-emerald-100 text-emerald-500'
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#E8652A]">{issue.id}</span>
                      <StatusBadge status={issue.status} />
                    </div>
                    <p className="text-sm font-medium text-zinc-900 mb-1">{issue.description}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                      {batch && (
                        <span>{batch.category} · {batch.specification}</span>
                      )}
                      <span>责任单位: {issue.responsibleUnit}</span>
                      <span>
                        复查日期: {new Date(issue.reviewDate).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-[10px] text-zinc-400">
                      <span>创建: {new Date(issue.createdAt).toLocaleString('zh-CN')}</span>
                      {insp?.result && (
                        <span>验收结论: {insp.result}</span>
                      )}
                      {issue.closedAt && (
                        <span>关闭: {new Date(issue.closedAt).toLocaleString('zh-CN')}</span>
                      )}
                    </div>

                    {issue.rectificationNote && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-xs text-emerald-700 font-semibold mb-0.5">整改结果</p>
                        <p className="text-xs text-emerald-600">{issue.rectificationNote}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      {currentRole === '材料员' && (issue.status === '待整改' || issue.status === '整改中') && !issue.rectificationNote && (
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="text-xs text-[#E8652A] hover:underline flex items-center gap-1"
                        >
                          补传整改结果 <ChevronRight size={12} />
                        </button>
                      )}
                      {currentRole === '监理工程师' && issue.status === '整改中' && issue.rectificationNote && (
                        <button
                          onClick={() => closeIssue(issue.id)}
                          className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> 确认关闭
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="text-xs text-zinc-500 hover:underline"
                      >
                        查看详情
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedIssue && (
        <RectifyPanel issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}
    </div>
  );
}
