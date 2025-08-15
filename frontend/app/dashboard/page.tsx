"use client";

import Image from "next/image";
import { ModeToggle } from "@/app/components/modeToggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  easeOut,
  easeIn,
} from "framer-motion";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  BarChart3,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: number;
  item_id: number;
  total_buy: number;
  total_sell: number;
  cost_price: string;
  selling_price: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

interface ItemPerformance {
  item_id: number;
  profit: number;
  revenue: number;
  sales_volume: number;
  stock_left: number;
  profit_margin: number;
}

interface TransactionData {
  success: boolean;
  transaction: Transaction[];
  total_sell: number;
  stock_left: number;
  revenue: number;
  total_net_profit: number;
  average_profit_per_sale: number;
  profit_margin_percent: number;
  return_on_investment_percent: number;
  total_investment: number;
  this_week_revenue: number;
  this_week_net_profit: number;
  weekly_sales_volume: number;
  weekly_profit_margin_percent: number;
  weekly_growth_rate_percent: number;
  avg_daily_revenue: number;
  avg_daily_profit: number;
  avg_daily_sales: number;
  this_month_revenue: number;
  this_month_net_profit: number;
  monthly_sales_volume: number;
  monthly_profit_margin_percent: number;
  monthly_growth_rate_percent: number;
  avg_monthly_daily_revenue: number;
  avg_monthly_daily_profit: number;
  avg_monthly_daily_sales: number;
  item_performance: ItemPerformance[];
  top_performing_items: ItemPerformance[];
  slow_moving_items: ItemPerformance[];
}

interface Item {
  id: number;
  name: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface ItemChartData {
  date: string;
  costPrice: number;
  sellingPrice: number;
  totalBuy: number;
  totalSell: number;
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [transactionData, setTransactionData] =
    useState<TransactionData | null>(null);
  const [items, setItems] = useState<Record<number, Item>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      // nothing to do — force redirect
      router.push("/login");
      return;
    }

    try {
      setIsLoggingOut(true);

      // send POST to logout endpoint with Authorization header
      const resp = await axios.post(
        `${process.env.NEXT_PUBLIC_B_URL}/api/logout`,
        {}, // no body required usually, send empty object
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          validateStatus: (status) => status >= 200 && status < 500,
        }
      );

      if (resp.status === 200 || resp.data?.success) {
        localStorage.removeItem("auth_token");
        setUser(null);
        router.push("/login");
        return;
      }

      console.warn("Logout failed:", resp.data || resp.status);

