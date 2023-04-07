import { DynamicTool } from "langchain/tools"
import { ChatOpenAI } from "langchain/chat_models"
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "langchain/prompts"
import { ChatVectorDBQAChain, ConversationChain } from "langchain/chains"
import { callbackManager } from "../utils.js"
import { BufferMemory } from "langchain/memory"
import prompts from "prompts"

export const profileTool = new DynamicTool({
  name: "profile_tool",
  description: `The user asks to create a profile
    Request the following information from the user: name, age, favorite color.
    Continue the dialogue only focused on collecting all the required data.
    Create an input to ask the user.
    Only responses from the user is allowed.
    DO NOT MAKE UP RETURN VALUES.
    `,
  func: async (input: string) => {
    console.log("CLARIFICATION INPUT:", input)

    const chat = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
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
      memory: new BufferMemory({
        returnMessages: true,
        memoryKey: "history",
      }),
      prompt: chatPrompt,
      llm: chat,
    })

    var output = (
      await prompts({
        type: "text",
        name: "question",
        message: input,
      })
    ).question
    console.log("PROFILE OUTPUT", output)

    const response = await chain.call({ input: output })
    console.log("Response:", response.response)

    return response.response
  },
})
