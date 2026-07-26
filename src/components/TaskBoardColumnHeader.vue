<script setup lang="ts">
import type { TaskBoardColumn } from '@/types/taskboard'

defineProps<{
  column: TaskBoardColumn
  taskCount: number
  isWipExceeded: boolean
}>()

const emit = defineEmits<{
  'toggle-collapse': []
  'add-task': []
}>()
</script>

<template>
  <div class="taskboard-column-header">
    <span class="taskboard-column-header__label">{{ column.label }}</span>
    <span class="taskboard-column-header__count">{{ taskCount }}</span>
    <span
      v-if="column.wipLimit"
      class="taskboard-column-header__wip"
      :class="{ 'taskboard-column-header__wip--exceeded': isWipExceeded }"
    >
      / {{ column.wipLimit }}
    </span>
    <div class="taskboard-column-header__actions">
      <button
        class="tb-btn-icon"
        @click="emit('add-task')"
        title="Add card"
      >+</button>
      <button
        class="tb-btn-icon"
        @click="emit('toggle-collapse')"
        title="Toggle collapse"
      >{{ column.collapsed ? '▶' : '▼' }}</button>
    </div>
  </div>
</template>

<style scoped>
.tb-btn-icon {
  height: 26px;
  width: 26px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  line-height: 1;
}
.tb-btn-icon:hover {
  background: #f3f4f6;
  color: #374151;
}
</style>
