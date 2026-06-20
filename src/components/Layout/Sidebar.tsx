import { NavLink } from 'react-router-dom';
import { ClipboardList, FileCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/batches', label: '待验收批次', icon: ClipboardList },
  { to: '/inspections', label: '现场验收单', icon: FileCheck },
  { to: '/issues', label: '问题闭环', icon: AlertTriangle },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-[#1B2A4A] text-white flex flex-col shrink-0 h-screen">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E8652A] flex items-center justify-center">
            <ClipboardList size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">材料进场验收</h1>
            <p className="text-[10px] text-white/50">材料验收电子台账</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/30">XX房建项目 · 总包项目部</p>
      </div>
    </aside>
  );
}
