import { useState } from 'react'
import type { ActionItem as ActionItemType } from '../../types'
import api from '../../lib/api'

interface Props {
  item: ActionItemType
  roomId: string
}

export default function ActionItem({ item, roomId }: Props) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    if (toggling) return
    setToggling(true)
    try {
      await api.patch(`/rooms/${roomId}/actions/${item.id}`, {
        completed: !item.completed,
      })
    } catch (err) {
      console.error('Failed to toggle action item', err)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        item.completed
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-primary-200'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
          item.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-primary-400'
        } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={item.completed ? 'Tamamlandı olarak işaretle' : 'Tamamlanmadı olarak işaretle'}
        role="checkbox"
        aria-checked={item.completed}
      >
        {item.completed && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${
            item.completed ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {item.content}
        </p>

        {item.assignee && (
          <div className="mt-1.5 flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">{item.assignee}</span>
          </div>
        )}
      </div>

      {/* Status badge */}
      {item.completed && (
        <span className="badge bg-green-100 text-green-700 flex-shrink-0 text-xs">
          Tamamlandı
        </span>
      )}
    </div>
  )
}
