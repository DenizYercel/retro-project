import type { JSX } from 'react'
import type { Card as CardType, RoomPhase } from '../../types'
import Card from './Card'
import AddCardForm from './AddCardForm'

interface Props {
  columnId: string
  title: string
  color: string
  icon: JSX.Element
  cards: CardType[]
  phase: RoomPhase
}

// Returns a very light tinted bg from a dark hex color
function lightBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.06)`
}

function lightBorder(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.18)`
}

export default function Column({ columnId, title, color, icon, cards, phase }: Props) {
  const sorted = [...cards].sort((a, b) =>
    phase === 'VOTING' || phase === 'DONE' ? b.voteCount - a.voteCount : 0
  )

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border bg-white"
      style={{ borderColor: lightBorder(color) }}
    >
      {/* Header — flat, dark, professional */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: color }}>
        <div className="flex items-center gap-2 text-white">
          <span className="opacity-80 flex-shrink-0">{icon}</span>
          <span className="font-semibold text-sm tracking-wide">{title}</span>
        </div>
        <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded bg-black/20 text-white/90">
          {cards.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        className="flex-1 p-3 space-y-2.5 min-h-[200px]"
        style={{ backgroundColor: lightBg(color) }}
      >
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-24">
            <p className="text-xs text-slate-400 italic text-center px-2">Henüz kart yok</p>
          </div>
        )}
        {sorted.map((card) => (
          <Card key={card.id} card={card} phase={phase} />
        ))}
      </div>

      {/* Add form */}
      {phase === 'WRITING' && (
        <div
          className="p-3 border-t"
          style={{ backgroundColor: lightBg(color), borderColor: lightBorder(color) }}
        >
          <AddCardForm columnId={columnId} />
        </div>
      )}
    </div>
  )
}
