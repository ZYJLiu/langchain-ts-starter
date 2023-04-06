import { Tool } from "langchain/tools"

export class CustomTool extends Tool {
  name = "coin_market_cap"
  description =
    "Get the price of a cryptocurrency from coinmarketcap.com, input is the slug of the cryptocurrency."

  protected key: string

  constructor(
    apiKey: string | undefined = process.env.COIN_MARKET_CAP_API_KEY
  ) {
    super()

    if (!apiKey) {
      throw new Error(
        "No API key provided. Please provide an API key to use this tool."
      )
    }

    this.key = apiKey
  }

  async _call(input: string) {
    const url =
      "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest"
    const headers = {
      "X-CMC_PRO_API_KEY": this.key,
    }

    const params = new URLSearchParams({
      slug: input,
      convert: "USD",
    })

    const res = await fetch(`${url}?${params}`, {
      headers: headers,
    })

    const responseObj = await res.json()
    const dataKey = Object.keys(responseObj.data)[0]
    const price = responseObj.data[dataKey].quote.USD.price

    return price
  }
}
