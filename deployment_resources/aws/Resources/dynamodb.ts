const tableBaseName = process.env.TEACHER_RECOMMENDATION_TABLE || '${env:TEACHER_RECOMMENDATION_TABLE}'
const stage = process.env.STAGE || '${env:STAGE}'
const TableName = `${tableBaseName}-${stage}`

// access pattern: latest 3 faces with less attention for a class
// pk name: classId_pk - value: <classId>
// sk name: sk - value: LATEST_DISTRACTED#<screenshotTime>#<faceIndex>

export default {
  TeacherRecomendationTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      AttributeDefinitions: [
        {
          AttributeName: 'classId_pk',
          AttributeType: 'N',
        },
        {
          AttributeName: 'sk',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'classId_pk',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'sk',
          KeyType: 'RANGE',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 3,
        WriteCapacityUnits: 3,
      },
      TableName,
    }
  }
}

