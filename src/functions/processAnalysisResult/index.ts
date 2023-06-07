import { handlerPath } from '@libs/handler-resolver'

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sqs: process.env.SQS_QUEUE_ARN || '${env:SQS_QUEUE_ARN}'
    }
  ],
}
