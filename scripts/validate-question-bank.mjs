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
  '15-database-prisma.md',
  '16-html-css-a11y.md',
  '17-browser-web-api.md',
  '18-network-security.md',
  '19-hybrid-app.md',
  '20-performance-ux.md',
  '21-testing-quality.md',
  '22-project-behavioral.md',
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
const FOLLOWUP_MARKER_PATTERN = /^\*\*追问(链)?[：:]\*\*(.*)$/
const FOLLOWUP_DETAILS_MARKER = '::: details 追问参考答案'
const MIN_FOLLOWUP_ANSWER_LENGTH = 40

function createFenceState() {
  return { inFence: false, char: '', length: 0 }
}

function consumeFenceLine(state, rawLine) {
  const line = rawLine.replace(/\r$/, '')
  if (state.inFence) {
    const closingMatch = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/)
    if (
      closingMatch &&
      closingMatch[1][0] === state.char &&
      closingMatch[1].length >= state.length
    ) {
      state.inFence = false
      state.char = ''
      state.length = 0
    }
    return true
  }

  const openingMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
  if (!openingMatch) return false
  const marker = openingMatch[1]
  const info = openingMatch[2]
  if (marker[0] === '`' && info.includes('`')) return false

  state.inFence = true
  state.char = marker[0]
  state.length = marker.length
  return true
}

function parseContainerLine(rawLine) {
  const match = rawLine
    .replace(/\r$/, '')
    .match(/^ {0,3}(:{3,})(?:[ \t]+(.*?))?[ \t]*$/)
  if (!match) return null
  return {
    length: match[1].length,
    info: (match[2] ?? '').trim(),
  }
}

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
  const fenceState = createFenceState()

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!consumeFenceLine(fenceState, line)) {
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
 *   startIndex?: number,
 *   endIndex?: number,
 * }}
 */
export function extractNamedDetails(block, marker) {
  const lines = block.split('\n')
  const lineOffsets = []
  let offset = 0
  for (const line of lines) {
    lineOffsets.push(offset)
    offset += line.length + 1
  }
  let startLine = -1
  const searchFenceState = createFenceState()

  for (let i = 0; i < lines.length; i += 1) {
    if (consumeFenceLine(searchFenceState, lines[i])) continue
    if (lines[i].trim() === marker) {
      startLine = i
      break
    }
  }

  if (startLine === -1) {
    return { found: false }
  }

  const contentLines = []
  const containerStack = [marker.match(/^(:{3,})/)?.[1].length ?? 3]
  const contentFenceState = createFenceState()

  for (let i = startLine + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (!consumeFenceLine(contentFenceState, line)) {
      const container = parseContainerLine(line)
      if (container?.info) {
        containerStack.push(container.length)
      } else if (
        container &&
        container.length >= containerStack[containerStack.length - 1]
      ) {
        containerStack.pop()
        if (containerStack.length === 0) {
          return {
            found: true,
            closed: true,
            content: contentLines.join('\n').trim(),
            startIndex: lineOffsets[startLine],
            endIndex: lineOffsets[i] + line.length,
          }
        }
        continue
      }
    }

    contentLines.push(line)
  }

  return {
    found: true,
    closed: false,
    content: contentLines.join('\n').trim(),
    startIndex: lineOffsets[startLine],
    endIndex: block.length,
  }
}

export function extractAnswerDetails(block) {
  return extractNamedDetails(block, DETAILS_MARKER)
}

export function extractFollowupAnswerDetails(block) {
  return extractNamedDetails(block, FOLLOWUP_DETAILS_MARKER)
}

/**
 * @param {string} block
 * @returns {{
 *   found: boolean,
 *   kind: 'single' | 'chain' | null,
 *   questions: { number: number, text: string }[],
 *   markerLine: number,
 * }}
 */
