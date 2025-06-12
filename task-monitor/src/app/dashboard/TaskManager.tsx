'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';

interface TaskManagerProps {
  userName: string;
}

export default function TaskManager({ userName }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    taskName: '',
    taskDescription: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const taskID = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          taskID,
          taskName: formData.taskName,
          taskDescription: formData.taskDescription,
        }),
      });

      if (!res.ok) throw new Error('Failed to create task');

      const newTask = await res.json();
      setTasks([...tasks, newTask]);
      setFormData({ taskName: '', taskDescription: '' });
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to create task');
    }
  };

  const toggleTaskStatus = async (taskID: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/tasks/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskID,
          isFinished: !currentStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      const updatedTask = await res.json();
      setTasks(tasks.map(task => 
        task.taskID === taskID ? updatedTask : task
      ));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const unfinishedTasks = tasks.filter(task => !task.isFinished);
  const finishedTasks = tasks.filter(task => task.isFinished);

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add New Task
          </button>
        ) : (
          <form onSubmit={handleAddTask} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">
                  Task Name
                </label>
                <input
                  id="taskName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  value={formData.taskName}
                  onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">
                  Task Description
                </label>
                <textarea
                  id="taskDescription"
                  rows={3}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ taskName: '', taskDescription: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Unfinished Tasks ({unfinishedTasks.length})
          </h2>
          <div className="space-y-3">
            {unfinishedTasks.map((task) => (
              <TaskCard
                key={task.taskID}
                task={task}
                onToggle={() => toggleTaskStatus(task.taskID, task.isFinished)}
              />
            ))}
            {unfinishedTasks.length === 0 && (
              <p className="text-gray-500 text-center py-8">No unfinished tasks</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Finished Tasks ({finishedTasks.length})
          </h2>
          <div className="space-y-3">
            {finishedTasks.map((task) => (
              <TaskCard
                key={task.taskID}
                task={task}
                onToggle={() => toggleTaskStatus(task.taskID, task.isFinished)}
              />
            ))}
            {finishedTasks.length === 0 && (
              <p className="text-gray-500 text-center py-8">No finished tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <div className={`p-4 rounded-lg border ${
      task.isFinished ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
    }`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.isFinished}
          onChange={onToggle}
          className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
        />
        <div className="flex-1">
          <h3 className={`font-medium ${
            task.isFinished ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}>
            {task.taskName}
          </h3>
          <p className={`text-sm mt-1 ${
            task.isFinished ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {task.taskDescription}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Created: {new Date(task.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}