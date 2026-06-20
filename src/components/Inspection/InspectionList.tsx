import { useState } from 'react';
import { useStore, calculateResult } from '@/store/useStore';
import StatusBadge from '@/components/ui/StatusBadge';
import PhotoGrid from '@/components/ui/PhotoGrid';
import InspectionForm from './InspectionForm';
import SignPanel from './SignPanel';
import type { Inspection, InspectionResult } from '@/types';
import { FileCheck, Clock, Edit3 } from 'lucide-react';

type FilterTab = '全部' | '未完成' | InspectionResult;

const tabs: FilterTab[] = ['全部', '未完成', '可接收', '需复检', '拒收'];

export default function InspectionList() {
  const { inspections, batches, currentRole } = useStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('全部');
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showSignPanel, setShowSignPanel] = useState(false);

  const getBatch = (batchId: string) => batches.find((b) => b.id === batchId);

  const filtered = inspections.filter((i) => {
    if (activeTab === '全部') return true;
    if (activeTab === '未完成') return i.result === null;
    return i.result === activeTab;
  });

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
    return currentRole === '质检员' && insp.result === null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">现场验收单</h2>
        <p className="text-sm text-zinc-500 mt-0.5">共 {inspections.length} 份验收单</p>
      </div>

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
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-400 bg-white rounded-lg border border-zinc-100">
                      暂无数据
                    </div>
                  ) : (
                    items.map((insp) => {
                      const batch = getBatch(insp.batchId);
                      const isEditable = canEdit(insp);
                      return (
                        <div
                          key={insp.id}
                          className="bg-white rounded-lg border border-zinc-200 p-3.5 hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedInspection(insp)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-[#E8652A]">{insp.id}</span>
                            {insp.result ? (
                              <StatusBadge status={insp.result} />
                            ) : (
                              <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                                进行中
                              </span>
                            )}
                          </div>
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
                                <Edit3 size={10} /> 继续验收
                              </span>
                            )}
                            {insp.result && !insp.signedAt && currentRole === '监理工程师' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenSign(insp); }}
                                className="text-[10px] text-purple-600 hover:underline"
                              >
                                签署
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
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-zinc-500 text-xs">
                <th className="text-left px-4 py-3 font-medium">验收单号</th>
                <th className="text-left px-4 py-3 font-medium">材料类别</th>
                <th className="text-left px-4 py-3 font-medium">规格型号</th>
                <th className="text-left px-4 py-3 font-medium">供应商</th>
                <th className="text-left px-4 py-3 font-medium">验收员</th>
                <th className="text-center px-4 py-3 font-medium">结论</th>
                <th className="text-center px-4 py-3 font-medium">签署</th>
                <th className="text-center px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">暂无数据</td>
                </tr>
              ) : (
                filtered.map((insp, idx) => {
                  const batch = getBatch(insp.batchId);
                  const isEditable = canEdit(insp);
                  return (
                    <tr
                      key={insp.id}
                      className={`border-t border-zinc-50 hover:bg-orange-50/30 transition cursor-pointer ${
                        idx % 2 === 1 ? 'bg-zinc-50/50' : ''
                      }`}
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
                          <span className="text-xs text-zinc-400">未完成</span>
                        )}
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
                          {isEditable ? '继续验收' : '查看'}
                        </button>
                        {insp.result && !insp.signedAt && currentRole === '监理工程师' && (
                          <button onClick={() => handleOpenSign(insp)} className="text-xs text-purple-600 hover:underline">
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
