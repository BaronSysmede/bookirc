import React from 'react'
import { useDownloadStore } from '../../store/useDownloadStore'
import { ProgressBar } from '../xdcc/ProgressBar'

export function DownloadQueuePanel(): React.ReactElement {
  const downloads = useDownloadStore((s) => Array.from(s.downloads.values()))

  return (
    <div className="h-full bg-[#0d0d0f] overflow-y-auto p-3 space-y-3">
      {downloads.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs text-zinc-600">
          No active downloads
        </div>
      )}
      {downloads.map((dl) => (
        <div key={dl.id} className="flex items-center gap-3 bg-[#16161a] rounded-lg px-3 py-2">
          <ProgressBar download={dl} />
          <div className="flex gap-1 shrink-0">
            {dl.status === 'downloading' && (
              <button
                className="px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                onClick={() => window.bookirc.pauseDownload(dl.id)}
              >
                Pause
              </button>
            )}
            {dl.status === 'paused' && (
              <button
                className="px-2 py-1 text-[11px] bg-accent/80 hover:bg-accent rounded text-white transition-colors"
                onClick={() => window.bookirc.resumeDownload(dl.id)}
              >
                Resume
              </button>
            )}
            {(dl.status === 'downloading' || dl.status === 'paused' || dl.status === 'connecting') && (
              <button
                className="px-2 py-1 text-[11px] bg-red-900/60 hover:bg-red-900 rounded text-red-300 transition-colors"
                onClick={() => window.bookirc.cancelDownload(dl.id)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
