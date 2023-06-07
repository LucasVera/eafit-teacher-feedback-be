import { formatJSONResponse } from '@libs/api-gateway'
import { middyfy } from '@libs/lambda'
import { APIGatewayEvent } from 'aws-lambda'
import RecommendationService from 'src/common/services/RecommendationService'
import { ClassActivityType, GetTeacherRecommendationDto, StudentEducationLevel } from 'src/common/types/TeacherRecommendation'

const extractQueryParams = (event: APIGatewayEvent): GetTeacherRecommendationDto => {
  const {
    classId,
    classStartedAt,
    classMainTopic,
    studentsEducationLevel,
    classSubTopic = '',
    isVirtualClass = null,
    activityType = ClassActivityType.ANY,
  } = event.queryStringParameters

  return {
    classId,
    classStartedAt: Number(classStartedAt),
    classMainTopic,
    studentsEducationLevel: studentsEducationLevel as StudentEducationLevel,
    classSubTopic,
    isVirtualClass: isVirtualClass === 'true',
    activityType: activityType as ClassActivityType,
  }
}

const getTeacherRecommendation = async (event: APIGatewayEvent) => {
  try {
    const getRecommendationDto = extractQueryParams(event)
    const recommendation = await RecommendationService.getTeacherRecommendation(getRecommendationDto)

    console.log('recommendation', recommendation)

    return formatJSONResponse({
      recommendation,
    })
  }
  catch (ex) {
    console.error('Error in getTeacherRecommendation.', ex)
    return formatJSONResponse({
      error: ex.message,
    }, 500)
  }
}

export const main = middyfy(getTeacherRecommendation)
