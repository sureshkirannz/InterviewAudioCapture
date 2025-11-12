import { HelpCircle, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { SessionStats } from '@shared/schema';

interface StatisticsPanelProps {
  stats: SessionStats;
}

export function StatisticsPanel({ stats }: StatisticsPanelProps) {
  const successRate = stats.webhookSuccessCount + stats.webhookFailCount > 0
    ? Math.round((stats.webhookSuccessCount / (stats.webhookSuccessCount + stats.webhookFailCount)) * 100)
    : 0;

  const statistics = [
    {
      icon: HelpCircle,
      label: 'Questions Detected',
      value: stats.questionsDetected,
      color: 'text-primary',
      testId: 'stat-questions',
    },
    {
      icon: MessageSquare,
      label: 'Total Transcriptions',
      value: stats.totalTranscriptions,
      color: 'text-foreground',
      testId: 'stat-transcriptions',
    },
    {
      icon: CheckCircle2,
      label: 'Webhook Success Rate',
      value: `${successRate}%`,
      color: 'text-green-600',
      testId: 'stat-webhook',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statistics.map((stat) => (
        <Card key={stat.label} className="p-6" data-testid={stat.testId}>
          <div className="flex items-center gap-3 mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <div className={`text-3xl font-bold ${stat.color}`} data-testid={`${stat.testId}-value`}>
            {stat.value}
          </div>
        </Card>
      ))}
    </div>
  );
}
