import { useRoom } from '../../hooks/useRoom'
import { useRoomStore } from '../../store/roomStore'

interface Props {
  cardId: string
  myVotes: number
  isOwn: boolean
  remainingVotes: number
  roomId: string
}

const MAX_VOTES_PER_CARD = 3

export default function VoteButton({ cardId, myVotes, isOwn, remainingVotes, roomId }: Props) {
  const { castVote, retractVote } = useRoom()
  const myToken = useRoomStore((s) => s.myToken)

  const safeMyVotes = myVotes ?? 0
  const canAdd = !isOwn && remainingVotes > 0 && safeMyVotes < MAX_VOTES_PER_CARD
  const canRetract = safeMyVotes > 0

  function handleAdd() {
    if (!canAdd) return
    castVote(cardId, myToken, roomId)
  }

  function handleRetract() {
    if (!canRetract) return
    retractVote(cardId, myToken, roomId)
  }

  return (
    <div className="flex items-center gap-1">
      {/* Retract button */}
      <button
        onClick={handleRetract}
        disabled={!canRetract}
        className={`w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold transition-colors ${
          canRetract
            ? 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
        }`}
        title="Oyu geri al"
        aria-label="Oyu geri al"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
        </svg>
      </button>

      {/* Vote count display */}
      <div className="flex items-center gap-0.5 min-w-[2rem] justify-center">
        {Array.from({ length: MAX_VOTES_PER_CARD }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < safeMyVotes ? 'bg-red-400' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Cast vote button */}
      <button
        onClick={handleAdd}
        disabled={!canAdd}
        className={`w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold transition-colors ${
          canAdd
            ? 'bg-primary-100 text-primary-600 hover:bg-primary-200 active:bg-primary-300'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
        }`}
        title={
          isOwn
            ? 'Kendi kartınıza oy veremezsiniz'
            : remainingVotes === 0
            ? 'Oy hakkınız kalmadı'
            : myVotes >= MAX_VOTES_PER_CARD
            ? 'Bu karta maksimum oy verdiniz'
            : 'Oy ver'
        }
        aria-label="Oy ver"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}
