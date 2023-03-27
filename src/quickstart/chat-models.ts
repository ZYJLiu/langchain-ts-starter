//  npm run start ./quickstart/chat-models.ts
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

export async function run() {
  const chat = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 1,
    streaming: true,
    verbose: true,
    callbackManager,
  })

  // Chat Models: Message in, Message out
  const response = await chat.call([
    new HumanChatMessage(
      "Translate this sentence from English to French. I love programming."
    ),
  ])

  console.log(JSON.stringify(response, null, 2))

  const responseA = await chat.generate([
    [
      new SystemChatMessage(
        "You are a helpful assistant that translates English to French."
      ),
      new HumanChatMessage(
        "Translate this sentence from English to French. I love programming."
      ),
    ],
    [
      new SystemChatMessage(
        "You are a helpful assistant that translates English to French."
      ),
      new HumanChatMessage(
        "Translate this sentence from English to French. I love artificial intelligence."
      ),
    ],
  ])

  console.log(responseA)

  // Chat Prompt Templates: Manage Prompts for Chat Models
  const translationPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "You are a helpful assistant that translates {input_language} to {output_language}."
    ),
    HumanMessagePromptTemplate.fromTemplate("{text}"),
  ])

  const responseB = await chat.generatePrompt([
    await translationPrompt.formatPromptValue({
      input_language: "English",
      output_language: "French",
      text: "I love programming.",
    }),
  ])

  console.log(responseB)

  // Model + Prompt = LLMChain
  const chain = new LLMChain({
    prompt: translationPrompt,
    llm: chat,
  })

  const responseC = await chain.call({
    input_language: "English",
    output_language: "French",
    text: "I love programming.",
  })

  console.log(responseC)

  // Agents: Dynamically Run Chains Based on User Input
  const tools = [new SerpAPI()]

  const agent = ChatAgent.fromLLMAndTools(chat, tools)

  const executor = AgentExecutor.fromAgentAndTools({ agent, tools })

  const responseD = await executor.run(
    "How many people live in canada as of 2023??"
  )

  console.log(responseD)

  // Memory: Add State to Chains and Agents
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know."
    ),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}"),
  ])

  const chain2 = new ConversationChain({
    memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
    prompt: chatPrompt,
    llm: chat,
  })

  const responseE = await chain2.call({
    input: "How many people live in the world?",
  })

  console.log(responseE)

  const responseF = await chain2.call({
    input: "What was the previous question?",
  })

  console.log(responseF)
}
