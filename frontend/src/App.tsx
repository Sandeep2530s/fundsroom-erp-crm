import { useCallback, useEffect, useState } from "react";
import "./App.css";
const API_URL = "https://" + "fundsroom-backend-d65y.onrender.com" + "/api";

type DashboardData = {
  totalCustomers: number;
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  recentStockMovements: Array<{
    id: number;
    product_name: string;
    quantity_changed: number;
    movement_type: string;
    reason: string;
    created_by_email: string;
  }>;
  recentCustomers: Array<{
    id: number;
    customer_name: string;
    business_name: string;
    status: string;
    customer_type: string;
  }>;
  recentChallans: Array<{
    id: number;
    challan_number: string;
    customer_name: string;
    total_quantity: number;
    status: string;
  }>;
};

type Customer = {
  id: number;
  customer_name: string;
  mobile_number: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: string;
  address: string;
  status: string;
  follow_up_date: string | null;
  notes: string;
  created_at: string;
};

type CustomerForm = {
  customerName: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  gstNumber: string;
  customerType: string;
  address: string;
  status: string;
  followUpDate: string;
  notes: string;
};

const emptyCustomerForm: CustomerForm = {
  customerName: "",
  mobileNumber: "",
  email: "",
  businessName: "",
  gstNumber: "",
  customerType: "RETAIL",
  address: "",
  status: "LEAD",
  followUpDate: "",
  notes: "",
};

type Product = {
  id: number;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock_alert_quantity: number;
  warehouse_location: string;
  created_at: string;
  updated_at: string;
};

type ProductForm = {
  productName: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: string;
  minStockAlert: string;
  location: string;
};

type StockMovement = {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity_changed: number;
  movement_type: string;
  reason: string;
  created_by: number;
  created_by_email: string;
  created_at: string;
};

type LowStockProduct = {
  id: number;
  product_name: string;
  sku: string;
  category: string;
  current_stock: number;
  minimum_stock_alert_quantity: number;
  warehouse_location: string;
};

type ChallanItem = {
  id?: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
};

type Challan = {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name?: string;
  total_quantity: number;
  status: string;
  created_by?: number;
  created_at: string;
  items?: ChallanItem[];
};

type ChallanDraftItem = {
  productId: string;
  quantity: string;
};

const emptyProductForm: ProductForm = {
  productName: "",
  sku: "",
  category: "",
  unitPrice: "",
  currentStock: "",
  minStockAlert: "",
  location: "",
};

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [email, setEmail] = useState("admin@fundsroom.com");
  const [password, setPassword] = useState("Admin@123");

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);
  const [productLoading, setProductLoading] = useState(false);

  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [stockActionLoading, setStockActionLoading] = useState(false);
  const [stockFormError, setStockFormError] = useState("");
  const [stockMessage, setStockMessage] = useState("");
  const [stockProductId, setStockProductId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [movementFilter, setMovementFilter] = useState("");

  const [challans, setChallans] = useState<Challan[]>([]);
  const [challanLoading, setChallanLoading] = useState(false);
  const [challanActionLoading, setChallanActionLoading] = useState(false);
  const [challanError, setChallanError] = useState("");
  const [challanMessage, setChallanMessage] = useState("");
  const [challanCustomerId, setChallanCustomerId] = useState("");
  const [challanItems, setChallanItems] = useState<ChallanDraftItem[]>([
    { productId: "", quantity: "" },
  ]);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [showChallanDetails, setShowChallanDetails] = useState(false);
  const [reusedDraftId, setReusedDraftId] = useState<number | null>(null);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] =
    useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductDetails, setShowProductDetails] =
    useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    null
  );
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm);
  const [productFormError, setProductFormError] = useState("");
  const [productActionLoading, setProductActionLoading] = useState(false);

  const [editingCustomerId, setEditingCustomerId] = useState<
    number | null
  >(null);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(emptyCustomerForm);

  const [followUpNote, setFollowUpNote] = useState("");
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Login failed");
      }

      localStorage.setItem("token", result.data.token);
      setToken(result.data.token);
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load dashboard");
      }

      setDashboard(result.data);
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  }, [token]);

  const loadCustomers = useCallback(async () => {
  if (!token) return;

  setCustomerLoading(true);

  try {
    const params = new URLSearchParams({
      search: customerSearch,
      page: String(customerPage),
      limit: "10",
    });

    const response = await fetch(
      `${API_URL}/customers?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to load customers"
      );
    }

    setCustomers(result.data || []);
    setCustomerTotalPages(
      result.pagination?.totalPages || 1
    );
    
  } catch (error) {
    console.error("Customers error:", error);
  } finally {
    setCustomerLoading(false);
  }
}, [token, customerSearch, customerPage]);

    const loadProducts = useCallback(async () => {
    if (!token) return;

    setProductLoading(true);

    try {
      const params = new URLSearchParams({
        search: productSearch,
        page: String(productPage),
        limit: "10",
      });

      const response = await fetch(
        `${API_URL}/products?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load products"
        );
      }

      setProducts(result.data || []);

      setProductTotalPages(
        result.pagination?.totalPages || 1
      );
    } catch (error) {
      console.error("Products error:", error);
    } finally {
      setProductLoading(false);
    }
  }, [token, productSearch, productPage]);

  const loadInventory = useCallback(async () => {
    if (!token) return;

    setInventoryLoading(true);
    setStockFormError("");

    try {
      const movementUrl = movementFilter
        ? `${API_URL}/stock/movements?productId=${encodeURIComponent(movementFilter)}`
        : `${API_URL}/stock/movements`;

      const [movementsResponse, lowStockResponse] = await Promise.all([
        fetch(movementUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_URL}/alerts/low-stock`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const movementsResult = await movementsResponse.json();
      const lowStockResult = await lowStockResponse.json();

      if (!movementsResponse.ok || !movementsResult.success) {
        throw new Error(
          movementsResult.message || "Failed to load stock movements"
        );
      }

      if (!lowStockResponse.ok || !lowStockResult.success) {
        throw new Error(
          lowStockResult.message || "Failed to load low-stock products"
        );
      }

      setStockMovements(movementsResult.data || []);
      setLowStockProducts(lowStockResult.data || []);
    } catch (error) {
      console.error("Inventory error:", error);
      setStockFormError(
        error instanceof Error ? error.message : "Failed to load inventory"
      );
    } finally {
      setInventoryLoading(false);
    }
  }, [token, movementFilter]);

  const submitStockMovement = async (
    event: React.FormEvent,
    type: "in" | "out"
  ) => {
    event.preventDefault();

    if (!token) return;

    setStockActionLoading(true);
    setStockFormError("");
    setStockMessage("");

    try {
      const productId = Number(stockProductId);
      const quantity = Number(stockQuantity);
      const reason = stockReason.trim();

      if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error("Please select a valid product");
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Quantity must be a positive integer");
      }

      if (!reason) {
        throw new Error("Reason is required");
      }

      const response = await fetch(`${API_URL}/stock/${type}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
          reason,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Stock ${type.toUpperCase()} failed`);
      }

      setStockMessage(result.message || "Stock updated successfully");
      setStockQuantity("");
      setStockReason("");

      await Promise.all([
        loadInventory(),
        loadProducts(),
        loadDashboard(),
      ]);
    } catch (error) {
      setStockFormError(
        error instanceof Error ? error.message : "Stock operation failed"
      );
    } finally {
      setStockActionLoading(false);
    }
  };

  useEffect(() => {
  if (token && (activePage === "Customers" || activePage === "Sales Challans")) {
    loadCustomers();
  }
}, [token, activePage, loadCustomers]);

useEffect(() => {
  if (token && (activePage === "Products" || activePage === "Sales Challans")) {
    loadProducts();
  }
}, [token, activePage, loadProducts]);

useEffect(() => {
  if (token && activePage === "Dashboard") {
    loadDashboard();
  }
}, [token, activePage, loadDashboard]);

useEffect(() => {
  if (token && activePage === "Inventory") {
    loadInventory();
  }
}, [token, activePage, loadInventory]);

const loadChallans = useCallback(async () => {
  if (!token) return;
  setChallanLoading(true);
  setChallanError("");

  try {
    const response = await fetch(`${API_URL}/challans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load challans");
    }

    const rows = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.data?.rows)
      ? result.data.rows
      : [];

    setChallans(rows);
  } catch (error) {
    console.error("Challans error:", error);
    setChallanError(
      error instanceof Error ? error.message : "Failed to load challans"
    );
  } finally {
    setChallanLoading(false);
  }
}, [token]);

