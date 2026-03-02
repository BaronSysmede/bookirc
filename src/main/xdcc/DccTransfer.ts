import * as net from 'net'
import * as fs from 'fs'
import * as path from 'path'
import { getMainWindow } from '../index'
import { DownloadQueue } from './DownloadQueue'
import { randomUUID } from 'crypto'

export interface DccTransferOptions {
  serverId: string
  botNick: string
  filename: string
  filePath: string
  filesize: number
  ip?: string
  port?: number
  socket?: net.Socket
  downloadQueue: DownloadQueue
}

export class DccTransfer {
  private id = randomUUID()
  private opts: DccTransferOptions
  private socket: net.Socket | null = null
  private bytesReceived = 0
  private startTime = Date.now()
  private lastProgressTime = Date.now()
  private paused = false
  private cancelled = false
  private progressInterval: NodeJS.Timeout | null = null

  constructor(opts: DccTransferOptions) {
    this.opts = opts
    opts.downloadQueue.register(this.id, this)
  }

  async start(): Promise<void> {
    const { ip, port, socket, filePath, filesize, filename } = this.opts

    // Check for existing partial file (resume support)
    let resumeOffset = 0
    if (fs.existsSync(filePath)) {
      resumeOffset = fs.statSync(filePath).size
      if (resumeOffset >= filesize) {
        resumeOffset = 0 // re-download if complete
      }
    }

    this.bytesReceived = resumeOffset

    // Notify start
    const win = getMainWindow()
    if (win) {
      win.webContents.send('xdcc:progress', {
        id: this.id,
        filename,
        filesize,
        bytesReceived: resumeOffset,
        speed: 0,
        status: 'connecting',
        timestamp: Date.now(),
      })
    }

    if (socket) {
      this.socket = socket
    } else {
      this.socket = new net.Socket()
      await new Promise<void>((resolve, reject) => {
        this.socket!.connect(port!, ip!, () => resolve())
        this.socket!.once('error', reject)
      })
    }

    const writeStream = fs.createWriteStream(filePath, {
      flags: resumeOffset > 0 ? 'a' : 'w',
    })

    // Start progress reporting (throttled 500ms)
    this.progressInterval = setInterval(() => this.reportProgress(), 500)

    await new Promise<void>((resolve, reject) => {
      this.socket!.on('data', (chunk: Buffer) => {
        if (this.cancelled) {
          this.socket!.destroy()
          return
        }
        if (this.paused) {
          this.socket!.pause()
          return
        }

        writeStream.write(chunk)
        this.bytesReceived += chunk.length

        // Send 4-byte big-endian ACK
        const ack = Buffer.alloc(4)
        ack.writeUInt32BE(this.bytesReceived & 0xffffffff, 0)
        this.socket!.write(ack)
      })

      this.socket!.on('end', () => {
        writeStream.end(() => {
          this.cleanup()
          resolve()
        })
      })

      this.socket!.on('error', (err) => {
        writeStream.destroy()
        this.cleanup()
        reject(err)
      })

      // Stall detection (60s no bytes)
      this.socket!.setTimeout(60000)
      this.socket!.on('timeout', () => {
        this.cleanup()
        reject(new Error('DCC transfer stalled (60s timeout)'))
      })
    })

    this.reportFinal()
  }

  private reportProgress(): void {
    const now = Date.now()
    const elapsed = (now - this.startTime) / 1000
    const speed = elapsed > 0 ? this.bytesReceived / elapsed : 0
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('xdcc:progress', {
        id: this.id,
        filename: this.opts.filename,
        filesize: this.opts.filesize,
        bytesReceived: this.bytesReceived,
        speed,
        status: this.paused ? 'paused' : 'downloading',
        timestamp: Date.now(),
      })
    }
  }

  private reportFinal(): void {
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('xdcc:progress', {
        id: this.id,
        filename: this.opts.filename,
        filesize: this.opts.filesize,
        bytesReceived: this.bytesReceived,
        speed: 0,
        status: this.cancelled ? 'cancelled' : 'complete',
        timestamp: Date.now(),
      })
    }
  }

  private cleanup(): void {
    if (this.progressInterval) clearInterval(this.progressInterval)
    this.opts.downloadQueue.unregister(this.id)
  }

  pause(): void {
    this.paused = true
    this.socket?.pause()
  }

  resume(): void {
    this.paused = false
    this.socket?.resume()
  }

  cancel(): void {
    this.cancelled = true
    this.socket?.destroy()
  }
}
