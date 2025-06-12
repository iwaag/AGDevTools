export interface TaskInfo {
  userName: string;
  taskID: string;
  taskName: string;
  taskDescription: string;
}

export interface TaskState {
  taskID: string;
  isFinished: boolean;
}

export interface Task extends TaskInfo {
  isFinished: boolean;
  createdAt: string;
  lastActivityAt: string;
}