import { contextBridge, ipcRenderer } from 'electron'
import type {
  ServerConfig,
  IrcEvent,
  ProgressEvent,
  PacklistEvent,
  QueueEvent,
} from './types'

const api = {
  // IRC commands
  connect: (config: ServerConfig) => ipcRenderer.invoke('irc:connect', config),
  disconnect: (serverId: string) => ipcRenderer.invoke('irc:disconnect', serverId),
  sendMessage: (serverId: string, target: string, msg: string) =>
    ipcRenderer.invoke('irc:sendMessage', serverId, target, msg),
  joinChannel: (serverId: string, channel: string) =>
    ipcRenderer.invoke('irc:joinChannel', serverId, channel),
  partChannel: (serverId: string, channel: string) =>
    ipcRenderer.invoke('irc:partChannel', serverId, channel),

  // XDCC commands
  requestPacklist: (serverId: string, botNick: string) =>
    ipcRenderer.invoke('xdcc:requestPacklist', serverId, botNick),
  botSearch: (serverId: string, channel: string, term: string) =>
    ipcRenderer.invoke('xdcc:botSearch', serverId, channel, term),
  queuePack: (serverId: string, botNick: string, packNum: number) =>
    ipcRenderer.invoke('xdcc:queuePack', serverId, botNick, packNum),
  pauseDownload: (id: string) => ipcRenderer.invoke('xdcc:pauseDownload', id),
  resumeDownload: (id: string) => ipcRenderer.invoke('xdcc:resumeDownload', id),
  cancelDownload: (id: string) => ipcRenderer.invoke('xdcc:cancelDownload', id),

  // Indexer
  indexerSearch: (query: string, adapters: string[]) =>
    ipcRenderer.invoke('indexer:search', query, adapters),

  // Config
  setDownloadDir: () => ipcRenderer.invoke('config:setDownloadDir'),
  getConfig: (key: string) => ipcRenderer.invoke('config:get', key),
  setConfig: (key: string, value: unknown) => ipcRenderer.invoke('config:set', key, value),

  // Events (main → renderer)
  onIrcEvent: (cb: (e: IrcEvent) => void) => {
    const handler = (_: Electron.IpcRendererEvent, e: IrcEvent) => cb(e)
    ipcRenderer.on('irc:event', handler)
    return () => ipcRenderer.removeListener('irc:event', handler)
  },

  onProgress: (cb: (e: ProgressEvent) => void) => {
    const handler = (_: Electron.IpcRendererEvent, e: ProgressEvent) => cb(e)
    ipcRenderer.on('xdcc:progress', handler)
    return () => ipcRenderer.removeListener('xdcc:progress', handler)
  },

  onPacklist: (cb: (e: PacklistEvent) => void) => {
    const handler = (_: Electron.IpcRendererEvent, e: PacklistEvent) => cb(e)
    ipcRenderer.on('xdcc:packlist', handler)
    return () => ipcRenderer.removeListener('xdcc:packlist', handler)
  },

  onQueueUpdate: (cb: (e: QueueEvent) => void) => {
    const handler = (_: Electron.IpcRendererEvent, e: QueueEvent) => cb(e)
    ipcRenderer.on('xdcc:queueUpdate', handler)
    return () => ipcRenderer.removeListener('xdcc:queueUpdate', handler)
  },
}

contextBridge.exposeInMainWorld('bookirc', api)

export type BookIrcAPI = typeof api
