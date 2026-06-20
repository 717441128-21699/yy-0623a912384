import { useStore } from '@/store/useStore';
import type { UserRole } from '@/types';
import { User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const roles: UserRole[] = ['材料员', '质检员', '监理工程师'];

const roleColors: Record<UserRole, string> = {
  '材料员': 'bg-blue-500',
  '质检员': 'bg-emerald-500',
  '监理工程师': 'bg-purple-500',
};

export default function Header() {
  const { currentRole, setRole } = useStore();
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="text-zinc-900 font-semibold">XX房建项目</span>
        <span className="text-zinc-300">|</span>
        <span>材料验收管理系统</span>
      </div>
      <div ref={dropRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors border border-zinc-200"
        >
          <div className={`w-6 h-6 rounded-full ${roleColors[currentRole]} flex items-center justify-center`}>
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-700">{currentRole}</span>
          <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-30">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => { setRole(role); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-zinc-50 transition ${
                  role === currentRole ? 'text-[#E8652A] font-semibold' : 'text-zinc-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${roleColors[role]}`} />
                {role}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
