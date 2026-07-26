<script setup lang="ts">
import type { TaskBoardItem } from '@/types/taskboard'

defineProps<{
  task: TaskBoardItem
  selected: boolean
  dragging: boolean
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
}>()
</script>

<template>
  <!-- Tags row (top, plain text) -->
  <div v-if="task.tags.length > 0" class="taskboard-card__tags">
    <span
      v-for="tag in task.tags"
      :key="tag"
      class="taskboard-card__tag"
    >{{ tag }}</span>
  </div>

  <!-- Title + Priority row -->
  <div class="taskboard-card__header">
    <span class="taskboard-card__title">{{ task.title }}</span>
    <span class="taskboard-card__priority" :class="'priority--' + task.priority">
      {{ task.priority }}
    </span>
  </div>

  <!-- Footer row -->
  <div class="taskboard-card__footer">
    <div class="taskboard-card__progress" style="flex:1">
      <div class="taskboard-card__progress-bar">
        <div
          :style="{
            width: task.progress + '%',
            height: '100%',
            background: task.progress === 100 ? '#22c55e' : '#3b82f6',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }"
        />
      </div>
    </div>
    <span
      v-if="task.dueDate"
      class="taskboard-card__due-date"
      :class="{ 'taskboard-card__due-date--overdue': new Date(task.dueDate) < new Date() }"
    >{{ task.dueDate }}</span>
    <div v-if="task.assignees && task.assignees.length > 0" class="taskboard-card__assignees">
      <div
        v-for="(a, i) in task.assignees.slice(0, 3)"
        :key="a.name"
        class="taskboard-card__assignee-avatar"
        :style="{ background: getAvatarColor(a.name), zIndex: task.assignees.length - i }"
        :title="a.name"
      >
        {{ getInitials(a.name) }}
      </div>
      <div
        v-if="task.assignees.length > 3"
        class="taskboard-card__assignee-overflow"
        :style="{ zIndex: 0 }"
      >
        +{{ task.assignees.length - 3 }}
      </div>
    </div>
  </div>
</template>
