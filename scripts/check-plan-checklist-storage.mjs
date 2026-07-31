/**
 * 从 PlanChecklist.vue 源码校验 localStorage 键名约定（无浏览器依赖）
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sfcPath = join(root, 'docs/.vitepress/theme/components/PlanChecklist.vue')
const source = readFileSync(sfcPath, 'utf8')

const keyPattern = /mianshi-plan:\$\{props\.planId\}/
if (!keyPattern.test(source)) {
  console.error('未找到 storageKey 模板 `mianshi-plan:${props.planId}`')
  process.exit(1)
}

if (!source.includes('JSON.stringify(state)')) {
  console.error('未找到 JSON 序列化写入 localStorage')
  process.exit(1)
}

if (!source.includes('onMounted')) {
  console.error('未在 onMounted 中初始化，SSR 可能访问 localStorage')
  process.exit(1)
}

const samplePlanId = '14-day'
const expectedKey = `mianshi-plan:${samplePlanId}`
console.log('storage key 样例:', expectedKey)
console.log('PlanChecklist localStorage 约定校验通过')
