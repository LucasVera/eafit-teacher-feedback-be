import aws from "../aws"
import { ClassType } from "../types/Classes"

const {
  CLASSES_TABLE,
} = process.env

const mapDbClassToClass = (dbClass: any): ClassType => ({
  classId: dbClass.classId,
  screenshotBasePath: dbClass.screenshotBasePath,
  screenshotIntervalSeconds: dbClass.screenshotIntervalSeconds,
  screenshotsBucketName: dbClass.screenshotsBucketName,
  startedAtUtc: dbClass.startedAtUtc,
})

const findClassById = async (id: string): Promise<ClassType> => {
  const classId = Number(id)
  if (isNaN(classId)) {
    throw new Error(`Invalid classId: ${id}.`)
  }

  const { Item } = await aws.dynamodb.getItem(
    CLASSES_TABLE,
    { name: 'classId', value: classId }
  )

  if (!Item) {
    throw new Error(`Class not found: ${id}.`)
  }

  const [dbClass] = aws.dynamodb.dynamoDbItemsToJsObjects([Item])

  return mapDbClassToClass(dbClass)
}

export default {
  findClassById,
}
