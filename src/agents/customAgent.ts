//  npm run start ./agents/customAgent.ts
import {
  LLMSingleActionAgent,
  AgentActionOutputParser,
  AgentExecutor,
} from "langchain/agents"
import { LLMChain } from "langchain/chains"
import { OpenAI } from "langchain/llms"
import {
  BasePromptTemplate,
  BaseStringPromptTemplate,
  SerializedBasePromptTemplate,
  renderTemplate,
} from "langchain/prompts"
import {
  InputValues,
  PartialValues,
  AgentStep,
  AgentAction,
  AgentFinish,
} from "langchain/schema"
import { SerpAPI, Calculator, Tool } from "langchain/tools"
import prompts from "prompts"
import { callbackManager } from "utils.js"
import { profileTool } from "../tools/profileTool.js"
import { clarificationTool } from "../tools/clarificationTool.js"
import { translationTool } from "../tools/translationTool.js"

const PREFIX = `Always use the provided format.
Always respond speaking directly to the user.
You have access to the following tools:`

const formatInstructions = (
  toolNames: string
) => `You must also generate the following format:

Question: the input you respond to
Thought: you should always think about what to do
Action: the action to take, should be one of [${toolNames}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question`
const SUFFIX = `Begin!
Always respond with the provided format:
DO NOT MAKE UP RESPONSES

Question: {input}
Thought:{agent_scratchpad}`

class CustomPromptTemplate extends BaseStringPromptTemplate {
  tools: Tool[]

  constructor(args: { tools: Tool[]; inputVariables: string[] }) {
    super({ inputVariables: args.inputVariables })
    this.tools = args.tools
  }

  _getPromptType(): string {
    throw new Error("Not implemented")
  }

  format(input: InputValues): Promise<string> {
    /** Construct the final template */
    const toolStrings = this.tools
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join("\n")
    const toolNames = this.tools.map((tool) => tool.name).join("\n")
    const instructions = formatInstructions(toolNames)
    const template = [PREFIX, toolStrings, instructions, SUFFIX].join("\n\n")
    /** Construct the agent_scratchpad */
    const intermediateSteps = input.intermediate_steps as AgentStep[]
    const agentScratchpad = intermediateSteps.reduce(
      (thoughts, { action, observation }) =>
        thoughts +
        [action.log, `\nObservation: ${observation}`, "Thought:"].join("\n"),
      ""
    )
    const newInput = { agent_scratchpad: agentScratchpad, ...input }
    /** Format the template. */
    return Promise.resolve(renderTemplate(template, "f-string", newInput))
  }

  partial(_values: PartialValues): Promise<BasePromptTemplate> {
    throw new Error("Not implemented")
  }

  serialize(): SerializedBasePromptTemplate {
    throw new Error("Not implemented")
  }
}

interface CustomAgentFinish extends AgentFinish {
  text: string
}

class CustomOutputParser extends AgentActionOutputParser {
  async parse(text: string): Promise<AgentAction | AgentFinish> {
    if (text.includes("Final Answer:")) {
      const parts = text.split("Final Answer:")
      const input = parts[parts.length - 1].trim()
      const finalAnswers = { output: input }
      return { log: text, returnValues: finalAnswers }
    }

    const match = /Action: (.*)\nAction Input: (.*)/s.exec(text)
    if (!match) {
      console.log("FAIL PARSE:", text)
      return { log: text, text } as CustomAgentFinish
    }

    return {
      tool: match[1].trim(),
      toolInput: match[2].trim().replace(/^"+|"+$/g, ""),
      log: text,
    }
  }

  getFormatInstructions(): string {
    throw new Error("Not implemented")
  }
}

let executor: AgentExecutor

export const run = async () => {
  const model = new OpenAI({
    temperature: 0,
    callbackManager: callbackManager,
    modelName: "gpt-4",
    // modelName: "gpt-3.5-turbo",
  })

  const tools = [
    new SerpAPI(),
    new Calculator(),
    clarificationTool,
    profileTool,
    translationTool,
  ]

  const llmChain = new LLMChain({
    prompt: new CustomPromptTemplate({
      tools,
      inputVariables: ["input", "agent_scratchpad"],
    }),
    llm: model,
  })

  const agent = new LLMSingleActionAgent({
    llmChain,
    outputParser: new CustomOutputParser(),
    stop: ["\nObservation"],
  })

  executor = new AgentExecutor({
    agent,
    tools,
  })
  console.log("Loaded agent.")

  await loop()
}

async function loop(response?: string) {
  try {
    var input = (
      await prompts({
        type: "text",
        name: "input",
        message: response ?? "Input:",
      })
    ).input

    const res = await executor.call({ input })

    await loop(res.output)
  } catch (error: any) {
    console.log(error)
    let response = error.toString()
    if (!response.startsWith("Error: Could not parse LLM output:")) {
      throw error
    }
    response = response.replace("Error: Could not parse LLM output:", "")
    await loop(response)
  }
}
