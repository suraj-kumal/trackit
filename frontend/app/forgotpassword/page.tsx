"use client";

import { ModeToggle } from "@/app/components/modeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState } from "react";
import { motion, AnimatePresence, easeOut, easeIn } from "framer-motion";
import { useRouter } from "next/navigation";
import { KeyRound, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    // Basic email validation
    if (!email) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_B_URL}/api/forgot-password`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          },
        }
      );


      if (response.status === 200) {
        setMessage("Password reset link has been sent to your email!");
        setEmailSent(true);
        setEmail(""); // Clear email field
      } else {
        setError(
          response.data.message ||
            "Failed to send reset link. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);

      if (error.response) {
        if (error.response.status === 404) {
          setError("No account found with this email address.");
        } else if (error.response.status === 429) {
          setError(
            "Too many requests. Please wait a moment before trying again."
          );
        } else if (error.response.status === 500) {
          setError("Unable to send reset link. Please try again later.");
        } else {
          setError(error.response.data.message || "Failed to send reset link.");
        }
      } else if (error.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
        ease: easeOut,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ease: easeOut,
      },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: easeOut,
      },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easeOut,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.3,
        ease: easeIn,
      },
    },
  };

  return (
    <div className="min-h-screen">
      <main className="relative flex flex-col p-4 md:p-6 min-h-screen">
        {/* Mode Toggle in top-right corner */}
        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.2,
            ease: easeOut,
          }}
        >
          <ModeToggle />
        </motion.div>

        {/* Centered Content */}
        <div className="flex-grow flex items-center justify-center">
          <motion.div
            className="w-full max-w-md p-6 md:p-8 rounded-lg shadow-md border border-border space-y-6 text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Key Icon */}
            <motion.div className="flex justify-center" variants={iconVariants}>
              <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <KeyRound className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-2xl font-semibold"
              variants={itemVariants}
            >
              Forgot Password
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-muted-foreground text-sm"
              variants={itemVariants}
            >
              {emailSent
                ? "We've sent a password reset link to your email address. Check your inbox and follow the instructions to reset your password."
                : "Enter your email address and we'll send you a link to reset your password."}
            </motion.p>

            {/* Success Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  className="flex items-center justify-center gap-2 p-3 rounded-md bg-green-100 border border-green-400 text-green-700 text-sm"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <CheckCircle className="w-4 h-4" />
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="flex items-center justify-center gap-2 p-3 rounded-md bg-red-100 border border-red-400 text-red-700 text-sm"
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            {!emailSent && (
              <motion.form
                onSubmit={handleForgotPassword}
                className="space-y-4"
                variants={itemVariants}
              >
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full"
                  required
                />
                <Button
                  type="submit"
                  className="w-full max-w-xs cursor-pointer"
                  disabled={isLoading}
                >
                  <motion.span
                    className="flex items-center justify-center gap-2"
                    animate={
                      isLoading ? { opacity: [1, 0.5, 1] } : { opacity: 1 }
                    }
                    transition={
                      isLoading ? { repeat: Infinity, duration: 1.5 } : {}
                    }
                  >
                    {isLoading && (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    )}
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </motion.span>
                </Button>
              </motion.form>
            )}

            {/* Try Again Button for after email is sent */}
            {emailSent && (
              <motion.div className="space-y-4" variants={itemVariants}>
                <Button
                  onClick={() => {
                    setEmailSent(false);
                    setMessage("");
                    setError("");
                  }}
                  variant="outline"
                  className="w-full max-w-xs cursor-pointer"
                >
                  Send Another Reset Link
                </Button>
              </motion.div>
            )}

            {/* Additional Actions */}
            <motion.div
              className="space-y-2 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              {emailSent && (
                <p>Didn't receive the email? Check your spam folder.</p>
              )}
              <div className="flex justify-center gap-4">
                <motion.button
                  onClick={() => router.push("/login")}
                  className="underline hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ ease: easeOut }}
                >
                  Back to Login
                </motion.button>
                <motion.button
                  onClick={() => router.push("/signup")}
                  className="underline hover:text-primary transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ ease: easeOut }}
                >
                  Create Account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
