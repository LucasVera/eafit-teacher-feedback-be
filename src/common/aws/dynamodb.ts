import {
  DynamoDBClient,
  PutItemCommand,
  PutItemCommandInput,
  PutItemCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  GetItemCommand,
  GetItemCommandInput,
  GetItemCommandOutput,
  AttributeValue,
} from "@aws-sdk/client-dynamodb"

import AWSXRay from "aws-xray-sdk-core"

export type DynamoDbTypeFormat = {
  type: string,
  dynamoDbPropType: string,
}
export enum DynamoDbFilterOperation {
  CONTAINS = 'contains',
  BEGINS_WITH = 'begins_with',
  EQUALS = '=',
  LESS = '<',
  LESS_OR_EQUAL = '<=',
  GREATER = '>',
  GREATER_OR_EQUAL = '>=',
}
export interface DynamoDbProp {
  name: string
  value: string | number | boolean
}
export interface DynamoDbFilterExpression {
  operation: DynamoDbFilterOperation
  prop: DynamoDbProp
}

export type DynamoDbQuerySortOrder = 'ASC' | 'DESC'

const client = new DynamoDBClient({ region: process.env.AWS_REGION })

const addSortKeyCondition = (
  sortKey: DynamoDbProp,
  sortKeyOperation: DynamoDbFilterOperation,
  KeyConditionExpression: string,
): string => {
  if (sortKeyOperation === DynamoDbFilterOperation.BEGINS_WITH) {
    return `${KeyConditionExpression} and begins_with(${sortKey.name}, :sk)`
  }

  return `${KeyConditionExpression} and ${sortKey.name} ${sortKeyOperation} :sk`
}

const queryItems = async (
  TableName: string,
  primaryKey: DynamoDbProp,
  sortKey?: DynamoDbProp,
  sortKeyOperation?: DynamoDbFilterOperation,
  filters?: DynamoDbFilterExpression[],
  Limit?: number,
  sort?: DynamoDbQuerySortOrder,
): Promise<QueryCommandOutput> => {
  let KeyConditionExpression = `${primaryKey.name} = :pk`
  const ExpressionAttributeValues: any = { ':pk': getDynamoDbFormattedProp(primaryKey.value) }

  if (sortKey && sortKeyOperation) {
    KeyConditionExpression = addSortKeyCondition(sortKey, sortKeyOperation, KeyConditionExpression)
    ExpressionAttributeValues[':sk'] = getDynamoDbFormattedProp(sortKey.value)
  }

  let FilterExpression = ''
  if (Array.isArray(filters) && filters.length > 0) {
    filters.forEach(({ operation, prop }) => {
      if (operation === DynamoDbFilterOperation.BEGINS_WITH || operation === DynamoDbFilterOperation.CONTAINS) {
        FilterExpression += ` ${operation} (${prop.name}, :${prop.name})`
      } else {
        FilterExpression += `${prop.name} ${operation} :${prop.name}`
      }
      ExpressionAttributeValues[`:${prop.name}`] = getDynamoDbFormattedProp(prop.value)
    })
  }

  const input: QueryCommandInput = {
    TableName,
    KeyConditionExpression,
    FilterExpression,
    ExpressionAttributeValues,
    Limit,
    ScanIndexForward: sort === 'ASC' ? true : false,
  }

  if (!FilterExpression) delete input.FilterExpression
  if (!Limit) delete input.Limit

  const command = new QueryCommand(input)

  return client.send(command)
}

const putItem = (TableName: string, jsItem: object): Promise<PutItemCommandOutput> => {
  const input: PutItemCommandInput = {
    TableName,
    Item: objToDynamoItem(jsItem),
  }
  const command = new PutItemCommand(input)

  return client.send(command)
}

const getItem = (TableName: string, pk: DynamoDbProp, sk?: DynamoDbProp): Promise<GetItemCommandOutput> => {
  const Key = buildKey(pk, sk)
  const input: GetItemCommandInput = {
    TableName,
    Key,
  }

  const command = new GetItemCommand(input)

  return client.send(command)
}

const buildKey = (pk: DynamoDbProp, sk?: DynamoDbProp): Record<string, AttributeValue> => {
  if (!pk?.value || !pk?.name) throw new Error('Primary key is required')
  const Key = { [pk.name]: getDynamoDbFormattedProp(pk.value) }
  if (sk) Key[sk.name] = getDynamoDbFormattedProp(sk.value)

  return Key
}

const availableTypes: DynamoDbTypeFormat[] = [
  { type: 'string', dynamoDbPropType: 'S' },
  { type: 'number', dynamoDbPropType: 'N' },
  { type: 'boolean', dynamoDbPropType: 'BOOL' },
]
const objToDynamoItem = (obj: object) => {
  const dynamoItem = {} as any
  for (const key in obj) {
    const value = obj[key]
    if (!value) continue
    const dynamoDbProp = getDynamoDbFormattedProp(value)
    if (!dynamoDbProp) continue
    dynamoItem[key] = dynamoDbProp
  }

  return dynamoItem
}

const getDynamoDbFormattedProp = (value: any): any => {
  let dynamodbValue = value
  let typeFound = availableTypes.find(({ type }) => typeof value === type)
  if (!typeFound || !typeFound.type) {
    typeFound = availableTypes.find(({ type }) => type === 'string')
    dynamodbValue = JSON.stringify(value)
  }
  const { dynamoDbPropType } = typeFound

  if (!dynamoDbPropType) return null

  return { [dynamoDbPropType]: dynamodbValue.toString ? dynamodbValue.toString() : dynamodbValue }
}

const getJsPropFromDynamoDbProp = (dynamoDbProp: object): any => {
  const dynamoDbType = Object.keys(dynamoDbProp)[0]
  const propValueStr = dynamoDbProp[dynamoDbType]
  const typeFound = availableTypes.find(({ dynamoDbPropType }) => dynamoDbPropType === dynamoDbType)
  if (!typeFound || !typeFound.type) {
    return null
  }
  const { type } = typeFound

  if (type === 'string') return propValueStr
  if (type === 'number') return Number(propValueStr)
  return !!propValueStr
}

const dynamoDbItemsToJsObjects = (Items: any[]): object[] => Items.map((Item) => {
  const propNames = Object.keys(Item)
  const resultObj = {}
  propNames.forEach((propName) => {
    const dynamoDbProp = Item[propName]
    const propValue = getJsPropFromDynamoDbProp(dynamoDbProp)
    resultObj[propName] = propValue
  })

  return resultObj
})

export default {
  putItem,
  getItem,
  queryItems,
  dynamoDbItemsToJsObjects,
}
