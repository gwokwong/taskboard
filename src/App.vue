<script setup lang="ts">
import { h, onMounted, onUnmounted, ref, computed } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NSpace,
  NInputNumber,
} from 'naive-ui'
import TaskBoardRoot from './components/TaskBoardRoot.vue'
import TaskBoardContent from './components/TaskBoardContent.vue'
import TaskBoardColumnComp from './components/TaskBoardColumn.vue'
import { useTaskBoard } from './composables/useTaskBoard'
import type {
  TaskBoardItem,
  TaskBoardAssignee,
  TaskBoardColumn as TaskBoardColumnType,
  TaskBoardPriority,
  TaskBoardDensity,
} from './types/taskboard'
import './styles/taskboard.css'

// --- Default Demo Data ---
const defaultColumns: TaskBoardColumnType[] = [
  { id: 'ideas', label: 'Ideas', statusType: 'todo', wipLimit: 10, collapsed: false, order: 0 },
  { id: 'discovery', label: 'Discovery', statusType: 'todo', wipLimit: 8, collapsed: false, order: 1 },
  { id: 'ready', label: 'Ready', statusType: 'todo', wipLimit: 8, collapsed: false, order: 2 },
  { id: 'building', label: 'Building', statusType: 'in-progress', wipLimit: 5, collapsed: false, order: 3 },
  { id: 'blocked', label: 'Blocked', statusType: 'blocked', collapsed: false, order: 4 },
  { id: 'validation', label: 'Validation', statusType: 'done', wipLimit: 8, collapsed: false, order: 5 },
  { id: 'shipped', label: 'Shipped', statusType: 'done', collapsed: false, order: 6 },
]

const allAssignees = ref<TaskBoardAssignee[]>([
  { name: 'Alice Chen' },
  { name: 'Bob Wang' },
  { name: 'Carol Liu' },
  { name: 'Dave Zhang' },
  { name: 'Eve Wu' },
  { name: 'Frank Li' },
  { name: 'Grace Zhao' },
  { name: 'Henry Xu' },
  { name: 'Ivy Sun' },
  { name: 'Jack Ma' },
])

let cachedOptions: { label: string; value: string }[] = []
const allAssigneeOptions = computed(() => {
  const names = new Set<string>()
  allAssignees.value.forEach(a => names.add(a.name))
  board.tasks.value.forEach(t => t.assignees.forEach(a => names.add(a.name)))
  const newOptions = Array.from(names).map(name => ({ label: name, value: name }))
  // 只有内容变化时才更新引用
  const newKeys = newOptions.map(o => o.value).sort().join(',')
  const oldKeys = cachedOptions.map(o => o.value).sort().join(',')
  if (newKeys !== oldKeys) {
    cachedOptions = newOptions
  }
  console.log('allAssigneeOptions updated:', JSON.stringify(cachedOptions))
  return cachedOptions
})

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

// --- NSelect custom render for assignee avatars ---
function renderAssigneeTag({ option, handleClose }: any) {
  const name = String(option.label ?? option.value ?? '')
  return h('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      height: '22px',
      padding: '0 6px 0 3px',
      margin: '2px',
      background: '#f3f4f6',
      borderRadius: '11px',
      fontSize: '12px',
    }
  }, [
    h('span', {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: getAvatarColor(name),
        color: '#fff',
        fontSize: '9px',
        fontWeight: 700,
        flexShrink: '0',
        lineHeight: '1',
      }
    }, getInitials(name)),
    h('span', { style: { color: '#374151' } }, name),
    h('span', {
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        handleClose()
      },
      style: {
        cursor: 'pointer',
        color: '#9ca3af',
        fontSize: '13px',
        marginLeft: '1px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
      }
    }, '\u00d7')
  ])
}

function renderAssigneeOption({ option }: any) {
  const name = String(option.label ?? option.value ?? '')
  return h('div', {
    style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', pointerEvents: 'none' }
  }, [
    h('div', {
      style: {
        width: '24px', height: '24px', borderRadius: '50%',
        background: getAvatarColor(name),
        color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '11px', fontWeight: 600,
        flexShrink: 0
      }
    }, getInitials(name)),
    h('span', { style: { fontSize: '14px' } }, name)
  ])
}

