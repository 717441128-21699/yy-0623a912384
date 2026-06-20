import { useState, useMemo } from 'react';
import { useStore, calculateResult } from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import InspectionForm from './InspectionForm';
import SignPanel from './SignPanel';
import type { Inspection, InspectionResult } from '@/types';
import { FileCheck, Clock, Edit3, PenLine, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterTab = '全部' | '未完成' | InspectionResult;

const tabs: FilterTab[] = ['全部', '未完成', '可接收', '需复检', '拒收'];

export default function InspectionList() {
  const { inspections, batches, currentRole, issues } = useStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('全部');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showSignPanel, setShowSignPanel] = useState(false);

  const getBatch = (batchId: string) => batches.find((b) => b.id === batchId);

  const filtered = inspections.filter((i) => {
    if (activeTab === '全部') return true;
    if (activeTab === '未完成') return i.result === null;
    return i.result === activeTab;
  });

  const todoStats = useMemo(() => {
    const pendingReinspection = inspections.filter(
      (i) => i.result === '需复检' && !i.isReinspecting
    ).length;
    const pendingSign = inspections.filter(
      (i) => i.result && !i.signedAt
    ).length;
    const pendingDraftConfirm = issues.filter(
      (i) => i.isDraft
    ).length;
    return { pendingReinspection, pendingSign, pendingDraftConfirm };
  }, [inspections, issues]);

  const hasPendingDraft = (inspectionId: string) =>
    issues.some((i) => i.inspectionId === inspectionId && i.isDraft);

  const kanbanColumns = [
    { key: '未完成', label: '未完成', color: 'text-zinc-700', bgColor: 'bg-zinc-100', icon: Clock, filterFn: (i: Inspection) => i.result === null },
    { key: '可接收', label: '可接收', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: FileCheck, filterFn: (i: Inspection) => i.result === '可接收' },
    { key: '需复检', label: '需复检', color: 'text-amber-700', bgColor: 'bg-amber-50', icon: FileCheck, filterFn: (i: Inspection) => i.result === '需复检' },
    { key: '拒收', label: '拒收', color: 'text-red-700', bgColor: 'bg-red-50', icon: FileCheck, filterFn: (i: Inspection) => i.result === '拒收' },
  ];

  const handleOpenSign = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowSignPanel(true);
  };

  const canEdit = (insp: Inspection) => {
    return currentRole === '质检员' && (insp.result === null || insp.isReinspecting);
  };

  const getTodoBadges = (insp: Inspection) => {
    const badges: { label: string; icon: React.ElementType; className: string }[] = [];

    if (insp.isReinspecting) {
      badges.push({
        label: '复检中',
        icon: RefreshCw,
        className: 'bg-amber-100 text-amber-700 border-amber-300',
      });
    }

    if (currentRole === '质检员' && insp.result === '需复检' && !insp.isReinspecting) {
      badges.push({
        label: '待复检',
        icon: RefreshCw,
        className: 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-200',
      });
    }

    if (currentRole === '监理工程师' && insp.result && !insp.signedAt) {
      badges.push({
        label: '待签署',
        icon: PenLine,
        className: 'bg-purple-500 text-white border-purple-600 shadow-sm shadow-purple-200',
      });
    }

    if (currentRole === '监理工程师' && hasPendingDraft(insp.id)) {
      badges.push({
        label: '草稿待确认',
        icon: FileText,
        className: 'bg-red-500 text-white border-red-600 shadow-sm shadow-red-200',
      });
    }

    return badges;
  };

  const showTodoBanner = currentRole !== '材料员' && (todoStats.pendingReinspection > 0 || todoStats.pendingSign > 0 || todoStats.pendingDraftConfirm > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">现场验收单</h2>
          <p className="text-sm text-zinc-500 mt-0.5">共 {inspections.length} 份验收单</p>
        </div>
      </div>

      {showTodoBanner && (
        <div className="bg-gradient-to-r from-[#FFF3ED] to-white border border-orange-200 rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <AlertTriangle size={20} className="text-[#E8652A] shrink-0" />
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <span className="text-sm font-semibold text-zinc-800">待办提醒：</span>
            {currentRole === '质检员' && todoStats.pendingReinspection > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium shadow-sm">
                <RefreshCw size={12} />
                待复检 {todoStats.pendingReinspection} 张
              </div>
            )}
            {currentRole === '监理工程师' && todoStats.pendingSign > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-medium shadow-sm">
                <PenLine size={12} />
                待签署 {todoStats.pendingSign} 张
              </div>
            )}
            {currentRole === '监理工程师' && todoStats.pendingDraftConfirm > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium shadow-sm">
                <FileText size={12} />
                草稿待确认 {todoStats.pendingDraftConfirm} 条
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs rounded-full transition-colors ${
              activeTab === tab
                ? 'bg-[#1B2A4A] text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === '全部' ? (
        <div className="grid grid-cols-4 gap-3">
          {kanbanColumns.map((col) => {
            const items = filtered.filter(col.filterFn);
            const Icon = col.icon;
            return (
              <div key={col.key} className="space-y-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${col.bgColor}`}>
                  <Icon size={14} className={col.color} />
                  <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  <span className={`text-xs ${col.color} opacity-60`}>({items.length})</span>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-400 bg-white rounded-lg border border-zinc-100">
                      暂无数据
                    </div>
                  ) : (
                    items.map((insp) => {
                      const batch = getBatch(insp.batchId);
                      const isEditable = canEdit(insp);
                      const todoBadges = getTodoBadges(insp);
                      const hasTodo = todoBadges.length > 0;
                      return (
                        <div
                          key={insp.id}
                          className={cn(
                            'bg-white rounded-lg border p-3.5 hover:shadow-md transition-shadow cursor-pointer group',
                            hasTodo
                              ? 'border-2 border-[#E8652A]/40 shadow-[0_0_0_3px_rgba(232,101,42,0.08)]'
                              : 'border-zinc-200'
                          )}
                          onClick={() => setSelectedInspection(insp)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[#E8652A]">{insp.id}</span>
                            {insp.result ? (
                              <StatusBadge status={insp.result} />
                            ) : (
                              <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                                {insp.isReinspecting ? '复检中' : '进行中'}
                              </span>
                            )}
                          </div>

                          {todoBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {todoBadges.map((badge, idx) => {
                                const BadgeIcon = badge.icon;
                                return (
                                  <span
                                    key={idx}
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border',
                                      badge.className
                                    )}
                                  >
                                    <BadgeIcon size={9} />
                                    {badge.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          <div className="text-sm font-medium text-zinc-900 mb-1">
                            {batch?.category} · {batch?.specification}
                          </div>
                          <div className="text-xs text-zinc-500 mb-2 line-clamp-1">{batch?.supplier}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] text-zinc-400">
                              验收员: {insp.inspector}
                            </div>
                            {isEditable && (
                              <span className="text-[10px] text-[#E8652A] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 size={10} />
                                {insp.isReinspecting ? '继续复检' : '继续验收'}
                              </span>
                            )}
                            {insp.result && !insp.signedAt && currentRole === '监理工程师' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenSign(insp); }}
                                className="text-[10px] text-purple-600 hover:underline font-medium"
                              >
                                立即签署
                              </button>
                            )}
                          </div>
                          {batch && batch.deliveryPhotos.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-zinc-100">
                              <PhotoGrid photos={batch.deliveryPhotos} maxPreview={2} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs">
                <th className="text-left px-4 py-3 font-medium">验收单号</th>
                <th className="text-left px-4 py-3 font-medium">材料类别</th>
                <th className="text-left px-4 py-3 font-medium">规格型号</th>
                <th className="text-left px-4 py-3 font-medium">供应商</th>
                <th className="text-left px-4 py-3 font-medium">验收员</th>
                <th className="text-center px-4 py-3 font-medium">结论</th>
                <th className="text-center px-4 py-3 font-medium">待办</th>
                <th className="text-center px-4 py-3 font-medium">签署</th>
                <th className="text-center px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-zinc-400">暂无数据</td>
                </tr>
              ) : (
                filtered.map((insp, idx) => {
                  const batch = getBatch(insp.batchId);
                  const isEditable = canEdit(insp);
                  const todoBadges = getTodoBadges(insp);
                  const hasTodo = todoBadges.length > 0;
                  return (
                    <tr
                      key={insp.id}
                      className={cn(
                        'border-t border-zinc-50 hover:bg-orange-50/30 transition cursor-pointer',
                        idx % 2 === 1 ? 'bg-zinc-50/50' : '',
                        hasTodo ? '!bg-[#FFF3ED]/40' : ''
                      )}
                      onClick={() => setSelectedInspection(insp)}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#E8652A]">{insp.id}</td>
                      <td className="px-4 py-3">{batch?.category}</td>
                      <td className="px-4 py-3">{batch?.specification}</td>
                      <td className="px-4 py-3 max-w-[120px] truncate">{batch?.supplier}</td>
                      <td className="px-4 py-3 text-xs">{insp.inspector}</td>
                      <td className="px-4 py-3 text-center">
                        {insp.result ? (
                          <StatusBadge status={insp.result} />
                        ) : (
                          <span className="text-xs text-zinc-400">
                            {insp.isReinspecting ? '复检中' : '未完成'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center flex-wrap gap-1">
                          {todoBadges.length > 0 ? todoBadges.map((badge, bidx) => {
                            const BadgeIcon = badge.icon;
                            return (
                              <span
                                key={bidx}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border',
                                  badge.className
                                )}
                              >
                                <BadgeIcon size={9} />
                                {badge.label}
                              </span>
                            );
                          }) : (
                            <span className="text-xs text-zinc-300">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {insp.signedAt ? (
                          <span className="text-xs text-emerald-600">已签署</span>
                        ) : (
                          <span className="text-xs text-zinc-400">未签署</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedInspection(insp)} className="text-xs text-[#E8652A] hover:underline">
                          {isEditable ? (insp.isReinspecting ? '继续复检' : '继续验收') : '查看'}
                        </button>
                        {insp.result && !insp.signedAt && currentRole === '监理工程师' && (
                          <button onClick={() => handleOpenSign(insp)} className="text-xs text-purple-600 hover:underline font-medium">
                            签署
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedInspection && !showSignPanel && (
        <InspectionForm
          inspectionId={selectedInspection.id}
          onClose={() => setSelectedInspection(null)}
        />
      )}

      {showSignPanel && selectedInspection && (
        <SignPanel
          inspectionId={selectedInspection.id}
          onClose={() => { setShowSignPanel(false); setSelectedInspection(null); }}
        />
      )}
    </div>
  );
}
