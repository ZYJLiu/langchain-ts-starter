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
    modelName: "gpt-4",
    temperature: 0,
    streaming: true,
    verbose: true,
    callbackManager,
  })

  // Memory: Add State to Chains and Agents
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a focused AI assistant programmed to ask the user for specific information, including their name, age, and favorite color.
      Engage in a conversation with the user, only asking questions related to these three pieces of information.
      Continue the dialogue only focused on collecting all the required data.
      Once you have obtained all the information, provide a summary of the details you have collected.
      Limit your responses to either requesting the necessary information or presenting the collected data.
      If the user's input is not related to the requested information, politely redirect the conversation by repeating your request for the pertinent information.
      `
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
