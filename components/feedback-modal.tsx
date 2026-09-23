'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AGE_GROUPS } from '@/lib/feedback'

type FeedbackModalProps = {
  open: boolean
  onClose: () => void
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ageGroup, message }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(typeof data.error === 'string' ? data.error : 'አስተያየቱ አልተላከም።')
        return
      }
      setName('')
      setAgeGroup('')
      setMessage('')
      onClose()
      router.push('/feedback')
    } catch {
      setError('አስተያየቱ አልተላከም።')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-[#24211e]/40 p-5" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#dedbd3] bg-[#fbfaf7] p-6 shadow-[0_20px_60px_rgba(55,46,35,0.2)] select-text"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b938a]">አስተያየት</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold">ምን አሰብክ?</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close feedback" onClick={onClose}><X /></Button>
        </div>
        <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
          <label className="flex flex-col gap-1.5 text-sm text-[#5f5850]">
            ስም (አማራጭ)
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              className="h-9 rounded-md border border-[#dedbd3] bg-white px-3 text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-[#5f5850]">
            የዕድሜ ክልል
            <select
              required
              value={ageGroup}
              onChange={(event) => setAgeGroup(event.target.value)}
              className="h-9 rounded-md border border-[#dedbd3] bg-white px-3 text-sm outline-none"
            >
              <option value="">ይምረጡ</option>
              {AGE_GROUPS.map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-[#5f5850]">
            አስተያየት
            <textarea
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              rows={5}
              className="rounded-md border border-[#dedbd3] bg-white px-3 py-2 text-sm outline-none"
            />
          </label>
          {error && <p className="text-sm text-[#7d2929]">{error}</p>}
          <Button type="submit" disabled={sending} className="bg-[#8b2d2d] text-[#f8e9c4] hover:bg-[#7d2929]">
            {sending ? 'እየተላከ ነው...' : 'ላክ'}
          </Button>
        </form>
      </div>
    </div>
  )
}
