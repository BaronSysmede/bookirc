import React, { useState } from 'react'
import { useServerStore } from '../../store/useServerStore'

interface Props {
  onClose: () => void
}

export function ConnectDialog({ onClose }: Props): React.ReactElement {
  const [host, setHost] = useState('irc.libera.chat')
  const [port, setPort] = useState('6697')
  const [ssl, setSsl] = useState(true)
  const [nick, setNick] = useState('bookirc_user')
  const [username, setUsername] = useState('bookirc')
  const [realname, setRealname] = useState('BookIRC')
  const [password, setPassword] = useState('')
  const [sasl, setSasl] = useState(false)
  const [autoJoin, setAutoJoin] = useState('#bookirc')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  const addServer = useServerStore((s) => s.addServer)
  const addChannel = useServerStore((s) => s.addChannel)
  const setActiveChannel = useServerStore((s) => s.setActiveChannel)

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const serverId = await window.bookirc.connect({
        host,
        port: parseInt(port, 10),
        ssl,
        nick,
        username,
        realname,
        password: password || undefined,
        saslEnabled: sasl,
        autoJoin: autoJoin.split(',').map((c) => c.trim()).filter(Boolean),
      })

      addServer(serverId, host, nick)

      const channels = autoJoin.split(',').map((c) => c.trim()).filter(Boolean)
      for (const ch of channels) {
        addChannel(serverId, ch)
        await window.bookirc.joinChannel(serverId, ch)
      }
      if (channels.length > 0) {
        setActiveChannel(serverId, channels[0])
      }

      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#16161a] border border-zinc-700 rounded-lg p-6 w-[420px] shadow-2xl">
        <h2 className="text-sm font-bold text-zinc-200 mb-4">Connect to IRC Server</h2>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 block mb-1">Host</label>
              <input
                className="w-full bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
            <div className="w-16">
              <label className="text-xs text-zinc-400 block mb-1">Port</label>
              <input
                className="w-full bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={ssl} onChange={(e) => setSsl(e.target.checked)} />
            SSL/TLS
          </label>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 block mb-1">Nick</label>
              <input
                className="w-full bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-400 block mb-1">Username</label>
              <input
                className="w-full bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Real Name</label>
            <input
              className="w-full bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-accent"
              value={realname}
              onChange={(e) => setRealname(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Password (optional)</label>
            <input
              type="password"
              className="w-full bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-accent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={sasl} onChange={(e) => setSasl(e.target.checked)} />
            Use SASL PLAIN
          </label>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Auto-join channels (comma-separated)</label>
            <input
              className="w-full bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-accent"
              value={autoJoin}
              onChange={(e) => setAutoJoin(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 bg-accent hover:bg-accent-hover text-white text-xs py-2 rounded transition-colors disabled:opacity-50"
              onClick={handleConnect}
              disabled={connecting}
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
            <button
              className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2 rounded transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
