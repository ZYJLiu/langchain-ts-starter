//  npm run start ./misc/document-pdfload.ts
import { PDFLoader } from "langchain/document_loaders"

import { HNSWLib } from "langchain/vectorstores"
import { OpenAIEmbeddings } from "langchain/embeddings"

import path from "node:path"
import url from "node:url"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

export async function run() {
  try {
    const filePath = path.resolve(
      path.dirname(url.fileURLToPath(import.meta.url)),
      "../../test/bitcoin.pdf"
    )
    console.log(filePath)
    const loader = new PDFLoader(filePath, {
      pdfjs: () =>
        import("pdfjs-dist/legacy/build/pdf.js").then((mod) => mod.default),
    })
    // console.log(loader)
    const rawDocs = await loader.load()
    // console.log(rawDocs)
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })
    const docs = await textSplitter.splitDocuments(rawDocs)
    console.log("split docs", docs)
    const vectorstores = await HNSWLib.fromDocuments(
      docs,
      new OpenAIEmbeddings()
    )
    await vectorstores.save("bitcoin")
  } catch (e) {
    console.log(e)
  }
}
