/**
 * validate-question-bank.mjs 边界自测
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  REPO_ROOT,
  buildDeepSectionPattern,
  extractAnswerDetails,
  findQuestionHeadings,
  hasDeepSection,
  parseLimit,
  parseQuestionLimits,
  validateQuestionBank,
} from './validate-question-bank.mjs'

const scriptPath = path.join(REPO_ROOT, 'scripts/validate-question-bank.mjs')

function testParseLimit() {
  assert.equal(parseLimit('201', 'MIN_TOTAL_QUESTIONS'), 201)
  assert.equal(parseLimit('0', 'MIN_TOTAL_QUESTIONS'), 0)

  for (const bad of ['-1', '1.5', 'abc', '', 'NaN', '1e3']) {
    assert.throws(
      () => parseLimit(bad, 'MIN_TOTAL_QUESTIONS'),
      /必须是有限非负整数/,
    )
  }
}

function testParseQuestionLimits() {
  const limits = parseQuestionLimits({
    MIN_TOTAL_QUESTIONS: '10',
    MAX_TOTAL_QUESTIONS: '20',
    EXPECTED_TOTAL_QUESTIONS: '15',
  })
  assert.deepEqual(limits, { min: 10, max: 20, expected: 15 })

  assert.deepEqual(
    parseQuestionLimits({
      MIN_TOTAL_QUESTIONS: '10',
      MAX_TOTAL_QUESTIONS: '20',
    }),
    { min: 10, max: 20, expected: null },
  )

  assert.throws(
    () =>
      parseQuestionLimits({
        MIN_TOTAL_QUESTIONS: '500',
        MAX_TOTAL_QUESTIONS: '100',
      }),
    /不能大于/,
  )

  assert.throws(
    () =>
      parseQuestionLimits({
        MIN_TOTAL_QUESTIONS: 'x',
        MAX_TOTAL_QUESTIONS: '410',
      }),
    /MIN_TOTAL_QUESTIONS/,
  )

  assert.throws(
    () =>
      parseQuestionLimits({
        MIN_TOTAL_QUESTIONS: '10',
        MAX_TOTAL_QUESTIONS: '20',
        EXPECTED_TOTAL_QUESTIONS: 'x',
      }),
    /EXPECTED_TOTAL_QUESTIONS/,
  )
}

function testFindQuestionHeadingsSkipsCodeFence() {
  const content = `# demo

### Q1. 真实题目

\`\`\`js
// 不应计数
### Q99. 代码里的假标题
\`\`\`

### Q2. 第二题
`
  const headings = findQuestionHeadings(content)
  assert.deepEqual(
    headings.map((item) => item.id),
    ['Q1', 'Q2'],
  )
}

function testExtractAnswerDetails() {
  const closed = extractAnswerDetails(`### Q1. demo

::: details 参考答案
第一段
::: info 提示
嵌套内容
:::
第二段
:::

**追问：**
1. 不应算进答案
`)
  assert.equal(closed.found, true)
  assert.equal(closed.closed, true)
  assert.match(closed.content, /嵌套内容/)
  assert.match(closed.content, /第二段/)
  assert.doesNotMatch(closed.content, /不应算进答案/)

  const unclosed = extractAnswerDetails(`### D1. demo

::: details 参考答案
只有开头
**追问链：**
1. 正文
`)
  assert.equal(unclosed.found, true)
  assert.equal(unclosed.closed, false)

  const failures = []
  if (!unclosed.closed) {
    failures.push('参考答案容器未闭合')
  } else if ((unclosed.content ?? '').trim().length === 0) {
    failures.push('参考答案为空')
  }
  assert.deepEqual(failures, ['参考答案容器未闭合'])
}

function testHasDeepSection() {
  const block = `### D1. demo

::: details 参考答案

#### 基础结论
结论

**原理深挖**

#### 工程场景
场景

**反例 / 踩坑**

#### 资深回答模板
模板

:::

**追问链：**
1. 追问
`
  for (const section of [
    '基础结论',
    '原理深挖',
    '工程场景',
    '反例 / 踩坑',
    '资深回答模板',
    '追问链',
  ]) {
    assert.equal(hasDeepSection(block, section), true, section)
  }

  const proseOnly = `正文里提到了基础结论四个字，但没有标题标记`
  assert.equal(hasDeepSection(proseOnly, '基础结论'), false)
  assert.equal(buildDeepSectionPattern('反例 / 踩坑').test('**反例 / 踩坑**'), true)
  assert.equal(buildDeepSectionPattern('追问链').test('**追问链：**'), true)
}

function testInvalidEnvExitsOne() {
  const result = spawnSync(process.execPath, [scriptPath], {
    env: {
      ...process.env,
      MIN_TOTAL_QUESTIONS: '500',
      MAX_TOTAL_QUESTIONS: '100',
    },
    encoding: 'utf8',
  })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /不能大于/)
}

async function testWorksFromNonRepoRoot() {
  const { total, fileStats } = await validateQuestionBank({ min: 0, max: 999_999 })
  assert.ok(total > 0, '题库总量应大于 0')
  assert.ok(fileStats.length > 0, '应输出至少一个题库文件统计')

  const sampleStat = fileStats.find((line) => line.startsWith('01-js-ts.md:'))
  assert.ok(sampleStat, '应包含 01-js-ts.md 统计行')

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: path.dirname(fileURLToPath(import.meta.url)),
    env: {
      ...process.env,
      MIN_TOTAL_QUESTIONS: '0',
      MAX_TOTAL_QUESTIONS: '999999',
    },
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, new RegExp(`题库总量：${total}`))
  assert.match(result.stdout, /01-js-ts\.md: Q=\d+ D=\d+ total=\d+/)
}

async function testRejectsWrongQuestionFileSet() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'question-bank-files-'))
  const questionDir = path.join(repoRoot, 'docs/interview/questions')

  try {
    await mkdir(questionDir, { recursive: true })
    await writeFile(path.join(questionDir, '01-js-ts.md'), '# JS / TS\n')
    await writeFile(path.join(questionDir, '99-extra.md'), '# 额外题库\n')

    const { failures } = await validateQuestionBank({
      repoRoot,
      min: 0,
      max: 999_999,
    })
    const message = failures.join('\n')

    assert.match(message, /题库文件集合不符合预期/)
    assert.match(message, /缺失：02-vue3\.md/)
    assert.match(message, /额外：99-extra\.md/)
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
}

async function testExactQuestionTotal() {
  const baseline = await validateQuestionBank({ min: 0, max: 999_999 })
  assert.equal(baseline.failures.length, 0, baseline.failures.join('\n'))

  const matching = await validateQuestionBank({
    min: 0,
    max: 999_999,
    expected: baseline.total,
  })
  assert.equal(matching.failures.length, 0, matching.failures.join('\n'))

  const mismatching = await validateQuestionBank({
    min: 0,
    max: 999_999,
    expected: baseline.total + 1,
  })
  assert.match(
    mismatching.failures.join('\n'),
    new RegExp(`总题量 ${baseline.total} 不等于精确要求 ${baseline.total + 1}`),
  )
}

testParseLimit()
testParseQuestionLimits()
testFindQuestionHeadingsSkipsCodeFence()
testExtractAnswerDetails()
testHasDeepSection()
testInvalidEnvExitsOne()
await testWorksFromNonRepoRoot()
await testRejectsWrongQuestionFileSet()
await testExactQuestionTotal()

console.log('validate-question-bank 边界自测通过（9 组）')
