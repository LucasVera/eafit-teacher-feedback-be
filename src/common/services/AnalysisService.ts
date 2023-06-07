import aws from "../aws"
import { DynamoDbFilterOperation } from "../aws/dynamodb"
import { attentionConfig } from "../config"
import { ClassLatestScreenshotDynamoEntry } from "../types/TeacherRecommendation"

const {
  FACE_ANALYSIS_RESULTS_TABLE,
  TEACHER_RECOMMENDATION_TABLE,
} = process.env

type EmotionName = 'CALM' | 'SAD' | 'SURPRISED' | 'FEAR' | 'CONFUSED' | 'ANGRY' | 'DISGUSTED' | 'HAPPY'

type Emotion = {
  [name in EmotionName]: number
}

type FaceAnalysis = {
  classId: number,
  isUncertainAnalysis: boolean,
  attentionLevel: number,
  faceImageUrl: string,
  faceImageS3Location: string,
  screenshotTime: number,
  createdAt: number,
  rawEmotions: Emotion[],
  faceIndex: number,
  faceId: string,
}

const extractDistractedFaces = (rawFaces: any[]): FaceAnalysis[] => rawFaces
  .sort((a, b) => a.attentionLevel - b.attentionLevel)
  .slice(0, attentionConfig.MAX_DISTRACTED_FACES)
  .map(rawFace => ({
    classId: rawFace.classId_pk,
    isUncertainAnalysis: rawFace.isUncertainAnalysis,
    attentionLevel: rawFace.attentionLevel,
    faceImageUrl: rawFace.faceImageUrl,
    faceImageS3Location: rawFace.faceImageS3Location,
    screenshotTime: Number(rawFace.screenshotTime),
    createdAt: rawFace.createdAt,
    rawEmotions: typeof rawFace.rawEmotionValues === 'string' ? JSON.parse(rawFace.rawEmotionValues) as Emotion[] : [],
    faceIndex: rawFace.faceIndex,
    faceId: rawFace.faceId,
  }))

const mapDynamoDbRawFaceToFaceAnalysis = (rawFace: any): FaceAnalysis => ({
  classId: rawFace.classId_pk,
  isUncertainAnalysis: rawFace.isUncertainAnalysis,
  attentionLevel: rawFace.attentionLevel,
  faceImageS3Location: rawFace.faceImageS3Location,
  faceImageUrl: rawFace.faceImageUrl,
  screenshotTime: Number(rawFace.screenshotTime),
  createdAt: rawFace.createdAt,
  rawEmotions: typeof rawFace.rawEmotions === 'string' ? JSON.parse(rawFace.rawEmotions) as Emotion[] : [],
  faceIndex: rawFace.faceIndex,
  faceId: rawFace.faceId,
})

// const mapFaceAnalysisFromMessage = (faceAnalysisResult: FaceAnalysisResult, classId: string, screenshotTime: string): FaceAnalysis => ({
//   classId: Number(classId),
//   attentionLevel: faceAnalysisResult._AttentionLevel,
//   createdAt: faceAnalysisResult.analysisCreatedAt,
//   faceId: faceAnalysisResult.croppedFaceDetails.faceId,
//   faceImageS3Location: faceAnalysisResult.croppedFaceDetails.s3LocationKey,
//   faceImageUrl: faceAnalysisResult.croppedFaceDetails.s3ImageUrl,
//   faceIndex: faceAnalysisResult.index,
//   isUncertainAnalysis: faceAnalysisResult.isUncertainAnalysis,
//   rawEmotions: faceAnalysisResult.Emotions,
//   screenshotTime: Number(screenshotTime),
// })

