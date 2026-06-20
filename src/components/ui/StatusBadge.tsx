import { cn } from '@/lib/utils';
import type { BatchStatus, InspectionResult, IssueStatus } from '@/types';

type BadgeVariant = BatchStatus | InspectionResult | IssueStatus;

const variantStyles: Record<BadgeVariant, string> = {
  '待验收': 'bg-amber-50 text-amber-700 border-amber-200',
  '验收中': 'bg-blue-50 text-blue-700 border-blue-200',
  '已完成': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '可接收': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '需复检': 'bg-amber-50 text-amber-700 border-amber-200',
  '拒收': 'bg-red-50 text-red-700 border-red-200',
  '待整改': 'bg-red-50 text-red-700 border-red-200',
  '整改中': 'bg-amber-50 text-amber-700 border-amber-200',
  '已关闭': 'bg-zinc-50 text-zinc-500 border-zinc-200',
};

interface StatusBadgeProps {
  status: BadgeVariant;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        variantStyles[status],
        className
      )}
    >
      {status}
    </span>
  );
}
