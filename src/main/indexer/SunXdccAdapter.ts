import https from 'https'
import type { IndexerAdapter, IndexerResult, SearchOpts } from './types'

interface SunXdccPacket {
  botnick: string
  network: string
  channel: string
  pack: number
  fsize: string
  fname: string
  gets: number
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

function parseSize(s: string): number {
  if (!s) return 0
  const n = parseFloat(s)
  const u = s.slice(-1).toUpperCase()
  if (u === 'T') return n * 1e12
  if (u === 'G') return n * 1e9
  if (u === 'M') return n * 1e6
  if (u === 'K') return n * 1e3
  return n
}

export class SunXdccAdapter implements IndexerAdapter {
  name = 'sunxdcc'

  async isAvailable(): Promise<boolean> {
    try {
      await fetchJson('https://sunxdcc.com/api/v2/search?search=test&limit=1')
      return true
    } catch {
      return false
    }
  }

  async search(query: string, opts?: SearchOpts): Promise<IndexerResult[]> {
    const limit = opts?.limit ?? 100
    const url = `https://sunxdcc.com/api/v2/search?search=${encodeURIComponent(query)}&limit=${limit}`
    const data = await fetchJson(url) as { data?: SunXdccPacket[] }
    const packets = data?.data ?? []
    return packets.map((p) => ({
      network: p.network,
      channel: p.channel,
      botNick: p.botnick,
      packNumber: p.pack,
      filename: p.fname,
      filesize: parseSize(p.fsize),
      gets: p.gets,
      indexer: 'sunxdcc',
    }))
  }
}
