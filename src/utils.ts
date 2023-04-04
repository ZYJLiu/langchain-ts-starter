import { CallbackManager } from "langchain/callbacks"
import { LLMResult } from "langchain/schema"

export const callbackManager = CallbackManager.fromHandlers({
  handleLLMStart: async (llm: { name: string }, prompts: string[]) => {
    console.log("LLM:", llm)
    // console.log(JSON.stringify(prompts, null, 2))
    prompts.forEach((prompt) => {
      console.log("LLM PROMPT:", prompt)
    })
  },
  handleLLMEnd: async (output: LLMResult) => {
    console.log("LLM OUTPUT:")

    for (const genArr of output.generations) {
      for (const gen of genArr) {
        console.log(
          JSON.stringify(gen.text, null, 2)
            .replace(/\\n/g, "\n")
            .replace(/\\n\\n/g, "\n\n")
        )
      }
    }
  },

  handleLLMError: async (err: Error) => {
    console.error("LLM ERROR:", err)
  },
  // streams token responses from the LLM
  async handleLLMNewToken(token: string) {
    console.log({ token })
  },
})
