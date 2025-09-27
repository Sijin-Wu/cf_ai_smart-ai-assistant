# 🤖 Amazing AI Function-calling
To-do, Task Schedule, Weather, Time and more!

## ✨ Key Features

### 🤖 AI Chat Interface
- 💬 Interactive chat interface with streaming responses
- 🛠️ Built-in tool system for task management, weather, time, and location
- 🌓 Dark/Light theme support
- 🎨 Modern, responsive UI

### 📋 Smart Todo Management
- 🗣️ **Natural Language Input**: "remind me to do homework before Sep 27" 
- 🧠 **AI-Powered Date Parsing**: Automatically extracts due dates and times
- 💾 **Cross-Session Persistence**: Tasks survive chat history clearing
- 🔢 **Flexible Task Management**: Reference tasks by number, name, or partial text
- ⏰ **Smart Scheduling**: Supports relative dates ("tomorrow", "next week")

### 🌦️ Weather & Location Services
- 🌍 **Weather Information**: Get current weather for any city worldwide
- 📍 **Location Detection**: Automatic IP-based location detection
- 🕐 **Time Services**: Local time information with timezone support

### 📅 Task Scheduling
- 📆 One-time, delayed, and recurring tasks via cron expressions
- ⚡️ Real-time task execution and notificationst - Chat Agent Starter Kit

![npm i agents command](./npm-agents-banner.svg)

<a href="https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/agents-starter"><img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/></a>

An AI-powered chat agent with intelligent todo list management, built using Cloudflare's Agent platform and powered by [`agents`](https://www.npmjs.com/package/agents). This project demonstrates how to create interactive chat experiences with persistent data storage and natural language processing capabilities.

## ✨ Key Features

### 🤖 AI Chat Interface
- 💬 Interactive chat interface with streaming responses
- 🛠️ Built-in tool system with human-in-the-loop confirmation
- 🌓 Dark/Light theme support
- 🎨 Modern, responsive UI

### � Smart Todo Management
- 🗣️ **Natural Language Input**: "remind me to do homework before Sep 27" 
- 🧠 **AI-Powered Date Parsing**: Automatically extracts due dates and times
- 💾 **Cross-Session Persistence**: Tasks survive chat history clearing
- 🔢 **Flexible Task Management**: Reference tasks by number, name, or partial text
- ⏰ **Smart Scheduling**: Supports relative dates ("tomorrow", "next week")

### 📅 Advanced Task Scheduling
- 📆 One-time, delayed, and recurring tasks via cron expressions
- ⚡️ Real-time task execution and notifications
- 🔄 State management and chat history

### �️ Built-in Tools
- **Weather Information**: Get weather data for any location
- **Time Services**: Local time information with location detection
- **Location Services**: IP-based location detection

## 🚀 Quick Start

