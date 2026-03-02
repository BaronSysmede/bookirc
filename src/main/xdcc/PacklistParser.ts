import type { PackEntry } from '../../shared/types'

// Matches: #N [Xgets] [Xkidle] [size] filename
// Multiple common formats
const PACK_PATTERNS = [
  // Standard: #1  5x  [1.4G]  Some.Movie.2024.mkv
  /^#(\d+)\s+(\d+)x\s+\[([^\]]+)\]\s+(.+)$/,
  // Variant: #1  [5]  [1.4G]  filename.mkv
  /^#(\d+)\s+\[(\d+)\]\s+\[([^\]]+)\]\s+(.+)$/,
  // Minimal: #1 1.4G filename.mkv
  /^#(\d+)\s+([\d.]+\s*[KMGT]?B)\s+(.+)$/i,
  // With idle: #1  5x  [45m]  [1.4G]  filename.mkv
  /^#(\d+)\s+(\d+)x\s+\[\S+\]\s+\[([^\]]+)\]\s+(.+)$/,
]

function parseSize(sizeStr: string): number {
  const s = sizeStr.trim().toUpperCase()
  const match = s.match(/^([\d.]+)\s*([KMGT]?B?)$/)
  if (!match) return 0
  const n = parseFloat(match[1])
  const unit = match[2]
  if (unit.startsWith('T')) return n * 1e12
  if (unit.startsWith('G')) return n * 1e9
  if (unit.startsWith('M')) return n * 1e6
  if (unit.startsWith('K')) return n * 1e3
  return n
}

export class PacklistParser {
  parseLine(line: string, serverId: string, botNick: string): PackEntry | null {
    // Strip leading whitespace/ANSI codes
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x03\d{0,2}(,\d{0,2})?/g, '').trim()

    for (const pattern of PACK_PATTERNS) {
      const m = clean.match(pattern)
      if (!m) continue

      if (pattern === PACK_PATTERNS[0] || pattern === PACK_PATTERNS[1]) {
        return {
          packNumber: parseInt(m[1], 10),
          gets: parseInt(m[2], 10),
          filesize: parseSize(m[3]),
          filename: m[4].trim(),
          serverId,
          botNick,
          source: 'bot',
        }
      } else if (pattern === PACK_PATTERNS[2]) {
        return {
          packNumber: parseInt(m[1], 10),
          gets: 0,
          filesize: parseSize(m[2]),
          filename: m[3].trim(),
          serverId,
          botNick,
          source: 'bot',
        }
      } else if (pattern === PACK_PATTERNS[3]) {
        return {
          packNumber: parseInt(m[1], 10),
          gets: parseInt(m[2], 10),
          filesize: parseSize(m[3]),
          filename: m[4].trim(),
          serverId,
          botNick,
          source: 'bot',
        }
      }
    }
    return null
  }
}