const defaultTasks: TaskBoardItem[] = [
  {
    id: 't1', title: 'AI-powered task prioritization', description: 'Implement ML-based auto-prioritization for incoming tasks.',
    priority: 'P2', tags: ['AI', 'Backend'], assignees: [{ name: 'Alice Chen' }, { name: 'Bob Wang' }], progress: 70,
    dueDate: '2026-08-15', columnId: 'building', order: 0,
  },
  {
    id: 't2', title: 'Timeline view for project planning', description: 'Add Gantt-like timeline view for project roadmaps.',
    priority: 'P1', tags: ['UI', 'Frontend'], assignees: [{ name: 'Bob Wang' }], progress: 35,
    dueDate: '2026-08-01', columnId: 'building', order: 1,
  },
  {
    id: 't3', title: 'Mobile app notifications', description: 'Push notifications for task assignments and deadline reminders.',
    priority: 'P1', tags: ['Mobile', 'Backend'], assignees: [{ name: 'Carol Liu' }, { name: 'Frank Li' }], progress: 90,
    dueDate: '2026-07-30', columnId: 'validation', order: 0,
  },
  {
    id: 't4', title: 'Dark mode support', description: 'Add system-wide dark mode theme with automatic detection.',
    priority: 'P3', tags: ['UI', 'Accessibility'], assignees: [{ name: 'Dave Zhang' }], progress: 15,
    dueDate: '2026-09-01', columnId: 'building', order: 2,
  },
  {
    id: 't5', title: 'API rate limiting', description: 'Implement token bucket rate limiting for public API.',
    priority: 'P2', tags: ['Backend', 'Security'], assignees: [{ name: 'Eve Wu' }], progress: 100,
    dueDate: '2026-07-20', columnId: 'shipped', order: 0,
  },
  {
    id: 't6', title: 'User onboarding flow redesign', description: 'Revamp the new user signup and onboarding experience.',
    priority: 'P2', tags: ['UX', 'Frontend'], assignees: [{ name: 'Frank Li' }], progress: 80,
    dueDate: '2026-08-10', columnId: 'validation', order: 1,
  },
  {
    id: 't7', title: 'SSO integration with SAML', description: 'Enterprise single sign-on support via SAML 2.0 protocol.',
    priority: 'P1', tags: ['Enterprise', 'Security'], assignees: [{ name: 'Grace Zhao' }], progress: 0,
    dueDate: '2026-10-01', columnId: 'blocked', order: 0,
  },
  {
    id: 't8', title: 'Bulk CSV import/export', description: 'Allow bulk operations with CSV files for tasks and projects.',
    priority: 'P3', tags: ['Import', 'Feature'], assignees: [{ name: 'Henry Xu' }], progress: 25,
    dueDate: '2026-09-15', columnId: 'ready', order: 0,
  },
  {
    id: 't9', title: 'Custom workflow automation', description: 'Rule-based automation engine for task transitions.',
    priority: 'P2', tags: ['Automation', 'Backend'], assignees: [{ name: 'Ivy Sun' }], progress: 0,
    dueDate: '', columnId: 'discovery', order: 0,
  },
  {
    id: 't10', title: 'Performance dashboard', description: 'Real-time analytics dashboard for team performance metrics.',
    priority: 'P2', tags: ['Analytics', 'Frontend'], assignees: [{ name: 'Jack Ma' }], progress: 0,
    dueDate: '', columnId: 'discovery', order: 1,
  },
  {
    id: 't11', title: 'Multi-language support (i18n)', description: 'Internationalization framework for 10+ languages.',
    priority: 'P3', tags: ['i18n', 'Frontend'], assignees: [], progress: 0,
    dueDate: '', columnId: 'ideas', order: 0,
  },
  {
    id: 't12', title: 'GitHub integration', description: 'Two-way sync with GitHub issues and PRs.',
    priority: 'P2', tags: ['Integration', 'Backend'], assignees: [{ name: 'Alice Chen' }], progress: 0,
    dueDate: '', columnId: 'ideas', order: 1,
  },
  {
    id: 't13', title: 'Calendar sync (Google/Outlook)', description: 'Sync task due dates with external calendar providers.',
    priority: 'P4', tags: ['Integration', 'Feature'], assignees: [], progress: 0,
    dueDate: '', columnId: 'ideas', order: 2,
  },
  {
    id: 't14', title: 'Team workload balancing', description: 'Visualize and balance workload distribution across team members.',
    priority: 'P3', tags: ['Analytics', 'Feature'], assignees: [{ name: 'Bob Wang' }], progress: 0,
    dueDate: '', columnId: 'ideas', order: 3,
  },
  {
    id: 't15', title: 'Slack & Teams notifications', description: 'Send task updates to Slack and Microsoft Teams channels.',
    priority: 'P2', tags: ['Integration', 'Notification'], assignees: [{ name: 'Carol Liu' }], progress: 0,
    dueDate: '', columnId: 'ideas', order: 4,
  },
  {
    id: 't16', title: 'Time tracking module', description: 'Built-in time tracking with start/stop timer per task.',
    priority: 'P3', tags: ['Feature', 'Backend'], assignees: [{ name: 'Dave Zhang' }], progress: 45,
    dueDate: '2026-09-20', columnId: 'ready', order: 1,
  },
  {
    id: 't17', title: 'Recurring tasks', description: 'Support for daily/weekly/monthly recurring task creation.',
    priority: 'P2', tags: ['Feature', 'Backend'], assignees: [{ name: 'Eve Wu' }], progress: 60,
    dueDate: '2026-08-25', columnId: 'building', order: 3,
  },
  {
    id: 't18', title: 'File attachments on tasks', description: 'Upload and attach files directly to task cards.',
    priority: 'P1', tags: ['Feature', 'Storage'], assignees: [{ name: 'Frank Li' }], progress: 95,
    dueDate: '2026-07-28', columnId: 'validation', order: 2,
  },
  {
    id: 't19', title: 'OAuth 2.0 provider support', description: 'Add OAuth 2.0 identity provider integration.',
    priority: 'P1', tags: ['Security', 'Backend'], assignees: [{ name: 'Grace Zhao' }], progress: 55,
    dueDate: '2026-08-20', columnId: 'blocked', order: 1,
  },
  {
    id: 't20', title: 'Public roadmap page', description: 'Customer-facing roadmap page with voting on feature requests.',
    priority: 'P4', tags: ['Public', 'Frontend'], assignees: [{ name: 'Henry Xu' }], progress: 100,
    dueDate: '2026-07-18', columnId: 'shipped', order: 1,
  },
]

