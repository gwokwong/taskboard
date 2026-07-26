<script setup lang="ts">
import type { TaskBoardSwimlane } from '@/types/taskboard'

defineProps<{
  swimlanes: TaskBoardSwimlane[]
}>()
</script>

<template>
  <div class="taskboard-swimlane">
    <div v-if="swimlanes.length > 0" style="display:flex;flex-direction:column;gap:16px;width:100%;">
      <div
        v-for="swimlane in swimlanes"
        :key="swimlane.id"
        class="taskboard-swimlane-row"
      >
        <div class="taskboard-swimlane-header">{{ swimlane.label }}</div>
        <slot :name="swimlane.id" />
      </div>
    </div>
    <slot v-else name="default" />
  </div>
</template>
