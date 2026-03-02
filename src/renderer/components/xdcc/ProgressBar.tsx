import React from 'react'
import { formatBytes, formatSpeed } from '../../lib/formatBytes'
import type { DownloadEntry } from '../../store/useDownloadStore'

interface Props {
  download: DownloadEntry
}

export function ProgressBar({ download }: Props): React.ReactElement {
  const pct = download.filesize > 0
    ? Math.min(100, (download.bytesReceived / download.filesize) * 100)
    : 0

  const statusColor = {
    connecting: 'bg-yellow-500',
    downloading: 'bg-accent',
    paused: 'bg-zinc-500',
    complete: 'bg-green-500',
    cancelled: 'bg-red-500',
    error: 'bg-red-600',
  }[download.status] ?? 'bg-accent'

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-0.5">
        <span className="truncate">{download.filename}</span>
        <span className="shrink-0 ml-2">
          {pct.toFixed(0)}% · {formatSpeed(download.speed)}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${statusColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex text-[10px] text-zinc-600 mt-0.5">
        <span>{formatBytes(download.bytesReceived)} / {formatBytes(download.filesize)}</span>
        <span className="ml-auto">{download.status}</span>
      </div>
    </div>
  )
}
