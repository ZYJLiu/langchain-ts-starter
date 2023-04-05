import { DynamicTool } from "langchain/tools"
import prompts from "prompts"

export const clarificationTool = new DynamicTool({
  name: "clarification_tool",
  description: `Ask the user a follow up question for clarification.
    Create an input to ask the user.
    Only responses from the user is allowed.
    DO NOT MAKE UP RETURN VALUES.
    `,
  func: async (input: string) => {
    console.log("CLARIFICATION INPUT:", input)
    var output = (
      await prompts({
        type: "text",
        name: "question",
        message: input,
      })
    ).question
    console.log("CLARIFICATION OUTPUT", output)

    return output
  },
})
