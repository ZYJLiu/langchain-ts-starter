import { CallbackManager } from "langchain/callbacks"
import { LLMResult } from "langchain/schema"

export const callbackManager = CallbackManager.fromHandlers({
  handleLLMStart: async (llm: { name: string }, prompts: string[]) => {
    console.log(JSON.stringify(llm, null, 2))
    // console.log(JSON.stringify(prompts, null, 2))
    prompts.forEach((prompt) => {
      console.log(prompt)
    })
  },
  handleLLMEnd: async (output: LLMResult) => {
    console.log(JSON.stringify(output, null, 2))
  },
  handleLLMError: async (err: Error) => {
    console.error(err)
  },
  //   // streams token responses from the LLM
  //   async handleLLMNewToken(token: string) {
  //     console.log({ token })
  //   },
})
