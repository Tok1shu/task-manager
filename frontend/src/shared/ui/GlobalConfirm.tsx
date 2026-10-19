import { useConfirmStore } from "../stores/confirm"
import { Button } from "./Button"
import { Modal } from "./Modal"

export function GlobalConfirm() {
  const request = useConfirmStore((s) => s.request)
  const close = useConfirmStore((s) => s.close)
  return (
    <Modal open={!!request} title={request?.title ?? ""} onClose={() => close(false)} className="sm:max-w-md">
      {request?.message && <p className="mb-5 text-sm text-subtle">{request.message}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => close(false)}>
          Отмена
        </Button>
        <Button variant={request?.danger ? "danger" : "primary"} onClick={() => close(true)}>
          {request?.confirmLabel ?? "Подтвердить"}
        </Button>
      </div>
    </Modal>
  )
}
