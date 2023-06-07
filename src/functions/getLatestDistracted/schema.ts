export default {
  type: "object",
  properties: {
    classId: { type: 'string' },
    classStartedAt: { type: 'string' },
  },
  required: ['classId', 'classStartedAt']
} as const
