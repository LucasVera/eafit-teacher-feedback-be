import { FaceDetail } from '@aws-sdk/client-rekognition'

type CustomFaceAnalysisProps = {
  index: number,
  analysisCreatedAt: number,
  attentionLevel: number,
  isUncertainAnalysis: boolean,
  croppedFaceDetails?: CroppedFaceDetails,
}

export type CroppedFaceDetails = {
  faceId: string,
  s3LocationKey: string,
  s3BucketName: string,
  s3ImageUrl: string,
}

export type FaceAnalysisResult = Omit<FaceDetail, 'Landmarks'> & CustomFaceAnalysisProps

export type AnalysisResultMessage = {
  faceDetails: FaceAnalysisResult[],
  averageAttentionLevel: number,
  classId: string,
  classStartedAtTimestamp: string,
  screenshotTime: string,
  screenshotBasePath: string,
  s3BucketName: string,
  s3ObjectKey: string,
}
