//  npm run start ./misc/chat.ts
import { ChatOpenAI } from "langchain/chat_models"
import { HumanChatMessage, SystemChatMessage } from "langchain/schema"
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "langchain/prompts"
import { ConversationChain, LLMChain } from "langchain/chains"

import { callbackManager } from "../utils.js"
import { BufferMemory } from "langchain/memory"
import { SerpAPI } from "langchain/tools"
import { AgentExecutor, ChatAgent } from "langchain/agents"
import prompts from "prompts"

export async function run() {
  const chat = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 1,
    streaming: true,
    verbose: true,
    callbackManager,
  })

  // Memory: Add State to Chains and Agents
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know."
    ),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ])

  const chain = new ConversationChain({
    memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
    prompt: chatPrompt,
    llm: chat,
  })

  await loop(chain)
}

async function loop(chain: any) {
  const questionCLIPrompt = await prompts({
    type: "text",
    name: "input",
    message: "Input:",
  })

  const userMessage = {
    content: questionCLIPrompt.input,
  }

  const response = await chain.call({ input: userMessage.content })
  console.log("Response:", response.response)

  await loop(chain)
}
