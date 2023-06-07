export type GetTeacherRecommendationDto = {
  classId: string,
  classStartedAt: number,
  classMainTopic: string,
  studentsEducationLevel: StudentEducationLevel,
  classSubTopic?: string,
  isVirtualClass?: boolean,
  activityType?: ClassActivityType,
}

export enum ClassActivityType {
  ANY = 'ANY',
  CLASS_WIDE_ACTIVITY = 'CLASS_WIDE_ACTIVITY', // ai-generated activity based on average students' attention level
  ICE_BREAKER = 'ICE_BREAKER', // ai-generated activity
  SHORT_VIDEO = 'SHORT_VIDEO', // ai-recommended video
  COFFEE_BREAK = 'COFFEE_BREAK', // short break (5-15 min)
}

export type ClassActivityTypeInput = {
  type: ClassActivityType,
  name: string,
  prompt: string,
}

export enum StudentEducationLevel {
  PRIMARY = 'Primary',
  SECONDARY = 'Secondary',
  UNIVERSITY = 'University',
  MASTER = 'Master',
  DOCTORATE = 'Doctorate',
}

export type StudentEducationLevelInput = {
  type: StudentEducationLevel,
  name: string,
  prompt: string,
}

export type ClassSubjectInput = {
  name: string,
  prompt: string,
}

export type ClassActivityInput = {
  typeInput: ClassActivityTypeInput,
  subjectInput?: ClassSubjectInput,
  studentsEducationLevelInput?: StudentEducationLevelInput,
  isVirtualClass?: boolean,
}

export type ClassActivityOutput = {
  classId: string,
  input: ClassActivityInput
  finalPrompt: string,
  result: string[]
  recommendedAt: number,
}

export type ClassLatestScreenshotDynamoEntry = {
  classId_pk: number,
  sk: string,
  screenshotId: number,
}
