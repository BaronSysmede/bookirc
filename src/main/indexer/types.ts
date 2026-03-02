export interface IndexerResult {
  network: string
  channel: string
  botNick: string
  packNumber: number
  filename: string
  filesize: number
  gets: number
  indexer: string // 'sunxdcc' | 'ixirc' | ...
}

export interface SearchOpts {
  limit?: number
}

export interface IndexerAdapter {
  name: string
  search(query: string, opts?: SearchOpts): Promise<IndexerResult[]>
  isAvailable(): Promise<boolean>
}
