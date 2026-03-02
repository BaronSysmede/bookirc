import { getMainWindow } from '../index'
import type { Client } from 'irc-framework'

export class MessageRouter {
  private serverId: string
  private client: InstanceType<typeof Client>

  constructor(serverId: string, client: InstanceType<typeof Client>) {
    this.serverId = serverId
    this.client = client
  }

  private send(event: unknown): void {
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('irc:event', event)
    }
  }

  attach(): void {
    const sid = this.serverId

    this.client.on('message', (event: { nick: string; target: string; message: string; time?: Date }) => {
      this.send({
        type: 'message',
        serverId: sid,
        nick: event.nick,
        target: event.target,
        message: event.message,
        timestamp: event.time?.getTime() ?? Date.now(),
      })
    })

    this.client.on('join', (event: { nick: string; channel: string }) => {
      this.send({
        type: 'join',
        serverId: sid,
        nick: event.nick,
        channel: event.channel,
        timestamp: Date.now(),
      })
    })

    this.client.on('part', (event: { nick: string; channel: string; message?: string }) => {
      this.send({
        type: 'part',
        serverId: sid,
        nick: event.nick,
        channel: event.channel,
        message: event.message,
        timestamp: Date.now(),
      })
    })

    this.client.on('quit', (event: { nick: string; message?: string }) => {
      this.send({
        type: 'quit',
        serverId: sid,
        nick: event.nick,
        message: event.message,
        timestamp: Date.now(),
      })
    })

    this.client.on('nick', (event: { nick: string; new_nick: string }) => {
      this.send({
        type: 'nick',
        serverId: sid,
        oldNick: event.nick,
        newNick: event.new_nick,
        timestamp: Date.now(),
      })
    })

    this.client.on('topic', (event: { nick: string; channel: string; topic: string }) => {
      this.send({
        type: 'topic',
        serverId: sid,
        nick: event.nick,
        channel: event.channel,
        topic: event.topic,
        timestamp: Date.now(),
      })
    })

    this.client.on('userlist', (event: { channel: string; users: Array<{ nick: string; modes: string[] }> }) => {
      this.send({
        type: 'userlist',
        serverId: sid,
        channel: event.channel,
        users: event.users,
        timestamp: Date.now(),
      })
    })

    this.client.on('notice', (event: { nick: string; target: string; message: string }) => {
      this.send({
        type: 'notice',
        serverId: sid,
        nick: event.nick,
        target: event.target,
        message: event.message,
        timestamp: Date.now(),
      })
    })

    this.client.on('privmsg', (event: { nick: string; target: string; message: string }) => {
      this.send({
        type: 'privmsg',
        serverId: sid,
        nick: event.nick,
        target: event.target,
        message: event.message,
        timestamp: Date.now(),
      })
    })

    this.client.on('kick', (event: { kicked: string; nick: string; channel: string; message?: string }) => {
      this.send({
        type: 'kick',
        serverId: sid,
        kicked: event.kicked,
        by: event.nick,
        channel: event.channel,
        message: event.message,
        timestamp: Date.now(),
      })
    })

    this.client.on('mode', (event: { nick: string; target: string; modes: Array<{ mode: string; param?: string }> }) => {
      this.send({
        type: 'mode',
        serverId: sid,
        nick: event.nick,
        target: event.target,
        modes: event.modes,
        timestamp: Date.now(),
      })
    })
  }
}
