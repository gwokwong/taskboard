<script setup lang="ts">
import { computed } from 'vue'
import type { TaskBoardDensity } from '@/types/taskboard'

interface TaskBoardRootProps {
  density?: TaskBoardDensity
}

const props = withDefaults(
  defineProps<TaskBoardRootProps>(),
  { density: 'standard' }
)

const rootClass = computed(() => [
  'taskboard-root',
  `taskboard-root--density-${props.density}`,
])
</script>

<template>
  <div :class="rootClass">
    <slot />
  </div>
</template>

<style scoped>
/* Import global styles - scoped component just acts as wrapper */
</style>
