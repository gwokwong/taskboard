<script setup lang="ts">
import { computed } from 'vue'
import type { TaskBoardColumn, TaskBoardItem, TaskBoardDragState } from '@/types/taskboard'

const props = defineProps<{
  column: TaskBoardColumn
  tasks: TaskBoardItem[]
  dragState: TaskBoardDragState
  columnDragState: { draggingColumnId: string | null; dragOverColumnIndex: number }
  selectedTaskIds: Set<string>
  isWipExceeded: boolean
  columnIndex: number
  getAvatarColor: (name: string) => string
  getInitials: (name: string) => string
  isArchived?: boolean
}>()

const emit = defineEmits<{
  'toggle-collapse': [columnId: string]
  'add-task': [columnId: string]
  'drag-start': [taskId: string, columnId: string]
  'drag-over': [columnId: string, index: number]
  'drop': [columnId: string, index: number]
  'drag-end': []
  'select': [taskId: string, multi: boolean]
  'context-menu': [e: MouseEvent, task: TaskBoardItem]
  'edit': [task: TaskBoardItem]
  'edit-column': [column: TaskBoardColumn]
  'column-drag-start': [columnId: string]
  'column-drag-over': [index: number, e: DragEvent]
  'column-drop': [index: number]
  'column-drag-end': []
}>()

const columnClass = computed(() => [
  'taskboard-column',
  `taskboard-column--status-${props.column.statusType}`,
  {
    'taskboard-column--collapsed': props.column.collapsed,
    'taskboard-column--wip-exceeded': props.isWipExceeded,
    'taskboard-column--drop-target': props.columnDragState.draggingColumnId &&
      props.columnDragState.dragOverColumnIndex === props.columnIndex &&
      props.columnDragState.draggingColumnId !== props.column.id,
    'taskboard-column--dragging-column': props.columnDragState.draggingColumnId === props.column.id,
  },
])

const wipRatio = computed(() => {
  if (!props.column.wipLimit) return 0
  return props.tasks.length / props.column.wipLimit
})

function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  emit('drag-over', props.column.id, index)
}

function handleDrop(e: DragEvent, index: number) {
  e.preventDefault()
  emit('drop', props.column.id, index)
}

function handleDragLeave() {
  // Could clear indicator here
}

function handleColumnDrop(e: DragEvent) {
  if (props.tasks.length === 0) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    emit('drop', props.column.id, 0)
  }
}

function handleColumnDragOver(e: DragEvent) {
  if (props.tasks.length === 0) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }
}
</script>

<template>
  <div
    :class="columnClass"
    @dragover="handleColumnDragOver"
    @drop="handleColumnDrop"
    @dragleave="handleDragLeave"
  >
    <!-- Column Header -->
    <div
      class="taskboard-column-header"
      :style="column.color ? { '--col-color': column.color, cursor: props.isArchived ? 'default' : undefined } : {}"
    >
      <span
        class="taskboard-column-header__label"
        @click.stop="!props.isArchived && emit('edit-column', column)"
      >
        {{ column.label }}
      </span>
      <span class="taskboard-column-header__count">{{ tasks.length }}</span>
      <span
        v-if="column.wipLimit"
        class="taskboard-column-header__wip"
        :class="{ 'taskboard-column-header__wip--exceeded': isWipExceeded }"
      >
        / {{ column.wipLimit }}
      </span>
      <div class="taskboard-column-header__actions">
        <button
          v-if="!column.collapsed && !props.isArchived"
          class="taskboard-column-header__add-btn"
          @click="emit('add-task', column.id)"
          title="Add card"
        >
          +
        </button>
        <button
          class="taskboard-column-header__toggle-btn"
          @click="emit('toggle-collapse', column.id)"
          title="Toggle collapse"
        >
          {{ column.collapsed ? '&#9654;' : '&#9660;' }}
        </button>
      </div>
    </div>

    <!-- Column Body -->
    <div v-if="!column.collapsed" class="taskboard-column-body">
      <!-- Empty state -->
      <div v-if="tasks.length === 0" class="taskboard-column-empty">
        No tasks yet
      </div>

      <!-- Drop indicator top -->
      <div
        v-if="dragState.dragOverColumnId === column.id && dragState.dragOverIndex === 0"
        class="taskboard-drop-indicator taskboard-drop-indicator--active"
      />

      <template v-for="(task, idx) in tasks" :key="task.id">
        <!-- Card -->
        <div
          class="taskboard-card"
          :class="{
            'taskboard-card--selected': selectedTaskIds.has(task.id),
            'taskboard-card--dragging': dragState.draggingTaskId === task.id,
          }"
          :draggable="!props.isArchived ? 'true' : 'false'"
          @dragstart="emit('drag-start', task.id, column.id)"
          @dragend="emit('drag-end')"
          @dragover.prevent="(e) => handleDragOver(e, idx)"
          @drop="(e) => handleDrop(e, idx)"
          @click="emit('edit', task)"
          @contextmenu="emit('context-menu', $event, task)"
        >
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
              <div
                style="height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden"
              >
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
              :class="{
                'taskboard-card__due-date--overdue': new Date(task.dueDate) < new Date(),
              }"
            >
              {{ task.dueDate }}
            </span>

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
        </div>

        <!-- Drop indicator after this card -->
        <div
          v-if="dragState.dragOverColumnId === column.id && dragState.dragOverIndex === idx + 1"
          class="taskboard-drop-indicator taskboard-drop-indicator--active"
        />
      </template>

      <!-- Add card button at bottom -->
      <button
        v-if="!props.isArchived"
        class="taskboard-column-add-btn"
        @click="emit('add-task', column.id)"
      >
        + Add card
      </button>
    </div>
  </div>
</template>
