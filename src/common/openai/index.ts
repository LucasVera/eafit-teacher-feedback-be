import { Configuration, CreateChatCompletionResponseChoicesInner, OpenAIApi } from 'openai'
import { inspect } from 'util'
import openAiConfig from '../config/openai'

const {
  OPENAI_API_KEY,
} = process.env

const {
  OPENAI_CHAT_COMPLETION_TEMPERATURE,
  OPENAI_MODEL
} = openAiConfig

const config = new Configuration({
  apiKey: OPENAI_API_KEY,
})

let openaiClient: OpenAIApi
const loadClient = (): OpenAIApi => {
  if (!openaiClient) {
    openaiClient = new OpenAIApi(config)
  }

  return openaiClient
}

const chatResponses = async (prompt: string, numberOfResponses?: number): Promise<string[]> => {
  try {
    const openai = loadClient()

    const { data } = await openai.createChatCompletion({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: OPENAI_CHAT_COMPLETION_TEMPERATURE,
      n: numberOfResponses ?? 2,
    })

    if (!data) throw new Error('No data returned from OpenAI API')
    const { choices } = data
    const responses = choices.map(choice => choice.message.content)
    console.log('responses', responses)

    return responses
  }
  catch (ex) {
    let error: string
    if (ex.response) {
      error = JSON.stringify(ex.response.data)
    } else if (ex.request) {
      error = JSON.stringify({ customError: 'No response from OpenAI API', request: ex.request })
    }
    else {
      error = inspect(ex.message)
    }

    throw new Error(`Error getting chat response for prompt: ${prompt}. Error: ${error}`)
  }
}

export default {
  chatResponses,
}
