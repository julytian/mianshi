/**
 * 题库 Markdown 结构校验：题量、参考答案、深层题模板、占位文案、重复编号
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

export const DEEP_SECTIONS = [
  '基础结论',
  '原理深挖',
  '工程场景',
  '反例 / 踩坑',
  '资深回答模板',
  '追问链',
]

export const EXPECTED_QUESTION_FILES = [
  '01-js-ts.md',
  '02-vue3.md',
  '03-engineering.md',
  '04-admin-antdv.md',
  '05-h5-vant.md',
  '06-uniapp-miniprogram.md',
  '07-java-fullstack.md',
  '08-architecture-lead.md',
  '09-ai-vibe-coding.md',
  '10-handwriting.md',
  '11-frontend-system-design.md',
  '12-microfrontend.md',
  '13-nestjs.md',
  '14-frontend-architecture.md',
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

const DETAILS_MARKER = '::: details 参考答案'

/**
 * @param {string | undefined} raw
 * @param {string} name
 * @returns {number}
 */
export function parseLimit(raw, name) {
  const text = String(raw ?? '').trim()
  if (!/^\d+$/.test(text)) {
    throw new Error(`${name} 必须是有限非负整数，当前值：${JSON.stringify(raw)}`)
  }
  const value = Number(text)
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} 必须是有限非负整数，当前值：${JSON.stringify(raw)}`)
  }
  return value
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ min: number, max: number, expected: number | null }}
 */
export function parseQuestionLimits(env = process.env) {
  const min = parseLimit(env.MIN_TOTAL_QUESTIONS ?? '201', 'MIN_TOTAL_QUESTIONS')
  const max = parseLimit(env.MAX_TOTAL_QUESTIONS ?? '410', 'MAX_TOTAL_QUESTIONS')
  const expected = env.EXPECTED_TOTAL_QUESTIONS === undefined
    ? null
    : parseLimit(env.EXPECTED_TOTAL_QUESTIONS, 'EXPECTED_TOTAL_QUESTIONS')
  if (min > max) {
    throw new Error(
      `MIN_TOTAL_QUESTIONS (${min}) 不能大于 MAX_TOTAL_QUESTIONS (${max})`,
    )
  }
  return { min, max, expected }
}

/**
 * @param {string} content
 * @returns {{ id: string, index: number, line: number }[]}
 */
export function findQuestionHeadings(content) {
  const results = []
  const lines = content.split('\n')
  let offset = 0
  let inFence = false
  let fenceChar = ''
  let fenceLen = 0

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/)

    if (fenceMatch) {
      const marker = fenceMatch[1]
      const char = marker[0]
      const len = marker.length
      if (!inFence) {
        inFence = true
        fenceChar = char
        fenceLen = len
      } else if (char === fenceChar && len >= fenceLen) {
        inFence = false
      }
    } else if (!inFence) {
      const headingMatch = line.match(/^### ([QD]\d+)\.\s+(.+)$/)
      if (headingMatch) {
        results.push({ id: headingMatch[1], index: offset, line: i + 1 })
      }
    }

    offset += line.length + 1
  }

  return results
}

/**
 * @param {string} block
 * @returns {{
 *   found: boolean,
 *   closed?: boolean,
 *   content?: string,
 * }}
 */
export function extractAnswerDetails(block) {
  const lines = block.split('\n')
  let startLine = -1

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() === DETAILS_MARKER) {
      startLine = i
      break
    }
  }

  if (startLine === -1) {
    return { found: false }
  }

  const contentLines = []
  let depth = 1

  for (let i = startLine + 1; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed.startsWith(':::')) {
      const info = trimmed.slice(3).trim()
      if (info.length === 0) {
        depth -= 1
        if (depth === 0) {
          return {
            found: true,
            closed: true,
            content: contentLines.join('\n').trim(),
          }
        }
        continue
      }
      depth += 1
    }

    contentLines.push(line)
  }

  return {
    found: true,
    closed: false,
    content: contentLines.join('\n').trim(),
  }
}

/**
 * @param {string} section
 * @returns {RegExp}
 */
export function buildDeepSectionPattern(section) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(
    `(^####\\s+${escaped}\\s*$)|(\\*\\*${escaped}[:：]?\\*\\*)`,
    'm',
  )
}

/**
 * @param {string} block
 * @param {string} section
 * @returns {boolean}
 */
