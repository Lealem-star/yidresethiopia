export const AGE_GROUPS = ['ከ18 በታች', '18–24', '25–34', '35–44', '45+'] as const

export type AgeGroup = (typeof AGE_GROUPS)[number]

export type Feedback = {
  id: string
  name: string | null
  ageGroup: AgeGroup
  message: string
  createdAt: string
}

export function isAgeGroup(value: string): value is AgeGroup {
  return (AGE_GROUPS as readonly string[]).includes(value)
}

export function parseFeedbackInput(body: unknown) {
  if (!body || typeof body !== 'object') return { error: 'መረጃው ትክክል አይደለም።' }
  const data = body as Record<string, unknown>
  const name = typeof data.name === 'string' ? data.name.trim().slice(0, 80) : ''
  const ageGroup = typeof data.ageGroup === 'string' ? data.ageGroup : ''
  const message = typeof data.message === 'string' ? data.message.trim().slice(0, 2000) : ''

  if (!isAgeGroup(ageGroup)) return { error: 'የዕድሜ ክልል ይምረጡ።' }
  if (message.length < 2) return { error: 'አስተያየት ይጻፉ።' }

  return {
    value: {
      name: name || null,
      ageGroup,
      message,
    },
  }
}
