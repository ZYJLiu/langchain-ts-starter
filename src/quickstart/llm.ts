//  npm run start ./quickstart/llm.ts
import { OpenAI } from "langchain"
import { PromptTemplate } from "langchain/prompts"
import { LLMChain } from "langchain/chains"
import { initializeAgentExecutor } from "langchain/agents"
import { SerpAPI, Calculator } from "langchain/tools"
import { BufferMemory } from "langchain/memory"
import { ConversationChain } from "langchain/chains"

import { callbackManager } from "../utils.js"

export async function run() {
  const model = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 1,
    streaming: true,
    verbose: true,
    callbackManager,
  })

  // LLMs: Get Predictions from a Language Model
  const res = await model.call(
    "What would be a good company name a company that makes colorful socks?"
  )
  console.log(res)

  // Prompt Templates: Manage Prompts for LLMs
  const template = "What is a good name for a company that makes {product}?"
  const prompt = new PromptTemplate({
    template: template,
    inputVariables: ["product"],
  })

  // Chains: Combine LLMs and Prompts in Multi-Step Workflows
  const res2 = await prompt.format({ product: "colorful socks" })
  console.log(res2)

  const chain = new LLMChain({ llm: model, prompt: prompt })

  const res3 = await chain.call({ product: "colorful socks" })
  console.log(res3)

  // Agents: Dynamically Run Chains Based on User Input
  const tools = [new SerpAPI(), new Calculator()]
  const executor = await initializeAgentExecutor(
    tools,
    model,
    "zero-shot-react-description"
  )
  console.log("Loaded agent.")

  const input =
    "Who is the founder of the Solana blockchain?" +
    "What is his current age raised to the 0.23 power?"
  console.log(`Executing with input "${input}"...`)

  const result = await executor.call({ input })

  console.log(`Got output ${result.output}`)

  // Memory: Add State to Chains and Agents
  const memory = new BufferMemory()
  const chain2 = new ConversationChain({ llm: model, memory: memory })
  const res4 = await chain2.call({ input: "Hi! I'm John." })
  console.log(res4)
  const res5 = await chain2.call({ input: "What's my name?" })
  console.log(res5)
}
