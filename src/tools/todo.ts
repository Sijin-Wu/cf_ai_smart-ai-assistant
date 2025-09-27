/**
 * Todo list management tools for the AI chat agent
 * Allows users to add, view, and manage todo tasks using natural language
 * Uses the agent's built-in SQLite database for persistence with user-based storage
 * Tasks persist across chat sessions for the same user
 */
import { tool } from "ai";
import { z } from "zod/v3";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getCurrentAgent } from "agents";
import type { Chat } from "../server";

// Type definition for todo tasks
export type TodoTask = {
  id: string;
  text: string;
  due?: string; // Human-readable due date/time
  dueTimestamp?: number; // Unix timestamp for sorting
  completed: boolean;
  createdAt: number;
  userId: string; // User identifier for cross-session persistence
};

/**
 * Generate a user ID based on connection info and store it persistently
 * This ensures the same user gets the same ID across different chat sessions
 */
async function getUserId(agent: Chat): Promise<string> {
  // Create users table if it doesn't exist
  await agent.sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      createdAt INTEGER NOT NULL,
      lastSeen INTEGER NOT NULL
    )
  `;

  // For now, we'll use a simple approach: one user per agent instance
  // In a real application, you might use IP address, authentication, or other methods
  const agentId = "default_user"; // This could be enhanced to use actual user identification
  
  // Check if user exists
  const userQuery = agent.sql<{id: string, createdAt: number, lastSeen: number}>`
    SELECT * FROM users WHERE id = ${agentId}
  `;
  
  let userId = agentId;
  let userExists = false;
  
  for await (const row of userQuery) {
    userId = row.id;
    userExists = true;
  }
  
  if (!userExists) {
    // Create new user
    const now = Date.now();
    await agent.sql`
      INSERT INTO users (id, createdAt, lastSeen)
      VALUES (${userId}, ${now}, ${now})
    `;
  } else {
    // Update last seen
    await agent.sql`
      UPDATE users SET lastSeen = ${Date.now()} WHERE id = ${userId}
    `;
  }
  
  return userId;
}

/**
 * Helper function to parse due dates using AI
 */
async function parseDueDateWithAI(input: string): Promise<{ due?: string; dueTimestamp?: number }> {
  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Parse the following text and extract any time/date information. Current date is ${new Date().toISOString().split('T')[0]}. 
      
      Text: "${input}"
      
      If there's a time or date mentioned, return it in this JSON format:
      {
        "due": "human readable due date/time",
        "timestamp": unix_timestamp_in_milliseconds_or_null
      }
      
      If no time/date is mentioned, return:
      {
        "due": null,
        "timestamp": null
      }
      
      Examples:
      - "before Sep 27" -> {"due": "September 27", "timestamp": 1727395200000}
      - "at 7pm" -> {"due": "Today at 7:00 PM", "timestamp": appropriate_timestamp}
      - "tomorrow morning" -> {"due": "Tomorrow morning", "timestamp": appropriate_timestamp}
      - "no date mentioned" -> {"due": null, "timestamp": null}
      
      Return only valid JSON, no other text.`,
    });

    const parsed = JSON.parse(text);
    return {
      due: parsed.due || undefined,
      dueTimestamp: parsed.timestamp || undefined
    };
  } catch (error) {
    console.error('Error parsing due date:', error);
    return {};
  }
}

/**
 * Helper function to find a task by various identifiers (position, partial text, or ID)
 */
