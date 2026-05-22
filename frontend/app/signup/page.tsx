"use client";

import Image from "next/image";
import { ModeToggle } from "@/app/components/modeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";
import { useState } from "react";
import {
    motion,
    AnimatePresence,
    useAnimation,
    easeOut,
    easeIn,
} from "framer-motion";

import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";

export default function Home() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    type Errors = {
        name?: string[];
        email?: string[];
        password?: string[];
        password_confirmation?: string[];
        general?: string;
        [key: string]: any;
    };

    const [errors, setErrors] = useState<Errors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleInputChange = (e: { target: { name: any; value: any } }) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear specific field error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setSuccessMessage("");

        try {
            console.log(`${process.env.NEXT_PUBLIC_B_URL}/api/register`);
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_B_URL}/api/register`,
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    // This prevents Axios from throwing errors for 4xx status codes
                    validateStatus: function (status) {
                        return status >= 200 && status < 500; // Accept 2xx, 3xx, and 4xx
                    },
                },
            );

            console.log("Response status:", response.status);
            console.log("Response data:", response.data);

            if (
                response.status === 201 &&
                response.data.success &&
                response.data.token
            ) {
                // Store token in localStorage
                localStorage.setItem("auth_token", response.data.token);

                // Show success message briefly before redirect
                setSuccessMessage(
                    "Registration successful! Redirecting for email verification...",
                );

                // Clear form
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    password_confirmation: "",
                });

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    router.push("/verifyemail?sent=1");
                }, 1500);
            } else if (response.status === 422) {
                // Handle 422 validation errors
                console.log("422 Validation errors:", response.data.errors);
                setErrors(response.data.errors || {});
            } else if (!response.data.success) {
                // Handle other unsuccessful responses
                setErrors({
                    general:
                        response.data.error ||
                        "Registration failed. Please try again.",
                });
            }
        } catch (error: any) {
            console.error("Network or server error:", error);

            if (error.response) {
                // Server responded with error status (5xx)
                console.log("Error response status:", error.response.status);
                console.log("Error response data:", error.response.data);

                if (error.response.status === 500) {
                    setErrors({
                        general:
                            error.response.data.error ||
                            "Server error. Please try again.",
                    });
                } else {
                    setErrors({
                        general: "Something went wrong. Please try again.",
                    });
                }
            } else if (error.request) {
                // Network error
                console.log("Network error:", error.request);
                setErrors({
                    general:
                        "Network error. Please check your connection and try again.",
                });
            } else {
                // Something else went wrong
                console.log("Unexpected error:", error.message);
                setErrors({
                    general: "An unexpected error occurred. Please try again.",
                });
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
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    const errorVariants = {
        hidden: { opacity: 0, height: 0, marginTop: 0 },
        visible: {
            opacity: 1,
            height: "auto",
            marginTop: 8,
            transition: {
                duration: 0.3,
                ease: easeOut,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            marginTop: 0,
            transition: {
                duration: 0.2,
                ease: easeIn,
            },
        },
    };

    const successVariants = {
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
                    className="flex justify-between w-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link href={"/"}>
                        <BarChart3 className="h-6 w-6 text-primary m-1" />
                    </Link>
                    <ModeToggle />
                </motion.div>

                {/* Centered Form */}
                <div className="flex-grow flex items-center justify-center">
                    <motion.form
                        onSubmit={handleSubmit}
                        className="w-full max-w-md p-6 md:p-8 rounded-lg shadow-md border border-border space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.h1
                            className="text-center text-2xl font-semibold mb-6"
                            variants={itemVariants}
                        >
                            Sign Up
                        </motion.h1>

                        {/* Success Message */}
                        <AnimatePresence>
                            {successMessage && (
                                <motion.div
                                    className="p-3 rounded-md bg-green-100 border border-green-400 text-green-700 text-sm"
                                    variants={successVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    {successMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* General Error Message */}
                        <AnimatePresence>
                            {errors.general && (
                                <motion.div
                                    className="p-3 rounded-md bg-red-100 border border-red-400 text-red-700 text-sm"
                                    variants={successVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    {errors.general}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            className="space-y-2"
                            variants={itemVariants}
                        >
                            <Input
                                type="text"
                                placeholder="Name"
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={errors.name ? "border-red-500" : ""}
                            />
                            <AnimatePresence>
                                {errors.name && (
                                    <motion.p
                                        className="text-sm text-red-600"
                                        variants={errorVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        {errors.name[0]}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <motion.div
                            className="space-y-2"
                            variants={itemVariants}
                        >
                            <Input
                                type="email"
                                placeholder="Email"
                                required
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={errors.email ? "border-red-500" : ""}
                            />
                            <AnimatePresence>
                                {errors.email && (
                                    <motion.p
                                        className="text-sm text-red-600"
                                        variants={errorVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        {errors.email[0]}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <motion.div
                            className="space-y-2"
                            variants={itemVariants}
                        >
                            <Input
                                type="password"
                                placeholder="Password"
                                required
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={
                                    errors.password ? "border-red-500" : ""
                                }
                            />
                            <AnimatePresence>
                                {errors.password && (
                                    <motion.p
                                        className="text-sm text-red-600"
                                        variants={errorVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        {errors.password[0]}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <motion.div
                            className="space-y-2"
                            variants={itemVariants}
                        >
                            <Input
                                type="password"
                                placeholder="Confirm Password"
                                required
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleInputChange}
                                className={
                                    errors.password_confirmation
                                        ? "border-red-500"
                                        : ""
                                }
                            />
                            <AnimatePresence>
                                {errors.password_confirmation && (
                                    <motion.p
                                        className="text-sm text-red-600"
                                        variants={errorVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        {errors.password_confirmation[0]}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={isLoading}
                            >
                                <motion.span
                                    animate={
                                        isLoading
                                            ? { opacity: [1, 0.5, 1] }
                                            : { opacity: 1 }
                                    }
                                    transition={
                                        isLoading
                                            ? {
                                                  repeat: Infinity,
                                                  duration: 1.5,
                                              }
                                            : {}
                                    }
                                >
                                    {isLoading ? "Signing Up..." : "Sign Up"}
                                </motion.span>
                            </Button>
                        </motion.div>

                        <motion.div
                            className="flex justify-between text-sm text-muted-foreground"
                            variants={itemVariants}
                        >
                            <p className="text-sm text-center text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="underline hover:text-primary transition-colors"
                                >
                                    Login
                                </Link>
                            </p>
                        </motion.div>
                    </motion.form>
                </div>
                <footer className="py-6 text-center text-muted-foreground border-t border-border/50 bg-card/20 backdrop-blur-sm">
                    <p>&copy; Suraj Kumal 2026. All rights reserved.</p>
                </footer>
            </main>
        </div>
    );
}
