// Идентификаторы сущностей — UUID-строки. «Брендированные» типы не дают перепутать projectId и taskId.
type Brand<B extends string> = string & { readonly __brand: B }

export type UserId = Brand<"UserId">
export type ProjectId = Brand<"ProjectId">
export type TaskId = Brand<"TaskId">
export type CommentId = Brand<"CommentId">

export const asProjectId = (s: string) => s as ProjectId
export const asTaskId = (s: string) => s as TaskId
export const asUserId = (s: string) => s as UserId
