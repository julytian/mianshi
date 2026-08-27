/**
 * validate-question-bank.mjs 边界自测
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as validator from './validate-question-bank.mjs'
import {
  EXPECTED_QUESTION_FILES,
  REPO_ROOT,
  buildDeepSectionPattern,
  extractAnswerDetails,
  extractFollowupAnswerDetails,
  findQuestionHeadings,
  findFollowupSection,
  hasDeepSection,
  parseFollowupArgs,
  parseLimit,
  parseQuestionLimits,
  validateFollowupSection,
  validateQuestionBank,
} from './validate-question-bank.mjs'

const scriptPath = path.join(REPO_ROOT, 'scripts/validate-question-bank.mjs')

const singleFollowup = `### Q1. 示例

::: details 参考答案
主答案
:::

**追问：** 单个追问如何回答？

::: details 追问参考答案

单个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。

:::
`

const followupChain = `### D1. 示例

::: details 参考答案
主答案
:::

**追问链：**
1. 第一个追问？
2. 第二个追问？

::: details 追问参考答案

**1. 第一个追问？**

第一个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。

**2. 第二个追问？**

第二个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。

:::
`

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

function testParseQuestionLimitsDefaults() {
  assert.deepEqual(parseQuestionLimits({}), {
    min: 620,
    max: 640,
    expected: null,
  })
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

function testFollowupParsingAndValidation() {
  assert.equal(findFollowupSection(singleFollowup).questions.length, 1)
  assert.equal(validateFollowupSection(singleFollowup).failures.length, 0)
  assert.equal(findFollowupSection(followupChain).questions.length, 2)
  assert.equal(validateFollowupSection(followupChain).failures.length, 0)

  const nested = singleFollowup.replace(
    '单个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。',
    `::: info 补充
嵌套容器里的说明不应导致外层容器提前闭合。
:::
单个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。`,
  )
  const details = extractFollowupAnswerDetails(nested)
  assert.equal(details.found, true)
  assert.equal(details.closed, true)
  assert.match(details.content, /嵌套容器里的说明/)
  assert.equal(validateFollowupSection(nested).failures.length, 0)
}

function testInlineFollowupChain() {
  const inlineChain = `### D1. 示例

::: details 参考答案
主答案
:::

**追问链：** 第一个追问？→ 第二个追问？→ 第三个追问？

::: details 追问参考答案
**1. 第一个追问？**
第一个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
**2. 第二个追问？**
第二个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
**3. 第三个追问？**
第三个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
:::
`
  assert.equal(findFollowupSection(inlineChain).questions.length, 3)
  assert.equal(validateFollowupSection(inlineChain).failures.length, 0)
}

async function testRequireFollowupsRejectsAnyAnswerDefect() {
  const cases = [
    {
      name: '缺答案',
      content: followupChain.replace(/\n::: details 追问参考答案[\s\S]*$/, '\n'),
      pattern: /缺少追问参考答案/,
    },
    {
      name: '错号',
      content: followupChain.replace('**2. 第二个追问？**', '**3. 第二个追问？**'),
      pattern: /第 2 个追问编号与答案编号不一致/,
    },
    {
      name: '错标题',
      content: followupChain.replace(
        '**2. 第二个追问？**',
        '**2. 不同的追问？**',
      ),
      pattern: /第 2 个追问文本与答案标题不一致/,
    },
    {
      name: '过短',
      content: followupChain.replace(
        '第一个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。',
        '过短',
      ),
      pattern: /第 1 个追问答案少于 40 个有效字符/,
    },
  ]

  for (const testCase of cases) {
    const repoRoot = await mkdtemp(
      path.join(os.tmpdir(), `followup-defect-${testCase.name}-`),
    )
    const questionDir = path.join(repoRoot, 'docs/interview/questions')
    try {
      await mkdir(questionDir, { recursive: true })
      await writeExpectedQuestionFiles(questionDir)
      await writeFile(path.join(questionDir, '01-js-ts.md'), testCase.content)

      const result = await validateQuestionBank({
        repoRoot,
        min: 0,
        max: 999_999,
        requireFollowups: true,
        followupFiles: ['01-js-ts.md'],
      })
      assert.match(
        result.failures.join('\n'),
        testCase.pattern,
        testCase.name,
      )
    } finally {
      await rm(repoRoot, { recursive: true, force: true })
    }
  }
}

function testFollowupFailures() {
  const withoutDetails = singleFollowup.replace(
    /\n::: details 追问参考答案[\s\S]*$/,
    '\n',
  )
  assert.match(
    validateFollowupSection(withoutDetails).failures.join('\n'),
    /缺少追问参考答案/,
  )

  const unclosed = singleFollowup.replace(/\n:::\n$/, '\n')
  assert.match(
    validateFollowupSection(unclosed).failures.join('\n'),
    /追问参考答案容器未闭合/,
  )

  const countMismatch = followupChain.replace(
    /\n\*\*2\. 第二个追问？\*\*[\s\S]*?(?=\n:::)/,
    '',
  )
  assert.match(
    validateFollowupSection(countMismatch).failures.join('\n'),
    /追问数量 2 与答案数量 1 不一致/,
  )

  const numberMismatch = followupChain.replace(
    '**2. 第二个追问？**',
    '**3. 第二个追问？**',
  )
  assert.match(
    validateFollowupSection(numberMismatch).failures.join('\n'),
    /第 2 个追问编号与答案编号不一致/,
  )

  const textMismatch = followupChain.replace(
    '**2. 第二个追问？**',
    '**2. 不同的追问？**',
  )
  assert.match(
    validateFollowupSection(textMismatch).failures.join('\n'),
    /第 2 个追问文本与答案标题不一致/,
  )

  const empty = followupChain.replace(
    /(\*\*1\. 第一个追问？\*\*\n\n)[\s\S]*?(?=\n\*\*2\.)/,
    '$1',
  )
  assert.match(
    validateFollowupSection(empty).failures.join('\n'),
    /第 1 个追问答案少于 40 个有效字符/,
  )

  const placeholder = singleFollowup.replace(
    '单个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。',
    'TODO：稍后补充完整答案。',
  )
  assert.match(
    validateFollowupSection(placeholder).failures.join('\n'),
    /追问参考答案含占位文案/,
  )

  const tooShort = singleFollowup.replace(
    '单个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。',
    '这是一个过短的答案。',
  )
  assert.match(
    validateFollowupSection(tooShort).failures.join('\n'),
    /第 1 个追问答案少于 40 个有效字符/,
  )
}

function testFollowupParsingSkipsCodeFence() {
  const block = `### Q1. 示例

\`\`\`md
**追问：** 代码块中的伪追问？
::: details 追问参考答案
伪答案
:::
\`\`\`

**追问：** 真实追问？

::: details 追问参考答案
真实追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
:::
`
  const section = findFollowupSection(block)
  assert.equal(section.questions.length, 1)
  assert.equal(section.questions[0].text, '真实追问？')
  assert.equal(validateFollowupSection(block).failures.length, 0)
}

function testMarkdownStateMachineBoundaries() {
  const invalidBacktickFence = `### Q1. 示例

\`\`\` \`not-a-fence\`
**追问：** 真实追问？

::: details 追问参考答案
真实追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
:::
`
  assert.equal(findFollowupSection(invalidBacktickFence).questions.length, 1)

  const trailingTextDoesNotCloseFence = `### Q1. 示例

~~~md
**追问：** 第一个伪追问？
~~~ 这行带正文，不能关闭围栏
**追问：** 第二个伪追问？
~~~

**追问：** 真实追问？

::: details 追问参考答案
真实追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
:::
`
  assert.equal(
    findFollowupSection(trailingTextDoesNotCloseFence).questions[0]?.text,
    '真实追问？',
  )

  const nestedLongClosers = `### Q1. 示例

::: details 追问参考答案
外层内容
:::: info 嵌套
嵌套内容
:::::
外层继续
::::
容器外内容
`
  const details = extractFollowupAnswerDetails(nestedLongClosers)
  assert.equal(details.closed, true)
  assert.match(details.content, /嵌套内容/)
  assert.match(details.content, /外层继续/)
  assert.doesNotMatch(details.content, /容器外内容/)
}

function testFencedFakeAnswerHeadingDoesNotIncreaseCount() {
  const block = `### D1. 示例

::: details 参考答案
主答案
:::

**追问链：**
1. 第一个追问？

::: details 追问参考答案
**1. 第一个追问？**
第一个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。

~~~~md
**2. 围栏内伪答案？**
这只是代码示例，不应被识别为另一个追问答案标题。
~~~~
:::
`
  const result = validateFollowupSection(block)
  assert.equal(result.answerCount, 1)
  assert.equal(result.failures.length, 0)
}

function testFencedFakeAnswerCannotSatisfyMissingAnswer() {
  const block = `### D1. 示例

::: details 参考答案
主答案
:::

**追问链：**
1. 第一个追问？
2. 第二个追问？

::: details 追问参考答案
**1. 第一个追问？**
第一个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。

\`\`\`\`md
\`\`\`
**2. 第二个追问？**
围栏内伪答案包含足够多的字符，但四个反引号开启的围栏不能被三个反引号提前闭合，因此不得通过校验。
\`\`\`\`
:::
`
  const result = validateFollowupSection(block)
  assert.equal(result.answerCount, 1)
  assert.match(
    result.failures.join('\n'),
    /追问数量 2 与答案数量 1 不一致/,
  )
}

function testHeadingFollowupChainWithoutAnswersCountsEveryQuestion() {
  const block = `### D1. 示例

::: details 参考答案
主答案

#### 追问链
1. 第一个追问？
2. 第二个追问？
3. 第三个追问？
:::
`
  const result = validateFollowupSection(block)
  assert.equal(typeof validator.findFollowupSections, 'function')
  assert.equal(validator.findFollowupSections(block).length, 1)
  assert.equal(findFollowupSection(block).questions.length, 3)
  assert.equal(result.questionCount, 3)
  assert.equal(result.answerCount, 0)
  assert.match(result.failures.join('\n'), /缺少追问参考答案/)
}

function testBoldFollowupWithNumberedQuestionsAndAnswers() {
  const block = `### D1. 示例

**追问：**
1. 第一个追问？
2. 第二个追问？
3. 第三个追问？

::: details 追问参考答案
**1. 第一个追问？**
第一个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
**2. 第二个追问？**
第二个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
**3. 第三个追问？**
第三个追问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
:::
`
  const result = validateFollowupSection(block)
  assert.equal(result.questionCount, 3)
  assert.equal(result.answerCount, 3)
  assert.deepEqual(result.failures, [])

  const missingThirdAnswer = block.replace(
    /\n\*\*3\. 第三个追问？\*\*[\s\S]*?(?=\n:::)/,
    '',
  )
  const missingResult = validateFollowupSection(missingThirdAnswer)
  assert.equal(missingResult.questionCount, 3)
  assert.equal(missingResult.answerCount, 2)
  assert.match(
    missingResult.failures.join('\n'),
    /追问数量 3 与答案数量 2 不一致/,
  )
}

function testMultipleFollowupSectionsPairWithOwnAnswerDetails() {
  const block = `### D1. 示例

::: details 参考答案
主答案

#### 追问链
1. 标题链第一问？
2. 标题链第二问？

::: details 追问参考答案
**1. 标题链第一问？**
标题链第一问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
**2. 标题链第二问？**
标题链第二问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
:::
:::

**追问链：**
1. 粗体链第一问？
2. 粗体链第二问？

::: details 追问参考答案
**1. 粗体链第一问？**
粗体链第一问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
**2. 粗体链第二问？**
粗体链第二问的完整答案，包含明确结论、判断依据、工程示例以及实际使用时需要注意的适用边界。
:::
`
  const sections = validator.findFollowupSections(block)
  const result = validateFollowupSection(block)
  assert.equal(sections.length, 2)
  assert.equal(findFollowupSection(block).markerLine, sections[0].markerLine)
  assert.equal(result.questionCount, 4)
  assert.equal(result.answerCount, 4)
  assert.deepEqual(result.failures, [])
}

function testFollowupScannerRejectsFalseMarkers() {
  const block = `### D1. 示例

\`\`\`md
#### 追问链
1. 围栏里的伪追问？
\`\`\`

#### 追问参考答案
1. 答案标题不能成为追问？

#### 追问链答案
1. 相似标题不能成为追问？

::: details 追问参考答案
#### 追问
1. 答案容器里的伪追问？
:::

#### 追问
1. 唯一真实追问？
`
  const sections = validator.findFollowupSections(block)
  const result = validateFollowupSection(block)
  assert.equal(sections.length, 1)
  assert.equal(sections[0].questions[0]?.text, '唯一真实追问？')
  assert.equal(result.questionCount, 1)
  assert.equal(result.answerCount, 0)
}

function testParseFollowupArgs() {
  assert.deepEqual(parseFollowupArgs([]), {
    requireFollowups: false,
    followupFiles: null,
  })
  assert.deepEqual(
    parseFollowupArgs([
      '--require-followups',
      '--followup-files=01-js-ts.md, 02-vue3.md',
    ]),
    {
      requireFollowups: true,
      followupFiles: ['01-js-ts.md', '02-vue3.md'],
    },
  )
  assert.throws(
    () => parseFollowupArgs(['--followup-files=01-js-ts.md']),
    /必须与 --require-followups 同时使用/,
  )
  assert.throws(
    () =>
      parseFollowupArgs([
        '--require-followups',
        '--followup-files=99-unknown.md',
      ]),
    /未知题库文件：99-unknown\.md/,
  )
  assert.throws(
    () => parseFollowupArgs(['--require-followups', '--followup-files=']),
    /--followup-files 不能为空/,
  )
  assert.throws(
    () =>
      parseFollowupArgs([
        '--require-followups',
        '--followup-files=01-js-ts.md',
        '--followup-files=02-vue3.md',
      ]),
    /--followup-files 不能重复/,
  )
  for (const unknownArg of ['--require-followup', '--unknown', '01-js-ts.md']) {
    assert.throws(
      () => parseFollowupArgs([unknownArg]),
      new RegExp(`未知参数：${unknownArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    )
  }
}

async function testFollowupFileSelection() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'followup-selection-'))
  const questionDir = path.join(repoRoot, 'docs/interview/questions')

  try {
    await mkdir(questionDir, { recursive: true })
    await Promise.all(
      EXPECTED_QUESTION_FILES.map((file) =>
        writeFile(path.join(questionDir, file), `# ${file}\n`),
      ),
    )
    await writeFile(path.join(questionDir, '01-js-ts.md'), singleFollowup)
    await writeFile(
      path.join(questionDir, '02-vue3.md'),
      singleFollowup.replace(/\n::: details 追问参考答案[\s\S]*$/, '\n'),
    )

    const answeredSelection = await validateQuestionBank({
      repoRoot,
      min: 0,
      max: 999_999,
      requireFollowups: true,
      followupFiles: ['01-js-ts.md'],
    })
    assert.equal(
      answeredSelection.failures.length,
      0,
      answeredSelection.failures.join('\n'),
    )
    assert.match(
      answeredSelection.fileStats.find((line) =>
        line.startsWith('01-js-ts.md:'),
      ) ?? '',
      /followups=1 answered=1/,
    )

    const missingSelection = await validateQuestionBank({
      repoRoot,
      min: 0,
      max: 999_999,
      requireFollowups: true,
      followupFiles: ['02-vue3.md'],
    })
    assert.match(
      missingSelection.failures.join('\n'),
      /02-vue3\.md Q1 缺少追问参考答案/,
    )
    assert.doesNotMatch(missingSelection.failures.join('\n'), /01-js-ts\.md/)
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
}

async function testFollowupPlaceholderDiagnosticIsNotDuplicated() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'followup-placeholder-'))
  const questionDir = path.join(repoRoot, 'docs/interview/questions')

  try {
    await mkdir(questionDir, { recursive: true })
    await Promise.all(
      EXPECTED_QUESTION_FILES.map((file) =>
        writeFile(path.join(questionDir, file), `# ${file}\n`),
      ),
    )
    await writeFile(
      path.join(questionDir, '01-js-ts.md'),
      `${singleFollowup}
**追问：** 第二个追问如何回答？

::: details 追问参考答案
TODO：稍后补充完整答案。
:::
`,
    )

    const result = await validateQuestionBank({
      repoRoot,
      min: 0,
      max: 999_999,
      requireFollowups: true,
      followupFiles: ['01-js-ts.md'],
    })
    const placeholderFailures = result.failures.filter((failure) =>
      failure.includes('占位文案'),
    )
    assert.deepEqual(placeholderFailures, [
      '01-js-ts.md Q1 追问参考答案含占位文案',
    ])
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
}

async function testApiRejectsEmptyFollowupFiles() {
  await assert.rejects(
    () =>
      validateQuestionBank({
        requireFollowups: true,
        followupFiles: [],
      }),
    /followupFiles 不能为空/,
  )
}

function testFollowupDetailsExposeExactRangeWithContentCollision() {
  const repeatedContent = 'TODO：这段内容在主答案与追问答案中完全相同。'
  const block = `### Q1. 示例

::: details 参考答案
${repeatedContent}
:::

**追问：** 如何处理内容碰撞？

::: details 追问参考答案
${repeatedContent}
:::
`
  const details = extractFollowupAnswerDetails(block)
  const expectedStart = block.indexOf('::: details 追问参考答案')
  assert.equal(details.startIndex, expectedStart)
  assert.equal(
    block.slice(details.startIndex, details.endIndex),
    `::: details 追问参考答案
${repeatedContent}
:::`,
  )
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

async function writeExpectedQuestionFiles(questionDir, contents = {}) {
  await Promise.all(
    EXPECTED_QUESTION_FILES.map((file) =>
      writeFile(path.join(questionDir, file), contents[file] ?? `# ${file}\n`),
    ),
  )
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

    await writeExpectedQuestionFiles(questionDir)
    await writeFile(path.join(questionDir, '00-fake.md'), '# 伪题库\n')
    await writeFile(path.join(questionDir, '23-extra.md'), '# 额外题库\n')

    const extraOnly = await validateQuestionBank({
      repoRoot,
      min: 0,
      max: 999_999,
    })
    const extraMessage = extraOnly.failures.join('\n')
    assert.match(extraMessage, /题库文件集合不符合预期/)
    assert.match(extraMessage, /额外：00-fake\.md、23-extra\.md/)
    assert.doesNotMatch(extraMessage, /缺失：/)
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
}

async function testRejectsMissingAnyExpectedQuestionFile() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'question-bank-missing-'))
  const questionDir = path.join(repoRoot, 'docs/interview/questions')

  try {
    await mkdir(questionDir, { recursive: true })
    await writeExpectedQuestionFiles(questionDir)

    for (const missingFile of EXPECTED_QUESTION_FILES) {
      const target = path.join(questionDir, missingFile)
      await rm(target)

      const { failures } = await validateQuestionBank({
        repoRoot,
        min: 0,
        max: 999_999,
      })
      const message = failures.join('\n')
      assert.match(message, /题库文件集合不符合预期/)
      assert.match(
        message,
        new RegExp(`缺失：${missingFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
      )
      assert.doesNotMatch(message, /额外：/)

      await writeFile(target, `# ${missingFile}\n`)
    }
  } finally {
    await rm(repoRoot, { recursive: true, force: true })
  }
}

async function testQuestionFileSetIgnoresOrder() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), 'question-bank-order-'))
  const questionDir = path.join(repoRoot, 'docs/interview/questions')

  try {
    await mkdir(questionDir, { recursive: true })
    for (const file of [...EXPECTED_QUESTION_FILES].reverse()) {
      await writeFile(path.join(questionDir, file), `# ${file}\n`)
    }

    const { failures } = await validateQuestionBank({
      repoRoot,
      min: 0,
      max: 999_999,
    })
    assert.equal(
      failures.filter((failure) => failure.includes('题库文件集合不符合预期'))
        .length,
      0,
      failures.join('\n'),
    )
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

async function testExact630PassesAndOffByOneFails() {
  const defaults = parseQuestionLimits({})
  assert.deepEqual(defaults, { min: 620, max: 640, expected: null })

  const baseline = await validateQuestionBank({
    min: defaults.min,
    max: defaults.max,
  })
  assert.equal(baseline.total, 630)
  assert.equal(baseline.failures.length, 0, baseline.failures.join('\n'))

  const matching = await validateQuestionBank({
    min: defaults.min,
    max: defaults.max,
    expected: 630,
  })
  assert.equal(matching.failures.length, 0, matching.failures.join('\n'))

  for (const expected of [629, 631]) {
    const mismatching = await validateQuestionBank({
      min: defaults.min,
      max: defaults.max,
      expected,
    })
    assert.match(
      mismatching.failures.join('\n'),
      new RegExp(`总题量 630 不等于精确要求 ${expected}`),
    )
  }
}

testParseLimit()
testParseQuestionLimitsDefaults()
testParseQuestionLimits()
testFindQuestionHeadingsSkipsCodeFence()
testExtractAnswerDetails()
testFollowupParsingAndValidation()
testInlineFollowupChain()
testFollowupFailures()
testFollowupParsingSkipsCodeFence()
testMarkdownStateMachineBoundaries()
testFencedFakeAnswerCannotSatisfyMissingAnswer()
testFencedFakeAnswerHeadingDoesNotIncreaseCount()
testHeadingFollowupChainWithoutAnswersCountsEveryQuestion()
testBoldFollowupWithNumberedQuestionsAndAnswers()
testMultipleFollowupSectionsPairWithOwnAnswerDetails()
testFollowupScannerRejectsFalseMarkers()
testParseFollowupArgs()
testHasDeepSection()
testInvalidEnvExitsOne()
await testWorksFromNonRepoRoot()
await testRejectsWrongQuestionFileSet()
await testRejectsMissingAnyExpectedQuestionFile()
await testQuestionFileSetIgnoresOrder()
await testExactQuestionTotal()
await testExact630PassesAndOffByOneFails()
await testFollowupFileSelection()
await testFollowupPlaceholderDiagnosticIsNotDuplicated()
testFollowupDetailsExposeExactRangeWithContentCollision()
await testApiRejectsEmptyFollowupFiles()
await testRequireFollowupsRejectsAnyAnswerDefect()

console.log('validate-question-bank 边界自测通过（30 组）')
