import { revalidatePath } from 'next/cache'
import { addFeedback, listFeedback } from '@/lib/feedback-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await listFeedback()
  return Response.json(items)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'መረጃው ትክክል አይደለም።' }, { status: 400 })
  }

  const result = await addFeedback(body)
  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 400 })
  }

  revalidatePath('/feedback')
  return Response.json(result.value, { status: 201 })
}
