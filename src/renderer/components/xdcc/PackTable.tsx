import React, { useMemo, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { formatBytes } from '../../lib/formatBytes'
import type { PackEntry } from '../../../shared/types'
import { useServerStore } from '../../store/useServerStore'

interface Props {
  packs: PackEntry[]
  onQueue: (pack: PackEntry) => void
}

export function PackTable({ packs, onQueue }: Props): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [filter, setFilter] = useState('')

  const columns = useMemo<ColumnDef<PackEntry>[]>(
    () => [
      {
        accessorKey: 'packNumber',
        header: '#',
        size: 50,
        cell: (info) => <span className="text-zinc-500">#{info.getValue<number>()}</span>,
      },
      {
        accessorKey: 'filename',
        header: 'Filename',
        size: 400,
        cell: (info) => (
          <span className="text-zinc-200 truncate block">{info.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'filesize',
        header: 'Size',
        size: 80,
        cell: (info) => (
          <span className="text-zinc-400 text-right block">{formatBytes(info.getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'gets',
        header: 'Gets',
        size: 55,
        cell: (info) => (
          <span className="text-zinc-500 text-right block">{info.getValue<number>()}</span>
        ),
      },
      {
        accessorKey: 'source',
        header: 'Src',
        size: 60,
        cell: (info) => {
          const src = info.getValue<string>()
          const color = src === 'bot' ? 'text-green-500' : src === 'sunxdcc' ? 'text-blue-400' : 'text-purple-400'
          return <span className={`${color} text-[10px]`}>{src}</span>
        },
      },
    ],
    []
  )

  const filtered = useMemo(() => {
    if (!filter) return packs
    const q = filter.toLowerCase()
    return packs.filter((p) => p.filename.toLowerCase().includes(q))
  }, [packs, filter])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const { rows } = table.getRowModel()
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10,
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#16161a] border-b border-zinc-800">
        <input
          type="text"
          placeholder="Filter filename…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#0d0d0f] border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-accent/60 w-64"
        />
        <span className="text-xs text-zinc-600 ml-auto">{filtered.length} packs</span>
      </div>

      {/* Table header */}
      <div className="bg-[#16161a] border-b border-zinc-800 shrink-0">
        {table.getHeaderGroups().map((hg) => (
          <div key={hg.id} className="flex px-3">
            {hg.headers.map((header) => (
              <div
                key={header.id}
                style={{ width: header.getSize() + 'px' }}
                className={`py-1.5 text-xs text-zinc-500 uppercase tracking-wider shrink-0 ${
                  header.column.getCanSort() ? 'cursor-pointer hover:text-zinc-300' : ''
                }`}
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Virtualized rows */}
      <div ref={parentRef} className="flex-1 overflow-y-auto min-h-0">
        <div style={{ height: virtualizer.getTotalSize() + 'px', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((vItem) => {
            const row = rows[vItem.index]
            return (
              <div
                key={vItem.key}
                data-index={vItem.index}
                ref={virtualizer.measureElement}
                style={{ position: 'absolute', top: vItem.start + 'px', left: 0, right: 0 }}
                className="flex items-center px-3 hover:bg-zinc-800/40 cursor-pointer group"
                onDoubleClick={() => onQueue(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    style={{ width: cell.column.getSize() + 'px' }}
                    className="shrink-0 text-xs py-1.5 overflow-hidden"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
                <button
                  className="ml-auto text-[10px] px-2 py-0.5 bg-accent/60 hover:bg-accent text-white rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => { e.stopPropagation(); onQueue(row.original) }}
                >
                  Queue
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