const processFaceAnalysisResults = async (
  classId: string,
  screenshotTime: number,
  averageAttentionLevel: number,
  s3BucketName: string,
  s3ObjectKey: string
): Promise<void> => {
  // 1. extract faces from faceDetails
  // 2. order faces by attention level
  // 3. save distracted faces to teacher recommendation table (sk: LATEST_DISTRACTED#<screenshot_time>#<face_id>)

  const { Items } = await aws.dynamodb.queryItems(
    FACE_ANALYSIS_RESULTS_TABLE,
    { name: 'classId_pk', value: Number(classId) },
    { name: 'screenshot_attentionLevel_sk', value: `${screenshotTime}` },
    DynamoDbFilterOperation.BEGINS_WITH
  )

  const rawFaces = aws.dynamodb.dynamoDbItemsToJsObjects(Items)
  const distractedFaces = extractDistractedFaces(rawFaces)

  // save to dynamodb table
  const writePromises = distractedFaces.map(face => aws.dynamodb.putItem(
    TEACHER_RECOMMENDATION_TABLE,
    {
      ...face,
      classId_pk: face.classId,
      sk: `LATEST_DISTRACTED#${face.screenshotTime}#${face.faceId}`,
    }
  ))

  const classId_pk = Number(classId)
  writePromises.push(aws.dynamodb.putItem(
    TEACHER_RECOMMENDATION_TABLE,
    {
      classId_pk,
      sk: 'LATEST_SCREENSHOT',
      screenshotId: screenshotTime,
    }
  ))

  writePromises.push(aws.dynamodb.putItem(
    TEACHER_RECOMMENDATION_TABLE,
    {
      classId_pk,
      sk: `SCREENSHOT#${screenshotTime}`,
      screenshotId: screenshotTime,
      averageAttentionLevel,
      s3BucketName,
      s3ObjectKey,
    }
  ))

  await Promise.all(writePromises)
}

const getLatestDistractedFaces = async (classId: string, classStartedAt: number, limit?: number): Promise<FaceAnalysis[]> => {
  const { Items } = await aws.dynamodb.queryItems(
    TEACHER_RECOMMENDATION_TABLE,
    { name: 'classId_pk', value: Number(classId) },
    { name: 'sk', value: `LATEST_DISTRACTED#${classStartedAt}` },
    DynamoDbFilterOperation.GREATER_OR_EQUAL,
    null,
    limit || 3,
    'DESC'
  )

  const rawFaces = aws.dynamodb.dynamoDbItemsToJsObjects(Items) as any[]

  return rawFaces.map(rawFace => mapDynamoDbRawFaceToFaceAnalysis(rawFace))
}

const getLatestFaces = async (classId: string): Promise<FaceAnalysis[]> => {
  // 1. Get latest screenshot from teacher recommendation table
  // 2. Get all faces from face analysis results table with screenshotTime = latest screenshot
  // 3. Return faces

  const { Items: latestScreenshotItems } = await aws.dynamodb.queryItems(
    TEACHER_RECOMMENDATION_TABLE,
    { name: 'classId_pk', value: Number(classId) },
    { name: 'sk', value: 'LATEST_SCREENSHOT' },
    DynamoDbFilterOperation.EQUALS
  )

  const [latestScreenshot] = aws.dynamodb.dynamoDbItemsToJsObjects(latestScreenshotItems) as ClassLatestScreenshotDynamoEntry[]

  if (!latestScreenshot) {
    return []
  }

  const { screenshotId } = latestScreenshot

  const { Items } = await aws.dynamodb.queryItems(
    TEACHER_RECOMMENDATION_TABLE,
    { name: 'classId_pk', value: Number(classId) },
    { name: 'sk', value: `LATEST_DISTRACTED#${screenshotId}#` },
    DynamoDbFilterOperation.BEGINS_WITH,
  )

  const rawFaces = aws.dynamodb.dynamoDbItemsToJsObjects(Items) as any[]

  return rawFaces.sort((a, b) => a.attentionLevel - b.attentionLevel).map(rawFace => mapDynamoDbRawFaceToFaceAnalysis(rawFace))
}

export default {
  getLatestFaces,
  getLatestDistractedFaces,
  processFaceAnalysisResults,
}
