# 🤖 AI Prompts Used in Development

This document contains all the AI prompts and interactions used to develop the intelligent todo list agent system. This serves as documentation for the AI-assisted development process and can help others understand the thought process behind the implementation.

## 📋 Initial Project Setup

### Main Development Request
```
Add a todo list tool to the tools that AI can call. 1. User can use natural language like "remind me to do homework before Sep 27" or "Have dinner with Jenny at 7pm" 2. The AI detects that the user needs to add a todo task, and store the task in localStorage or chat history. 3. When use check the current todos (e.g. "check tasks"), show the listed tasks stored now.
```

**AI Response Strategy**: Created a comprehensive todo system using OpenAI for natural language processing and SQLite for persistence.

## 🔧 Technical Implementation Prompts

### Architecture Decision Prompt
```
Please don't use naive string match to detect the user's intentions. Change it to proper prompts and calls to OpenAI to detect, in similar ways as we detect the weather / time check tools we implemented. Check my current tools and scrutinize my codebase (especially the tools.ts) to better implement the todo tool.
```

**Key Insight**: This led to examining the existing tool patterns and implementing a proper AI SDK-based approach instead of regex matching.

### Persistence Architecture Prompt
```
Help me debug with a problem: current version successfully supports add task by natural language. But it does not persist. After I add many tasks and ask "Check current tasks" it returns an empty list and the AI tells me there's no tasks to do.
```

**Solution Applied**: Identified that localStorage only exists in browser context, but tools run on server-side. Migrated to agent's built-in SQLite database.

### Cross-Session Persistence Request
```
I'd like it persist even if the user clears the chat history or create a new chat. For example: "Do hw1 before tomorrow" -> clear history -> "Check tasks", it should show the unfinished hw1. Please help to deal with this. Each user's task list is independent, but each chat session shares a task list created by the current logging user
```

**Implementation**: Added user-based storage system with SQLite database migrations and user identification.

### Task Management Issues
```
It seems that it can't deal with the modification (e.g. mark doing homework 1 as finished) or deletion (e.g. clear all tasks). It has problem searching tasks by ID. Finish the task homework 1
```

**Problem Identified**: Task IDs were timestamps but UI showed sequential numbers. AI was trying to use display numbers as actual IDs.

## 🧠 Natural Language Processing Prompts

### Date Parsing Prompt (Used in Code)
```javascript
Parse the following text and extract any time/date information. Current date is ${new Date().toISOString().split('T')[0]}. 

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

Return only valid JSON, no other text.
```

**Purpose**: This prompt enables the AI to understand various natural language date/time expressions and convert them to structured data.

## 🗄️ Database Design Prompts

### Schema Migration Prompt
```typescript
// Automatic database migration logic
// Check if userId column exists by trying to query it
let hasUserIdColumn = false;
try {
  await agent.sql`SELECT userId FROM todos LIMIT 1`;
  hasUserIdColumn = true;
} catch (error) {
  // Column doesn't exist, we need to add it
  hasUserIdColumn = false;
}
```

**Context**: This pattern emerged from debugging SQLite schema evolution issues when adding user-based partitioning to existing todo tables.

### User Identification Strategy
```typescript
// For now, we'll use a simple approach: one user per agent instance
// In a real application, you might use IP address, authentication, or other methods
const agentId = "default_user"; // This could be enhanced to use actual user identification
```

**Design Decision**: Simplified user identification for MVP while maintaining architecture for future multi-user support.

## 🎯 Tool Description Prompts

### Tool Descriptions (from code)
```typescript
// addTodoTask description
"Add a new todo task to the user's todo list. Use this when the user wants to create a reminder, add a task, or schedule something to do. Tasks persist across chat sessions."

// getTodoTasks description  
"Get all current todo tasks from the user's todo list. Use this when the user wants to check their tasks, see what they need to do, or review their todo list. Shows tasks that persist across all chat sessions."

// toggleTodoTask description
"Mark a todo task as completed or uncompleted. Use this when the user indicates they've finished a task or wants to mark something as done."

// removeTodoTask description
"Remove a todo task completely from the user's todo list. Use this when the user wants to delete or remove a task entirely."

// clearAllTodoTasks description
"Remove all todo tasks from the user's todo list. Use this when the user wants to clear all tasks or start fresh."
```

**Strategy**: Clear, action-oriented descriptions that help the AI understand when to use each tool.

## 🔍 Debugging and Troubleshooting Prompts

### Task Identification Problem
```
Problem: AI trying to use "1", "2", "3" as task IDs but actual IDs are timestamps like "1727395200000"

Solution: Created flexible task finder that supports:
- Position-based: "1", "2", "3"  
- Text-based: "homework", "call mom"
- ID-based: "1727395200000"
```

### Error Handling Strategy
```typescript
// Enhanced error messages
return `❌ Task not found. I couldn't find a task matching "${taskIdentifier}". Please check your task list and try using the task number (1, 2, 3...) or part of the task description.`;
```

## 📝 Documentation Generation Prompts

### README Creation Request
```
include a README.md file with project documentation and clear running instructions to try out components (either locally or via deployed link). AI-assisted coding is encouraged, but you must include AI prompts used in PROMPTS.md
Help me complete such markdown files!!
```

**Approach**: Created comprehensive documentation including:
- Feature overview with examples
- Step-by-step setup instructions  
- Technical architecture explanation
- Usage examples and commands
- Deployment guide

## 🎨 User Experience Considerations

### Natural Language Examples
The system was designed to handle these natural language patterns:

```
Adding Tasks:
- "remind me to do homework before Sep 27"
- "add task: call mom tomorrow at 3pm"  
- "I need to prepare a gift for Jenny by September 29"
- "schedule a meeting next Tuesday morning"

Managing Tasks:
- "check my tasks" or "what do I need to do?"
- "mark homework as done" or "finish task 1"
- "remove the gift task" or "delete task 2"  
- "clear all tasks" or "clear all pending tasks"
```

### Persistence Messaging
```typescript
response += `\n\n💡 Your tasks persist across chat sessions. Clear this chat or start a new one - your tasks will still be here when you ask to check them!`;
```

**Purpose**: Educate users about the cross-session persistence feature.

## 🔄 Iterative Development Process

### Development Flow
1. **Initial Implementation**: Basic localStorage approach
2. **Problem Discovery**: Persistence issues with server-side execution
3. **Architecture Pivot**: Migration to SQLite with user-based storage
4. **UX Enhancement**: Flexible task identification and better error messages
5. **Feature Completion**: Added bulk operations and comprehensive tool set
6. **Documentation**: Created detailed README and this PROMPTS file

### Key Learning
The development process highlighted the importance of understanding the execution context (server vs browser) and designing for persistence and user experience from the beginning.

## 🚀 Deployment and Testing Prompts

### Testing Commands
```bash
# Local development testing
npm start
# Navigate to http://localhost:5173

# Production deployment  
wrangler secret bulk .dev.vars
npm run deploy
```

### User Testing Scenarios
1. **Basic Task Creation**: "remind me to buy groceries tomorrow"
2. **Cross-Session Test**: Add task → clear chat → "check tasks" 
3. **Natural Language Variation**: Try different ways to express the same intent
4. **Task Management**: Complete, remove, and bulk operations
5. **Date Parsing**: Test various date/time expressions

---

*This documentation demonstrates AI-assisted development with clear prompting strategies, iterative problem-solving, and comprehensive feature implementation.*