const addChallanItem = () => {
  setChallanItems((items) => [...items, { productId: "", quantity: "" }]);
};

const removeChallanItem = (index: number) => {
  setChallanItems((items) =>
    items.length === 1
      ? [{ productId: "", quantity: "" }]
      : items.filter((_, itemIndex) => itemIndex !== index)
  );
};

const updateChallanItem = (
  index: number,
  field: keyof ChallanDraftItem,
  value: string
) => {
  setChallanItems((items) =>
    items.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    )
  );
};

const resetChallanForm = () => {
  setChallanCustomerId("");
  setChallanItems([{ productId: "", quantity: "" }]);
};

const clearReusedDraft = () => {
  setReusedDraftId(null);
  setChallanMessage("Reuse mode cleared. The original draft is unchanged.");
  setChallanError("");
};

const createChallan = async (status: "DRAFT" | "CONFIRMED") => {
  if (!token) return;

  setChallanActionLoading(true);
  setChallanError("");
  setChallanMessage("");

  try {
    const customerId = Number(challanCustomerId);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      throw new Error("Please select a customer");
    }

    const items = challanItems.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }));

    if (
      items.some(
        (item) =>
          !Number.isInteger(item.productId) ||
          item.productId <= 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0
      )
    ) {
      throw new Error("Every product must have a valid positive quantity");
    }

    if (new Set(items.map((item) => item.productId)).size !== items.length) {
      throw new Error("The same product cannot be added more than once");
    }

    if (status === "CONFIRMED") {
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} is no longer available`);
        }
        if (item.quantity > Number(product.current_stock)) {
          throw new Error(
            `${product.product_name}: requested ${item.quantity}, but only ${product.current_stock} is available`
          );
        }
      }
    }

    const response = await fetch(`${API_URL}/challans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerId, items, status }),
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to create challan");
    }

    let finalMessage =
      result.message ||
      `Challan ${
        status === "CONFIRMED" ? "confirmed" : "saved as draft"
      } successfully`;

    // A reused draft is only consumed when the replacement is CONFIRMED.
    // Saving the reused data as another draft must leave the original draft
    // untouched so the user does not lose it accidentally.
    if (reusedDraftId !== null && status === "CONFIRMED") {
      const originalDraftId = reusedDraftId;
      const cancelResponse = await fetch(
        `${API_URL}/challans/${originalDraftId}/cancel`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const cancelResult = await cancelResponse.json();

      if (!cancelResponse.ok || !cancelResult.success) {
        throw new Error(
          `New challan was created, but the original draft could not be closed: ${
            cancelResult.message || "Failed to close original draft"
          }`
        );
      }

      finalMessage += ` Original draft ${originalDraftId} was closed.`;
    } else if (reusedDraftId !== null && status === "DRAFT") {
      finalMessage += " Original draft remains available.";
    }

    // The newly created challan is now independent. If it was saved as a
    // draft, a later confirmation must not accidentally cancel the older
    // draft. A later Reuse Draft action will establish a new source draft.
    setReusedDraftId(null);

    setChallanMessage(finalMessage);
    resetChallanForm();

    await Promise.all([loadChallans(), loadProducts(), loadDashboard(), loadInventory()]);
  } catch (error) {
    console.error("Create challan error:", error);
    setChallanError(
      error instanceof Error ? error.message : "Failed to create challan"
    );
  } finally {
    setChallanActionLoading(false);
  }
};

