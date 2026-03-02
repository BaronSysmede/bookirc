import React from 'react'

interface Span {
  text: string
  fg?: number
  bg?: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
}

export function parseMircColors(input: string): Span[] {
  const spans: Span[] = []
  let i = 0
  let current: Span = { text: '', bold: false, italic: false, underline: false, strikethrough: false }

  const push = () => {
    if (current.text) {
      spans.push({ ...current })
      current = { ...current, text: '' }
    }
  }

  while (i < input.length) {
    const ch = input[i]

    if (ch === '\x02') { // bold
      push()
      current.bold = !current.bold
      i++
    } else if (ch === '\x1d') { // italic
      push()
      current.italic = !current.italic
      i++
    } else if (ch === '\x1f') { // underline
      push()
      current.underline = !current.underline
      i++
    } else if (ch === '\x1e') { // strikethrough
      push()
      current.strikethrough = !current.strikethrough
      i++
    } else if (ch === '\x0f') { // reset
      push()
      current = { text: '', bold: false, italic: false, underline: false, strikethrough: false }
      i++
    } else if (ch === '\x03') { // color
      push()
      i++
      let fg = ''
      let bg = ''

      // Read up to 2 digit fg
      while (i < input.length && input[i] >= '0' && input[i] <= '9' && fg.length < 2) {
        fg += input[i++]
      }

      if (fg && i < input.length && input[i] === ',') {
        i++ // skip comma
        while (i < input.length && input[i] >= '0' && input[i] <= '9' && bg.length < 2) {
          bg += input[i++]
        }
      }

      if (fg) current.fg = parseInt(fg, 10)
      if (bg) current.bg = parseInt(bg, 10)
      if (!fg && !bg) {
        current.fg = undefined
        current.bg = undefined
      }
    } else {
      current.text += ch
      i++
    }
  }

  push()
  return spans
}

export function renderMircLine(text: string): React.ReactNode[] {
  const spans = parseMircColors(text)
  return spans.map((span, idx) => {
    const classes: string[] = []
    if (span.bold) classes.push('irc-bold')
    if (span.italic) classes.push('irc-italic')
    if (span.underline) classes.push('irc-underline')
    if (span.strikethrough) classes.push('irc-strike')
    if (span.fg !== undefined) classes.push(`irc-fg-${span.fg}`)
    if (span.bg !== undefined) classes.push(`irc-bg-${span.bg}`)

    if (classes.length === 0) return span.text

    return React.createElement('span', { key: idx, className: classes.join(' ') }, span.text)
  })
}
