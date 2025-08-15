"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/app/components/modeToggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { motion, AnimatePresence, easeOut } from "framer-motion";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  Loader2,
  DollarSign,
  ShoppingCart,
  ArrowUpDown,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Toast functionality (since sonner might not be available)
const toast = {
  success: (message: string) => console.log(`✅ ${message}`),
  error: (message: string) => console.error(`❌ ${message}`),
};

interface Item {
  id: number;
  name: string;
  user_id: number;
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

export default function InventoryPage() {
  const router = useRouter();

  // State management
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Form states
  const [itemForm, setItemForm] = useState({ name: "" });
  const [transactionForm, setTransactionForm] = useState({
    item_id: "",
    total_buy: "",
    total_sell: "",
    cost_price: "",
    selling_price: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");

  // Format currency
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat("ne-NP", {
      style: "currency",
      currency: "NPR",
    }).format(amount);
    return formatted.replace("नेरू", "Rs.");
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Authentication helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  };

  // API Functions
  const fetchItems = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_B_URL}/api/item`,
        { headers }
      );

      if (response.data.items) {
        setItems(response.data.items);
        setFilteredItems(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast.error("Failed to fetch items");
    }
  };

  const fetchTransactions = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_B_URL}/api/transaction`,
        { headers }
      );

