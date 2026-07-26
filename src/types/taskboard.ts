export type TaskBoardStatus = 'todo' | 'in-progress' | 'done' | 'blocked'
export type TaskBoardPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL'
export type TaskBoardDensity = 'compact' | 'standard' | 'comfortable'

export interface TaskBoardAssignee {
  name: string
  avatar?: string
}

export interface TaskBoardItem {
  id: string
  title: string
  description: string
  priority: TaskBoardPriority
  tags: string[]
  assignees: TaskBoardAssignee[]
  progress: number
  dueDate: string
  columnId: string
  order: number
  swimlaneId?: string
}

export interface TaskBoardColumn {
  id: string
  label: string
  statusType: TaskBoardStatus
  wipLimit?: number
  collapsed: boolean
  order: number
  color?: string
}

export interface TaskBoardSwimlane {
  id: string
  label: string
  order: number
}

export interface TaskBoardDragState {
  draggingTaskId: string | null
  dragOverColumnId: string | null
  dragOverIndex: number
  sourceColumnId: string | null
  sourceIndex: number
}

export interface TaskBoardHistoryEntry {
  type: 'move' | 'add' | 'update' | 'delete'
  snapshot: TaskBoardItem[]
  description: string
}

export interface TaskBoardContextMenuState {
  visible: boolean
  x: number
  y: number
  task: TaskBoardItem | null
}
