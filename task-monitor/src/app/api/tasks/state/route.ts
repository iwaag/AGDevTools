import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateTaskState } from '@/lib/tasks';
import { TaskState } from '@/types/task';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const taskState: TaskState = body;

    // Validate required fields
    if (!taskState.taskID || typeof taskState.isFinished !== 'boolean') {
      return NextResponse.json(
        { error: 'taskID and isFinished are required' },
        { status: 400 }
      );
    }

    const updatedTask = await updateTaskState(taskState);

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Verify that the task belongs to the logged in user
    if (updatedTask.userName !== session.user.name) {
      return NextResponse.json(
        { error: 'Cannot update tasks for other users' },
        { status: 403 }
      );
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Update task state error:', error);
    return NextResponse.json(
      { error: 'Failed to update task state' },
      { status: 500 }
    );
  }
}