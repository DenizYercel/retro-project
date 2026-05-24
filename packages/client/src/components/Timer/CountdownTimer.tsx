interface Props {
  remaining: number // seconds
}

function formatTime(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const mins = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function CountdownTimer({ remaining }: Props) {
  const isUrgent = remaining > 0 && remaining < 60
  const isDone = remaining <= 0

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors ${
        isDone
          ? 'bg-gray-100 text-gray-400'
          : isUrgent
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'bg-gray-100 text-gray-700'
      }`}
      aria-live="polite"
      aria-label={`Kalan süre: ${formatTime(remaining)}`}
    >
      <svg
        className={`w-3.5 h-3.5 ${isDone ? 'text-gray-400' : isUrgent ? 'text-red-500' : 'text-gray-500'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{formatTime(remaining)}</span>
    </div>
  )
}
