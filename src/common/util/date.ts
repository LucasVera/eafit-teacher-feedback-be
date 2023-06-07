import moment from "moment"

/**
 * Returns a human readable string of the time passed since the given timestamp.
 * @param timestamp The timestamp to compare to the current time.
 * @returns string of human-readable time passed since the given timestamp.
 */
export function getTimePassedSinceTimestamp(timestamp: number): string {
  const asDate = moment(timestamp)
  const diff = moment.duration(moment().diff(asDate))

  return diff.locale('es').humanize()
}

export function getTimestamp(date = new Date()): number {
  return Math.floor(date.getTime() / 1000)
}

export function isTimestampExpired(timestamp: number, seconds: number): boolean {
  return (getTimestamp() - timestamp) > seconds
}
