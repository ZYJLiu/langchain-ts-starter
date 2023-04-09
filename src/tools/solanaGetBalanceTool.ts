import { DynamicTool } from "langchain/tools"
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js"
import prompts from "prompts"

async function getPublicKey() {
  const { question } = await prompts({
    type: "text",
    name: "question",
    message: "What is the public key of the account you want to check?",
  })
  return question
}

async function getSolanaBalance(publicKey: string) {
  const connection = new Connection(clusterApiUrl("devnet"))
  try {
    const balanceInLamports = await connection.getBalance(
      new PublicKey(publicKey)
    )
    return balanceInLamports / LAMPORTS_PER_SOL
  } catch (error) {
    console.log(error)
    return JSON.stringify(error, Object.getOwnPropertyNames(error))
  }
}

function isValidPublicKey(input: string): boolean {
  try {
    new PublicKey(input)
    return true
  } catch {
    return false
  }
}

export const solanaGetBalanceTool = new DynamicTool({
  name: "solana_get_balance_tool",
  description: `Get the balance of a solana account using its public key.
  Ask the user for the public key.`,
  func: async (input) => {
    console.log("Input:", input)

    let publicKey = input
    if (!isValidPublicKey(input)) {
      publicKey = await getPublicKey()
      console.log("Public Key:", publicKey)
    }

    const balance = await getSolanaBalance(publicKey)

    if (balance === null) {
      return "Invalid public key"
    }

    return `${balance} SOL`
  },
})