const viewChallan = async (challanId: number) => {
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/challans/${challanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load challan");
    }

    const rawChallan = result.data;

    // The backend returns the stored challan-item snapshots using
    // *_snapshot column names. Normalize them for the frontend.
    const normalizedChallan: Challan = {
      ...rawChallan,
      items: (rawChallan.items || []).map((item: any) => {
        const unitPrice = Number(
          item.unit_price ?? item.unit_price_snapshot ?? 0
        );
        const quantity = Number(item.quantity ?? 0);

        return {
          id: item.id,
          product_id: Number(item.product_id),
          product_name:
            item.product_name ?? item.product_name_snapshot ?? "Unknown product",
          sku: item.sku ?? item.sku_snapshot ?? "—",
          quantity,
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
        };
      }),
    };

    setSelectedChallan(normalizedChallan);
    setShowChallanDetails(true);
  } catch (error) {
    console.error("Challan details error:", error);
    setChallanError(
      error instanceof Error ? error.message : "Failed to load challan"
    );
  }
};

const reuseDraft = async (challanId: number) => {
  if (!token) return;

  setChallanActionLoading(true);
  setChallanError("");
  setChallanMessage("");

  try {
    const response = await fetch(`${API_URL}/challans/${challanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load draft");
    }

    const rawChallan = result.data;

    if (rawChallan.status !== "DRAFT") {
      throw new Error("Only draft challans can be reused");
    }

    const draftItems: ChallanDraftItem[] = (rawChallan.items || []).map(
      (item: any) => ({
        productId: String(item.product_id),
        quantity: String(item.quantity),
      })
    );

    if (!draftItems.length) {
      throw new Error("This draft does not contain any products");
    }

    setChallanCustomerId(String(rawChallan.customer_id));
    setChallanItems(draftItems);
    setReusedDraftId(challanId);
    setChallanMessage(
      `${rawChallan.challan_number} loaded into the challan form. Review it and save or confirm. Saving creates a new draft and keeps the original; confirming creates a new confirmed challan and closes the original draft.`
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Reuse draft error:", error);
    setChallanError(
      error instanceof Error ? error.message : "Failed to reuse draft"
    );
  } finally {
    setChallanActionLoading(false);
  }
};

const cancelChallan = async (challanId: number) => {
  if (!token || !window.confirm("Cancel this challan?")) return;

  setChallanActionLoading(true);
  setChallanError("");
  setChallanMessage("");

  try {
    const response = await fetch(`${API_URL}/challans/${challanId}/cancel`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to cancel challan");
    }

    setChallanMessage(result.message || "Challan cancelled successfully");

    if (selectedChallan?.id === challanId) {
      setSelectedChallan(result.data);
    }

    await Promise.all([
      loadChallans(),
      loadProducts(),
      loadDashboard(),
      loadInventory(),
    ]);
  } catch (error) {
    console.error("Cancel challan error:", error);
    setChallanError(
      error instanceof Error ? error.message : "Failed to cancel challan"
    );
  } finally {
    setChallanActionLoading(false);
  }
};

useEffect(() => {
  if (token && activePage === "Sales Challans") {
    loadChallans();
  }
}, [token, activePage, loadChallans]);

useEffect(() => {
  if (activePage !== "Sales Challans") {
    setReusedDraftId(null);
  }
}, [activePage]);

const logout = () => {
  localStorage.removeItem("token");
  setToken(null);
  setDashboard(null);
  setCustomers([]);
  setProducts([]);
  setStockMovements([]);
  setLowStockProducts([]);
  setChallans([]);
  setSelectedChallan(null);
  setShowChallanDetails(false);
};

  const openAddCustomer = () => {
    setEditingCustomerId(null);
    setCustomerForm(emptyCustomerForm);
    setFormError("");
    setShowCustomerModal(true);
  };

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomerId(customer.id);

    setCustomerForm({
      customerName: customer.customer_name || "",
      mobileNumber: customer.mobile_number || "",
      email: customer.email || "",
      businessName: customer.business_name || "",
      gstNumber: customer.gst_number || "",
      customerType: customer.customer_type || "RETAIL",
      address: customer.address || "",
      status: customer.status || "LEAD",
      followUpDate: customer.follow_up_date
        ? customer.follow_up_date.substring(0, 10)
        : "",
      notes: customer.notes || "",
    });

    setFormError("");
    setShowCustomerModal(true);
  };

  const viewCustomer = async (customerId: number) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/customers/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load customer");
      }

      setSelectedCustomer(result.data);
      setFollowUpNote("");
      setShowCustomerDetails(true);
    } catch (error) {
      console.error("Customer details error:", error);
    }
  };

  const saveCustomer = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) return;

    setActionLoading(true);
    setFormError("");

    try {
      const isEditing = editingCustomerId !== null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/customers/${editingCustomerId}`
          : `${API_URL}/customers`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: customerForm.customerName,
            mobileNumber: customerForm.mobileNumber,
            email: customerForm.email,
            businessName: customerForm.businessName,
            gstNumber: customerForm.gstNumber,
            customerType: customerForm.customerType,
            address: customerForm.address,
            status: customerForm.status,
            followUpDate:
              customerForm.followUpDate || null,
            notes: customerForm.notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to save customer"
        );
      }

      setShowCustomerModal(false);
      setCustomerForm(emptyCustomerForm);

      await loadCustomers();
      await loadDashboard();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to save customer"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const addFollowUp = async () => {
    if (!token || !selectedCustomer || !followUpNote.trim()) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/customers/${selectedCustomer.id}/follow-up`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: followUpNote.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to add follow-up"
        );
      }

      setFollowUpNote("");

      const refreshed = await fetch(
        `${API_URL}/customers/${selectedCustomer.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const refreshedResult = await refreshed.json();

      if (refreshedResult.success) {
        setSelectedCustomer(refreshedResult.data);
      }
    } catch (error) {
      console.error("Follow-up error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const openAddProduct = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setProductFormError("");
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      productName: product.product_name || "",
      sku: product.sku || "",
      category: product.category || "",
      unitPrice: String(product.unit_price ?? ""),
      currentStock: String(product.current_stock ?? ""),
      minStockAlert: String(
        product.minimum_stock_alert_quantity ?? ""
      ),
      location: product.warehouse_location || "",
    });
    setProductFormError("");
    setShowProductModal(true);
  };

  const viewProduct = async (productId: number) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load product"
        );
      }

      setSelectedProduct(result.data);
      setShowProductDetails(true);
    } catch (error) {
      console.error("Product details error:", error);
    }
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) return;

    setProductActionLoading(true);
    setProductFormError("");

    try {
      const isEditing = editingProductId !== null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/products/${editingProductId}`
          : `${API_URL}/products`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productName: productForm.productName.trim(),
            sku: productForm.sku.trim(),
            category: productForm.category.trim(),
            unitPrice: Number(productForm.unitPrice),
            currentStock: Number(productForm.currentStock),
            minStockAlert: Number(productForm.minStockAlert),
            location: productForm.location.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to save product"
        );
      }

      setShowProductModal(false);
      setProductForm(emptyProductForm);
      setEditingProductId(null);

      await loadProducts();
      await loadDashboard();
    } catch (error) {
      setProductFormError(
        error instanceof Error
          ? error.message
          : "Failed to save product"
      );
    } finally {
      setProductActionLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-mark">FR</div>

          <h1>Fundsroom ERP</h1>
          <p className="login-subtitle">
            ERP & CRM Operations Portal
          </p>

          <form onSubmit={login}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

            {loginError && (
              <div className="error-message">{loginError}</div>
            )}

            <button className="primary-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">FR</div>

          <div>
            <strong>Fundsroom</strong>
            <span>ERP / CRM</span>
          </div>
        </div>

        <nav>
          {[
            "Dashboard",
            "Customers",
            "Products",
            "Inventory",
            "Sales Challans",
          ].map((page) => (
            <button
              key={page}
              className={`nav-item ${
                activePage === page ? "active" : ""
              }`}
              onClick={() => setActivePage(page)}
            >
              <span>
                {page === "Dashboard" && "▦"}
                {page === "Customers" && "♙"}
                {page === "Products" && "▣"}
                {page === "Inventory" && "◈"}
                {page === "Sales Challans" && "▤"}
              </span>

              {page}
            </button>
          ))}
        </nav>

        <button className="logout-button" onClick={logout}>
          ⇥ Sign out
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations Portal</p>
            <h1>{activePage}</h1>
          </div>

          <div className="user-badge">
            <div className="avatar">A</div>

            <div>
              <strong>Admin</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <Dashboard
            dashboard={dashboard}
            loadDashboard={loadDashboard}
          />
        )}

        {activePage === "Customers" && (
          <CustomersPage
            customers={customers}
            loading={customerLoading}
            search={customerSearch}
            setSearch={(value) => {
              setCustomerSearch(value);
              setCustomerPage(1);
            }}
            page={customerPage}
            totalPages={customerTotalPages}
            setPage={setCustomerPage}
            openAddCustomer={openAddCustomer}
            openEditCustomer={openEditCustomer}
            viewCustomer={viewCustomer}
          />
        )}

        {activePage === "Products" && (
          <ProductsPage
            products={products}
            loading={productLoading}
            search={productSearch}
            setSearch={(value) => {
              setProductSearch(value);
              setProductPage(1);
            }}
            page={productPage}
            totalPages={productTotalPages}
            setPage={setProductPage}
            openAddProduct={openAddProduct}
            openEditProduct={openEditProduct}
            viewProduct={viewProduct}
          />
        )}

        {activePage === "Inventory" && (
          <InventoryPage
            products={products}
            movements={stockMovements}
            lowStockProducts={lowStockProducts}
            loading={inventoryLoading}
            actionLoading={stockActionLoading}
            formError={stockFormError}
            message={stockMessage}
            productId={stockProductId}
            quantity={stockQuantity}
            reason={stockReason}
            movementFilter={movementFilter}
            setProductId={setStockProductId}
            setQuantity={setStockQuantity}
            setReason={setStockReason}
            setMovementFilter={setMovementFilter}
            submitStockMovement={submitStockMovement}
            refresh={loadInventory}
          />
        )}

        {activePage === "Sales Challans" && (
          <SalesChallansPage
            customers={customers}
            products={products}
            challans={challans}
            loading={challanLoading}
            actionLoading={challanActionLoading}
            error={challanError}
            message={challanMessage}
            customerId={challanCustomerId}
            items={challanItems}
            setCustomerId={setChallanCustomerId}
            updateItem={updateChallanItem}
            addItem={addChallanItem}
            removeItem={removeChallanItem}
            createChallan={createChallan}
            viewChallan={viewChallan}
            reuseDraft={reuseDraft}
            reusedDraftId={reusedDraftId}
            clearReusedDraft={clearReusedDraft}
            cancelChallan={cancelChallan}
            refresh={loadChallans}
          />
        )}
      </main>

      {showChallanDetails && selectedChallan && (
        <div className="modal-overlay">
          <div className="modal-card large-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedChallan.challan_number}</h2>
                <p>
                  {selectedChallan.customer_name ||
                    `Customer #${selectedChallan.customer_id}`}
                </p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowChallanDetails(false)}
              >
                ×
              </button>
            </div>

            <div className="details-grid">
              <Detail label="Challan Number" value={selectedChallan.challan_number} />
              <Detail
                label="Customer"
                value={
                  selectedChallan.customer_name ||
                  `Customer #${selectedChallan.customer_id}`
                }
              />
              <Detail
                label="Total Quantity"
                value={String(selectedChallan.total_quantity)}
              />
              <Detail label="Status" value={selectedChallan.status} />
              <Detail
                label="Created Date"
                value={new Date(selectedChallan.created_at).toLocaleString("en-IN")}
              />
            </div>

            <section className="panel" style={{ marginTop: "20px" }}>
              <div className="panel-header">
                <div>
                  <h3>Products</h3>
                  <p>Product snapshot stored with the challan.</p>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.items?.length ? (
                      selectedChallan.items.map((item, index) => (
                        <tr key={item.id ?? `${item.product_id}-${index}`}>
                          <td>{item.product_name}</td>
                          <td>{item.sku}</td>
                          <td>{item.quantity}</td>
                          <td>
                            ₹{Number(item.unit_price ?? 0).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            ₹{Number(
                              item.total_price ??
                                Number(item.quantity || 0) * Number(item.unit_price || 0)
                            ).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          No product details returned by the API.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "16px 20px",
                  fontWeight: 700,
                  fontSize: "16px",
                }}
              >
                Grand Total: ₹{
                  (selectedChallan.items || []).reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.total_price ??
                          Number(item.quantity || 0) * Number(item.unit_price || 0)
                      ),
                    0
                  ).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              </div>
            </section>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowChallanDetails(false)}
              >
                Close
              </button>
              {selectedChallan.status !== "CANCELLED" && (
                <button
                  type="button"
                  className="primary-button modal-submit"
                  onClick={() => cancelChallan(selectedChallan.id)}
                  disabled={challanActionLoading}
                >
                  {challanActionLoading ? "Cancelling..." : "Cancel Challan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-card large-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingProductId ? "Edit Product" : "Add Product"}
                </h2>
                <p>
                  {editingProductId
                    ? "Update product and inventory information."
                    : "Enter product and inventory information."}
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowProductModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="form-grid">
                <FormField
                  label="Product Name"
                  value={productForm.productName}
                  onChange={(value) =>
                    setProductForm({
                      ...productForm,
                      productName: value,
                    })
                  }
                  required
                />

                <FormField
                  label="SKU"
                  value={productForm.sku}
                  onChange={(value) =>
                    setProductForm({
                      ...productForm,
                      sku: value,
                    })
                  }
                  required
                />

                <FormField
                  label="Category"
                  value={productForm.category}
                  onChange={(value) =>
                    setProductForm({
                      ...productForm,
                      category: value,
                    })
                  }
                  required
                />

                <FormField
                  label="Unit Price"
                  value={productForm.unitPrice}
                  onChange={(value) =>
                    setProductForm({
                      ...productForm,
                      unitPrice: value,
                    })
                  }
                  type="number"
                  required
                />

                <FormField
                  label="Current Stock"
                  value={productForm.currentStock}
                  onChange={(value) =>
                    setProductForm({
                      ...productForm,
                      currentStock: value,
                    })
                  }
                  type="number"
                  required
                />

                <FormField
                  label="Minimum Stock Alert"
                  value={productForm.minStockAlert}
                  onChange={(value) =>
                    setProductForm({
                      ...productForm,
                      minStockAlert: value,
                    })
                  }
                  type="number"
                  required
                />

                <FormField
                  label="Warehouse Location"
                  value={productForm.location}
                  onChange={(value) =>
                    setProductForm({
                      ...productForm,
                      location: value,
                    })
                  }
                  required
                />
              </div>

              {productFormError && (
                <div className="error-message">{productFormError}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button modal-submit"
                  disabled={productActionLoading}
                >
                  {productActionLoading
                    ? "Saving..."
                    : editingProductId
                    ? "Update Product"
                    : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductDetails && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-card large-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedProduct.product_name}</h2>
                <p>{selectedProduct.sku}</p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => setShowProductDetails(false)}
              >
                ×
              </button>
            </div>

            <div className="details-grid">
              <Detail
                label="Product Name"
                value={selectedProduct.product_name}
              />
              <Detail label="SKU" value={selectedProduct.sku} />
              <Detail
                label="Category"
                value={selectedProduct.category}
              />
              <Detail
                label="Unit Price"
                value={`₹${Number(
                  selectedProduct.unit_price
                ).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}`}
              />
              <Detail
                label="Current Stock"
                value={String(selectedProduct.current_stock)}
              />
              <Detail
                label="Minimum Stock Alert"
                value={String(
                  selectedProduct.minimum_stock_alert_quantity
                )}
              />
              <Detail
                label="Warehouse Location"
                value={selectedProduct.warehouse_location}
              />
              <Detail
                label="Stock Status"
                value={
                  Number(selectedProduct.current_stock) <=
                  Number(
                    selectedProduct.minimum_stock_alert_quantity
                  )
                    ? "LOW STOCK"
                    : "NORMAL"
                }
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowProductDetails(false)}
              >
                Close
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowProductDetails(false);
                  openEditProduct(selectedProduct);
                }}
              >
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-card large-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingCustomerId
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p>
                  Enter the customer's CRM information.
                </p>
              </div>

              <button
                className="close-button"
                onClick={() => setShowCustomerModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCustomer}>
              <div className="form-grid">
                <FormField
                  label="Customer Name"
                  value={customerForm.customerName}
                  onChange={(value) =>
                    setCustomerForm({
                      ...customerForm,
                      customerName: value,
                    })
                  }
                  required
                />

                <FormField
                  label="Mobile Number"
                  value={customerForm.mobileNumber}
                  onChange={(value) =>
                    setCustomerForm({
                      ...customerForm,
                      mobileNumber: value,
                    })
                  }
                  required
                />

                <FormField
                  label="Email"
                  value={customerForm.email}
                  onChange={(value) =>
                    setCustomerForm({
                      ...customerForm,
                      email: value,
                    })
                  }
                  type="email"
                />

                <FormField
                  label="Business Name"
                  value={customerForm.businessName}
                  onChange={(value) =>
                    setCustomerForm({
                      ...customerForm,
                      businessName: value,
                    })
                  }
                />

                <FormField
                  label="GST Number"
                  value={customerForm.gstNumber}
                  onChange={(value) =>
                    setCustomerForm({
                      ...customerForm,
                      gstNumber: value,
                    })
                  }
                />

                <div className="form-field">
                  <label>Customer Type</label>

                  <select
                    value={customerForm.customerType}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        customerType: event.target.value,
                      })
                    }
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Status</label>

                  <select
                    value={customerForm.status}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        status: event.target.value,
                      })
                    }
                  >
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>

                <FormField
                  label="Follow-up Date"
                  value={customerForm.followUpDate}
                  onChange={(value) =>
                    setCustomerForm({
                      ...customerForm,
                      followUpDate: value,
                    })
                  }
                  type="date"
                />

                <div className="form-field full-width">
                  <label>Address</label>

                  <textarea
                    value={customerForm.address}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        address: event.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>

                <div className="form-field full-width">
                  <label>Notes</label>

                  <textarea
                    value={customerForm.notes}
                    onChange={(event) =>
                      setCustomerForm({
                        ...customerForm,
                        notes: event.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>

              {formError && (
                <div className="error-message">{formError}</div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowCustomerModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button modal-submit"
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? "Saving..."
                    : editingCustomerId
                    ? "Update Customer"
                    : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustomerDetails && selectedCustomer && (
        <div className="modal-overlay">
          <div className="modal-card large-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedCustomer.customer_name}</h2>
                <p>
                  {selectedCustomer.business_name ||
                    "Customer details"}
                </p>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCustomerDetails(false)
                }
              >
                ×
              </button>
            </div>

            <div className="details-grid">
              <Detail
                label="Mobile"
                value={selectedCustomer.mobile_number}
              />

              <Detail
                label="Email"
                value={selectedCustomer.email}
              />

              <Detail
                label="Business"
                value={selectedCustomer.business_name}
              />

              <Detail
                label="GST"
                value={selectedCustomer.gst_number}
              />

              <Detail
                label="Type"
                value={selectedCustomer.customer_type}
              />

              <Detail
                label="Status"
                value={selectedCustomer.status}
              />

              <Detail
                label="Follow-up"
                value={
                  selectedCustomer.follow_up_date
                    ? selectedCustomer.follow_up_date.substring(
                        0,
                        10
                      )
                    : "Not scheduled"
                }
              />

              <Detail
                label="Address"
                value={selectedCustomer.address}
              />
            </div>

            <div className="follow-up-section">
              <h3>Add Follow-up Note</h3>

              <textarea
                value={followUpNote}
                onChange={(event) =>
                  setFollowUpNote(event.target.value)
                }
                placeholder="Enter follow-up note..."
                rows={3}
              />

              <button
                className="primary-button small-button"
                onClick={addFollowUp}
                disabled={
                  actionLoading || !followUpNote.trim()
                }
              >
                {actionLoading
                  ? "Adding..."
                  : "Add Follow-up"}
              </button>
            </div>

            {selectedCustomer.notes && (
              <div className="notes-box">
                <strong>Current Notes</strong>
                <p>{selectedCustomer.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  dashboard,
  loadDashboard,
}: {
  dashboard: DashboardData | null;
  loadDashboard: () => void;
}) {
  return (
    <>
      <section className="welcome-section">
        <div>
          <h2>Business Overview</h2>
          <p>
            Monitor customers, inventory and sales activity.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
        >
          ↻ Refresh
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Total Customers"
          value={dashboard?.totalCustomers ?? "—"}
          icon="♙"
        />

        <StatCard
          title="Total Products"
          value={dashboard?.totalProducts ?? "—"}
          icon="▣"
        />

        <StatCard
          title="Total Stock"
          value={dashboard?.totalStock ?? "—"}
          icon="◈"
        />

        <StatCard
          title="Low Stock"
          value={dashboard?.lowStockCount ?? "—"}
          icon="!"
          warning
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Recent Stock Movements</h3>
            <p>Latest inventory activity</p>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Movement</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                {dashboard?.recentStockMovements?.length ? (
                  dashboard.recentStockMovements.map(
                    (movement) => (
                      <tr key={movement.id}>
                        <td>
                          <strong>
                            {movement.product_name}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              movement.movement_type === "IN"
                                ? "success"
                                : "danger"
                            }`}
                          >
                            {movement.movement_type}
                          </span>
                        </td>

                        <td>{movement.quantity_changed}</td>

                        <td>{movement.reason}</td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      No stock movements found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Recent Challans</h3>
            <p>Latest sales activity</p>
          </div>

          <div className="challan-list">
            {dashboard?.recentChallans?.length ? (
              dashboard.recentChallans.map((challan) => (
                <div className="challan-item" key={challan.id}>
                  <div>
                    <strong>{challan.challan_number}</strong>
                    <span>{challan.customer_name}</span>
                  </div>

                  <div className="challan-right">
                    <strong>{challan.total_quantity}</strong>

                    <span
                      className={`badge ${
                        challan.status === "CONFIRMED"
                          ? "success"
                          : challan.status === "CANCELLED"
                          ? "danger"
                          : "warning"
                      }`}
                    >
                      {challan.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No challans found.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel customers-panel">
        <div className="panel-header">
          <h3>Recent Customers</h3>
          <p>Recently added CRM records</p>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Business</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {dashboard?.recentCustomers?.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.customer_name}</strong>
                  </td>

                  <td>{customer.business_name || "—"}</td>
                  <td>{customer.customer_type}</td>

                  <td>
                    <span className="badge success">
                      {customer.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function CustomersPage({
  customers,
  loading,
  search,
  setSearch,
  page,
  totalPages,
  setPage,
  openAddCustomer,
  openEditCustomer,
  viewCustomer,
}: {
  customers: Customer[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  openAddCustomer: () => void;
  openEditCustomer: (customer: Customer) => void;
  viewCustomer: (id: number) => void;
}) {
  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Customer Management</h2>
          <p>
            Manage customer records, details and follow-ups.
          </p>
        </div>

        <button
          className="primary-button add-button"
          onClick={openAddCustomer}
        >
          + Add Customer
        </button>
      </section>

      <section className="panel">
        <div className="customer-toolbar">
          <input
            className="search-input"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customer, mobile, email or business..."
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Business</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.customer_name}</strong>

                      <span className="table-subtext">
                        {customer.email || "No email"}
                      </span>
                    </td>

                    <td>{customer.mobile_number}</td>

                    <td>
                      {customer.business_name || "—"}
                    </td>

                    <td>{customer.customer_type}</td>

                    <td>
                      <span className="badge success">
                        {customer.status}
                      </span>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="table-button"
                          onClick={() =>
                            viewCustomer(customer.id)
                          }
                        >
                          View
                        </button>

                        <button
                          className="table-button"
                          onClick={() =>
                            openEditCustomer(customer)
                          }
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            className="pagination-button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>
            Page <strong>{page}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>

          <button
            className="pagination-button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </>
  );
}

function ProductsPage({
  products,
  loading,
  search,
  setSearch,
  page,
  totalPages,
  setPage,
  openAddProduct,
  openEditProduct,
  viewProduct,
}: {
  products: Product[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  openAddProduct: () => void;
  openEditProduct: (product: Product) => void;
  viewProduct: (id: number) => void;
}) {
  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Product Management</h2>
          <p>
            Manage products, pricing, inventory and warehouse locations.
          </p>
        </div>

        <button
          className="primary-button add-button"
          onClick={openAddProduct}
        >
          + Add Product
        </button>
      </section>

      <section className="panel">
        <div className="customer-toolbar">
          <input
            className="search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, SKU or category..."
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const lowStock =
                    Number(product.current_stock) <=
                    Number(product.minimum_stock_alert_quantity);

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.product_name}</strong>
                        <span className="table-subtext">
                          ID: {product.id}
                        </span>
                      </td>

                      <td>{product.sku}</td>
                      <td>{product.category}</td>

                      <td>
                        ₹
                        {Number(product.unit_price).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            lowStock ? "danger" : "success"
                          }`}
                        >
                          {product.current_stock}
                        </span>

                        {lowStock && (
                          <span className="table-subtext">
                            Low stock
                          </span>
                        )}
                      </td>

                      <td>{product.warehouse_location}</td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="table-button"
                            onClick={() => viewProduct(product.id)}
                          >
                            View
                          </button>

                          <button
                            className="table-button"
                            onClick={() => openEditProduct(product)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            className="pagination-button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>
            Page <strong>{page}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>

          <button
            className="pagination-button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </>
  );
}

function InventoryPage({
  products,
  movements,
  lowStockProducts,
  loading,
  actionLoading,
  formError,
  message,
  productId,
  quantity,
  reason,
  movementFilter,
  setProductId,
  setQuantity,
  setReason,
  setMovementFilter,
  submitStockMovement,
  refresh,
}: {
  products: Product[];
  movements: StockMovement[];
  lowStockProducts: LowStockProduct[];
  loading: boolean;
  actionLoading: boolean;
  formError: string;
  message: string;
  productId: string;
  quantity: string;
  reason: string;
  movementFilter: string;
  setProductId: (value: string) => void;
  setQuantity: (value: string) => void;
  setReason: (value: string) => void;
  setMovementFilter: (value: string) => void;
  submitStockMovement: (
    event: React.FormEvent,
    type: "in" | "out"
  ) => Promise<void>;
  refresh: () => void;
}) {
  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Inventory Management</h2>
          <p>
            Manage stock in, stock out, low-stock alerts and movement history.
          </p>
        </div>

        <button className="refresh-button" onClick={refresh} disabled={loading}>
          ↻ Refresh
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length}
          icon="!"
          warning={lowStockProducts.length > 0}
        />
        <StatCard title="Stock Movements" value={movements.length} icon="◈" />
        <StatCard title="Products Available" value={products.length} icon="▣" />
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <h3>Stock In</h3>
            <p>Add received stock to a product.</p>
          </div>

          <form
            className="inventory-form"
            onSubmit={(event) => submitStockMovement(event, "in")}
          >
            <div className="form-field">
              <label>Product *</label>
              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              type="number"
              required
            />

            <div className="form-field">
              <label>Reason *</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. New stock received"
                rows={3}
                required
              />
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : "Add Stock"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Stock Out</h3>
            <p>Remove stock for sales, damage or other reasons.</p>
          </div>

          <form
            className="inventory-form"
            onSubmit={(event) => submitStockMovement(event, "out")}
          >
            <div className="form-field">
              <label>Product *</label>
              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} ({product.sku}) — Stock:{" "}
                    {product.current_stock}
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              type="number"
              required
            />

            <div className="form-field">
              <label>Reason *</label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Customer sale"
                rows={3}
                required
              />
            </div>

            <button
              className="primary-button"
              type="submit"
              disabled={actionLoading}
            >
              {actionLoading ? "Updating..." : "Remove Stock"}
            </button>
          </form>
        </div>
      </section>

      {formError && <div className="error-message">{formError}</div>}
      {message && <div className="success-message">{message}</div>}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Low Stock Alerts</h3>
            <p>Products at or below their configured minimum stock level.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Minimum</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Loading low-stock alerts...
                  </td>
                </tr>
              ) : lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No low-stock products found.
                  </td>
                </tr>
              ) : (
                lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.product_name}</strong>
                    </td>
                    <td>{product.sku}</td>
                    <td>
                      <span className="badge danger">
                        {product.current_stock}
                      </span>
                    </td>
                    <td>{product.minimum_stock_alert_quantity}</td>
                    <td>{product.warehouse_location || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Stock Movement History</h3>
            <p>Every stock IN and OUT transaction recorded by the backend.</p>
          </div>

          <select
            value={movementFilter}
            onChange={(event) => setMovementFilter(event.target.value)}
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Movement</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Loading movements...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <strong>{movement.product_name}</strong>
                    </td>
                    <td>{movement.sku}</td>
                    <td>
                      <span
                        className={`badge ${
                          movement.movement_type === "IN"
                            ? "success"
                            : "danger"
                        }`}
                      >
                        {movement.movement_type}
                      </span>
                    </td>
                    <td>{movement.quantity_changed}</td>
                    <td>{movement.reason}</td>
                    <td>{movement.created_by_email || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SalesChallansPage({
  customers,
  products,
  challans,
  loading,
  actionLoading,
  error,
  message,
  customerId,
  items,
  setCustomerId,
  updateItem,
  addItem,
  removeItem,
  createChallan,
  viewChallan,
  reuseDraft,
  reusedDraftId,
  clearReusedDraft,
  cancelChallan,
  refresh,
}: {
  customers: Customer[];
  products: Product[];
  challans: Challan[];
  loading: boolean;
  actionLoading: boolean;
  error: string;
  message: string;
  customerId: string;
  items: ChallanDraftItem[];
  setCustomerId: (value: string) => void;
  updateItem: (
    index: number,
    field: keyof ChallanDraftItem,
    value: string
  ) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  createChallan: (status: "DRAFT" | "CONFIRMED") => Promise<void>;
  viewChallan: (id: number) => Promise<void>;
  reuseDraft: (id: number) => Promise<void>;
  reusedDraftId: number | null;
  clearReusedDraft: () => void;
  cancelChallan: (id: number) => Promise<void>;
  refresh: () => void;
}) {
  return (
    <>
      <section className="page-toolbar">
        <div>
          <h2>Sales Challan Management</h2>
          <p>Create draft or confirmed sales challans and manage their status.</p>
        </div>
        <button
          type="button"
          className="refresh-button"
          onClick={refresh}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </section>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      {reusedDraftId !== null && (
        <div className="success-message" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <span>Reusing draft #{reusedDraftId}. Save Draft keeps the original; Confirm Challan closes the original after the new challan is created.</span>
          <button type="button" className="table-button" onClick={clearReusedDraft} disabled={actionLoading}>
            Clear Reuse
          </button>
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Create Sales Challan</h3>
            <p>
              Confirmed challans reduce stock. Draft challans do not reduce stock.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field full-width">
            <label>Customer *</label>
            <select
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name}
                  {customer.business_name ? ` — ${customer.business_name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Available Stock</th>
                <th>Unit Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const selectedProduct = products.find(
                  (product) => String(product.id) === item.productId
                );

                return (
                  <tr key={index}>
                    <td>
                      <select
                        value={item.productId}
                        onChange={(event) =>
                          updateItem(index, "productId", event.target.value)
                        }
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.product_name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        placeholder="Qty"
                      />
                    </td>
                    <td>{selectedProduct?.current_stock ?? "—"}</td>
                    <td>
                      {selectedProduct
                        ? `₹${Number(selectedProduct.unit_price).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}`
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="table-button"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={addItem}
            disabled={actionLoading}
          >
            + Add Product
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => createChallan("DRAFT")}
            disabled={actionLoading}
          >
            {actionLoading ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            className="primary-button modal-submit"
            onClick={() => createChallan("CONFIRMED")}
            disabled={actionLoading}
          >
            {actionLoading ? "Processing..." : "Confirm Challan"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Challan History</h3>
            <p>View, cancel and track sales challans.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Challan</th>
                <th>Customer</th>
                <th>Total Qty</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="empty-state">Loading challans...</td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">No challans found.</td>
                </tr>
              ) : (
                challans.map((challan) => (
                  <tr key={challan.id}>
                    <td><strong>{challan.challan_number}</strong></td>
                    <td>
                      {challan.customer_name ||
                        customers.find((c) => c.id === challan.customer_id)
                          ?.customer_name ||
                        `Customer #${challan.customer_id}`}
                    </td>
                    <td>{challan.total_quantity}</td>
                    <td>
                      <span
                        className={`badge ${
                          challan.status === "CONFIRMED"
                            ? "success"
                            : challan.status === "CANCELLED"
                            ? "danger"
                            : "warning"
                        }`}
                      >
                        {challan.status}
                      </span>
                    </td>
                    <td>
                      {new Date(challan.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="table-button"
                          onClick={() => viewChallan(challan.id)}
                        >
                          View
                        </button>
                        {challan.status === "DRAFT" && (
                          <button
                            type="button"
                            className="table-button"
                            onClick={() => reuseDraft(challan.id)}
                            disabled={actionLoading}
                          >
                            Reuse Draft
                          </button>
                        )}
                        {challan.status !== "CANCELLED" && (
                          <button
                            type="button"
                            className="table-button"
                            onClick={() => cancelChallan(challan.id)}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}



function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="form-field">
      <label>
        {label}
        {required && " *"}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  warning = false,
}: {
  title: string;
  value: number | string;
  icon: string;
  warning?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${warning ? "warning-icon" : ""}`}>
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default App;
