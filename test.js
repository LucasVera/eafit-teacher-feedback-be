const openai = require('openai')
const { inspect } = require('util')

const main = async () => {
  try {
    const config = new openai.Configuration({
      apiKey: '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'
    })

    const client = new openai.OpenAIApi(config)

    const response = await client.createChatCompletion({
      // model: 'gpt-3.5-turbo',
      model: 'gpt-35.5-turbo',
      messages: [{ role: 'user', content: 'Hello, please tell me a joke in spanish' }],
      temperature: 0.75,
    })

    // const response = await client.createImage({
    //   prompt: 'An image of a classroom, students are 1st year students, the topic of the class is calculus, oil painting',
    //   n: 4,
    //   response_format: 'url',
    //   size: '512x512',
    // })


    console.log('response', inspect(response.data, null, 6))
    console.log('stuff', inspect(response.status, null, 6))
  } catch (ex) {
    if (ex.response) {
      console.log('error getting stuff response', ex.response.data)
      return
    }
    if (ex.request) {
      console.log('error getting stuff request', ex.request)
      return
    }

    console.log('error getting stuff', ex.message)
  }
}

main()
