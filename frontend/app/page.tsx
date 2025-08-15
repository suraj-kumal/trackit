"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { ModeToggle } from "@/app/components/modeToggle";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  LayoutDashboard,
  Lock,
  UserPlus,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const ctaRef = useRef(null);

  // Fix hydration mismatch by using state for auth token
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("auth_token");
    setHasAuthToken(!!token);
  }, []);

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const featuresInView = useInView(featuresRef, {
    once: true,
    margin: "-100px",
  });
  const howItWorksInView = useInView(howItWorksRef, {
    once: true,
    margin: "-100px",
  });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/30 backdrop-blur-md border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                whileHover={{ rotate: 15, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </motion.div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                TrackIt
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ModeToggle />
            {hasAuthToken ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg text-sm sm:text-base px-3 sm:px-4 py-2 cursor-pointer"
                  onClick={() => router.push("/dashboard")}
                >
                  <span className="hidden xs:inline">Go to Dashboard</span>
                  <span className="xs:hidden">Dashboard</span>
                  <LayoutDashboard className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    className="text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm sm:text-base px-3 sm:px-4 py-2"
                    onClick={() => router.push("/login")}
                  >
                    Login
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg cursor-pointer text-sm sm:text-base px-3 sm:px-4 py-2"
                    onClick={() => router.push("/signup")}
                  >
                    Sign Up
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden"
      >
        {/* Hero background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="text-center max-w-4xl mx-auto px-4 relative z-10">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Track Your Inventory{" "}
            <motion.span
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Effortlessly
            </motion.span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Manage items, track transactions, analyze revenues, and gain
            insights with powerful charts. Secure and easy for any business.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={() => router.push("/signup")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 relative">
        <div className="absolute inset-0 bg-accent/5 backdrop-blur-sm" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.h2
            className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={
              featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.6 }}
          >
            Powerful Features for Your Business
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShoppingCart className="h-8 w-8 text-primary" />,
                title: "Inventory Management",
                description:
                  "Add, edit, or remove items like shoes or laptops. Keep track of stock levels in real-time.",
              },
              {
                icon: <DollarSign className="h-8 w-8 text-primary" />,
                title: "Transaction Tracking",
                description:
                  "Record daily buys and sells with prices and quantities. Edit transactions anytime.",
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-primary" />,
                title: "Revenue Analytics",
                description:
                  "Calculate total, daily, weekly, monthly, or custom revenues. View profit margins and ROI.",
              },
              {
                icon: <BarChart3 className="h-8 w-8 text-primary" />,
                title: "Insightful Charts",
                description:
                  "Visualize sales volume, purchase volume, price trends, and more with interactive graphs.",
              },
              {
                icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
                title: "Customizable Dashboard",
                description:
                  "See top-performing items, recent transactions, and performance metrics at a glance.",
              },
              {
                icon: <Lock className="h-8 w-8 text-primary" />,
                title: "Secure Authentication",
                description:
                  "Full login, signup, email verification, forgot password, and reset features for multiple users.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="h-full"
              >
                <Card className="bg-card/50 backdrop-blur-md border border-border/50 hover:bg-card/70 transition-all duration-300 hover:shadow-xl supports-[backdrop-filter]:bg-card/30 h-full cursor-pointer">
                  <CardHeader>
                    <motion.div
                      className="mb-2"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <CardTitle className="text-foreground">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works / Screenshots Section */}
      <section ref={howItWorksRef} className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={
              howItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.6 }}
          >
            See TrackIt in Action
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Dashboard Overview",
                description:
                  "Monitor key metrics like revenue, profit, and sales.",
              },
              {
                title: "Item Details & Charts",
                description:
                  "Detailed analysis with price trends and volume charts.",
              },
              {
                title: "Inventory Management",
                description: "Manage items and transactions seamlessly.",
              },
              {
                title: "Transactions List",
                description:
                  "Track all buys and sells with profit calculations.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  howItWorksInView
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-card/50 backdrop-blur-md border border-border/50 rounded-lg p-6 hover:bg-card/70 transition-all duration-300 hover:shadow-xl supports-[backdrop-filter]:bg-card/30 cursor-pointer"
              >
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 text-center relative">
        <div className="absolute inset-0 bg-accent/5 backdrop-blur-sm" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <motion.h2
            className="text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
          >
            Ready to Streamline Your Inventory?
          </motion.h2>
          <motion.p
            className="text-xl mb-8 text-muted-foreground"
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Sign up today and take control of your business metrics.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={() => router.push("/signup")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              Start Tracking Now <UserPlus className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground border-t border-border/50 bg-card/20 backdrop-blur-sm">
        <p>&copy; Suraj Kumal 2025. All rights reserved.</p>
      </footer>
    </div>
  );
}
