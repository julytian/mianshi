<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

export interface PlanChecklistItem {
  id: string
  label: string
}

const props = defineProps<{
  planId: string
  items: PlanChecklistItem[]
}>()

const storageKey = computed(() => `mianshi-plan:${props.planId}`)

const checked = ref<Record<string, boolean>>({})
const hydrated = ref(false)

function readStorage(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey.value)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>
    }
  } catch {
    /* 损坏或非 JSON 时忽略 */
  }
  return {}
}

function writeStorage(state: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey.value, JSON.stringify(state))
}

function mergeWithItems(stored: Record<string, boolean>): Record<string, boolean> {
  const next: Record<string, boolean> = {}
  for (const item of props.items) {
    next[item.id] = Boolean(stored[item.id])
  }
  return next
}

onMounted(() => {
  checked.value = mergeWithItems(readStorage())
  hydrated.value = true
})

watch(
  () => props.planId,
  () => {
    if (!hydrated.value) return
    checked.value = mergeWithItems(readStorage())
  },
)

watch(
  () => props.items,
  () => {
    if (!hydrated.value) return
    checked.value = mergeWithItems(readStorage())
  },
  { deep: true },
)

watch(
  checked,
  (state) => {
    if (!hydrated.value) return
    writeStorage(state)
  },
  { deep: true },
)

function toggleItem(id: string, value: boolean) {
  checked.value = { ...checked.value, [id]: value }
}

function clearProgress() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(storageKey.value)
  checked.value = mergeWithItems({})
}

const completedCount = computed(() =>
  props.items.filter((item) => checked.value[item.id]).length,
)
</script>

<template>
  <div class="plan-checklist">
    <p v-if="hydrated && items.length" class="plan-checklist__summary">
      已完成 {{ completedCount }} / {{ items.length }}
    </p>
    <ul class="plan-checklist__list">
      <li v-for="item in items" :key="item.id" class="plan-checklist__item">
        <label class="plan-checklist__label">
          <input
            type="checkbox"
            class="plan-checklist__checkbox"
            :checked="checked[item.id]"
            :disabled="!hydrated"
            @change="toggleItem(item.id, ($event.target as HTMLInputElement).checked)"
          />
          <span :class="{ 'plan-checklist__text--done': checked[item.id] }">
            {{ item.label }}
          </span>
        </label>
      </li>
    </ul>
    <button
      type="button"
      class="plan-checklist__clear"
      :disabled="!hydrated"
      @click="clearProgress"
    >
      清除本计划进度
    </button>
  </div>
</template>

<style scoped>
.plan-checklist {
  margin: 1rem 0 1.5rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.plan-checklist__summary {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.plan-checklist__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.plan-checklist__item + .plan-checklist__item {
  margin-top: 0.5rem;
}

.plan-checklist__label {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
  line-height: 1.6;
  color: var(--vp-c-text-1);
}

.plan-checklist__checkbox {
  margin-top: 0.35rem;
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  accent-color: var(--vp-c-brand-1);
  cursor: pointer;
}

.plan-checklist__text--done {
  color: var(--vp-c-text-2);
  text-decoration: line-through;
}

.plan-checklist__clear {
  margin-top: 1rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
}

.plan-checklist__clear:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-soft);
  background: var(--vp-c-bg);
}

.plan-checklist__clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