      if (response.data.success && response.data.transaction) {
        setTransactions(response.data.transaction);
        setFilteredTransactions(response.data.transaction);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to fetch transactions");
    }
  };

  const createItem = async (name: string) => {
    try {
      setIsSubmitting(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_B_URL}/api/item`,
        { name },
        { headers }
      );

      if (response.data.success) {
        toast.success("Item created successfully!");
        await fetchItems();
        setItemDialogOpen(false);
        setItemForm({ name: "" });
      }
    } catch (error: any) {
      console.error("Failed to create item:", error);
      toast.error(error.response?.data?.error || "Failed to create item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItem = async (id: number, name: string) => {
    try {
      setIsSubmitting(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_B_URL}/api/item/${id}`,
        { name },
        { headers }
      );

      if (response.data.success) {
        toast.success("Item updated successfully!");
        await fetchItems();
        setItemDialogOpen(false);
        setEditingItem(null);
        setItemForm({ name: "" });
      }
    } catch (error: any) {
      console.error("Failed to update item:", error);
      toast.error(error.response?.data?.error || "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_B_URL}/api/item/${id}`,
        { headers }
      );

      if (response.data.success) {
        toast.success("Item deleted successfully!");
        await fetchItems();
        await fetchTransactions();
      }
    } catch (error: any) {
      console.error("Failed to delete item:", error);
      toast.error(error.response?.data?.error || "Failed to delete item");
    }
  };

  const createTransaction = async (data: any) => {
    try {
      setIsSubmitting(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const payload = {
        item_id: parseInt(data.item_id),
        total_buy: parseInt(data.total_buy),
        total_sell: parseInt(data.total_sell),
        cost_price: parseFloat(data.cost_price),
        selling_price: parseFloat(data.selling_price),
        transaction_date: data.transaction_date,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_B_URL}/api/transaction`,
        payload,
        { headers }
      );

      if (response.data.success) {
        toast.success("Transaction created successfully!");
        await fetchTransactions();
        setTransactionDialogOpen(false);
        setTransactionForm({
          item_id: "",
          total_buy: "",
          total_sell: "",
          cost_price: "",
          selling_price: "",
          transaction_date: new Date().toISOString().split("T")[0],
        });
      }
    } catch (error: any) {
      console.error("Failed to create transaction:", error);
      toast.error(
        error.response?.data?.error || "Failed to create transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTransaction = async (id: number, data: any) => {
    try {
      setIsSubmitting(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const payload = {
        total_buy: parseInt(data.total_buy),
        total_sell: parseInt(data.total_sell),
        cost_price: parseFloat(data.cost_price),
        selling_price: parseFloat(data.selling_price),
        transaction_date: data.transaction_date,
      };

      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_B_URL}/api/transaction/${id}`,
        payload,
        { headers }
      );

      if (response.data.success) {
        toast.success("Transaction updated successfully!");
        await fetchTransactions();
        setTransactionDialogOpen(false);
        setEditingTransaction(null);
        setTransactionForm({
          item_id: "",
          total_buy: "",
          total_sell: "",
          cost_price: "",
          selling_price: "",
          transaction_date: new Date().toISOString().split("T")[0],
        });
      }
    } catch (error: any) {
      console.error("Failed to update transaction:", error);
      toast.error(
        error.response?.data?.error || "Failed to update transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchItems(), fetchTransactions()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Filter items
  useEffect(() => {
    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [items, searchTerm]);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions.filter((transaction) => {
      const item = items.find((item) => item.id === transaction.item_id);
      return item?.name
        .toLowerCase()
        .includes(transactionSearchTerm.toLowerCase());
    });
    setFilteredTransactions(filtered);
  }, [transactions, transactionSearchTerm, items]);

  // Handle form submissions
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return;

    if (editingItem) {
      await updateItem(editingItem.id, itemForm.name);
    } else {
      await createItem(itemForm.name);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !transactionForm.item_id ||
      !transactionForm.total_buy ||
      !transactionForm.total_sell ||
      !transactionForm.cost_price ||
      !transactionForm.selling_price
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, transactionForm);
    } else {
      await createTransaction(transactionForm);
    }
  };

  // Handle edit actions
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setItemForm({ name: item.name });
    setItemDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      item_id: transaction.item_id.toString(),
      total_buy: transaction.total_buy.toString(),
      total_sell: transaction.total_sell.toString(),
      cost_price: transaction.cost_price,
      selling_price: transaction.selling_price,
      transaction_date: transaction.transaction_date,
    });
    setTransactionDialogOpen(true);
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({ name: "" });
  };

  const resetTransactionForm = () => {
    setEditingTransaction(null);
    setTransactionForm({
      item_id: "",
      total_buy: "",
      total_sell: "",
      cost_price: "",
      selling_price: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
  };

  // Get item name by ID
  const getItemName = (itemId: number) => {
    const item = items.find((item) => item.id === itemId);
    return item?.name || `Item ${itemId}`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1, ease: easeOut },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-lg">Loading inventory...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 sm:p-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-8" variants={itemVariants}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Inventory Management
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your items and transactions
            </p>
          </div>
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full sm:w-auto md:justify-end">
            <Dialog
              open={itemDialogOpen}
              onOpenChange={(
                open: boolean | ((prevState: boolean) => boolean)
              ) => {
                setItemDialogOpen(open);
                if (!open) resetItemForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Item" : "Add New Item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem
                      ? "Update item details"
                      : "Create a new item to track in your inventory"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleItemSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Item Name</Label>
                      <Input
                        id="name"
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ name: e.target.value })}
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setItemDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingItem ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={transactionDialogOpen}
              onOpenChange={(
                open: boolean | ((prevState: boolean) => boolean)
              ) => {
                setTransactionDialogOpen(open);
                if (!open) resetTransactionForm();
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <ShoppingCart className="w-4 h-4 Mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction
                      ? "Edit Transaction"
                      : "Add New Transaction"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTransaction
                      ? "Update transaction details"
                      : "Record a new transaction for your inventory"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTransactionSubmit}>
                  <div className="grid gap-4 py-4">
                    {!editingTransaction && (
                      <div className="grid gap-2">
                        <Label htmlFor="item_id">Item</Label>
                        <Select
                          value={transactionForm.item_id}
                          onValueChange={(value: any) =>
                            setTransactionForm({
                              ...transactionForm,
                              item_id: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((item) => (
                              <SelectItem
                                key={item.id}
                                value={item.id.toString()}
                              >
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="total_buy">Quantity Bought</Label>
                        <Input
                          id="total_buy"
                          type="number"
                          value={transactionForm.total_buy}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              total_buy: e.target.value,
                            })
                          }
                          placeholder="0"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="total_sell">Quantity Sold</Label>
                        <Input
                          id="total_sell"
                          type="number"
                          value={transactionForm.total_sell}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              total_sell: e.target.value,
                            })
                          }
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cost_price">Cost Price</Label>
                        <Input
                          id="cost_price"
                          type="number"
                          step="0.01"
                          value={transactionForm.cost_price}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              cost_price: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="selling_price">Selling Price</Label>
                        <Input
                          id="selling_price"
                          type="number"
                          step="0.01"
                          value={transactionForm.selling_price}
                          onChange={(e) =>
                            setTransactionForm({
                              ...transactionForm,
                              selling_price: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="transaction_date">Transaction Date</Label>
                      <Input
                        id="transaction_date"
                        type="date"
                        value={transactionForm.transaction_date}
                        onChange={(e) =>
                          setTransactionForm({
                            ...transactionForm,
                            transaction_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 ">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTransactionDialogOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {editingTransaction ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <div
              className="flex justify-center items-center w-full 
md:justify-end md:items-end md:w-full"
            >
              <Button
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                className="cursor-pointer"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="sm:inline">Dashboard</span>
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              <ModeToggle />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs for Items and Transactions */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions ({transactions.length})
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Items</CardTitle>
                    <CardDescription>
                      Manage your inventory items
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-64">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredItems.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05, ease: easeOut }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {item.id}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                {item.name}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(item.created_at)}</TableCell>
                            <TableCell>{formatDate(item.updated_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="w-full max-w-md">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete "
                                        {item.name}" and all its associated
                                        transactions. This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                      <AlertDialogCancel className="w-full sm:w-auto">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteItem(item.id)}
                                        className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                  {/* Mobile card layout for items */}
                  <div className="sm:hidden space-y-4">
                    <AnimatePresence>
                      {filteredItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05, ease: easeOut }}
                          className="border rounded-lg p-4 bg-card"
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <h3 className="font-medium">{item.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                ID: {item.id}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Created: {formatDate(item.created_at)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Updated: {formatDate(item.updated_at)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-full max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{item.name}"
                                      and all its associated transactions. This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel className="w-full sm:w-auto">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteItem(item.id)}
                                      className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {filteredItems.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No items found</p>
                      {searchTerm && (
                        <p className="text-sm">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>
                      Track all your inventory transactions
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-64">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by item name..."
                        value={transactionSearchTerm}
                        onChange={(e) =>
                          setTransactionSearchTerm(e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Buy Qty</TableHead>
                        <TableHead className="text-right">Sell Qty</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Sell Price</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredTransactions.map((transaction, index) => {
                          const profit =
                            (parseFloat(transaction.selling_price) -
                              parseFloat(transaction.cost_price)) *
                            transaction.total_sell;
                          return (
                            <motion.tr
                              key={transaction.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{
                                delay: index * 0.05,
                                ease: easeOut,
                              }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="font-medium">
                                {transaction.id}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  {getItemName(transaction.item_id)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.total_buy}
                              </TableCell>
                              <TableCell className="text-right">
                                {transaction.total_sell}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  parseFloat(transaction.cost_price)
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  parseFloat(transaction.selling_price)
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={
                                    profit >= 0 ? "default" : "destructive"
                                  }
                                >
                                  {formatCurrency(profit)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  {formatDate(transaction.transaction_date)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleEditTransaction(transaction)
                                    }
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                  {/* Mobile card layout for transactions */}
                  <div className="sm:hidden space-y-4">
                    <AnimatePresence>
                      {filteredTransactions.map((transaction, index) => {
                        const profit =
                          (parseFloat(transaction.selling_price) -
                            parseFloat(transaction.cost_price)) *
                          transaction.total_sell;
                        return (
                          <motion.div
                            key={transaction.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05, ease: easeOut }}
                            className="border rounded-lg p-4 bg-card"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                  <h3 className="font-medium">
                                    {getItemName(transaction.item_id)}
                                  </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  ID: {transaction.id}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Buy Qty: {transaction.total_buy}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Sell Qty: {transaction.total_sell}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Cost Price:{" "}
                                  {formatCurrency(
                                    parseFloat(transaction.cost_price)
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Sell Price:{" "}
                                  {formatCurrency(
                                    parseFloat(transaction.selling_price)
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Profit:{" "}
                                  <Badge
                                    variant={
                                      profit >= 0 ? "default" : "destructive"
                                    }
                                  >
                                    {formatCurrency(profit)}
                                  </Badge>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Date:{" "}
                                  {formatDate(transaction.transaction_date)}
                                </p>
                              </div>
                              <div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleEditTransaction(transaction)
                                  }
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                  {filteredTransactions.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                      {transactionSearchTerm && (
                        <p className="text-sm">
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
        variants={itemVariants}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              Items in your inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {transactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recorded transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {transactions.reduce(
                (acc, t) => acc + (t.total_buy - t.total_sell),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Items remaining in stock
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