async function findTaskByIdentifier(agent: Chat, userId: string, identifier: string): Promise<TodoTask | null> {
  // First try to find by exact ID
  if (identifier.match(/^\d{13}$/)) { // Timestamp IDs are 13 digits
    const taskQuery = agent.sql<TodoTask>`SELECT * FROM todos WHERE id = ${identifier} AND userId = ${userId}`;
    for await (const row of taskQuery) {
      return {
        id: row.id,
        text: row.text,
        due: row.due || undefined,
        dueTimestamp: row.dueTimestamp || undefined,
        completed: Boolean(row.completed),
        createdAt: row.createdAt,
        userId: row.userId
      };
    }
  }
  
  // Try to find by position number (e.g., "1", "2", "3")
  if (identifier.match(/^\d+$/)) {
    const position = parseInt(identifier) - 1; // Convert to 0-based index
    const query = agent.sql<TodoTask>`SELECT * FROM todos WHERE userId = ${userId} AND completed = FALSE ORDER BY 
      CASE WHEN dueTimestamp IS NOT NULL THEN 0 ELSE 1 END,
      dueTimestamp ASC,
      createdAt ASC
      LIMIT 1 OFFSET ${position}`;
    
    for await (const row of query) {
      return {
        id: row.id,
        text: row.text,
        due: row.due || undefined,
        dueTimestamp: row.dueTimestamp || undefined,
        completed: Boolean(row.completed),
        createdAt: row.createdAt,
        userId: row.userId
      };
    }
  }
  
  // Try to find by partial text match (case insensitive)
  const textQuery = agent.sql<TodoTask>`SELECT * FROM todos WHERE userId = ${userId} AND LOWER(text) LIKE LOWER(${'%' + identifier + '%'}) ORDER BY createdAt ASC LIMIT 1`;
  for await (const row of textQuery) {
    return {
      id: row.id,
      text: row.text,
      due: row.due || undefined,
      dueTimestamp: row.dueTimestamp || undefined,
      completed: Boolean(row.completed),
      createdAt: row.createdAt,
      userId: row.userId
    };
  }
  
  return null;
}
async function initializeTodoTable(agent: Chat) {
  // First, create the table if it doesn't exist (original version)
  await agent.sql`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      due TEXT,
      dueTimestamp INTEGER,
      completed BOOLEAN DEFAULT FALSE,
      createdAt INTEGER NOT NULL
    )
  `;
  
  // Check if userId column exists by trying to query it
  let hasUserIdColumn = false;
  try {
    await agent.sql`SELECT userId FROM todos LIMIT 1`;
    hasUserIdColumn = true;
  } catch (error) {
    // Column doesn't exist, we need to add it
    hasUserIdColumn = false;
  }
  
  // Add userId column if it doesn't exist
  if (!hasUserIdColumn) {
    try {
      await agent.sql`ALTER TABLE todos ADD COLUMN userId TEXT DEFAULT 'default_user'`;
      
      // Update existing rows to have the default user ID
      await agent.sql`UPDATE todos SET userId = 'default_user' WHERE userId IS NULL`;
      
      console.log('Successfully migrated todos table to include userId column');
    } catch (error) {
      console.error('Error migrating todos table:', error);
    }
  }
  
  // Create index on userId for better performance (only if column exists now)
  try {
    await agent.sql`CREATE INDEX IF NOT EXISTS idx_todos_userId ON todos(userId)`;
  } catch (error) {
    console.error('Error creating userId index:', error);
  }
}

/**
 * Tool to add a new todo task
 */
