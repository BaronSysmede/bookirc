import { create } from 'zustand'
import type { ProgressEvent } from '../../shared/types'

export type DownloadEntry = ProgressEvent

interface DownloadStore {
  downloads: Map<string, DownloadEntry>
  updateDownload: (e: ProgressEvent) => void
  removeDownload: (id: string) => void
  getActiveDownloads: () => DownloadEntry[]
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: new Map(),

  updateDownload: (e) =>
    set((s) => {
      const downloads = new Map(s.downloads)
      downloads.set(e.id, e)
      return { downloads }
    }),

  removeDownload: (id) =>
    set((s) => {
      const downloads = new Map(s.downloads)
      downloads.delete(id)
      return { downloads }
    }),

  getActiveDownloads: () => {
    return Array.from(get().downloads.values())
  },
}))
