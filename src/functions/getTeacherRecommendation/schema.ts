export default {
  type: "object",
  properties: {
    classId: { type: 'string' },
    classStartedAt: { type: 'string' },
    classMainTopicName: { type: 'string' },
    studentsEducationLevel: { type: 'string' },
    classSubTopicName: { type: 'string' },
    isVirtualClass: { type: 'boolean' },
    activityType: { type: 'string' },
  },
  required: [
    'classId',
    'classStartedAt',
    'classMainTopicName',
    'studentsEducationLevel'
  ]
} as const
