import aws from "../aws"
import { DynamoDbFilterOperation } from "../aws/dynamodb"
import openai from "../openai"
import { ClassActivityTypeInput, ClassActivityOutput, ClassActivityType, ClassSubjectInput, GetTeacherRecommendationDto, StudentEducationLevelInput, StudentEducationLevel } from "../types/TeacherRecommendation"
import { getRandomEntry } from "../util/array"
import { getTimePassedSinceTimestamp, getTimestamp } from "../util/date"

const {
  TEACHER_RECOMMENDATION_TABLE,
} = process.env

const possibleActivityRecommendations: ClassActivityTypeInput[] = [
  {
    type: ClassActivityType.ICE_BREAKER,
    name: 'Ice Breaker',
    prompt: 'Recomiendame una actividad corta para "romper el hielo" con mis estudiantes. Responde solo con una descripción muy corta de la actividad.',
  },
  {
    type: ClassActivityType.SHORT_VIDEO,
    name: 'Short Video',
    prompt: 'Recomiendame un video corto (máximo de 8 minutos) para mis estudiantes. Responde con el siguiente orden: primero el titulo del video, luego el autor del video, luego el link del video y por último una descripción muy corta del contenido del video.',
  },
  {
    type: ClassActivityType.COFFEE_BREAK,
    name: 'Coffee Break',
    prompt: '',
  },
  {
    type: ClassActivityType.CLASS_WIDE_ACTIVITY,
    name: 'Class Wide Activity',
    prompt: 'La atención de los estudiantes de la clase ha estado baja en promedio en los ultimos minutos. Para recuperar la atención de los estudiantes en la clase, recomiendame una actividad corta y sencilla para toda la clase. Puede ser una actividad relacionada con el tema y nivel de estudiantes. Responde solo con una descripción muy corta de la actividad.',
  }
]

const getActivityTypeInput = (activityType: ClassActivityType): ClassActivityTypeInput => {
  if (activityType === ClassActivityType.ANY) {
    return getRandomEntry(possibleActivityRecommendations)
  }

  const activityTypeInput = possibleActivityRecommendations.find(a => a.type === activityType)

  if (!activityTypeInput) {
    throw new Error(`Invalid activity type: ${activityType}`)
  }

  return activityTypeInput
}

const studentsEducationLevels: StudentEducationLevelInput[] = [
  {
    type: StudentEducationLevel.PRIMARY,
    name: 'Primaria',
    prompt: 'El nivel de mis estudiantes es de primaria.'
  },
  {
    type: StudentEducationLevel.SECONDARY,
    name: 'Secundaria',
    prompt: 'El nivel de mis estudiantes es de secundaria.'
  },
  {
    type: StudentEducationLevel.UNIVERSITY,
    name: 'Universidad',
    prompt: 'El nivel de mis estudiantes es de universidad.'
  },
  {
    type: StudentEducationLevel.MASTER,
    name: 'Maestría',
    prompt: 'El nivel de mis estudiantes es de maestría.'
  },
  {
    type: StudentEducationLevel.DOCTORATE,
    name: 'Doctorado',
    prompt: 'El nivel de mis estudiantes es de doctorado.'
  }
]
const getStudentsEducationLevelInput = (studentsEducationLevel: StudentEducationLevel): StudentEducationLevelInput => {
  const studentsEducationLevelInput = studentsEducationLevels.find(s => s.type === studentsEducationLevel)

  if (!studentsEducationLevelInput) {
    throw new Error(`Invalid students education level type: ${studentsEducationLevel}`)
  }

  return studentsEducationLevelInput
}

const getClassSubjectInput = (classMainTopicName: string, classSubTopicName?: string): ClassSubjectInput => {
  let name = classMainTopicName
  let subjectPrompt = `El tema principal de la clase es ${classMainTopicName}.`

  if (classSubTopicName) {
    name += ` - ${classSubTopicName}`
    subjectPrompt += `El subtema de la clase es ${classSubTopicName}.`
  }

  return {
    name,
    prompt: subjectPrompt,
  }
}

const getAverageAttentionLevel = async (classId: string): Promise<number> => {
  const { Items } = await aws.dynamodb.queryItems(
    TEACHER_RECOMMENDATION_TABLE,
    { name: 'classId_pk', value: Number(classId) },
    { name: 'sk', value: 'SCREENSHOT#' },
    DynamoDbFilterOperation.BEGINS_WITH,
    null,
    10
  )

  const screenshots = aws.dynamodb.dynamoDbItemsToJsObjects(Items) as any[]
  const averageAttentionLevel = screenshots.reduce((acc, screenshot) => acc + screenshot.averageAttentionLevel, 0) / screenshots.length

  return Math.round(averageAttentionLevel)
}

const getTeacherRecommendation = async (getDto: GetTeacherRecommendationDto): Promise<ClassActivityOutput> => {
  const {
    classId,
    classStartedAt,
    classMainTopic,
    classSubTopic,
    studentsEducationLevel,
    isVirtualClass,
    activityType,
  } = getDto

  const activityTypeInput = getActivityTypeInput(activityType)

  if (activityTypeInput.type === ClassActivityType.COFFEE_BREAK) {
    const timePassed = getTimePassedSinceTimestamp(classStartedAt)
    return {
      input: {
        typeInput: activityTypeInput,
      },
      finalPrompt: '',
      result: [`Teniendo en cuenta que han pasado ${timePassed} desde que la clase comenzó, anuncia un descanso de 5 a 15 minutos para que tus estudiantes puedan tomar un café o ir al baño.`],
    } as ClassActivityOutput
  }

  const studentsEducationLevelInput = getStudentsEducationLevelInput(studentsEducationLevel)
  const classSubjectInput = getClassSubjectInput(classMainTopic, classSubTopic)

  const isVirtualClassPrompt = `La clase es ${isVirtualClass ? 'virtual' : 'presencial'}.`

  let inputPrompt = `${activityTypeInput.prompt}${studentsEducationLevelInput.prompt}${classSubjectInput.prompt}${isVirtualClassPrompt}`

  if (activityTypeInput.type === ClassActivityType.CLASS_WIDE_ACTIVITY) {
    const averageAttentionLevel = await getAverageAttentionLevel(classId)

    inputPrompt += `La atención en promedio, en las ultimas 10 mediciones, ha estado en ${averageAttentionLevel}%`
  }

  const responses = await openai.chatResponses(inputPrompt)

  return {
    classId,
    input: {
      typeInput: activityTypeInput,
      subjectInput: classSubjectInput,
      studentsEducationLevelInput,
      isVirtualClass,
    },
    finalPrompt: inputPrompt,
    result: responses.map(response => response?.replaceAll('\n', '')),
    recommendedAt: getTimestamp(),
  } as ClassActivityOutput
}

export default {
  getTeacherRecommendation,
}
