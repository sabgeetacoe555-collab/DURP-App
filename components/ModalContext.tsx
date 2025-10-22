import React, { createContext, useContext, useState, ReactNode } from "react"

interface ModalContextType {
  isModalVisible: boolean
  showModal: () => void
  hideModal: () => void
  shouldResetSessions: boolean
  setShouldResetSessions: (reset: boolean) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [shouldResetSessions, setShouldResetSessions] = useState(false)

  const showModal = () => setIsModalVisible(true)
  const hideModal = () => setIsModalVisible(false)

  return (
    <ModalContext.Provider
      value={{
        isModalVisible,
        showModal,
        hideModal,
        shouldResetSessions,
        setShouldResetSessions,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
