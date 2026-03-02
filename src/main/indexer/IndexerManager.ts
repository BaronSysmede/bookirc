import { SunXdccAdapter } from './SunXdccAdapter'
import { IxIrcAdapter } from './IxIrcAdapter'
import type { IndexerAdapter, IndexerResult } from './types'

export class IndexerManager {
  private adapters: Map<string, IndexerAdapter>

  constructor() {
    this.adapters = new Map([
      ['sunxdcc', new SunXdccAdapter()],
      ['ixirc', new IxIrcAdapter()],
    ])
  }

  async search(query: string, adapterNames: string[]): Promise<IndexerResult[]> {
    const targets = adapterNames.length > 0
      ? adapterNames.filter((n) => this.adapters.has(n)).map((n) => this.adapters.get(n)!)
      : Array.from(this.adapters.values())

    const results = await Promise.allSettled(targets.map((a) => a.search(query)))
    const merged: IndexerResult[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') {
        merged.push(...r.value)
      }
    }
    return merged
  }
}
