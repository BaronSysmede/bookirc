export interface ServerConfig {
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

export interface PackEntry {
  packNumber: number
  gets: number
  filesize: number
  filename: string
  serverId: string
  botNick: string
  source: 'bot' | 'sunxdcc' | 'ixirc'
  network?: string
  channel?: string
}

export interface IrcEvent {
  type: string
  serverId: string
  timestamp: number
  [key: string]: unknown
}

export interface ProgressEvent {
  id: string
  filename: string
  filesize: number
  bytesReceived: number
  speed: number
  status: 'connecting' | 'downloading' | 'paused' | 'complete' | 'cancelled' | 'error'
  timestamp: number
}

export interface PacklistEvent {
  serverId: string
  botNick: string
  packs: PackEntry[]
  timestamp: number
}

export interface QueueEvent {
  id: string
  serverId: string
  botNick: string
  packNum: number
  status: 'queued' | 'downloading' | 'complete' | 'cancelled'
  timestamp: number
}