export function hasDeepSection(block, section) {
  return buildDeepSectionPattern(section).test(block)
}

/**
 * @param {string | null | undefined} text
 * @returns {boolean}
 */
export function isEmptyAnswer(text) {
  if (!text) return true
  const stripped = text.replace(/[#>*`\-|\s]/g, '').trim()
  return stripped.length === 0
}

/**
 * @param {string} text
 * @returns {RegExp[]}
 */
export function findPlaceholders(text) {
  return PLACEHOLDER_PATTERNS.filter((pattern) => pattern.test(text))
}

/**
 * @param {{
 *   repoRoot?: string,
 *   min?: number,
 *   max?: number,
 *   expected?: number | null,
 * }} [options]
 * @returns {Promise<{ failures: string[], total: number, fileStats: string[] }>}
 */
export async function validateQuestionBank(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT
  const limits = parseQuestionLimits()
  const min = options.min ?? limits.min
  const max = options.max ?? limits.max
  const expected = options.expected ?? limits.expected
  const questionDir = path.join(repoRoot, 'docs/interview/questions')

  const actualFiles = (await readdir(questionDir))
    .filter((file) => file.endsWith('.md'))
    .sort()
  const expectedSet = new Set(EXPECTED_QUESTION_FILES)
  const actualSet = new Set(actualFiles)
  const missingFiles = EXPECTED_QUESTION_FILES.filter((file) => !actualSet.has(file))
  const extraFiles = actualFiles.filter((file) => !expectedSet.has(file))
  const failures = []
  const fileStats = []
  let total = 0

  if (missingFiles.length > 0 || extraFiles.length > 0) {
    const details = [
      missingFiles.length > 0 ? `缺失：${missingFiles.join('、')}` : '',
      extraFiles.length > 0 ? `额外：${extraFiles.join('、')}` : '',
    ].filter(Boolean)
    failures.push(`题库文件集合不符合预期（${details.join('；')}）`)
  }

  const files = EXPECTED_QUESTION_FILES.filter((file) => actualSet.has(file))
  for (const file of files) {
    const content = await readFile(path.join(questionDir, file), 'utf8')
    const matches = findQuestionHeadings(content)
    let normal = 0
    let deep = 0
    const seenIds = new Map()

    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index]
      const start = match.index
      const end = matches[index + 1]?.index ?? content.length
      const block = content.slice(start, end)
      const id = match.id

      if (seenIds.has(id)) {
        failures.push(
          `${file} ${id} 编号重复（首次出现于第 ${seenIds.get(id)} 题）`,
        )
      } else {
        seenIds.set(id, index + 1)
      }

      const details = extractAnswerDetails(block)
      if (!details.found) {
        failures.push(`${file} ${id} 缺少参考答案`)
      } else if (!details.closed) {
        failures.push(`${file} ${id} 参考答案容器未闭合`)
      } else if (isEmptyAnswer(details.content)) {
        failures.push(`${file} ${id} 参考答案为空`)
      }

      for (const pattern of findPlaceholders(block)) {
        failures.push(`${file} ${id} 含占位文案（${pattern}）`)
      }

      if (id.startsWith('D')) {
        deep += 1
        for (const section of DEEP_SECTIONS) {
          if (!hasDeepSection(block, section)) {
            failures.push(`${file} ${id} 缺少「${section}」`)
          }
        }
      } else {
        normal += 1
      }
    }

    total += normal + deep
    fileStats.push(`${file}: Q=${normal} D=${deep} total=${normal + deep}`)
  }

  if (total < min || total > max) {
    failures.push(`总题量 ${total} 不在 ${min}–${max} 范围`)
  }
  if (expected !== null && total !== expected) {
    failures.push(`总题量 ${total} 不等于精确要求 ${expected}`)
  }

  return { failures, total, fileStats }
}

async function main() {
  const { min, max, expected } = parseQuestionLimits()
  const { failures, total, fileStats } = await validateQuestionBank({
    min,
    max,
    expected,
  })

  for (const line of fileStats) {
    console.log(line)
  }
  console.log(`题库总量：${total}`)

  if (failures.length > 0) {
    console.error(failures.map((failure) => `- ${failure}`).join('\n'))
    process.exitCode = 1
  }
}

const entryPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null
const isMain = entryPath === fileURLToPath(import.meta.url)

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
