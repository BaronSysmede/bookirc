import { ipcMain, dialog } from 'electron'
import { ConnectionManager } from './irc/ConnectionManager'
import { XdccEngine } from './xdcc/XdccEngine'
import { AppConfig } from './config/AppConfig'
import { IndexerManager } from './indexer/IndexerManager'
import type { ServerConfig } from '../shared/types'

export function registerIpcHandlers(
  connectionManager: ConnectionManager,
  xdccEngine: XdccEngine,
  config: AppConfig
): void {
  const indexerManager = new IndexerManager()

  ipcMain.handle('irc:connect', async (_event, serverConfig: ServerConfig) => {
    return connectionManager.connect(serverConfig)
  })

  ipcMain.handle('irc:disconnect', async (_event, serverId: string) => {
    return connectionManager.disconnect(serverId)
  })

  ipcMain.handle('irc:sendMessage', async (_event, serverId: string, target: string, msg: string) => {
    return connectionManager.sendMessage(serverId, target, msg)
  })

  ipcMain.handle('irc:joinChannel', async (_event, serverId: string, channel: string) => {
    return connectionManager.joinChannel(serverId, channel)
  })

  ipcMain.handle('irc:partChannel', async (_event, serverId: string, channel: string) => {
    return connectionManager.partChannel(serverId, channel)
  })

  ipcMain.handle('xdcc:requestPacklist', async (_event, serverId: string, botNick: string) => {
    return xdccEngine.requestPacklist(serverId, botNick)
  })

  ipcMain.handle('xdcc:botSearch', async (_event, serverId: string, channel: string, term: string) => {
    return xdccEngine.botSearch(serverId, channel, term)
  })

  ipcMain.handle('xdcc:queuePack', async (_event, serverId: string, botNick: string, packNum: number) => {
    return xdccEngine.queuePack(serverId, botNick, packNum)
  })

  ipcMain.handle('xdcc:pauseDownload', async (_event, id: string) => {
    return xdccEngine.pauseDownload(id)
  })

  ipcMain.handle('xdcc:resumeDownload', async (_event, id: string) => {
    return xdccEngine.resumeDownload(id)
  })

  ipcMain.handle('xdcc:cancelDownload', async (_event, id: string) => {
    return xdccEngine.cancelDownload(id)
  })

  ipcMain.handle('indexer:search', async (_event, query: string, adapters: string[]) => {
    return indexerManager.search(query, adapters)
  })

  ipcMain.handle('config:setDownloadDir', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (!result.canceled && result.filePaths.length > 0) {
      const dir = result.filePaths[0]
      config.set('downloadDir', dir)
      return dir
    }
    return config.get('downloadDir')
  })

  ipcMain.handle('config:get', async (_event, key: string) => {
    return config.get(key as any)
  })

  ipcMain.handle('config:set', async (_event, key: string, value: unknown) => {
    config.set(key as any, value)
  })
}
