'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AGE_GROUPS } from '@/lib/feedback'

export function FeedbackForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

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
      router.refresh()
    } catch {
      setError('አስተያየቱ አልተላከም።')
    } finally {
      setSending(false)
    }
  }

  return (
    <form className="mt-6 flex flex-col gap-4 border-t border-[#e7dfd1] pt-6" onSubmit={submit}>
      <p className="font-serif text-lg font-semibold">አዲስ አስተያየት ጻፍ</p>
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
          rows={4}
          className="rounded-md border border-[#dedbd3] bg-white px-3 py-2 text-sm outline-none"
        />
      </label>
      {error && <p className="text-sm text-[#7d2929]">{error}</p>}
      <Button type="submit" disabled={sending} className="w-fit bg-[#8b2d2d] text-[#f8e9c4] hover:bg-[#7d2929]">
        {sending ? 'እየተላከ ነው...' : 'ላክ'}
      </Button>
    </form>
  )
}
