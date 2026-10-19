import type { ReactNode } from "react"
import { CheckSquare } from "lucide-react"
import { Card } from "@/shared/ui"

/** Каркас страниц входа и регистрации. */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-accent text-accent-500">
            <CheckSquare className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold text-bright">{title}</h1>
          <p className="text-sm text-subtle">{subtitle}</p>
        </div>
        <Card className="p-5">{children}</Card>
        <p className="mt-4 text-center text-sm text-subtle">{footer}</p>
      </div>
    </div>
  )
}
