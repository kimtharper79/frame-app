import { createRoot } from "react-dom/client"
import { Toaster } from "sonner"
import { AuthProvider } from "./contexts/AuthContext"
import App from "./app/App.tsx"
import "./styles/index.css"

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#1A1A1A",
          color: "#fff",
          borderRadius: "8px",
          fontSize: "14px",
        },
      }}
    />
  </AuthProvider>
)