// --- Initialize composable ---
const board = useTaskBoard(defaultColumns, defaultTasks)

// --- Project Settings ---
const showProjectSettingsModal = ref(false)
const projectName = ref('Product Roadmap')
const projectDescription = ref('')

function openProjectSettings() { showProjectSettingsModal.value = true }

const isArchived = ref(false)

function archiveProject() {
  isArchived.value = true
}

function unarchiveProject() {
  isArchived.value = false
}

const showDeleteConfirmModal = ref(false)

function deleteProject() {
  board.tasks.value = []
  board.columns.value = []
}

// --- Edit Column Modal ---
const editingColumn = ref<TaskBoardColumnType | null>(null)
const showEditColumnModal = ref(false)
const editColumnForm = ref({ label: '', color: '' })

const columnColorPresets = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#22c55e', '#10b981', '#14b8a6',
  '#eab308', '#f59e0b', '#f97316', '#ef4444',
  '#ec4899', '#d946ef', '#06b6d4', '#64748b',
]

function openEditColumnModal(column: TaskBoardColumnType) {
  editingColumn.value = column
  editColumnForm.value = {
    label: column.label,
    color: column.color || '',
  }
  showEditColumnModal.value = true
}

function saveEditColumn() {
  if (editingColumn.value && editColumnForm.value.label.trim()) {
    board.updateColumn(editingColumn.value.id, {
      label: editColumnForm.value.label.trim(),
      color: editColumnForm.value.color || undefined,
    })
  }
  showEditColumnModal.value = false
  editingColumn.value = null
}

// --- Assignee Management ---
const showAssigneeModal = ref(false)
const newAssigneeName = ref('')
const hoveredAssignee = ref<string | undefined>(undefined)
const editingAssigneeName = ref<string | null>(null)
const editingAssigneeNewName = ref('')

function openAssigneeModal() {
  showAssigneeModal.value = true
}

function addAssignee() {
  const name = newAssigneeName.value.trim()
  if (name && !allAssignees.value.some(a => a.name === name)) {
    allAssignees.value.push({ name })
  }
  newAssigneeName.value = ''
}

