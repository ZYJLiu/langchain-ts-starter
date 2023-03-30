//  npm run start ./misc/document-csvload.ts
import {
  CSVLoader,
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders"

import { HNSWLib } from "langchain/vectorstores"
import { OpenAIEmbeddings } from "langchain/embeddings"

import path from "node:path"
import url from "node:url"

export async function run() {
  const filePath = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "../../test/test.csv"
  )
  // console.log(filePath)
  const loader = new CSVLoader(filePath)
  // console.log(loader)
  const docs = await loader.load()
  // console.log(docs)

  const vectorstores = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings())
  await vectorstores.save("data")
}
