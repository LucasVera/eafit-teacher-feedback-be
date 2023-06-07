type ExecutionRoleStatement = {
  Effect: 'Allow' | 'Deny'
  Action: string[]
  Resource: ExecutionRoleStatementResource | ExecutionRoleStatementResource[]
}
type ExecutionRoleStatementResource = string | { 'Fn::GetAtt': string[] } | { Ref: string } | { 'Fn::Sub': string } | { 'Fn::Join': [string, any[]] }

export default [
  // DynamoDB
  {
    Effect: 'Allow',
    Action: [
      'dynamodb:List*',
      'dynamodb:BatchGet*',
      'dynamodb:DescribeTable',
      'dynamodb:Get*',
      'dynamodb:Query',
      'dynamodb:PutItem',
    ],
    Resource: [
      { "Fn::GetAtt": ["TeacherRecomendationTable", "Arn"] },
      `arn:aws:dynamodb:us-east-1:747016795213:table/classes-dev`,
      `arn:aws:dynamodb:us-east-1:747016795213:table/face-analysis-results-dev` // (TODO): change to dynamic value (below is an example)
      // { "Fn::Join": ["", [{ "Fn::Sub": 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/' }, `${faceAnalysisTable}`, '*']] }
    ]
  },// arn:aws:dynamodb:us-east-1:747016795213:table/face-analysis-results-dev
  {
    Effect: 'Allow',
    Action: [
      'xray:PutTraceSegments',
      'xray:PutTelemetryRecords'
    ],
    Resource: ['*']
  },
] as ExecutionRoleStatement[]
