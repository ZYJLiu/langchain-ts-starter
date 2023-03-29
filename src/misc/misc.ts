//  npm run start ./misc/misc.ts
import { ChatOpenAI } from "langchain/chat_models"
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "langchain/prompts"
import { ConversationChain } from "langchain/chains"

import { callbackManager } from "../utils.js"
import { BufferMemory } from "langchain/memory"

export async function run() {
  const chat = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    streaming: true,
    verbose: true,
    callbackManager,
  })

  const promptTemplate = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `Please analyze the given input and determine if it relates to any of the following Topics.
        Topics:
        Lesson planning,
        Assessment and grading,
        Classroom management,
        Professional development,
        Student engagement,

        If the input is related to one of the Topics with a cosine similarity of greater than 0.5, provide only the exact Topic name from the list.
        If the input is related to multiple Topics, provide the only the exact Topic names from the list.
        If the input is not related to any of the Topics or a previous question, respond with "I don't know." and provide the list of Topics as a response.
        Do not response with anything other than one of the Topics listed. Do not write anything as a response.

        {input}
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
    prompt: promptTemplate,
    llm: chat,
  })

  //   const response = await chain.call({
  //     input: "write a poem about bananas",
  //   })

  //   console.log(response)

  const responseA = await chain.call({
    input:
      "write template about assessing students in a classroom and a lesson about american history",
  })

  // { response: 'Assessment and grading, Lesson planning' }
  console.log(responseA)

  const responseB = await chain.call({
    input:
      "what was the previous question I asked and what topics are they related to?",
  })

  // {response: 'The previous question you asked was "Please analyze the given input and determine if it relates to any of the following Topics." and the related topics are Lesson planning, Assessment and grading, Classroom management, Professional development, and Student engagement.'}
  console.log(responseB)
}