### Prerequisites
- Cloudflare account
- OpenAI API key

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [Cloudflare account](https://cloudflare.com) (for deployment)
- [OpenAI API key](https://platform.openai.com/api-keys)

### 🖥️ Local Development

1. **Clone and install:**
```bash
# Clone the repository
git clone <your-repo-url>
cd agents-starter

# Install dependencies
npm install
```

2. **Set up environment:**
Create `.dev.vars` file in the root directory:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

3. **Start development server:**
```bash
npm start
```

4. **Open your browser:**
Navigate to `http://localhost:5173` to start chatting!

### ☁️ Remote Deployment (Cloudflare Workers)

1. **Install Wrangler CLI:**
```bash
npm install -g wrangler
```

2. **Authenticate with Cloudflare:**
```bash
wrangler login
```

3. **Upload your OpenAI API key:**
```bash
wrangler secret bulk .dev.vars
```

4. **Deploy to production:**
```bash
npm run deploy
```

5. **Access your deployed agent:**
After deployment, you'll get a URL like `https://your-agent.your-subdomain.workers.dev`

### 🔧 Troubleshooting

- **Missing OpenAI API Key**: Make sure your `.dev.vars` file contains a valid OpenAI API key
- **Port conflicts**: If port 5173 is busy, Vite will automatically use the next available port
- **Cloudflare deployment issues**: Ensure you're logged into Wrangler and have the necessary permissions

## 📱 How to Use the AI Agent

Once your agent is running (locally or deployed), you can interact with it using natural language. Here are examples of what you can ask:

### 📋 Todo Management Examples

**Adding Tasks:**
```
🧑 "remind me to do homework before Sep 27"
🧑 "add task: call mom tomorrow at 3pm"  
🧑 "I need to prepare a gift for Jenny by September 29"
🧑 "schedule a meeting next Tuesday morning"
🧑 "Add a task of completing homework 1"
```

**Managing Tasks:**
```
🧑 "check my tasks" or "what do I need to do?"
🧑 "mark homework as done" or "finish task 1"
🧑 "complete the first task"
🧑 "remove the gift task" or "delete task 2"  
🧑 "clear all tasks" or "clear pending tasks"
🧑 "show completed tasks too"
```

### 🌦️ Weather Information Examples

**Get Weather Data:**
```
🧑 "What's the weather like?"
🧑 "Show me the weather in New York"
🧑 "How's the weather in Tokyo today?"
🧑 "What's the current temperature in London?"
🧑 "Weather forecast for San Francisco"
```

### 🕐 Time & Location Examples

**Time Information:**
```
🧑 "What time is it?"
🧑 "Current time in Paris"
🧑 "Show me the time in different timezones"
🧑 "What's the local time in Sydney?"
```

**Location Services:**
```
🧑 "Where am I?"
🧑 "What's my current location?"
🧑 "Detect my location"
```

### 📅 Task Scheduling Examples

**Schedule Tasks:**
```
🧑 "Schedule a call to Jenny at 3pm"
🧑 "Remind me in 30 minutes to take a break"
🧑 "Set up a recurring reminder every Monday at 9am"
🧑 "Schedule a task for next Friday at 2pm"
```

### 🎯 Cross-Session Persistence Demo

Try this to see the persistence feature:
1. **Add tasks**: "remind me to buy groceries tomorrow"
2. **Clear chat history**: Click the 🗑️ button in the top right
3. **Check tasks**: "what are my tasks?"
4. **Result**: Your tasks will still be there! 🎉

### 💬 Natural Conversation

The AI understands context and can handle follow-up questions:
```
🧑 "Add a task to call John tomorrow"
🤖 "✅ Added task: call John (Due: Tomorrow)"

🧑 "Actually, make that at 2pm"
🤖 "I'll help you update that task with the specific time..."

🧑 "Show my tasks"
🤖 "📝 Your Todo List (1 task): 1. ⭕ call John (Due: Tomorrow at 2:00 PM)"
```

5. Deploy:

```bash
npm run deploy
```

## 🏗️ Project Structure

```
├── src/
│   ├── app.tsx              # Chat UI implementation
│   ├── server.ts            # Chat agent logic & core functionality
│   ├── tools.ts             # Tool registration and definitions
│   ├── utils.ts             # Helper functions
│   ├── styles.css           # UI styling
│   ├── tools/               # Individual tool implementations
│   │   ├── todo.ts          # ⭐ Smart todo list management
│   │   ├── weather.ts       # Weather information service
│   │   ├── time.ts          # Time and location services
│   │   └── location.ts      # IP-based location detection
│   ├── components/          # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   └── providers/          # Context providers
├── wrangler.jsonc          # Cloudflare Workers configuration
├── package.json            # Dependencies and scripts
├── README.md               # This file
└── PROMPTS.md              # AI prompts used in development
```

## 🛠️ Technical Implementation

### Todo System Architecture

The todo system demonstrates advanced patterns for building persistent AI tools:

1. **Natural Language Processing**: Uses OpenAI GPT-4 to parse user input and extract:
   - Task descriptions (cleaned of common prefixes)
   - Due dates and times (converted to timestamps)
   - User intent (add, complete, remove, list)

2. **Database Design**: 
   - SQLite storage with automatic migrations
   - User-based partitioning for multi-user support
   - Flexible task identification (by position, text, or ID)

3. **Cross-Session Persistence**:
   - Tasks stored in agent's SQLite database, not chat history
   - User identification system for task ownership
   - Automatic database schema migrations

4. **Smart Task Management**:
   - Reference tasks by number: "mark task 1 as done"
   - Reference by partial text: "finish the homework task"  
   - Reference by exact ID: technical identifier support

## 🛠️ Available Tools

The agent comes with several built-in tools that activate automatically based on your natural language input:

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `addTodoTask` | Create new tasks with natural language | "remind me to call mom tomorrow" |
| `getTodoTasks` | List current tasks, sorted by due date | "check my tasks", "show completed tasks too" |
| `toggleTodoTask` | Mark tasks complete/incomplete | "mark task 1 as done", "finish homework" |
| `removeTodoTask` | Delete specific tasks | "remove task 2", "delete the gift task" |
| `clearAllTodoTasks` | Clear all or pending tasks | "clear all tasks", "clear pending tasks" |
| `getWeatherInformation` | Get weather data for any location | "weather in Tokyo", "how's the weather?" |
| `getLocalTime` | Get current time with location detection | "what time is it?", "time in London" |
| `getCurrentLocation` | Detect user location via IP | "where am I?", "what's my location?" |
| `scheduleTask` | Schedule tasks for future execution | "remind me in 30 minutes", "schedule for 3pm" |
| `getScheduledTasks` | List all scheduled tasks | "show my scheduled tasks" |
| `cancelScheduledTask` | Cancel a scheduled task | "cancel task [task-id]" |

## 🎯 Customization Guide

### Adding New Tools

The project structure makes it easy to add new tools. Here's a simple example:

```typescript
// In src/tools/your-tool.ts
import { tool } from "ai";
import { z } from "zod/v3";

export const yourNewTool = tool({
  description: "Clear description of what the tool does and when to use it",
  inputSchema: z.object({
    parameter1: z.string().describe("Description of parameter"),
  }),
  execute: async ({ parameter1 }) => {
    // Your tool logic here
    return `✅ Success: ${parameter1}`;
  }
});

// Register in src/tools/index.ts
export { yourNewTool } from "./your-tool";

// Add to main tools in src/tools.ts
import { yourNewTool } from "./tools/your-tool";

export const tools = {
  // ... existing tools
  yourNewTool
} satisfies ToolSet;
```

### Modifying the UI

The chat interface can be customized in `src/app.tsx`:
- **Theme Colors**: Update CSS variables in `src/styles.css`
- **Message Styling**: Modify the message rendering components
- **Header Controls**: Add new buttons or status indicators

### Using Different AI Models

Replace the OpenAI integration in `src/server.ts`:

```typescript
// Current: OpenAI GPT-4
import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4o-2024-11-20");

// Alternative: Anthropic Claude
import { anthropic } from "@ai-sdk/anthropic";
const model = anthropic("claude-3-5-sonnet-20241022");
```

## 🌍 Environment Variables

### Required for all deployments:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Optional configurations:
```env
# Custom model configuration (default: gpt-4o-2024-11-20)
MODEL_NAME=gpt-4o

# AI Gateway (for Cloudflare AI Gateway)
GATEWAY_BASE_URL=your_gateway_url
```

## 🎓 Example Extensions

Here are some ideas for extending the current system:

### Enhanced Todo System
- **Categories/Tags**: "add work task: finish report"
- **Priority Levels**: "high priority: call doctor tomorrow"  
- **Recurring Tasks**: "remind me to take medicine daily at 8am"

### Additional Tools
- **Email Integration**: "draft an email to John about the meeting"
- **Calendar Integration**: "schedule a meeting with the team"
- **Note Taking**: "save this note: important project requirements"

## 🛠️ Technical Architecture

### Core Components
- **Agent Framework**: Cloudflare Agents for scalable AI interactions
- **AI Integration**: OpenAI GPT-4 for natural language understanding
- **Database**: SQLite for persistent data storage
- **UI**: React with TypeScript for the chat interface
- **Deployment**: Cloudflare Workers for edge computing

### Data Persistence
- **SQLite Database**: Embedded database with full SQL support
- **User Isolation**: Tasks are separated by user ID
- **Schema Migrations**: Automatic database updates
- **Cross-Session**: Data persists across chat sessions

## 📚 Learn More

### Documentation
- [`agents`](https://github.com/cloudflare/agents/blob/main/packages/agents/README.md) - Core agent framework
- [Cloudflare Agents](https://developers.cloudflare.com/agents/) - Official documentation
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling) - Tool integration
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Deployment platform

## 📜 License

MIT License - see LICENSE file for details.

---

**🎉 Ready to build your own AI agent?** 

This project demonstrates how to create intelligent applications with natural language processing, persistent data storage, and user-friendly AI interactions.

**Built with ❤️ using AI-assisted development** - See [PROMPTS.md](PROMPTS.md) for the full development journey.
