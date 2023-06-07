import { SQSEvent } from "aws-lambda"
import AnalysisService from "src/common/services/AnalysisService"
import { AnalysisResultMessage } from "src/common/types/AttentionAnalysis"
import { inspect } from "util"

const processMessage = async (message: AnalysisResultMessage): Promise<void> => {
  const {
    classId,
    screenshotTime,
    averageAttentionLevel,
    s3BucketName,
    s3ObjectKey
  } = message
  await AnalysisService.processFaceAnalysisResults(
    classId,
    Number(screenshotTime),
    averageAttentionLevel,
    s3BucketName,
    s3ObjectKey
  )
}

const processAnalysisResult = async (event: SQSEvent) => {
  try {
    const { Records } = event
    console.log('Processing analysis result', Records.length, inspect(Records, false, 8))
    const promises = Records.map(record => processMessage(JSON.parse(JSON.parse(record.body).Message) as AnalysisResultMessage))
    await Promise.all(promises)
  }
  catch (ex) {
    console.log('Error processing analysis result', ex)
  }
}

export const main = processAnalysisResult
