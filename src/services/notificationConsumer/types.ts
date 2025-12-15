export type ParsedMessage = {
   pattern: string | null
   payload?: unknown
   raw: string
}

export type NotificationHandler = (parsed: ParsedMessage) => Promise<void>