      localStorage.removeItem("auth_token");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);

      localStorage.removeItem("auth_token");
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("ne-NP", {
      style: "currency",
      currency: "NPR",
    }).format(amount);
    return formatted.replace("नेरू", "Rs.");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const prepareItemChartData = (itemId: number): ItemChartData[] => {
    if (!transactionData) return [];

    const itemTransactions = transactionData.transaction
      .filter((t) => t.item_id === itemId)
      .sort(
        (a, b) =>
          new Date(a.transaction_date).getTime() -
          new Date(b.transaction_date).getTime()
      );

    return itemTransactions.map((transaction) => ({
      date: transaction.transaction_date,
      costPrice: parseFloat(transaction.cost_price),
      sellingPrice: parseFloat(transaction.selling_price),
      totalBuy: transaction.total_buy,
      totalSell: transaction.total_sell,
    }));
  };

  const getUniqueItemIds = (): number[] => {
    if (!transactionData) return [];
    return [...new Set(transactionData.transaction.map((t) => t.item_id))];
  };

  const getItemPerformance = (itemId: number): ItemPerformance | null => {
    if (!transactionData) return null;
    return (
      transactionData.item_performance.find(
        (item) => item.item_id === itemId
      ) || null
    );
  };

  // Fetch user data
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        router.push("/login");
        return null;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_B_URL}/api/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          },
        }
      );

      if (response.data.message === "unauthenticated") {
        localStorage.removeItem("auth_token");
        router.push("/login");
        return null;
      }
     
      if (response.data.email_verified_at === null) {
        router.push("/verifyemail?sent=0");
        return null;
      }

      return response.data;
    } catch (error) {
      console.error("User fetch error:", error);
      localStorage.removeItem("auth_token");
      router.push("/login");
      return null;
    }
  };

  // Fetch transaction data
  const fetchTransactionData = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_B_URL}/api/transaction`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          },
        }
      );

      if (response.data.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Transaction fetch error:", error);
      return null;
    }
  };

  // Fetch item details
  const fetchItem = async (itemId: number): Promise<Item | null> => {
    try {
      const token = localStorage.getItem("auth_token");

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_B_URL}/api/item/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          },
        }
      );

      if (response.data.success) {
        return response.data.item;
      }
      return null;
    } catch (error) {
      console.error(`Item ${itemId} fetch error:`, error);
      return null;
    }
  };

  // Load all data on page load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Fetch user first
        const userData = await fetchUser();
        if (!userData) return;

        setUser(userData);

        // Fetch transaction data
        const transData = await fetchTransactionData();
        if (transData) {
          setTransactionData(transData);

          const itemIds = new Set<number>();
          transData.transaction.forEach((t: Transaction) =>
            itemIds.add(t.item_id)
          );
          transData.item_performance.forEach((item: ItemPerformance) =>
            itemIds.add(item.item_id)
          );

          // Fetch all items
          const itemsData: Record<number, Item> = {};
          await Promise.all(
            Array.from(itemIds).map(async (itemId) => {
              const item = await fetchItem(itemId);
              if (item) {
                itemsData[itemId] = item;
              }
            })
          );
          setItems(itemsData);
        }
      } catch (error) {
        console.error("Data loading error:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const menuButton = document.getElementById("menu-button");

      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
        ease: easeOut,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easeOut,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: easeOut,
      },
    },
  };

  // Render individual item analysis
  const renderItemAnalysis = (itemId: number) => {
    const chartData = prepareItemChartData(itemId);
    const itemName = items[itemId]?.name || `Item ${itemId}`;
    const itemPerformance = getItemPerformance(itemId);

    return (
      <motion.div
        key={`item-${itemId}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: easeOut }}
      >
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-sm md:text-base">
                    {itemName}
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Detailed performance analysis
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs md:text-sm"
                onClick={() => {
                  setActiveNav("dashboard");
                  setSelectedItemId(null);
                  setIsSidebarOpen(false);
                }}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Item Performance Summary */}
            {itemPerformance && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Revenue
                  </p>
                  <p className="text-sm md:text-xl font-bold text-[min(4vw,1.25rem)]">
                    {formatCurrency(itemPerformance.revenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Profit
                  </p>
                  <p className="text-sm md:text-xl font-bold text-[min(4vw,1.25rem)]">
                    {formatCurrency(itemPerformance.profit)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Sales Volume
                  </p>
                  <p className="text-sm md:text-xl font-bold">
                    {itemPerformance.sales_volume}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Stock Left
                  </p>
                  <p className="text-sm md:text-xl font-bold">
                    {itemPerformance.stock_left}
                  </p>
                </div>
              </div>
            )}

            {/* Price Analysis Chart */}
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-4">
                Price Analysis
              </h4>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id={`colorCost${itemId}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id={`colorSelling${itemId}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        formatCurrency(Number(value)),
                        name,
                      ]}
                      labelFormatter={(label) => `Date: ${formatDate(label)}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sellingPrice"
                      name="Selling Price"
                      stroke="hsl(var(--foreground))"
                      fill={`url(#colorSelling${itemId})`}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="costPrice"
                      name="Cost Price"
                      stroke="hsl(var(--foreground))"
                      fill={`url(#colorCost${itemId})`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales Volume Chart */}
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-4">
                Sales Volume
              </h4>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: any) => [value, "Units Sold"]}
                      labelFormatter={(label) => `Date: ${formatDate(label)}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontSize: "12px",
                      }}
                      itemStyle={{
                        color: "hsl(var(--foreground))",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalSell"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Purchase Volume Chart */}
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-4">
                Purchase Volume
              </h4>
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      className="text-xs"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: any) => [value, "Units Purchased"]}
                      labelFormatter={(label) => `Date: ${formatDate(label)}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontSize: "12px",
                      }}
                      itemStyle={{
                        color: "hsl(var(--foreground))",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalBuy"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm md:text-lg">Loading dashboard...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-6"
        >
          <p className="text-red-600 mb-4 text-sm md:text-base">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          id="sidebar"
          className={`
            fixed lg:static top-0 left-0 z-50 lg:z-auto
            w-64 bg-card shadow-lg min-h-screen border-r overflow-y-auto
            transition-transform duration-300 ease-in-out lg:transition-none
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
          initial={{ x: -264 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <Link href="/">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-background" />
                  </div>
                  <span className="font-bold text-lg lg:text-xl">Track It</span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <nav className="space-y-2">
              <motion.button
                onClick={() => {
                  setActiveNav("dashboard");
                  setSelectedItemId(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm ${
                  activeNav === "dashboard"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                whileHover={{ x: activeNav !== "dashboard" ? 4 : 0 }}
                whileTap={{ scale: 0.98 }}
                transition={{ ease: easeOut }}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </motion.button>

              <motion.button
                onClick={() => {
                  setActiveNav("inventory");
                  setSelectedItemId(null);
                  setIsSidebarOpen(false);
                  router.push("/inventory");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ ease: easeOut }}
              >
                <Package className="w-5 h-5" />
                Inventory
                <ExternalLink className="w-3 h-3 ml-auto" />
              </motion.button>

              {/* Items Section */}
              <div className="pt-4 border-t">
                <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground mb-2 px-4">
                  Items
                </h3>
                <div className="space-y-1 max-h-64">
                  {getUniqueItemIds().map((itemId) => {
                    const itemName = items[itemId]?.name || `Item ${itemId}`;
                    const isSelected = selectedItemId === itemId;

                    return (
                      <motion.button
                        key={itemId}
                        onClick={() => {
                          setActiveNav("item");
                          setSelectedItemId(itemId);
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-xs lg:text-sm transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                        whileHover={{ x: !isSelected ? 4 : 0 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ ease: easeOut }}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className="truncate">{itemName}</span>
                        {isSelected && (
                          <ChevronRight className="w-3 h-3 ml-auto" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top Bar */}
          <motion.header
            className="bg-card shadow-sm px-4 lg:px-6 py-4 flex justify-between items-center border-b"
            initial={{ y: -64 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <div className="flex items-center gap-4">
              <Button
                id="menu-button"
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-4 h-4" />
              </Button>
              <div>
                {/* <h1 className="text-lg lg:text-2xl font-bold text-foreground">
                  {selectedItemId
                    ? `Analysis: ${
                        items[selectedItemId]?.name || `Item ${selectedItemId}`
                      }`
                    : `${getGreeting()}!  ${user?.name}`}
                </h1> */}
                {/* <h1 className="text-lg lg:text-2xl font-bold text-foreground">
                  {selectedItemId ? (
                    `Analysis: ${
                      items[selectedItemId]?.name || `Item ${selectedItemId}`
                    }`
                  ) : (
                    <>
                      <span className="block lg:inline">{getGreeting()}!</span>{" "}
                      <span className="block lg:inline">{user?.name}</span>
                    </>
                  )}
                </h1> */}
                <h1 className="text-lg lg:text-2xl font-bold text-foreground">
                  {selectedItemId ? (
                    <>
                      <span className="block lg:inline">Analysis:</span>{" "}
                      <span className="block lg:inline">
                        {items[selectedItemId]?.name ||
                          `Item ${selectedItemId}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block lg:inline">{getGreeting()}!</span>{" "}
                      <span className="block lg:inline">{user?.name}</span>
                    </>
                  )}
                </h1>

                <p className="text-muted-foreground text-xs lg:text-sm">
                  {selectedItemId
                    ? "Detailed performance metrics and charts"
                    : "Welcome back to TrackIt"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <ModeToggle />
              <Button
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 cursor-pointer text-xs lg:text-sm"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Logout
              </Button>
            </div>
          </motion.header>

          {/* Content Area */}
          <div className="p-4 lg:p-6">
            <AnimatePresence mode="wait" initial={false}>
              {activeNav === "item" && selectedItemId ? (
                // Show individual item analysis
                renderItemAnalysis(selectedItemId)
              ) : (
                // Show dashboard content
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Key Metrics Cards */}
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8"
                    variants={itemVariants}
                  >
                    {/* Total Revenue */}
                    <motion.div
                      variants={cardVariants}
                      whileHover={{ y: -2 }}
                      transition={{ ease: easeOut }}
                    >
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs lg:text-sm font-medium">
                            Total Revenue
                          </CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl lg:text-2xl font-bold">
                            {formatCurrency(transactionData?.revenue || 0)}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                            <span className="text-green-500 font-medium">
                              {transactionData?.weekly_growth_rate_percent || 0}
                              %
                            </span>
                            <span className="ml-1">vs last week</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Net Profit */}
                    <motion.div
                      variants={cardVariants}
                      whileHover={{ y: -2 }}
                      transition={{ ease: easeOut }}
                    >
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs lg:text-sm font-medium">
                            Net Profit
                          </CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl lg:text-2xl font-bold">
                            {formatCurrency(
                              transactionData?.total_net_profit || 0
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">
                              {transactionData?.profit_margin_percent?.toFixed(
                                1
                              ) || 0}
                              %
                            </span>
                            <span className="ml-1">profit margin</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Total Sales */}
                    <motion.div
                      variants={cardVariants}
                      whileHover={{ y: -2 }}
                      transition={{ ease: easeOut }}
                    >
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs lg:text-sm font-medium">
                            Total Sales
                          </CardTitle>
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl lg:text-2xl font-bold">
                            {transactionData?.total_sell || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">
                              {transactionData?.stock_left || 0}
                            </span>
                            <span className="ml-1">items in stock</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* ROI */}
                    <motion.div
                      variants={cardVariants}
                      whileHover={{ y: -2 }}
                      transition={{ ease: easeOut }}
                    >
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs lg:text-sm font-medium">
                            ROI
                          </CardTitle>
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl lg:text-2xl font-bold">
                            {transactionData?.return_on_investment_percent?.toFixed(
                              1
                            ) || 0}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">
                              {formatCurrency(
                                transactionData?.total_investment || 0
                              )}
                            </span>
                            <span className="ml-1">invested</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>

                  {/* Weekly Performance */}
                  <motion.div variants={itemVariants}>
                    <Card className="mb-6 lg:mb-8">
                      <CardHeader>
                        <CardTitle className="text-base lg:text-lg">
                          Weekly Performance
                        </CardTitle>
                        <CardDescription className="text-xs lg:text-sm">
                          Performance metrics for this week
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                              Revenue
                            </p>
                            <p className="text-xl lg:text-2xl font-bold">
                              {formatCurrency(
                                transactionData?.this_week_revenue || 0
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg.{" "}
                              {formatCurrency(
                                transactionData?.avg_daily_revenue || 0
                              )}
                              /day
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                              Net Profit
                            </p>
                            <p className="text-xl lg:text-2xl font-bold">
                              {formatCurrency(
                                transactionData?.this_week_net_profit || 0
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Margin:{" "}
                              {transactionData?.weekly_profit_margin_percent?.toFixed(
                                1
                              )}
                              %
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                              Sales Volume
                            </p>
                            <p className="text-xl lg:text-2xl font-bold">
                              {transactionData?.weekly_sales_volume || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg.{" "}
                              {transactionData?.avg_daily_sales?.toFixed(1)}/day
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Monthly Performance */}
                  <motion.div variants={itemVariants}>
                    <Card className="mb-6 lg:mb-8">
                      <CardHeader>
                        <CardTitle className="text-base lg:text-lg">
                          Monthly Performance
                        </CardTitle>
                        <CardDescription className="text-xs lg:text-sm">
                          Performance metrics for this month
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                              Revenue
                            </p>
                            <p className="text-xl lg:text-2xl font-bold">
                              {formatCurrency(
                                transactionData?.this_month_revenue || 0
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg.{" "}
                              {formatCurrency(
                                transactionData?.avg_monthly_daily_revenue || 0
                              )}
                              /day
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                              Net Profit
                            </p>
                            <p className="text-xl lg:text-2xl font-bold">
                              {formatCurrency(
                                transactionData?.this_month_net_profit || 0
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Margin:{" "}
                              {transactionData?.monthly_profit_margin_percent?.toFixed(
                                1
                              )}
                              %
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs lg:text-sm font-medium text-muted-foreground">
                              Sales Volume
                            </p>
                            <p className="text-xl lg:text-2xl font-bold">
                              {transactionData?.monthly_sales_volume || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avg.{" "}
                              {transactionData?.avg_monthly_daily_sales?.toFixed(
                                1
                              )}
                              /day
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Top Performing Items */}
                  <motion.div variants={itemVariants}>
                    <Card className="mb-6 lg:mb-8">
                      <CardHeader>
                        <CardTitle className="text-base lg:text-lg">
                          Top Performing Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {transactionData?.top_performing_items ? (
                          Object.values(
                            transactionData.top_performing_items
                          ).map((item, index) => (
                            <motion.div
                              key={item.item_id}
                              className="flex items-center justify-between p-3 lg:p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1, ease: easeOut }}
                              onClick={() => {
                                setActiveNav("item");
                                setSelectedItemId(item.item_id);
                              }}
                            >
                              <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Package className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-xs lg:text-sm truncate">
                                    {items[item.item_id]?.name ||
                                      `Item ${item.item_id}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.sales_volume} units sold •{" "}
                                    {item.stock_left} in stock
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2 flex-shrink-0">
                                <div>
                                  <p className="font-semibold text-xs lg:text-sm">
                                    {formatCurrency(item.profit)}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {item.profit_margin.toFixed(1)}% margin
                                  </Badge>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-8 text-xs lg:text-sm">
                            No top performing items available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent Transactions */}

                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm sm:text-base lg:text-lg">
                          Recent Transactions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6">
                        <div className="space-y-3 sm:space-y-4">
                          {transactionData?.transaction
                            ?.slice(0, 5)
                            .map((transaction, index) => (
                              <motion.div
                                key={transaction.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b last:border-0 gap-2 sm:gap-0"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.05,
                                  ease: easeOut,
                                }}
                              >
                                {/* Main transaction info */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm sm:text-sm lg:text-base truncate">
                                      {items[transaction.item_id]?.name ||
                                        `Item ${transaction.item_id}`}
                                    </p>
                                    <p className="text-xs sm:text-xs text-muted-foreground">
                                      {new Date(
                                        transaction.transaction_date
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Transaction details - stacked on mobile, inline on larger screens */}
                                <div className="flex flex-col sm:items-end gap-2 sm:gap-1 ml-9 sm:ml-0">
                                  {/* Badges */}
                                  <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-2 py-0.5 whitespace-nowrap"
                                    >
                                      Buy: {transaction.total_buy}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-2 py-0.5 whitespace-nowrap"
                                    >
                                      Sell: {transaction.total_sell}
                                    </Badge>
                                  </div>

                                  {/* Price info */}
                                  <div className="text-xs text-muted-foreground">
                                    <div className="flex flex-col sm:flex-row sm:gap-2">
                                      <span className="whitespace-nowrap">
                                        Cost:{" "}
                                        {formatCurrency(
                                          parseFloat(transaction.cost_price)
                                        )}
                                      </span>
                                      <span className="whitespace-nowrap">
                                        Sale:{" "}
                                        {formatCurrency(
                                          parseFloat(transaction.selling_price)
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
