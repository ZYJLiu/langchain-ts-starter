import { OpenAI } from "langchain"
import { initializeAgentExecutor } from "langchain/agents"
import { SerpAPI, Calculator, ChainTool } from "langchain/tools"
import { VectorDBQAChain } from "langchain/chains"
import { HNSWLib } from "langchain/vectorstores"
import { OpenAIEmbeddings } from "langchain/embeddings"
import * as fs from "fs"
import path from "node:path"
import url from "node:url"

const filePath = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  "../../bitcoin"
)
const model = new OpenAI({ temperature: 0 })
const vectorStore = await HNSWLib.load(filePath, new OpenAIEmbeddings())
const chain = VectorDBQAChain.fromLLM(model, vectorStore)

export const qaTool = new ChainTool({
  name: "bitcoin_whitepaper",
  description: "Answer questions about the bitcoin.",
  chain: chain,
  returnDirect: true,
})
