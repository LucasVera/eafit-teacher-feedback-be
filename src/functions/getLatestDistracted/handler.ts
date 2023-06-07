import { formatJSONResponse } from '@libs/api-gateway'
import { middyfy } from '@libs/lambda'
import { APIGatewayEvent } from 'aws-lambda'
import AnalysisService from 'src/common/services/AnalysisService'

const extractQueryParams = (event: APIGatewayEvent): { classId: string, classStartedAt: number } => {
  const { classId, classStartedAt } = event.queryStringParameters
  return { classId, classStartedAt: Number(classStartedAt) }
}

const getLatestDistracted = async (event: APIGatewayEvent) => {
  try {
    const { classId, classStartedAt } = extractQueryParams(event)

    const latestDistracted = await AnalysisService.getLatestDistractedFaces(classId, classStartedAt)

    console.log('latest faces', latestDistracted)

    return formatJSONResponse({
      latestDistracted,
    })
  }
  catch (ex) {
    console.error('Error in getLatestDistracted.', ex)
    return formatJSONResponse({
      error: ex.message,
    }, 500)
  }
}

export const main = middyfy(getLatestDistracted)
