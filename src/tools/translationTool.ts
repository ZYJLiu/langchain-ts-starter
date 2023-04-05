import { DynamicTool } from "langchain/tools"
import { ChatOpenAI } from "langchain/chat_models"
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "langchain/prompts"
import {
  ChatVectorDBQAChain,
  ConversationChain,
  LLMChain,
} from "langchain/chains"
import { callbackManager } from "../utils.js"
import { BufferMemory } from "langchain/memory"
import prompts from "prompts"

export const translationTool = new DynamicTool({
  name: "translation_tool",
  description: `
  You are a focused AI assistant programmed to translate "text" from one language to another.
  The input is a JSON object with the following fields in the following format:
  {{input_language, output_language, text}}
    `,
  func: async (input: string) => {
    const { input_language, output_language, text } = JSON.parse(input)
    console.log("INPUT LANGUAGE:", input_language)
    console.log("OUTPUT LANGUAGE:", output_language)
    console.log("TEXT:", text)
    console.log("TRANSLATION INPUT:", input)

    const chat = new ChatOpenAI({
      modelName: "gpt-4",
      // modelName: "gpt-3.5-turbo",
      temperature: 1,
      // streaming: true,
      verbose: true,
      callbackManager,
    })

    // Chat Prompt Templates: Manage Prompts for Chat Models
    const translationPrompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        "You are a helpful assistant that translates {input_language} to {output_language}."
      ),
      HumanMessagePromptTemplate.fromTemplate("{text}"),
    ])

    // Model + Prompt = LLMChain
    const chain = new LLMChain({
      prompt: translationPrompt,
      llm: chat,
    })

    const response = await chain.call({
      input_language: input_language,
      output_language: output_language,
      text: text,
    })

    console.log("Response:", response.response)

    return response.response
    // return "Hello World"
  },
})
