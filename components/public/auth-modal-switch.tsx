"use client"

import type { AuthModalKey } from "@/app/(public)/types"

type AuthModalSwitchProps = {
  activeModal: AuthModalKey
  renderLoginModal: (handlers: ModalHandlers) => React.ReactNode
  renderRegisterModal: (handlers: ModalHandlers) => React.ReactNode
  onClose: () => void
  onSwitch: (next: AuthModalKey) => void
}

type ModalHandlers = {
  onClose: () => void
  onSwitch: (next: AuthModalKey) => void
}

export function AuthModalSwitch({
  activeModal,
  renderLoginModal,
  renderRegisterModal,
  onClose,
  onSwitch,
}: AuthModalSwitchProps) {
  const handlers: ModalHandlers = {
    onClose,
    onSwitch,
  }

  if (activeModal === "login") {
    return renderLoginModal(handlers)
  }

  if (activeModal === "register") {
    return renderRegisterModal(handlers)
  }

  return null
}

