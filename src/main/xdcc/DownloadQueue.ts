import { DccTransfer } from './DccTransfer'
import { AppConfig } from '../config/AppConfig'

export class DownloadQueue {
  private transfers = new Map<string, DccTransfer>()
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  register(id: string, transfer: DccTransfer): void {
    this.transfers.set(id, transfer)
  }

  unregister(id: string): void {
    this.transfers.delete(id)
  }

  pause(id: string): void {
    this.transfers.get(id)?.pause()
  }

  resume(id: string): void {
    this.transfers.get(id)?.resume()
  }

  cancel(id: string): void {
    this.transfers.get(id)?.cancel()
    this.transfers.delete(id)
  }

  get activeCount(): number {
    return this.transfers.size
  }
}