export function findFollowupSection(block) {
  const lines = block.split('\n')
  const fenceState = createFenceState()

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (consumeFenceLine(fenceState, line)) continue

    const markerMatch = line.match(FOLLOWUP_MARKER_PATTERN)
    if (!markerMatch) continue

    const isChain = Boolean(markerMatch[1])
    const questions = []
    if (!isChain) {
      let text = markerMatch[2].trim()
      if (!text) {
        for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
          const candidate = lines[cursor].trim()
          if (!candidate) continue
          if (candidate.startsWith(':::')) break
          text = candidate
          break
        }
      }
      if (text) questions.push({ number: 1, text })
    } else if (markerMatch[2].trim()) {
      markerMatch[2]
        .split('→')
        .map((text) => text.trim())
        .filter(Boolean)
        .forEach((text, questionIndex) => {
          questions.push({ number: questionIndex + 1, text })
        })
    } else {
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const candidate = lines[cursor].trim()
        if (!candidate) continue
        if (candidate === FOLLOWUP_DETAILS_MARKER) break
        const questionMatch = candidate.match(/^(\d+)\.\s+(.+)$/)
        if (!questionMatch) break
        questions.push({
          number: Number(questionMatch[1]),
          text: questionMatch[2].trim(),
        })
      }
    }

    return {
      found: true,
      kind: isChain ? 'chain' : 'single',
      questions,
      markerLine: index + 1,
    }
  }

  return { found: false, kind: null, questions: [], markerLine: -1 }
}

/**
 * @param {string} content
 * @returns {{ number: number, text: string, index: number, length: number }[]}
 */
function findFollowupAnswerHeadings(content) {
  const headings = []
  const lines = content.split('\n')
  let offset = 0
  const fenceState = createFenceState()

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    if (!consumeFenceLine(fenceState, line)) {
      const headingMatch = line.match(/^\*\*(\d+)\.\s+(.+?)\*\*\s*$/)
      if (headingMatch) {
        headings.push({
          number: Number(headingMatch[1]),
          text: headingMatch[2].trim(),
          index: offset,
          length: rawLine.length,
        })
      }
    }
    offset += rawLine.length + 1
  }

  return headings
}

/**
 * @param {string} block
 * @returns {{
 *   failures: string[],
 *   questionCount: number,
 *   answerCount: number,
 * }}
 */