function removeAssignee(assignee: TaskBoardAssignee) {
  const idx = allAssignees.value.findIndex(a => a.name === assignee.name)
  if (idx !== -1) {
    allAssignees.value.splice(idx, 1)
  }
  board.tasks.value.forEach(task => {
    task.assignees = task.assignees.filter(a => a.name !== assignee.name)
  })
}

function renameAssignee(oldName: string, newName: string) {
  newName = newName.trim()
  if (!newName || newName === oldName) return
  if (allAssignees.value.some(a => a.name === newName)) return

  const idx = allAssignees.value.findIndex(a => a.name === oldName)
  if (idx !== -1) {
    allAssignees.value[idx] = { ...allAssignees.value[idx], name: newName }
  }

  board.tasks.value.forEach(task => {
    const a = task.assignees.find(a => a.name === oldName)
    if (a) a.name = newName
  })
}

function finishRenameAssignee(oldName: string) {
  renameAssignee(oldName, editingAssigneeNewName.value)
}

// --- Add Column Modal ---
const showAddColumnModal = ref(false)
const newColumnForm = ref({ label: '', statusType: 'todo' as TaskBoardColumnType['statusType'], wipLimit: undefined as number | undefined, color: '' })

function createNewColumn() {
  if (!newColumnForm.value.label.trim()) return
  board.addColumn({
    label: newColumnForm.value.label.trim(),
    statusType: newColumnForm.value.statusType,
    wipLimit: newColumnForm.value.wipLimit || undefined,
    color: newColumnForm.value.color || undefined,
  })
  newColumnForm.value = { label: '', statusType: 'todo', wipLimit: undefined, color: '' }
  showAddColumnModal.value = false
}

// --- Task Form (unified for Add & Edit) ---
const taskForm = ref({
  title: '',
  description: '',
  priority: 'P3' as TaskBoardPriority,
  tags: [] as string[],
  assignees: [] as string[],
  progress: 0,
  dueDate: '',
})
const editingTaskId = ref<string | null>(null)
const currentAddColumn = ref<string | null>(null)

const priorityOptions = [
  { label: 'P1 - Critical', value: 'P1' },
  { label: 'P2 - High', value: 'P2' },
  { label: 'P3 - Medium', value: 'P3' },
  { label: 'P4 - Low', value: 'P4' },
]

function openAddModal(colId?: string) {
  editingTaskId.value = null
  currentAddColumn.value = colId || null
  taskForm.value = {
    title: '',
    description: '',
    priority: 'P3',
    tags: [],
    assignees: [],
    progress: 0,
    dueDate: '',
  }
  board.showAddModal.value = true
}

function openEditModal(task: TaskBoardItem) {
  editingTaskId.value = task.id
  taskForm.value = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    tags: [...task.tags],
    assignees: task.assignees.map(a => a.name),
    progress: task.progress,
    dueDate: task.dueDate || '',
  }
  board.showEditModal.value = true
}

function saveTask() {
  const formData = taskForm.value
  const data = {
    title: formData.title,
    description: formData.description,
    priority: formData.priority,
    tags: [...formData.tags],
    assignees: formData.assignees.map(name => ({ name })),
    progress: formData.progress,
    dueDate: formData.dueDate || undefined,
  }
  if (editingTaskId.value) {
    board.updateTask(editingTaskId.value, data)
  } else {
    board.addTask(currentAddColumn.value || board.columns.value[0]?.id, data)
  }
  closeTaskModal()
}

function closeTaskModal() {
  board.showAddModal.value = false
  board.showEditModal.value = false
  editingTaskId.value = null
  currentAddColumn.value = null
}

function deleteCurrentTask() {
  if (editingTaskId.value) {
    board.deleteTask(editingTaskId.value)
  }
  closeTaskModal()
}

// --- Context Menu Actions ---
function handleDeleteTask() {
  if (board.contextMenu.task) {
    board.deleteTask(board.contextMenu.task.id)
  }
  board.hideContextMenu()
}

function handleEditFromContext() {
  if (board.contextMenu.task) {
    openEditModal(board.contextMenu.task)
  }
  board.hideContextMenu()
}

function handleDuplicateTask() {
  if (board.contextMenu.task) {
    const t = board.contextMenu.task
    board.addTask(t.columnId, {
      title: t.title + ' (Copy)',
      description: t.description,
      priority: t.priority,
      tags: [...t.tags],
      assignees: t.assignees ? [...t.assignees.map(a => ({ ...a }))] : [],
      progress: t.progress,
      dueDate: t.dueDate,
    })
  }
  board.hideContextMenu()
}

