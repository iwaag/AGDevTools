import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createTask, getUserTasks } from '@/lib/tasks';
import { TaskInfo } from '@/types/task';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const taskInfo: TaskInfo = body;

    // Validate required fields
    if (!taskInfo.userName || !taskInfo.taskID || !taskInfo.taskName || !taskInfo.taskDescription) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify that the userName matches the logged in user
    if (taskInfo.userName !== session.user.name) {
      return NextResponse.json(
        { error: 'Cannot create tasks for other users' },
        { status: 403 }
      );
    }

    const task = await createTask(taskInfo);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tasks = await getUserTasks(session.user.name);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}