export function validateFollowupSection(block) {
  const section = findFollowupSection(block)
  if (!section.found) {
    return { failures: [], questionCount: 0, answerCount: 0 }
  }

  const failures = []
  if (section.questions.length === 0) {
    failures.push('追问标记后没有有效问题')
  }

  const details = extractFollowupAnswerDetails(block)
  if (!details.found) {
    failures.push('缺少追问参考答案')
    return {
      failures,
      questionCount: section.questions.length,
      answerCount: 0,
    }
  }
  if (!details.closed) {
    failures.push('追问参考答案容器未闭合')
    return {
      failures,
      questionCount: section.questions.length,
      answerCount: 0,
    }
  }

  const content = details.content ?? ''
  if (findPlaceholders(content).length > 0) {
    failures.push('追问参考答案含占位文案')
  }

  const answers = []
  if (section.kind === 'single') {
    answers.push({
      number: 1,
      text: section.questions[0]?.text ?? '',
      content,
    })
  } else {
    const headings = findFollowupAnswerHeadings(content)
    for (let index = 0; index < headings.length; index += 1) {
      const start = headings[index].index + headings[index].length
      const end = headings[index + 1]?.index ?? content.length
      answers.push({
        number: headings[index].number,
        text: headings[index].text,
        content: content.slice(start, end).trim(),
      })
    }
  }

  if (answers.length !== section.questions.length) {
    failures.push(
      `追问数量 ${section.questions.length} 与答案数量 ${answers.length} 不一致`,
    )
  }

  const comparableCount = Math.min(answers.length, section.questions.length)
  for (let index = 0; index < comparableCount; index += 1) {
    const question = section.questions[index]
    const answer = answers[index]
    if (question.number !== answer.number) {
      failures.push(`第 ${index + 1} 个追问编号与答案编号不一致`)
    }
    if (question.text !== answer.text) {
      failures.push(`第 ${index + 1} 个追问文本与答案标题不一致`)
    }
    const effectiveLength = answer.content.replace(/[#>*`\-|\s]/g, '').length
    if (effectiveLength < MIN_FOLLOWUP_ANSWER_LENGTH) {
      failures.push(
        `第 ${index + 1} 个追问答案少于 ${MIN_FOLLOWUP_ANSWER_LENGTH} 个有效字符`,
      )
    }
  }

  return {
    failures,
    questionCount: section.questions.length,
    answerCount: answers.length,
  }
}

/**
 * @param {string[]} [argv]
 * @returns {{ requireFollowups: boolean, followupFiles: string[] | null }}
 */
export function parseFollowupArgs(argv = process.argv.slice(2)) {
  const unknownArgs = argv.filter(
    (arg) =>
      arg !== '--require-followups' &&
      !arg.startsWith('--followup-files='),
  )
  if (unknownArgs.length > 0) {
    throw new Error(`未知参数：${unknownArgs.join('、')}`)
  }

  const requireFollowups = argv.includes('--require-followups')
  const fileArgs = argv.filter((arg) => arg.startsWith('--followup-files='))
  if (fileArgs.length > 1) {
    throw new Error('--followup-files 不能重复')
  }
  const fileArg = fileArgs[0]
  const followupFiles = fileArg
    ? fileArg
        .slice('--followup-files='.length)
        .split(',')
        .map((file) => file.trim())
        .filter(Boolean)
    : null

  if (fileArg && followupFiles?.length === 0) {
    throw new Error('--followup-files 不能为空')
  }
  if (followupFiles && !requireFollowups) {
    throw new Error('--followup-files 必须与 --require-followups 同时使用')
  }
  const invalidFiles = (followupFiles ?? []).filter(
    (file) => !EXPECTED_QUESTION_FILES.includes(file),
  )
  if (invalidFiles.length > 0) {
    throw new Error(`未知题库文件：${invalidFiles.join('、')}`)
  }

  return { requireFollowups, followupFiles }
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
 *   requireFollowups?: boolean,
 *   followupFiles?: string[] | null,
 * }} [options]
 * @returns {Promise<{ failures: string[], total: number, fileStats: string[] }>}
 */
export async function validateQuestionBank(options = {}) {
  const repoRoot = options.repoRoot ?? REPO_ROOT
  const limits = parseQuestionLimits()
  const min = options.min ?? limits.min
  const max = options.max ?? limits.max
  const expected = options.expected ?? limits.expected
  const requireFollowups = options.requireFollowups ?? false
  const followupFiles = options.followupFiles ?? null
  if (Array.isArray(followupFiles) && followupFiles.length === 0) {
    throw new Error('followupFiles 不能为空')
  }
  const invalidFollowupFiles = (followupFiles ?? []).filter(
    (file) => !EXPECTED_QUESTION_FILES.includes(file),
  )
  if (followupFiles && !requireFollowups) {
    throw new Error('followupFiles 必须与 requireFollowups 同时使用')
  }
  if (invalidFollowupFiles.length > 0) {
    throw new Error(`未知题库文件：${invalidFollowupFiles.join('、')}`)
  }
  const selectedFollowupFiles = new Set(
    followupFiles ?? EXPECTED_QUESTION_FILES,
  )
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
    let followups = 0
    let answered = 0
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

      let generalPlaceholderSource = block
      if (requireFollowups && selectedFollowupFiles.has(file)) {
        const followupDetails = extractFollowupAnswerDetails(block)
        if (
          followupDetails.startIndex !== undefined &&
          followupDetails.endIndex !== undefined
        ) {
          generalPlaceholderSource =
            block.slice(0, followupDetails.startIndex) +
            block.slice(followupDetails.endIndex)
        }
      }
      for (const pattern of findPlaceholders(generalPlaceholderSource)) {
        failures.push(`${file} ${id} 含占位文案（${pattern}）`)
      }

      const followupResult = validateFollowupSection(block)
      followups += followupResult.questionCount
      answered += followupResult.answerCount
      if (requireFollowups && selectedFollowupFiles.has(file)) {
        for (const failure of followupResult.failures) {
          failures.push(`${file} ${id} ${failure}`)
        }
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
    fileStats.push(
      `${file}: Q=${normal} D=${deep} total=${normal + deep} ` +
        `followups=${followups} answered=${answered}`,
    )
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
  const { requireFollowups, followupFiles } = parseFollowupArgs()
  const { failures, total, fileStats } = await validateQuestionBank({
    min,
    max,
    expected,
    requireFollowups,
    followupFiles,
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
