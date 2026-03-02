import https from 'https'
import type { IndexerAdapter, IndexerResult, SearchOpts } from './types'

interface IxIrcPacket {
  nme: string  // network
  chnl: string
  uname: string // bot nick
  n: number    // pack number
  sz: number   // filesize in bytes
  fn: string   // filename
  gets?: number
}

function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => (data += chunk.toString()))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

export class IxIrcAdapter implements IndexerAdapter {
  name = 'ixirc'

  async isAvailable(): Promise<boolean> {
    try {
      await fetchJson('https://ixirc.com/api/?q=test&sn=0&se=0&pkg=0')
      return true
    } catch {
      return false
    }
  }

  async search(query: string, opts?: SearchOpts): Promise<IndexerResult[]> {
    const url = `https://ixirc.com/api/?q=${encodeURIComponent(query)}&sn=0&se=0&pkg=0`
    const data = await fetchJson(url) as { packages?: IxIrcPacket[] }
    const packets = data?.packages ?? []
    return packets.map((p) => ({
      network: p.nme,
      channel: p.chnl,
      botNick: p.uname,
      packNumber: p.n,
      filename: p.fn,
      filesize: p.sz,
      gets: p.gets ?? 0,
      indexer: 'ixirc',
    }))
  }
}
