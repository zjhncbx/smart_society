import { Badge } from 'antd';

const statusColor: Record<string, string> = {
  open: 'red',
  in_progress: 'blue',
  monitoring: 'blue',
  done: 'green',
  resolved: 'green',
  cancelled: 'default',
  ignored: 'default',
  approved: 'green',
  rejected: 'red',
  approving: 'gold',
};

export function StatusBadge({ status }: { status: string }): React.JSX.Element {
  return <Badge status={(statusColor[status] as 'success' | 'processing' | 'default' | 'error' | 'warning') ?? 'default'} text={status} />;
}
