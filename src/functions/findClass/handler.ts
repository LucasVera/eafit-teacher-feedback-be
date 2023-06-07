import { formatJSONResponse } from '@libs/api-gateway'
import { middyfy } from '@libs/lambda'
import { APIGatewayEvent } from 'aws-lambda'
import ClassService from 'src/common/services/ClassService'

const extractUrlParams = (event: APIGatewayEvent): { classId: string } => {
  const { classId } = event.pathParameters
  return { classId }
}

const getClass = async (event: APIGatewayEvent) => {
  try {
    const { classId } = extractUrlParams(event)
    const classFound = await ClassService.findClassById(classId)

    return formatJSONResponse({
      class: classFound,
    })
  }
  catch (ex) {
    console.error('Error in getClass.', ex)
    return formatJSONResponse({
      error: ex.message,
    }, 500)
  }
}

export const main = middyfy(getClass)
