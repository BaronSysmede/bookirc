import type { ServerConfig } from '../../shared/types'

export class SaslHandler {
  private config: ServerConfig

  constructor(config: ServerConfig) {
    this.config = config
  }

  // Returns SASL PLAIN base64 payload
  getSaslPlainPayload(): string | null {
    if (!this.config.saslEnabled || !this.config.password) return null
    const user = this.config.username || this.config.nick
    const combined = `\0${user}\0${this.config.password}`
    return Buffer.from(combined).toString('base64')
  }

  // NickServ identify command
  getNickServCommand(): string | null {
    if (!this.config.password) return null
    return `IDENTIFY ${this.config.password}`
  }
}
