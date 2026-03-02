/// <reference types="vite/client" />

import type {
  IrcEvent,
  ProgressEvent,
  PacklistEvent,
  QueueEvent,
  ServerConfig,
  IndexerResult,
} from '../shared/types'

interface BookIrcAPI {
  // IRC commands
  connect(config: ServerConfig): Promise<string>
  disconnect(serverId: string): Promise<void>
  sendMessage(serverId: string, target: string, msg: string): Promise<void>
  joinChannel(serverId: string, channel: string): Promise<void>
  partChannel(serverId: string, channel: string): Promise<void>

  // XDCC commands
  requestPacklist(serverId: string, botNick: string): Promise<void>
  botSearch(serverId: string, channel: string, term: string): Promise<void>
  queuePack(serverId: string, botNick: string, packNum: number): Promise<string>
  pauseDownload(id: string): Promise<void>
  resumeDownload(id: string): Promise<void>
  cancelDownload(id: string): Promise<void>

  // Indexer
  indexerSearch(query: string, adapters: string[]): Promise<IndexerResult[]>

  // Config
  setDownloadDir(): Promise<string>
  getConfig(key: string): Promise<unknown>
  setConfig(key: string, value: unknown): Promise<void>

  // Events (main → renderer)
  onIrcEvent(cb: (e: IrcEvent) => void): () => void
  onProgress(cb: (e: ProgressEvent) => void): () => void
  onPacklist(cb: (e: PacklistEvent) => void): () => void
  onQueueUpdate(cb: (e: QueueEvent) => void): () => void
}

declare global {
  interface Window {
    bookirc: BookIrcAPI
  }
}
