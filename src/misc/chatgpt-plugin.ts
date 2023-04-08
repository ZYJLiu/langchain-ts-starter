// npm run start ./misc/chatgpt-plugin.ts
import { ChatOpenAI } from "langchain/chat_models"
import { initializeAgentExecutor } from "langchain/agents"
import {
  RequestsGetTool,
  RequestsPostTool,
  AIPluginTool,
} from "langchain/tools"
import { callbackManager } from "utils.js"

export const run = async () => {
  const tools = [
    new RequestsGetTool(),
    new RequestsPostTool(),
    await AIPluginTool.fromPluginUrl(
      "https://www.klarna.com/.well-known/ai-plugin.json"
    ),
  ]
  const agent = await initializeAgentExecutor(
    tools,
    new ChatOpenAI({ temperature: 0 }),
    "chat-zero-shot-react-description",
    true,
    callbackManager
  )

  const result = await agent.call({
    input: "what phones are available in klarna?",
  })

  console.log({ result })
}
