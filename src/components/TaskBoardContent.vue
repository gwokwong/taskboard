<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInput, NSelect, NDropdown } from 'naive-ui'
import type { TaskBoardColumn, TaskBoardDensity, TaskBoardItem } from '@/types/taskboard'

interface TaskBoardContentProps {
  columns: TaskBoardColumn[]
  searchQuery: string
  density: TaskBoardDensity
  tasksCount: number
  tasks: TaskBoardItem[]
  isArchived?: boolean
}

const props = defineProps<TaskBoardContentProps>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'change-density': [density: TaskBoardDensity]
  'download-json': []
  'download-csv': []
  'undo': []
  'redo': []
  'manage-assignees': []
  'open-project-settings': []
  'archive-project': []
  'unarchive-project': []
  'delete-project': []
  'add-column': []
}>()

const densityOptions = [
  { label: 'Compact', value: 'compact' },
  { label: 'Standard', value: 'standard' },
  { label: 'Comfortable', value: 'comfortable' },
]

const exportMenuOptions = [
  { label: 'Export JSON', key: 'json' },
  { label: 'Export CSV', key: 'csv' },
]

const avatarColors = ['#7c3aed', '#059669', '#ea580c', '#2563eb', '#db2777']

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

const uniqueAssignees = computed(() => {
  const seen = new Set<string>()
  return props.tasks
    .flatMap(t => t.assignees || [])
    .filter(a => {
      if (seen.has(a.name)) return false
      seen.add(a.name)
      return true
    })
})

const settingsOptions = computed(() => [
  { label: '项目设置', key: 'settings' },
  { label: props.isArchived ? '取消归档' : '项目归档', key: 'archive' },
  { type: 'divider' as const, key: 'd1' },
  { label: '项目删除', key: 'delete' },
])

function handleSettingsSelect(key: string) {
  if (key === 'settings') emit('open-project-settings')
  else if (key === 'archive') {
    if (props.isArchived) emit('unarchive-project')
    else emit('archive-project')
  }
  else if (key === 'delete') emit('delete-project')
}
</script>

<template>
  <div class="taskboard-toolbar">
    <span class="taskboard-toolbar__title">Product Roadmap</span>

    <div class="taskboard-toolbar__right">
      <NInput
        :value="searchQuery"
        @update:value="emit('update:searchQuery', $event)"
        placeholder="Search tasks..."
        clearable
        size="small"
        style="width: 220px"
      />

      <NSelect
        :value="density"
        @update:value="(v: TaskBoardDensity) => emit('change-density', v)"
        :options="densityOptions"
        size="small"
        style="width: 130px"
      />

      <NButton size="small" @click="emit('undo')" quaternary>
        Undo
      </NButton>
      <NButton size="small" @click="emit('redo')" quaternary>
        Redo
      </NButton>

      <NDropdown
        trigger="click"
        :options="exportMenuOptions"
        @select="(key: string) => key === 'json' ? emit('download-json') : emit('download-csv')"
      >
        <NButton size="small" quaternary>Export</NButton>
      </NDropdown>

      <div
        class="taskboard-toolbar__avatar-group"
        @click="emit('manage-assignees')"
        title="管理参与人"
      >
        <div class="avatar-stack">
          <div
            v-for="(assignee, i) in uniqueAssignees.slice(0, 5)"
            :key="assignee.name"
            class="avatar-stack__item"
            :style="{
              backgroundColor: getAvatarColor(assignee.name),
              zIndex: 5 - i,
              marginLeft: i > 0 ? '-10px' : '0'
            }"
            :title="assignee.name"
          >
            {{ getInitials(assignee.name) }}
          </div>
          <div
            v-if="uniqueAssignees.length > 5"
            class="avatar-stack__item avatar-stack__overflow"
            style="marginLeft: '-10px'; zIndex: 0"
          >
            +{{ uniqueAssignees.length - 5 }}
          </div>
        </div>
      </div>

      <NDropdown
        trigger="click"
        placement="bottom-end"
        :options="settingsOptions"
        @select="handleSettingsSelect"
      >
        <button class="toolbar-settings-btn" title="设置">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </NDropdown>
    </div>
  </div>

  <div v-if="props.isArchived" class="taskboard-archive-banner">
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M4 4H16M4 4V16C4 17.1046 4.89543 18 6 18H14C15.1046 18 16 17.1046 16 16V4M4 4L6.5 2H13.5L16 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>此项目已归档，内容为只读状态。</span>
    <button class="taskboard-archive-banner__unarchive" @click="emit('unarchive-project')">取消归档</button>
  </div>

  <div class="taskboard-content">
    <div class="taskboard-columns">
      <slot />
      <div
        v-if="!props.isArchived"
        class="taskboard-add-column-btn"
        @click="emit('add-column')"
      >
        <div class="taskboard-add-column-btn__inner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>添加列</span>
        </div>
      </div>
    </div>
  </div>
</template>
