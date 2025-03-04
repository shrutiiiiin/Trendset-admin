import { useState } from "react"
import { motion } from "framer-motion"
import { AnimatedLogo } from "@/components/AnimatedLogo"
import { LoginForm } from "@/components/LoginForm"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export default function LoginPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? "dark" : ""} bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800`}
    >
      <Toaster />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 right-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="bg-white/20 backdrop-blur-sm text-gray-800 dark:text-white hover:bg-white/30 rounded-full p-2"
        >
          {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
        </Button>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl"
      >
        <div className="text-center">
          <AnimatedLogo />
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Admin Portal
          </motion.h2>
        </div>
        <LoginForm />
      </motion.div>
    </div>
  )
}

