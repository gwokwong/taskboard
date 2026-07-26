<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { NButton, NInput, NSelect, NDropdown } from 'naive-ui'
import UserSelect from './UserSelect.vue'
import type { TaskBoardColumn, TaskBoardDensity, TaskBoardItem } from '@/types/taskboard'

interface TaskBoardContentProps {
  columns: TaskBoardColumn[]
  searchQuery: string
  density: TaskBoardDensity
  tasksCount: number
  tasks: TaskBoardItem[]
  isArchived?: boolean
  columnDragState?: { draggingColumnId: string | null; dragOverColumnIndex: number; dragOverSide: 'left' | 'right' | null }
  assigneeOptions?: { label: string; value: string }[]
  toolbarAssignees?: string[]
}

const props = defineProps<TaskBoardContentProps>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'change-density': [density: TaskBoardDensity]
  'download-json': []
  'download-csv': []
  'undo': []
  'redo': []
  'update:toolbarAssignees': [value: string[]]
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

const settingsOptions = computed(() => [
  { label: '项目设置', key: 'settings' },
  { label: props.isArchived ? '取消归档' : '项目归档', key: 'archive' },
  { type: 'divider' as const, key: 'd1' },
  { label: '项目删除', key: 'delete' },
])

const safeToolbarAssignees = computed(() => props.toolbarAssignees ?? [])

function handleSettingsSelect(key: string) {
  if (key === 'settings') emit('open-project-settings')
  else if (key === 'archive') {
    if (props.isArchived) emit('unarchive-project')
    else emit('archive-project')
  }
  else if (key === 'delete') emit('delete-project')
}

// --- Column drop floating indicator ---
const dropIndicatorLeft = ref(0)

watch(() => [props.columnDragState?.dragOverColumnIndex, props.columnDragState?.dragOverSide], async ([idx, side]) => {
  if (idx === null || idx === undefined || idx === -1) return
  if (!side) return
  await nextTick()
  const el = document.querySelector(`[data-column-index="${idx}"]`) as HTMLElement | null
  if (!el) return
  const container = el.closest('.taskboard-columns') as HTMLElement | null
  if (!container) return
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  if (side === 'left') {
    dropIndicatorLeft.value = elRect.left - containerRect.left - 2
  } else {
    dropIndicatorLeft.value = elRect.right - containerRect.left + 2
  }
})
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

      <UserSelect
        v-model="safeToolbarAssignees"
        :options="assigneeOptions ?? []"
        title="选择参与人"
        placeholder="搜索"
        @update:model-value="emit('update:toolbarAssignees', $event)"
      />

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
        v-if="props.columnDragState?.dragOverColumnIndex !== null && props.columnDragState?.dragOverColumnIndex !== undefined && props.columnDragState?.draggingColumnId"
        class="column-drop-indicator"
        :style="{ left: dropIndicatorLeft + 'px' }"
      />
      <div
        v-if="!props.isArchived"
        class="taskboard-column taskboard-add-column"
        @click="emit('add-column')"
      >
        <div class="taskboard-column__header">
          <span class="taskboard-add-column__icon">+</span>
          <span class="taskboard-add-column__text">添加列</span>
        </div>
      </div>
    </div>
  </div>
</template>
