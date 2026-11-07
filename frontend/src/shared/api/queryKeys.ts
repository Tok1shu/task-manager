// Корневые ключи кеша. Фичи строят свои ключи от них; после мутации сбрасываем нужный корень целиком.
export const rootKeys = {
  me: ["me"] as const,
  projects: ["projects"] as const,
  tasks: ["tasks"] as const,
  comments: ["comments"] as const,
}
