import { ref, computed, reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type {
  TaskBoardItem,
  TaskBoardColumn,
  TaskBoardSwimlane,
  TaskBoardDensity,
  TaskBoardDragState,
  TaskBoardHistoryEntry,
  TaskBoardContextMenuState,
  TaskBoardPriority,
} from '@/types/taskboard'

export function useTaskBoard(initialColumns: TaskBoardColumn[], initialTasks: TaskBoardItem[], initialSwimlanes: TaskBoardSwimlane[] = []) {
  // --- State ---
  const columns = ref<TaskBoardColumn[]>([...initialColumns])
  const tasks = ref<TaskBoardItem[]>([...initialTasks])
  const swimlanes = ref<TaskBoardSwimlane[]>([...initialSwimlanes])
  const searchQuery = ref('')
  const density = ref<TaskBoardDensity>('standard')
  const selectedTaskIds = ref<Set<string>>(new Set())
  const showAddModal = ref(false)
  const addModalColumnId = ref('')
  const editingTask = ref<TaskBoardItem | null>(null)
  const showEditModal = ref(false)

  // Drag state
  const dragState = reactive<TaskBoardDragState>({
    draggingTaskId: null,
    dragOverColumnId: null,
    dragOverIndex: -1,
    sourceColumnId: null,
    sourceIndex: -1,
  })

  // Column drag state
  const columnDragState = reactive({
    draggingColumnId: null as string | null,
    dragOverColumnIndex: -1,
  })

  // Context menu
  const contextMenu = reactive<TaskBoardContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    task: null,
  })

  // Undo/Redo history
  const history = ref<TaskBoardHistoryEntry[]>([])
  const historyIndex = ref(-1)

  // Keyboard focus
  const focusedTaskIndex = ref(0)
  const focusedColumnIndex = ref(0)

  // --- Push to history ---
  function pushHistory(type: TaskBoardHistoryEntry['type'], description: string) {
    const snapshot = JSON.parse(JSON.stringify(tasks.value)) as TaskBoardItem[]
    const entry: TaskBoardHistoryEntry = { type, snapshot, description }
    // Truncate future entries if we're in the middle
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(entry)
    // Keep max 50 entries
    if (history.value.length > 50) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
  }

  // --- Computed ---
  const filteredTasks = computed(() => {
    if (!searchQuery.value.trim()) return tasks.value
    const q = searchQuery.value.toLowerCase()
    return tasks.value.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (t.assignees && t.assignees.some(a => a.name.toLowerCase().includes(q)))
    )
  })

  const visibleColumnIds = computed(() => new Set(filteredTasks.value.map((t) => t.columnId)))

  function getColumnTasks(columnId: string): TaskBoardItem[] {
    return filteredTasks.value
      .filter((t) => t.columnId === columnId && (swimlanes.value.length === 0 || !t.swimlaneId || swimlanes.value.some((s) => s.id === t.swimlaneId)))
      .sort((a, b) => a.order - b.order)
  }

  function getSwimlaneColumnTasks(columnId: string, swimlaneId: string): TaskBoardItem[] {
    return filteredTasks.value
      .filter((t) => t.columnId === columnId && t.swimlaneId === swimlaneId)
      .sort((a, b) => a.order - b.order)
  }

  function getColumnWipCount(columnId: string): number {
    return tasks.value.filter((t) => t.columnId === columnId).length
  }

  function isWipExceeded(column: TaskBoardColumn): boolean {
    if (!column.wipLimit) return false
    return getColumnWipCount(column.id) > column.wipLimit
  }

  // --- CRUD ---
  function addTask(columnId: string, partial: Partial<TaskBoardItem>) {
    const colTasks = getColumnTasks(columnId)
    const maxOrder = colTasks.length > 0 ? Math.max(...colTasks.map((t) => t.order)) : -1
    const newTask: TaskBoardItem = {
      id: uuidv4(),
      title: partial.title || 'New Task',
      description: partial.description || '',
      priority: (partial.priority || 'P3') as TaskBoardPriority,
      tags: partial.tags || [],
      assignees: partial.assignees || [],
      progress: partial.progress ?? 0,
      dueDate: partial.dueDate || '',
      columnId,
      order: partial.order ?? maxOrder + 1,
      swimlaneId: partial.swimlaneId,
    }
    tasks.value.push(newTask)
    pushHistory('add', `Added "${newTask.title}" to ${columns.value.find((c) => c.id === columnId)?.label || columnId}`)
    return newTask
  }

  function updateTask(taskId: string, updates: Partial<TaskBoardItem>) {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return
    const old = tasks.value[idx]
    tasks.value[idx] = { ...old, ...updates }
    pushHistory('update', `Updated "${tasks.value[idx].title}"`)
  }

  function deleteTask(taskId: string) {
    const idx = tasks.value.findIndex((t) => t.id === taskId)
    if (idx === -1) return
    const task = tasks.value[idx]
    tasks.value.splice(idx, 1)
    selectedTaskIds.value.delete(taskId)
    pushHistory('delete', `Deleted "${task.title}"`)
  }

  // --- Column ---
  function toggleColumnCollapse(columnId: string) {
    const col = columns.value.find((c) => c.id === columnId)
    if (col) {
      col.collapsed = !col.collapsed
    }
  }

  function updateColumn(columnId: string, updates: Partial<TaskBoardColumn>) {
    const col = columns.value.find(c => c.id === columnId)
    if (col) {
      Object.assign(col, updates)
    }
  }

  function addColumn(partial: { label?: string; statusType?: TaskBoardColumn['statusType']; wipLimit?: number; color?: string }) {
    const newCol: TaskBoardColumn = {
      id: uuidv4(),
      label: partial.label || '新列',
      statusType: partial.statusType || 'todo',
      wipLimit: partial.wipLimit || undefined,
      collapsed: false,
      order: columns.value.length,
      color: partial.color || undefined,
    }
    columns.value.push(newCol)
  }

  // --- Density ---
  function setDensity(d: TaskBoardDensity) {
    density.value = d
  }

  // --- Selection ---
  function toggleSelect(taskId: string, multi: boolean = false) {
    const newSet = new Set(multi ? selectedTaskIds.value : [])
    if (newSet.has(taskId)) {
      newSet.delete(taskId)
    } else {
      newSet.add(taskId)
    }
    selectedTaskIds.value = newSet
  }

  function clearSelection() {
    selectedTaskIds.value = new Set()
  }

  // --- Drag & Drop ---
  function onDragStart(taskId: string, columnId: string) {
    const colTasks = getColumnTasks(columnId)
    const idx = colTasks.findIndex((t) => t.id === taskId)
    dragState.draggingTaskId = taskId
    dragState.sourceColumnId = columnId
    dragState.sourceIndex = idx
  }

  function onDragOver(columnId: string, index: number) {
    if (dragState.draggingTaskId) {
      dragState.dragOverColumnId = columnId
      dragState.dragOverIndex = index
    }
  }

  function onDrop(targetColumnId: string, targetIndex: number) {
    const taskId = dragState.draggingTaskId
    const sourceCol = dragState.sourceColumnId
    const sourceIdx = dragState.sourceIndex
    if (!taskId || !sourceCol) return

    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) { resetDrag(); return }

    if (sourceCol === targetColumnId && sourceIdx === targetIndex) {
      resetDrag()
      return
    }

    pushHistory('move', `Moved "${task.title}" between columns`)

    if (sourceCol === targetColumnId) {
      // Same column reorder
      const colTasks = tasks.value
        .filter((t) => t.columnId === sourceCol)
        .sort((a, b) => a.order - b.order)
      const moved = colTasks.splice(sourceIdx, 1)[0]
      colTasks.splice(targetIndex, 0, moved)
      colTasks.forEach((t, i) => {
        const orig = tasks.value.find((x) => x.id === t.id)
        if (orig) orig.order = i
      })
    } else {
      // Cross-column
      task.columnId = targetColumnId
      const targetTasks = tasks.value
        .filter((t) => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order)
      const movedIdx = targetTasks.findIndex((t) => t.id === taskId)
      if (movedIdx !== -1) targetTasks.splice(movedIdx, 1)
      targetTasks.splice(targetIndex, 0, task)
      targetTasks.forEach((t, i) => {
        const orig = tasks.value.find((x) => x.id === t.id)
        if (orig) orig.order = i
      })
      // Reorder source
      const sourceTasks = tasks.value
        .filter((t) => t.columnId === sourceCol)
        .sort((a, b) => a.order - b.order)
      sourceTasks.forEach((t, i) => {
        const orig = tasks.value.find((x) => x.id === t.id)
        if (orig) orig.order = i
      })
    }
    resetDrag()
  }

  function resetDrag() {
    dragState.draggingTaskId = null
    dragState.dragOverColumnId = null
    dragState.dragOverIndex = -1
    dragState.sourceColumnId = null
    dragState.sourceIndex = -1
  }

  function onDragEnd() {
    resetDrag()
  }

  // --- Column Drag & Drop ---
  function onColumnDragStart(columnId: string) {
    columnDragState.draggingColumnId = columnId
  }

  function onColumnDragOver(index: number, e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    columnDragState.dragOverColumnIndex = index
  }

  function onColumnDrop(targetIndex: number) {
    const draggingId = columnDragState.draggingColumnId
    if (!draggingId) return

    const dragCol = columns.value.find(c => c.id === draggingId)
    const dragIndex = columns.value.findIndex(c => c.id === draggingId)
    if (!dragCol || dragIndex === -1) { resetColumnDrag(); return }

    if (dragIndex === targetIndex) { resetColumnDrag(); return }

    // Reorder columns
    const updated = [...columns.value]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)
    // Update order
    updated.forEach((c, i) => { c.order = i })
    columns.value = updated

    resetColumnDrag()
  }

  function onColumnDragEnd() {
    resetColumnDrag()
  }

  function resetColumnDrag() {
    columnDragState.draggingColumnId = null
    columnDragState.dragOverColumnIndex = -1
  }

  // --- Undo / Redo ---
  function undo() {
    if (historyIndex.value < 0) return
    if (historyIndex.value === 0) {
      tasks.value = JSON.parse(JSON.stringify(initialTasks))
    } else {
      tasks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value - 1].snapshot))
    }
    historyIndex.value--
  }

  function redo() {
    if (historyIndex.value >= history.value.length - 1) return
    historyIndex.value++
    tasks.value = JSON.parse(JSON.stringify(history.value[historyIndex.value].snapshot))
  }

  // --- Export ---
  function exportToJSON(): string {
    const data = {
      columns: columns.value,
      tasks: tasks.value,
      swimlanes: swimlanes.value,
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  }

  function downloadJSON() {
    const json = exportToJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taskboard-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportToCSV(): string {
    const headers = ['ID', 'Title', 'Description', 'Priority', 'Tags', 'Assignees', 'Progress', 'Due Date', 'Column', 'Order']
    const rows = tasks.value.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.priority,
      t.tags.join(';'),
      t.assignees?.map(a => a.name).join(';') || '',
      `${t.progress}%`,
      t.dueDate,
      columns.value.find((c) => c.id === t.columnId)?.label || t.columnId,
      String(t.order),
    ])
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  }

  function downloadCSV() {
    const csv = exportToCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taskboard-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Context menu ---
  function showContextMenu(e: MouseEvent, task: TaskBoardItem) {
    e.preventDefault()
    contextMenu.visible = true
    contextMenu.x = e.clientX
    contextMenu.y = e.clientY
    contextMenu.task = task
  }

  function hideContextMenu() {
    contextMenu.visible = false
    contextMenu.task = null
  }

  // --- Keyboard navigation ---
  function handleKeyboard(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === 'Z') {
        e.preventDefault()
        redo()
        return
      }
    }

    // Arrow key navigation
    const visibleCols = columns.value.filter((c) => !c.collapsed)
    if (visibleCols.length === 0) return

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusedColumnIndex.value = Math.min(focusedColumnIndex.value + 1, visibleCols.length - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusedColumnIndex.value = Math.max(focusedColumnIndex.value - 1, 0)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const colId = visibleCols[focusedColumnIndex.value]?.id
      if (colId) {
        const colTasks = getColumnTasks(colId)
        focusedTaskIndex.value = Math.min(focusedTaskIndex.value + 1, colTasks.length - 1)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusedTaskIndex.value = Math.max(focusedTaskIndex.value - 1, 0)
    } else if (e.key === 'Escape') {
      hideContextMenu()
      clearSelection()
    }
  }

  // --- Edit modal ---
  function openEditModal(task: TaskBoardItem) {
    editingTask.value = { ...task }
    showEditModal.value = true
  }

  function closeEditModal() {
    showEditModal.value = false
    editingTask.value = null
  }

  function saveEditModal() {
    if (editingTask.value) {
      updateTask(editingTask.value.id, editingTask.value)
    }
    closeEditModal()
  }

  return {
    // State
    columns,
    tasks,
    swimlanes,
    searchQuery,
    density,
    selectedTaskIds,
    showAddModal,
    addModalColumnId,
    editingTask,
    showEditModal,
    dragState,
    contextMenu,
    history,
    historyIndex,
    focusedTaskIndex,
    focusedColumnIndex,

    // Computed
    filteredTasks,
    visibleColumnIds,

    // Methods
    getColumnTasks,
    getSwimlaneColumnTasks,
    getColumnWipCount,
    isWipExceeded,
    addTask,
    updateTask,
    deleteTask,
    toggleColumnCollapse,
    updateColumn,
    addColumn,
    setDensity,
    toggleSelect,
    clearSelection,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    resetDrag,
    columnDragState,
    onColumnDragStart,
    onColumnDragOver,
    onColumnDrop,
    onColumnDragEnd,
    undo,
    redo,
    exportToJSON,
    exportToCSV,
    downloadJSON,
    downloadCSV,
    showContextMenu,
    hideContextMenu,
    handleKeyboard,
    openEditModal,
    closeEditModal,
    saveEditModal,
    pushHistory,
  }
}
