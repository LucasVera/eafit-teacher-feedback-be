import { formatJSONResponse } from '@libs/api-gateway'
import { middyfy } from '@libs/lambda'
import { APIGatewayEvent } from 'aws-lambda'
import AnalysisService from 'src/common/services/AnalysisService'
import CacheService from 'src/common/services/CacheService'

const extractUrlParams = (event: APIGatewayEvent): { classId: string } => {
  const { classId } = event.pathParameters
  return { classId }
}

const getLatestFaces = async (event: APIGatewayEvent) => {
  try {
    const { classId } = extractUrlParams(event)

    const cacheKey = `latestFaces-${classId}`

    const cachedLatestFaces = CacheService.getCachedObject(cacheKey)

    if (cachedLatestFaces) return formatJSONResponse({ latestFaces: cachedLatestFaces })

    const latestFaces = await AnalysisService.getLatestFaces(classId)
    CacheService.setCachedObject(cacheKey, latestFaces)
    return formatJSONResponse({
      latestFaces,
    })
  }
  catch (ex) {
    console.error('Error in getLatestFaces.', ex)
    return formatJSONResponse({
      error: ex.message,
    }, 500)
  }
}

export const main = middyfy(getLatestFaces)
