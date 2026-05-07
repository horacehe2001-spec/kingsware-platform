'use client';

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  KeyRound,
  PlayCircle,
  Sparkles,
  Stamp,
  WifiOff,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Card } from '@/components/ui/card';
import type { ActivityEvent } from '@/data/types';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  'agent-start': { Icon: PlayCircle, color: 'text-ai-from' },
  'agent-finish': { Icon: CheckCircle2, color: 'text-grade-a' },
  'report-generated': { Icon: FileText, color: 'text-primary' },
  'risk-alert': { Icon: AlertTriangle, color: 'text-grade-d' },
  approval: { Icon: Stamp, color: 'text-grade-b' },
  authorization: { Icon: KeyRound, color: 'text-grade-c' },
} as const;

const MAX_EVENTS = 30; // 客户端最多保留 30 条，避免 DOM 无限增长

type ConnState = 'connecting' | 'open' | 'closed';

export function ActivityFeed({ events: initialEvents }: { events: ActivityEvent[] }) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [conn, setConn] = useState<ConnState>('connecting');
  const [latestId, setLatestId] = useState<string | null>(null);
  const seenIds = useRef(new Set(initialEvents.map((e) => e.id)));

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setConn('connecting');
      es = new EventSource('/api/dashboard/activity-stream');

      es.onopen = () => {
        if (!cancelled) setConn('open');
      };

      es.onmessage = (e) => {
        if (cancelled) return;
        try {
          const event = JSON.parse(e.data) as ActivityEvent;
          if (seenIds.current.has(event.id)) return;
          seenIds.current.add(event.id);
          setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
          setLatestId(event.id);
          // 高亮 1.5s 后清除
          setTimeout(() => {
            setLatestId((curr) => (curr === event.id ? null : curr));
          }, 1500);
        } catch {
          // 忽略畸形 payload（如 ping 注释行不会进 onmessage）
        }
      };

      es.onerror = () => {
        if (cancelled) return;
        setConn('closed');
        es?.close();
        // 2s 后自动重连（开发环境 HMR 重启 / 网络抖动场景）
        reconnectTimer = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, []);

  return (
    <Card className="p-0">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md ai-gradient text-white">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight">实时活动流</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Agent 编排引擎 · SSE 推流
            </p>
          </div>
        </div>
        <ConnIndicator state={conn} />
      </header>
      <div className="relative max-h-[28rem] overflow-y-auto">
        <ul className="divide-y divide-border/60">
          {events.map((event) => {
            const def = ICON_MAP[event.type];
            const Icon = def?.Icon ?? FileText;
            const isLatest = event.id === latestId;
            return (
              <li
                key={event.id}
                className={cn(
                  'flex gap-3 px-4 py-3 transition-colors duration-700',
                  isLatest ? 'bg-ai-from/8' : 'hover:bg-muted/40',
                )}
              >
                <div className="mt-0.5">
                  <Icon className={`size-4 ${def?.color ?? 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-snug">
                    <span className="font-semibold text-foreground">{event.actor}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-foreground/80">{event.target}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                    {event.message}
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] tabular-nums text-muted-foreground/70">
                    {event.timestamp.slice(11)} · {formatRelativeTime(event.timestamp)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

function ConnIndicator({ state }: { state: ConnState }) {
  if (state === 'open') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-grade-a opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-grade-a" />
        </span>
        直连
      </span>
    );
  }
  if (state === 'connecting') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="size-2 rounded-full bg-grade-c animate-pulse" />
        连接中
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
      <WifiOff className="size-3" />
      重连中
    </span>
  );
}
