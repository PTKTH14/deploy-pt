import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  return (
    <Sonner
      theme="light"
      richColors
      closeButton
      expand
      position="top-right"
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "0.5rem",
          padding: "1rem",
        },
      }}
    />
  )
}

export { Toaster }
