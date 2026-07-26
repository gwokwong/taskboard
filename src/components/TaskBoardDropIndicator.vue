<script setup lang="ts">
defineProps<{
  active: boolean
}>()
</script>

<template>
  <div class="taskboard-drop-indicator" :class="{ 'taskboard-drop-indicator--active': active }" />
</template>