// --- Keyboard ---
function onKeydown(e: KeyboardEvent) {
  board.handleKeyboard(e)
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', () => {
    if (board.contextMenu.visible) {
      board.hideContextMenu()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

function onGlobalDragStart(taskId: string, columnId: string) {
  board.onDragStart(taskId, columnId)
}
</script>

<template>
  <TaskBoardRoot :density="board.density.value">
    <TaskBoardContent
      :columns="board.columns.value"
      :search-query="board.searchQuery.value"
      :density="board.density.value"
      :tasks-count="board.tasks.value.length"
      :tasks="board.tasks.value"
      :is-archived="isArchived"
      @update:search-query="board.searchQuery.value = $event"
      @change-density="(d: TaskBoardDensity) => board.setDensity(d)"
      @download-json="board.downloadJSON()"
      @download-csv="board.downloadCSV()"
      @undo="board.undo()"
      @redo="board.redo()"
      @manage-assignees="openAssigneeModal"
      @open-project-settings="openProjectSettings"
      @archive-project="archiveProject"
      @unarchive-project="unarchiveProject"
      @delete-project="showDeleteConfirmModal = true"
      @add-column="showAddColumnModal = true"
    >
      <TaskBoardColumnComp
        v-for="(column, colIdx) in board.columns.value"
        :key="column.id"
        :column="column"
        :tasks="board.getColumnTasks(column.id)"
        :drag-state="board.dragState"
        :column-drag-state="board.columnDragState"
        :selected-task-ids="board.selectedTaskIds.value"
        :is-wip-exceeded="board.isWipExceeded(column)"
        :column-index="colIdx"
        :get-avatar-color="getAvatarColor"
        :get-initials="getInitials"
        :is-archived="isArchived"
        @toggle-collapse="(colId: string) => board.toggleColumnCollapse(colId)"
        @add-task="(colId: string) => openAddModal(colId)"
        @drag-start="(taskId: string, colId: string) => onGlobalDragStart(taskId, colId)"
        @drag-over="(colId: string, idx: number) => board.onDragOver(colId, idx)"
        @drop="(colId: string, idx: number) => board.onDrop(colId, idx)"
        @drag-end="board.onDragEnd()"
        @select="(taskId: string, multi: boolean) => board.toggleSelect(taskId, multi)"
        @context-menu="(e: MouseEvent, task: TaskBoardItem) => board.showContextMenu(e, task)"
        @edit="(task: TaskBoardItem) => openEditModal(task)"
        @edit-column="(col: TaskBoardColumnType) => openEditColumnModal(col)"
        @column-drag-start="(colId: string) => board.onColumnDragStart(colId)"
        @column-drag-over="(idx: number, e: DragEvent) => board.onColumnDragOver(idx, e)"
        @column-drop="(idx: number) => board.onColumnDrop(idx)"
        @column-drag-end="board.onColumnDragEnd()"
      />
    </TaskBoardContent>

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="board.contextMenu.visible"
        class="taskboard-context-menu"
        :style="{ left: board.contextMenu.x + 'px', top: board.contextMenu.y + 'px' }"
        @click.stop
      >
        <button class="taskboard-context-menu__item" @click="handleEditFromContext">
          Edit card
        </button>
        <button class="taskboard-context-menu__item" @click="handleDuplicateTask">
          Duplicate
        </button>
        <div class="taskboard-context-menu__divider" />
        <button class="taskboard-context-menu__item taskboard-context-menu__item--danger" @click="handleDeleteTask">
          Delete
        </button>
      </div>
    </Teleport>

    <!-- Add Card Modal -->
    <NModal
      v-model:show="board.showAddModal.value"
      preset="card"
      title="Add New Card"
      style="width:500px"
      :mask-closable="false"
    >
      <NForm label-placement="top">
        <NFormItem label="Title" required>
          <NInput v-model:value="taskForm.title" placeholder="Enter task title" />
        </NFormItem>
        <NFormItem label="Description">
          <NInput
            v-model:value="taskForm.description"
            type="textarea"
            placeholder="Enter description"
            :rows="3"
          />
        </NFormItem>
        <NFormItem label="Priority">
          <NSelect
            v-model:value="taskForm.priority"
            :options="priorityOptions"
          />
        </NFormItem>
        <NFormItem label="Tags (comma separated)">
          <NInput
            :value="taskForm.tags.join(', ')"
            @update:value="taskForm.tags = ($event as string).split(',').map(t => t.trim()).filter(Boolean)"
            placeholder="e.g. UI, Backend"
          />
        </NFormItem>
        <NFormItem label="Assignees">
          <NSelect
            v-model:value="taskForm.assignees"
            :options="allAssigneeOptions"
            multiple
            tag
            filterable
            placeholder="选择参与人"
            @update:value="(val: string[]) => console.log('Add NSelect update:value', val)"
          />
        </NFormItem>
        <NFormItem label="Progress (0-100)">
          <NInputNumber
            v-model:value="taskForm.progress"
            :min="0"
            :max="100"
            style="width:100%"
          />
        </NFormItem>
        <NFormItem label="Due Date">
          <NInput v-model:value="taskForm.dueDate" placeholder="YYYY-MM-DD" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="closeTaskModal()">Cancel</NButton>
          <NButton type="primary" @click="saveTask()" :disabled="!taskForm.title.trim()">
            Add Card
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Edit Card Modal -->
    <NModal
      v-model:show="board.showEditModal.value"
      preset="card"
      title="Edit Card"
      style="--n-border-radius: 12px; border-radius: 12px; width: 700px;"
      :card-style="{ borderRadius: '12px' }"
      :mask-closable="false"
    >
      <div class="edit-card-layout">
        <div class="edit-card-left">
          <NForm label-placement="top">
            <NFormItem label="Title" required>
              <NInput v-model:value="taskForm.title" />
            </NFormItem>
            <NFormItem label="Priority">
              <NSelect
                v-model:value="taskForm.priority"
                :options="priorityOptions"
              />
            </NFormItem>
            <NFormItem label="Due Date">
              <NInput v-model:value="taskForm.dueDate" placeholder="YYYY-MM-DD" />
            </NFormItem>
            <NFormItem label="Tags">
              <NInput
                :value="taskForm.tags.join(', ')"
                @update:value="taskForm.tags = ($event as string).split(',').map(t => t.trim()).filter(Boolean)"
              />
            </NFormItem>
            <NFormItem label="Progress">
              <NInputNumber
                v-model:value="taskForm.progress"
                :min="0"
                :max="100"
                style="width:100%"
              />
            </NFormItem>
          </NForm>
        </div>
        <div class="edit-card-right">
          <NForm label-placement="top">
            <NFormItem label="Description">
              <NInput
                v-model:value="taskForm.description"
                type="textarea"
                :rows="6"
              />
            </NFormItem>
            <NFormItem label="Assignees">
              <NSelect
                v-model:value="taskForm.assignees"
                :options="allAssigneeOptions"
                multiple
                tag
                filterable
                placeholder="选择参与人"
                @update:value="(val: string[]) => console.log('Edit NSelect update:value', val)"
              />
            </NFormItem>
          </NForm>
        </div>
      </div>
      <template #footer>
        <div class="edit-card-actions">
          <NButton type="error" quaternary @click="deleteCurrentTask()">
            Delete
          </NButton>
          <NButton @click="closeTaskModal()">Cancel</NButton>
          <NButton type="primary" @click="saveTask()">Save</NButton>
        </div>
      </template>
    </NModal>

    <!-- Edit Column Modal -->
    <NModal
      v-model:show="showEditColumnModal"
      preset="card"
      title="编辑列"
      style="width:380px"
      :mask-closable="false"
    >
      <NForm v-if="editingColumn" label-placement="top">
        <NFormItem label="列名称">
          <NInput v-model:value="editColumnForm.label" placeholder="输入列名" />
        </NFormItem>
        <NFormItem label="颜色">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
            <button
              v-for="c in columnColorPresets"
              :key="c"
              type="button"
              :style="{
                width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: c, border: editColumnForm.color === c ? '3px solid #1a1d23' : '2px solid transparent',
                cursor: 'pointer', outline: 'none'
              }"
              @click="editColumnForm.color = c"
            />
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button
              type="button"
              :style="{
                width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: editColumnForm.color || '#e5e7eb',
                border: '1px solid #d1d5db', cursor: 'pointer', flexShrink: 0
              }"
            />
            <NInput
              v-model:value="editColumnForm.color"
              placeholder="#3b82f6 或留空使用默认色"
              size="small"
              style="flex:1"
            />
            <NButton
              v-if="editColumnForm.color"
              size="small"
              quaternary
              @click="editColumnForm.color = ''"
            >
              重置
            </NButton>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEditColumnModal = false">取消</NButton>
          <NButton type="primary" @click="saveEditColumn" :disabled="!editColumnForm.label.trim()">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Manage Assignees Modal -->
    <NModal v-model:show="showAssigneeModal" preset="card" title="管理参与人" style="width:420px" :mask-closable="false">
      <div style="margin-bottom:16px">
        <div style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px">已添加的参与人:</div>
        <div v-if="allAssignees.length" class="manage-assignees__list">
          <div
            v-for="a in allAssignees"
            :key="a.name"
            class="manage-assignees__item"
          >
            <div class="manage-assignees__avatar" :style="{ background: getAvatarColor(a.name) }">
              {{ getInitials(a.name) }}
            </div>
            <span class="manage-assignees__name">{{ a.name }}</span>
            <span class="manage-assignees__remove" @click="removeAssignee(a)">&times;</span>
          </div>
        </div>
        <div v-else style="text-align:center;padding:16px;color:#9ca3af;font-size:13px">暂无参与人</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px">新增参与人:</div>
        <div style="display:flex;gap:8px">
          <NInput v-model:value="newAssigneeName" placeholder="输入姓名，回车添加" @keyup.enter="addAssignee" style="flex:1" />
          <NButton type="primary" @click="addAssignee" :disabled="!newAssigneeName.trim()">添加</NButton>
        </div>
      </div>
      <template #footer>
        <NButton @click="showAssigneeModal = false">完成</NButton>
      </template>
    </NModal>

    <!-- Project Settings Modal -->
    <NModal v-model:show="showProjectSettingsModal" preset="card" title="项目设置" style="width:420px" :mask-closable="false">
      <NForm label-placement="top">
        <NFormItem label="项目名称">
          <NInput v-model:value="projectName" placeholder="输入项目名称" />
        </NFormItem>
        <NFormItem label="项目描述">
          <NInput v-model:value="projectDescription" type="textarea" placeholder="输入项目描述" :rows="3" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showProjectSettingsModal = false">取消</NButton>
          <NButton type="primary" @click="showProjectSettingsModal = false">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Delete Confirm Modal -->
    <NModal v-model:show="showDeleteConfirmModal" preset="card" title="删除项目" style="width:380px" :mask-closable="false">
      <p style="color:#6b7280">删除后所有列和卡片将被清空，此操作不可撤销。</p>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showDeleteConfirmModal = false">取消</NButton>
          <NButton type="error" @click="deleteProject(); showDeleteConfirmModal = false">确认删除</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Add Column Modal -->
    <NModal v-model:show="showAddColumnModal" preset="card" title="新建列" style="width:400px" :mask-closable="false">
      <NForm label-placement="top">
        <NFormItem label="列名称" required>
          <NInput v-model:value="newColumnForm.label" placeholder="输入列名" />
        </NFormItem>
        <NFormItem label="状态类型">
          <NSelect v-model:value="newColumnForm.statusType" :options="[
            { label: '待办', value: 'todo' },
            { label: '进行中', value: 'in-progress' },
            { label: '已完成', value: 'done' },
            { label: '阻塞', value: 'blocked' },
          ]" />
        </NFormItem>
        <NFormItem label="WIP 限制（可选）">
          <NInputNumber v-model:value="newColumnForm.wipLimit" :min="1" placeholder="不填则无限制" style="width:100%" />
        </NFormItem>
        <NFormItem label="颜色（可选）">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
            <button
              v-for="c in columnColorPresets"
              :key="c"
              type="button"
              :style="{
                width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: c,
                border: newColumnForm.color === c ? '3px solid #1a1d23' : '2px solid transparent',
                cursor: 'pointer', outline: 'none'
              }"
              @click="newColumnForm.color = c"
            />
          </div>
          <NInput v-model:value="newColumnForm.color" placeholder="#3b82f6 或留空" size="small" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showAddColumnModal = false">取消</NButton>
          <NButton type="primary" @click="createNewColumn" :disabled="!newColumnForm.label.trim()">创建</NButton>
        </NSpace>
      </template>
    </NModal>
  </TaskBoardRoot>
</template>
