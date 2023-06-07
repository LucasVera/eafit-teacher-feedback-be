import type { AWS } from '@serverless/typescript'
import * as functions from './src/functions'
import Resources from './deployment_resources/aws/Resources'
import LambdaExecutionRoleStatements from './deployment_resources/aws/LambdaExecutionRoleStatements'

const stage = process.env.STAGE || '${env:STAGE}'

const serverlessConfiguration: AWS = {
  service: 'teacher-feedback-be',
  frameworkVersion: '3',
  useDotenv: true,
  plugins: ['serverless-offline', 'serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      STAGE: stage,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      SQS_QUEUE_ARN: process.env.SQS_QUEUE_ARN || '${env:SQS_QUEUE_ARN}',
      TEACHER_RECOMMENDATION_TABLE: `${process.env.TEACHER_RECOMMENDATION_TABLE || '${env:TEACHER_RECOMMENDATION_TABLE}'}-${stage}`,
      FACE_ANALYSIS_RESULTS_TABLE: `${process.env.FACE_ANALYSIS_RESULTS_TABLE || '${env:FACE_ANALYSIS_RESULTS_TABLE}'}-${stage}`,
      CLASSES_TABLE: `${process.env.CLASSES_TABLE || '${env:CLASSES_TABLE}'}-${stage}`,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '${env:OPENAI_API_KEY}',
    },
    iam: { role: { statements: LambdaExecutionRoleStatements } },
    memorySize: 1024,
    logRetentionInDays: 90,
    timeout: 15,
    tracing: { lambda: true }
  },
  // import the function via paths
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
  functions,
  resources: { Resources },
}

module.exports = serverlessConfiguration