export const addTodoTask = tool({
  description: "Add a new todo task to the user's todo list. Use this when the user wants to create a reminder, add a task, or schedule something to do. Tasks persist across chat sessions.",
  inputSchema: z.object({
    taskDescription: z.string().describe("The full description of the task including any time/date information")
  }),
  execute: async ({ taskDescription }) => {
    try {
      const { agent } = getCurrentAgent<Chat>();
      
      if (!agent) {
        return "❌ Agent context not available";
      }
      
      // Initialize the table if needed
      await initializeTodoTable(agent);
      
      // Get user ID
      const userId = await getUserId(agent);
      
      // Parse due date using AI
      const { due, dueTimestamp } = await parseDueDateWithAI(taskDescription);
      
      // Clean up the task text by removing common prefixes
      let cleanText = taskDescription
        .replace(/^(remind me to|add task|create task|task:|add|create)\s*/i, '')
        .trim();
      
      // If we found a due date, remove date/time phrases from the main text
      if (due) {
        cleanText = cleanText
          .replace(/\s*(before|by|at|on|until|due)\s+[^,.\n]*$/i, '')
          .replace(/\s*(before|by|at|on|until|due)\s+[^,]*,?/i, '')
          .trim();
      }
      
      const id = Date.now().toString();
      const createdAt = Date.now();
      
      // Insert the task into the database
      await agent.sql`
        INSERT INTO todos (id, text, due, dueTimestamp, completed, createdAt, userId)
        VALUES (${id}, ${cleanText}, ${due || null}, ${dueTimestamp || null}, FALSE, ${createdAt}, ${userId})
      `;
      
      let response = `✅ Added task: "${cleanText}"`;
      if (due) {
        response += ` (Due: ${due})`;
      }
      response += `\n\n💡 Your tasks persist across chat sessions. Clear this chat or start a new one - your tasks will still be here when you ask to check them!`;
      
      return response;
    } catch (error) {
      console.error('Error adding todo task:', error);
      return `❌ Failed to add task: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Tool to list all current todo tasks
 */
export const getTodoTasks = tool({
  description: "Get all current todo tasks from the user's todo list. Use this when the user wants to check their tasks, see what they need to do, or review their todo list. Shows tasks that persist across all chat sessions.",
  inputSchema: z.object({
    includeCompleted: z.boolean().optional().describe("Whether to include completed tasks in the list")
  }),
  execute: async ({ includeCompleted = false }) => {
    try {
      const { agent } = getCurrentAgent<Chat>();
      
      if (!agent) {
        return "❌ Agent context not available";
      }
      
      // Initialize the table if needed
      await initializeTodoTable(agent);
      
      // Get user ID
      const userId = await getUserId(agent);
      
      // Query tasks from the database for this user
      const query = includeCompleted 
        ? agent.sql<TodoTask>`SELECT * FROM todos WHERE userId = ${userId} ORDER BY 
            CASE WHEN dueTimestamp IS NOT NULL THEN 0 ELSE 1 END,
            dueTimestamp ASC,
            createdAt ASC`
        : agent.sql<TodoTask>`SELECT * FROM todos WHERE userId = ${userId} AND completed = FALSE ORDER BY 
            CASE WHEN dueTimestamp IS NOT NULL THEN 0 ELSE 1 END,
            dueTimestamp ASC,
            createdAt ASC`;
      
      const tasks: TodoTask[] = [];
      for await (const row of query) {
        tasks.push({
          id: row.id,
          text: row.text,
          due: row.due || undefined,
          dueTimestamp: row.dueTimestamp || undefined,
          completed: Boolean(row.completed),
          createdAt: row.createdAt,
          userId: row.userId
        });
      }
      
      if (tasks.length === 0) {
        return includeCompleted 
          ? "📝 Your todo list is empty! You can add tasks by saying something like 'remind me to do homework' or 'add task: call mom'."
          : "🎉 All your tasks are completed! You can add new tasks or include completed tasks to see your full history.";
      }
      
      let response = `📝 **Your Todo List** (${tasks.length} task${tasks.length === 1 ? '' : 's'}):\n\n`;
      
      tasks.forEach((task, index) => {
        const status = task.completed ? '✅' : '⭕';
        const number = index + 1;
        let line = `${number}. ${status} ${task.text}`;
        
        if (task.due) {
          line += ` *(Due: ${task.due})*`;
        }
        
        response += line + '\n';
      });
      
      if (!includeCompleted) {
        // Check if there are any completed tasks
        const completedQuery = agent.sql<{count: number}>`SELECT COUNT(*) as count FROM todos WHERE userId = ${userId} AND completed = TRUE`;
        let completedCount = 0;
        for await (const row of completedQuery) {
          completedCount = row.count;
        }
        
        if (completedCount > 0) {
          response += `\n💡 You have ${completedCount} completed task${completedCount === 1 ? '' : 's'}. Ask me to include completed tasks to see them.`;
        }
      }
      
      response += `\n\n🔄 These tasks persist across all your chat sessions.`;
      
      return response;
    } catch (error) {
      console.error('Error getting todo tasks:', error);
      return `❌ Failed to get tasks: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Tool to complete or uncomplete a todo task
 */
export const toggleTodoTask = tool({
  description: "Mark a todo task as completed or uncompleted. Use this when the user indicates they've finished a task or wants to mark something as done.",
  inputSchema: z.object({
    taskIdentifier: z.string().describe("The task identifier - can be the position number (1, 2, 3), part of the task text (e.g., 'homework'), or the exact task ID"),
    completed: z.boolean().describe("Whether to mark the task as completed (true) or uncompleted (false)")
  }),
  execute: async ({ taskIdentifier, completed }) => {
    try {
      const { agent } = getCurrentAgent<Chat>();
      
      if (!agent) {
        return "❌ Agent context not available";
      }
      
      // Initialize the table if needed
      await initializeTodoTable(agent);
      
      // Get user ID
      const userId = await getUserId(agent);
      
      // Find the task using the flexible identifier
      const task = await findTaskByIdentifier(agent, userId, taskIdentifier);
      
      if (!task) {
        return `❌ Task not found. I couldn't find a task matching "${taskIdentifier}". Please check your task list and try using the task number (1, 2, 3...) or part of the task description.`;
      }
      
      // Update the task
      await agent.sql`UPDATE todos SET completed = ${completed} WHERE id = ${task.id} AND userId = ${userId}`;
      
      const action = completed ? 'completed' : 'uncompleted';
      return `✅ Task "${task.text}" marked as ${action}!`;
    } catch (error) {
      console.error('Error toggling todo task:', error);
      return `❌ Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Tool to remove a todo task completely
 */
export const removeTodoTask = tool({
  description: "Remove a todo task completely from the user's todo list. Use this when the user wants to delete or remove a task entirely.",
  inputSchema: z.object({
    taskIdentifier: z.string().describe("The task identifier - can be the position number (1, 2, 3), part of the task text (e.g., 'homework'), or the exact task ID")
  }),
  execute: async ({ taskIdentifier }) => {
    try {
      const { agent } = getCurrentAgent<Chat>();
      
      if (!agent) {
        return "❌ Agent context not available";
      }
      
      // Initialize the table if needed
      await initializeTodoTable(agent);
      
      // Get user ID
      const userId = await getUserId(agent);
      
      // Find the task using the flexible identifier
      const task = await findTaskByIdentifier(agent, userId, taskIdentifier);
      
      if (!task) {
        return `❌ Task not found. I couldn't find a task matching "${taskIdentifier}". Please check your task list and try using the task number (1, 2, 3...) or part of the task description.`;
      }
      
      // Delete the task
      await agent.sql`DELETE FROM todos WHERE id = ${task.id} AND userId = ${userId}`;
      
      return `🗑️ Removed task: "${task.text}"`;
    } catch (error) {
      console.error('Error removing todo task:', error);
      return `❌ Failed to remove task: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});

/**
 * Tool to clear all todo tasks
 */
export const clearAllTodoTasks = tool({
  description: "Remove all todo tasks from the user's todo list. Use this when the user wants to clear all tasks or start fresh.",
  inputSchema: z.object({
    includeCompleted: z.boolean().optional().describe("Whether to also clear completed tasks (default: true)")
  }),
  execute: async ({ includeCompleted = true }) => {
    try {
      const { agent } = getCurrentAgent<Chat>();
      
      if (!agent) {
        return "❌ Agent context not available";
      }
      
      // Initialize the table if needed
      await initializeTodoTable(agent);
      
      // Get user ID
      const userId = await getUserId(agent);
      
      // Count tasks before deletion
      const countQuery = includeCompleted
        ? agent.sql<{count: number}>`SELECT COUNT(*) as count FROM todos WHERE userId = ${userId}`
        : agent.sql<{count: number}>`SELECT COUNT(*) as count FROM todos WHERE userId = ${userId} AND completed = FALSE`;
      
      let taskCount = 0;
      for await (const row of countQuery) {
        taskCount = row.count;
      }
      
      if (taskCount === 0) {
        return includeCompleted 
          ? "📝 Your todo list is already empty!"
          : "📝 You have no pending tasks to clear!";
      }
      
      // Delete the tasks
      if (includeCompleted) {
        await agent.sql`DELETE FROM todos WHERE userId = ${userId}`;
      } else {
        await agent.sql`DELETE FROM todos WHERE userId = ${userId} AND completed = FALSE`;
      }
      
      const taskType = includeCompleted ? "all" : "pending";
      return `🗑️ Cleared ${taskCount} ${taskType} task${taskCount === 1 ? '' : 's'} from your todo list!`;
    } catch (error) {
      console.error('Error clearing todo tasks:', error);
      return `❌ Failed to clear tasks: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
});
