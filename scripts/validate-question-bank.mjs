/**
 * 题库 Markdown 结构校验：题量、参考答案、深层题模板、占位文案、重复编号
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const QUESTION_DIR = path.resolve('docs/interview/questions')
const MIN_TOTAL = Number(process.env.MIN_TOTAL_QUESTIONS ?? 201)
const MAX_TOTAL = Number(process.env.MAX_TOTAL_QUESTIONS ?? 410)

const DEEP_SECTIONS = [
  '基础结论',
  '原理深挖',
  '工程场景',
  '反例 / 踩坑',
  '资深回答模板',
  '追问链',
]

const PLACEHOLDER_PATTERNS = [
  /内容建设中/,
  /稍后补充/,
  /待完善/,
  /\bTODO\b/,
  /\bTBD\b/,
  /自行组织/,
  /待补充/,
]

const QUESTION_HEADING = /^### ([QD]\d+)\.\s+.+$/gm

function extractAnswerContent(block) {
  const marker = '::: details 参考答案'
  const start = block.indexOf(marker)
  if (start === -1) return null

  const afterMarker = block.indexOf('\n', start)
  if (afterMarker === -1) return ''

  const rest = block.slice(afterMarker + 1)
  const closeIndex = rest.indexOf('\n:::')
  if (closeIndex === -1) return rest.trim()

  return rest.slice(0, closeIndex).trim()
}

function isEmptyAnswer(text) {
  if (!text) return true
  const stripped = text.replace(/[#>*`\-\s]/g, '').trim()
  return stripped.length === 0
}

function findPlaceholders(text) {
  return PLACEHOLDER_PATTERNS.filter((pattern) => pattern.test(text))
}

const files = (await readdir(QUESTION_DIR))
  .filter((file) => /^\d{2}-.+\.md$/.test(file))
  .sort()

const failures = []
let total = 0

for (const file of files) {
  const content = await readFile(path.join(QUESTION_DIR, file), 'utf8')
  const matches = [...content.matchAll(QUESTION_HEADING)]
  let normal = 0
  let deep = 0
  const seenIds = new Map()

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const start = match.index
    const end = matches[index + 1]?.index ?? content.length
    const block = content.slice(start, end)
    const id = match[1]

    if (seenIds.has(id)) {
      failures.push(`${file} ${id} 编号重复（首次出现于第 ${seenIds.get(id)} 题）`)
    } else {
      seenIds.set(id, index + 1)
    }

    if (!block.includes('::: details 参考答案')) {
      failures.push(`${file} ${id} 缺少参考答案`)
    } else {
      const answer = extractAnswerContent(block)
      if (isEmptyAnswer(answer)) {
        failures.push(`${file} ${id} 参考答案为空`)
      }
    }

    for (const pattern of findPlaceholders(block)) {
      failures.push(`${file} ${id} 含占位文案（${pattern}）`)
    }

    if (id.startsWith('D')) {
      deep += 1
      for (const section of DEEP_SECTIONS) {
        if (!block.includes(section)) {
          failures.push(`${file} ${id} 缺少「${section}」`)
        }
      }
    } else {
      normal += 1
    }
  }

  total += normal + deep
  console.log(`${file}: Q=${normal} D=${deep} total=${normal + deep}`)
}

if (total < MIN_TOTAL || total > MAX_TOTAL) {
  failures.push(`总题量 ${total} 不在 ${MIN_TOTAL}–${MAX_TOTAL} 范围`)
}

console.log(`题库总量：${total}`)

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'))
  process.exitCode = 1
}
