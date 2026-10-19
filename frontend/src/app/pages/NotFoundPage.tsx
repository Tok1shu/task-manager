import { Link } from "react-router"
import { Button } from "@/shared/ui"

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-semibold text-faint">404</p>
      <p className="mt-3 text-secondary">Такой страницы нет</p>
      <Link to="/projects" className="mt-6 inline-block">
        <Button variant="secondary">К проектам</Button>
      </Link>
    </div>
  )
}
