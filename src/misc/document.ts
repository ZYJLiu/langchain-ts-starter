//  npm run start ./misc/document.ts

import path from "node:path"
import url from "node:url"

import { HNSWLib } from "langchain/vectorstores"
import { OpenAIEmbeddings } from "langchain/embeddings"

import { OpenAIChat } from "langchain/llms"
import { LLMChain, ChatVectorDBQAChain, loadQAChain } from "langchain/chains"
import { PromptTemplate } from "langchain/prompts"
import { callbackManager } from "utils.js"
import { BufferMemory } from "langchain/memory"
import { StructuredOutputParser } from "langchain/output_parsers"
import { z } from "zod"

export async function run() {
  const filePath = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "../../data"
  )

  const loadedVectorStore = await HNSWLib.load(filePath, new OpenAIEmbeddings())

  // const result = await loadedVectorStore.similaritySearchWithScore(
  //   "write a poem about bananas",
  //   3
  // )
  // console.log(result)
  // // @ts-ignore
  // console.log(result[0][0].pageContent)

  const CONDENSE_PROMPT =
    PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

    Chat History:
    {chat_history}
    Follow Up Input: {question}
    Standalone question:`)

  // const parser = StructuredOutputParser.fromNamesAndDescriptions({
  //   IntendDescription: "Intend Description",
  //   CosineSimilarity: "Cosine Similarity",
  // })

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      Intent: z
        .string()
        .optional()
        .describe("Intent of user's question matched to context"),
      Similarity: z
        .string()
        .optional()
        .describe("cosine similarity score of user's question to each intent"),
    })
  )

  const formatInstructions = parser.getFormatInstructions()

  const QA_PROMPT = PromptTemplate.fromTemplate(
    `Return only the respective "Intent Description" of the "User Request" from the context with the highest cosine similarity to the question and the cosine similarity score if > 0.

    Context:[{context}]

    Question: {question}

    {format_instructions}`,
    { partialVariables: { format_instructions: formatInstructions } }
  )

  // If there is no clear similarity, reply with "Hmm, can you reword the question?" and return the most similar one.
  // Consider an intent to be similar if it shares a common theme or goal.

  const questionGenerator = new LLMChain({
    llm: new OpenAIChat({ temperature: 0 }),
    prompt: CONDENSE_PROMPT,
  })

  const docChain = loadQAChain(
    new OpenAIChat({
      temperature: 0,
      modelName: "gpt-3.5-turbo",
      streaming: false,
      callbackManager: callbackManager,
    }),
    { prompt: QA_PROMPT }
  )

  const chain = new ChatVectorDBQAChain({
    vectorstore: loadedVectorStore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 3, //number of source documents to return
  })

  const response = await chain.call({
    question: "write a poem about bananas",
    chat_history: [],
  })

  console.log("Response:", response.text)

  // const response2 = await chain.call({
  //   question: "Create a template for an activity plan for a 3rd grade class",
  //   chat_history: [],
  // })

  // console.log(response2.text)
}
