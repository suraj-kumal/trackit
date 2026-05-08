"use client";

import { ModeToggle } from "@/app/components/modeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence, easeOut, easeIn } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Lock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Eye,
    EyeOff,
} from "lucide-react";

// Separate component for the reset password form
function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [token, setToken] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Extract token and email from URL parameters
    useEffect(() => {
        const tokenParam = searchParams.get("token");
        const emailParam = searchParams.get("email");

        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError(
                "Invalid reset link. Please request a new password reset.",
            );
        }

        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
        }
    }, [searchParams]);

    const handleResetPassword = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setMessage("");

        // Validation
        if (!email) {
            setError("Email is required.");
            setIsLoading(false);
            return;
        }

        if (!password) {
            setError("Password is required.");
            setIsLoading(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            setIsLoading(false);
            return;
        }

        if (!passwordConfirmation) {
            setError("Password confirmation is required.");
            setIsLoading(false);
            return;
        }

        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        if (!token) {
            setError("Reset token is missing. Please use a valid reset link.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_B_URL}/api/reset-password`,
                {
                    token,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    validateStatus: function (status) {
                        return status >= 200 && status < 500;
                    },
                },
            );

            if (response.status === 200) {
                setMessage(
                    "Password reset successful! You can now login with your new password.",
                );
                setResetSuccess(true);
                // Clear form
                setPassword("");
                setPasswordConfirmation("");
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(
                    response.data.message ||
                        "Failed to reset password. Please try again.",
                );
            }
        } catch (error: any) {
            console.error("Reset password error:", error);

            if (error.response) {
                if (error.response.status === 400) {
                    setError(
                        "Invalid or expired reset token. Please request a new password reset.",
                    );
                } else if (error.response.status === 422) {
                    // Validation errors
                    const validationErrors = error.response.data.errors;
                    if (validationErrors) {
                        const firstError = Object.values(
                            validationErrors,
                        )[0] as string[];
                        setError(firstError[0]);
                    } else {
                        setError("Please check your input and try again.");
                    }
                } else if (error.response.status === 429) {
                    setError(
                        "Too many requests. Please wait a moment before trying again.",
                    );
                } else {
                    setError(
                        error.response.data.message ||
                            "Failed to reset password.",
                    );
                }
            } else if (error.request) {
                setError(
                    "Network error. Please check your connection and try again.",
                );
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
        <motion.div
            className="w-full max-w-md p-6 md:p-8 rounded-lg shadow-md border border-border space-y-6 text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Lock Icon */}
            <motion.div className="flex justify-center" variants={iconVariants}>
                <div
                    className={`w-20 h-20 rounded-full ${
                        resetSuccess
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-purple-100 dark:bg-purple-900"
                    } flex items-center justify-center`}
                >
                    {resetSuccess ? (
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    ) : (
                        <Lock className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    )}
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                className="text-2xl font-semibold"
                variants={itemVariants}
            >
                {resetSuccess
                    ? "Password Reset Successful!"
                    : "Reset Your Password"}
            </motion.h1>

            {/* Description */}
            <motion.p
                className="text-muted-foreground text-sm"
                variants={itemVariants}
            >
                {resetSuccess
                    ? "Your password has been successfully reset. You will be redirected to the login page shortly."
                    : "Enter your new password below. Make sure it's at least 8 characters long and secure."}
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
            {!resetSuccess && (
                <motion.form
                    onSubmit={handleResetPassword}
                    className="space-y-4"
                    variants={itemVariants}
                >
                    <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="w-full"
                        required
                    />

                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="New password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full pr-10"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                            disabled={isLoading}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <Input
                            type={
                                showPasswordConfirmation ? "text" : "password"
                            }
                            placeholder="Confirm new password"
                            value={passwordConfirmation}
                            onChange={(e) =>
                                setPasswordConfirmation(e.target.value)
                            }
                            disabled={isLoading}
                            className="w-full pr-10"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setShowPasswordConfirmation(
                                    !showPasswordConfirmation,
                                )
                            }
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                            disabled={isLoading}
                        >
                            {showPasswordConfirmation ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    <Button
                        type="submit"
                        className="w-full max-w-xs cursor-pointer"
                        disabled={isLoading || !token}
                    >
                        <motion.span
                            className="flex items-center justify-center gap-2"
                            animate={
                                isLoading
                                    ? { opacity: [1, 0.5, 1] }
                                    : { opacity: 1 }
                            }
                            transition={
                                isLoading
                                    ? { repeat: Infinity, duration: 1.5 }
                                    : {}
                            }
                        >
                            {isLoading && (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            )}
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </motion.span>
                    </Button>
                </motion.form>
            )}

            {/* Password Requirements */}
            {!resetSuccess && !error.includes("token") && (
                <motion.div
                    className="text-xs text-muted-foreground space-y-1"
                    variants={itemVariants}
                >
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside text-left max-w-xs mx-auto space-y-1">
                        <li
                            className={
                                password.length >= 8 ? "text-green-600" : ""
                            }
                        >
                            At least 8 characters
                        </li>
                        <li
                            className={
                                password === passwordConfirmation && password
                                    ? "text-green-600"
                                    : ""
                            }
                        >
                            Passwords must match
                        </li>
                    </ul>
                </motion.div>
            )}

            {/* Additional Actions */}
            <motion.div
                className="space-y-2 text-sm text-muted-foreground"
                variants={itemVariants}
            >
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
                    {!resetSuccess && (
                        <motion.button
                            onClick={() => router.push("/forgot-password")}
                            className="underline hover:text-primary transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ ease: easeOut }}
                        >
                            Request New Link
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// Loading fallback component
function LoadingFallback() {
    return (
        <div className="w-full max-w-md p-6 md:p-8 rounded-lg shadow-md border border-border space-y-6 text-center">
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <RefreshCw className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin" />
                </div>
            </div>
            <h1 className="text-2xl font-semibold">Loading...</h1>
            <p className="text-muted-foreground text-sm">
                Please wait while we prepare your reset form.
            </p>
        </div>
    );
}

// Main component
export default function Home() {
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
                    <Suspense fallback={<LoadingFallback />}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
