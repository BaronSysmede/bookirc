import Store from 'electron-store'
import { app } from 'electron'
import { join } from 'path'
import os from 'os'

interface AppConfigSchema {
  downloadDir: string
  externalIp: string
  maxConcurrentDownloads: number
  servers: SavedServer[]
  theme: 'dark' | 'light'
}

export interface SavedServer {
  host: string
  port: number
  ssl: boolean
  nick: string
  username: string
  realname: string
  password?: string
  saslEnabled: boolean
  autoJoin: string[]
}

const defaults: AppConfigSchema = {
  downloadDir: join(os.homedir(), 'Downloads', 'bookirc'),
  externalIp: '',
  maxConcurrentDownloads: 3,
  servers: [],
  theme: 'dark',
}

export class AppConfig {
  private static instance: AppConfig
  private store: Store<AppConfigSchema>

  private constructor() {
    this.store = new Store<AppConfigSchema>({
      name: 'bookirc-config',
      defaults,
    })
  }

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig()
    }
    return AppConfig.instance
  }

  get<K extends keyof AppConfigSchema>(key: K): AppConfigSchema[K] {
    return this.store.get(key)
  }

  set<K extends keyof AppConfigSchema>(key: K, value: AppConfigSchema[K]): void {
    this.store.set(key, value)
  }

  getAll(): AppConfigSchema {
    return this.store.store
  }
}
