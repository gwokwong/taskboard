<script setup lang="ts">
import type { TaskBoardItem } from '@/types/taskboard'

defineProps<{
  task: TaskBoardItem | null
  visible: boolean
  mouseX: number
  mouseY: number
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && task"
      class="taskboard-drag-preview"
      :style="{ left: mouseX + 10 + 'px', top: mouseY + 10 + 'px' }"
    >
      <div class="taskboard-card__header">
        <span class="taskboard-card__title">{{ task.title }}</span>
        <span class="taskboard-card__priority" :class="'priority--' + task.priority">
          {{ task.priority }}
        </span>
      </div>
      <div v-if="task.tags.length > 0" class="taskboard-card__tags">
        <span v-for="tag in task.tags" :key="tag" class="taskboard-card__tag">{{ tag }}</span>
      </div>
    </div>
  </Teleport>
</template>
