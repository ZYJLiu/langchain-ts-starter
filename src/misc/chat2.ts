//  npm run start ./misc/chat.ts
import { ChatOpenAI } from "langchain/chat_models"
import { HumanChatMessage, SystemChatMessage } from "langchain/schema"
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "langchain/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import {
  ChatVectorDBQAChain,
  ConversationChain,
  LLMChain,
  loadQAChain,
} from "langchain/chains"
import { HNSWLib } from "langchain/vectorstores"
import { OpenAIEmbeddings } from "langchain/embeddings"
import { callbackManager } from "../utils.js"
import { BufferMemory } from "langchain/memory"
import { z } from "zod"
import prompts from "prompts"
import path from "node:path"
import url from "node:url"
import { OpenAIChat } from "langchain/llms"

export async function run() {
  const filePath = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "../../data"
  )

  const loadedVectorStore = await HNSWLib.load(filePath, new OpenAIEmbeddings())

  const CONDENSE_PROMPT = PromptTemplate.fromTemplate(`
    Summarize the following conversation. Return the summarized conversation. And the new question.

    Chat History:
    {chat_history}

    Input: {question}

    Output:`)

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      // data: z.object({
      //   Intent: z
      //     .string()
      //     .optional()
      //     .describe("Intent of user's question matched to context"),
      //   Similarity: z
      //     .string()
      //     .optional()
      //     .describe(
      //       "Cosine similarity score of user's question to each intent compared to the context"
      //     ),
      // }),
      message: z.string().describe("AI response to user's question"),
    })
  )

  const formatInstructions = parser.getFormatInstructions()

  const QA_PROMPT = PromptTemplate.fromTemplate(
    `
    Answer the question.


    Question: {question}

    {format_instructions}`,
    { partialVariables: { format_instructions: formatInstructions } }
  )
  // Context:[{context}]

  const chat = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 1,
    streaming: true,
    verbose: true,
    callbackManager,
  })

  const questionGenerator = new LLMChain({
    llm: chat,
    prompt: CONDENSE_PROMPT,
  })

  const docChain = loadQAChain(chat, { prompt: QA_PROMPT })

  const chain = new ChatVectorDBQAChain({
    vectorstore: loadedVectorStore,
    combineDocumentsChain: docChain,
    questionGeneratorChain: questionGenerator,
    returnSourceDocuments: true,
    k: 3, //number of source documents to return
  })

  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
  })

  // // Memory: Add State to Chains and Agents
  // const chatPrompt = ChatPromptTemplate.fromPromptMessages([
  //   SystemMessagePromptTemplate.fromTemplate(
  //     "The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know."
  //   ),
  //   new MessagesPlaceholder("history"),
  //   HumanMessagePromptTemplate.fromTemplate("{input}"),
  // ])

  // const chain = new ConversationChain({
  //   memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
  //   prompt: chatPrompt,
  //   llm: chat,
  // })

  await loop(chain, memory)
}

async function loop(chain: any, memory: BufferMemory) {
  const questionCLIPrompt = await prompts({
    type: "text",
    name: "question",
    message: "Input:",
  })

  const userMessage = {
    content: questionCLIPrompt.question,
  }

  memory.chatHistory.addUserMessage(questionCLIPrompt.question)

  const response = await chain.call({
    question: userMessage.content,
    chat_history: JSON.stringify(memory.chatHistory.messages, null, 2),
  })
  console.log("Response:", response)
  console.log("Response:", response.text)

  memory.chatHistory.addAIChatMessage(response.text)

  await loop(chain, memory)
}
