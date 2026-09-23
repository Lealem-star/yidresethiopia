import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseFeedbackInput, type Feedback } from '@/lib/feedback'

const filePath = path.join(process.cwd(), 'data', 'feedback.json')

let writeChain = Promise.resolve()

function enqueue<T>(work: () => Promise<T>) {
  const run = writeChain.then(work, work)
  writeChain = run.then(() => undefined, () => undefined)
  return run
}

async function readAll(): Promise<Feedback[]> {
  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw) as Feedback[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function listFeedback() {
  const items = await readAll()
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function addFeedback(body: unknown) {
  const parsed = parseFeedbackInput(body)
  if ('error' in parsed) return parsed

  return enqueue(async () => {
    const items = await readAll()
    const item: Feedback = {
      id: crypto.randomUUID(),
      ...parsed.value,
      createdAt: new Date().toISOString(),
    }
    items.push(item)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, `${JSON.stringify(items, null, 2)}\n`, 'utf8')
    return { value: item }
  })
}
