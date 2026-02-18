import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Product, Category, ProductSize, CareInfo } from "@palmtree/shared";
import { generateSlug, generateId } from "@palmtree/shared";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Loader2,
  ImageIcon,
  Tag,
  FolderTree,
  Save,
  AlertTriangle,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const EMPTY_CARE_INFO: CareInfo = {
  sunlight: "",
  water: "",
  temperature: "",
  soil: "",
  tips: [],
};

function blankSize(): ProductSize {
  return {
    id: generateId(),
    label: "",
    height: "",
    price: 0,
    compareAtPrice: undefined,
    stock: 0,
    sku: "",
  };
}

interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  images: string[];
  thumbnailURL: string;
  sizes: ProductSize[];
  careInfo: CareInfo;
  tags: string;
  featured: boolean;
  active: boolean;
  seasonalOnly: boolean;
}

function emptyFormData(): ProductFormData {
  return {
    name: "",
    description: "",
    categoryId: "",
    images: [],
    thumbnailURL: "",
    sizes: [blankSize()],
    careInfo: { ...EMPTY_CARE_INFO, tips: [] },
    tags: "",
    featured: false,
    active: true,
    seasonalOnly: false,
  };
}

function productToFormData(p: Product): ProductFormData {
  return {
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    images: [...p.images],
    thumbnailURL: p.thumbnailURL,
    sizes: p.sizes.map((s) => ({ ...s })),
    careInfo: {
      sunlight: p.careInfo.sunlight,
      water: p.careInfo.water,
      temperature: p.careInfo.temperature,
      soil: p.careInfo.soil,
      tips: [...p.careInfo.tips],
    },
    tags: p.tags.join(", "),
    featured: p.featured,
    active: p.active,
    seasonalOnly: p.seasonalOnly,
  };
}

// ─── Category Inline Row ────────────────────────────────────────

interface CategoryRowProps {
  category?: Category;
  onSave: (data: { name: string; description: string; imageURL: string; sortOrder: number; active: boolean }) => void;
  onCancel: () => void;
  saving: boolean;
}

function CategoryInlineForm({ category, onSave, onCancel, saving }: CategoryRowProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageURL, setImageURL] = useState(category?.imageURL ?? "");
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0);
  const [active, setActive] = useState(category?.active ?? true);

  return (
    <tr className="bg-emerald-50">
      <td className="px-4 py-2">
        <input
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          placeholder="Image URL"
          value={imageURL}
          onChange={(e) => setImageURL(e.target.value)}
        />
      </td>
      <td className="px-4 py-2">
        <input
          type="number"
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-1">
          <button
            disabled={saving || !name.trim()}
            onClick={() => onSave({ name: name.trim(), description, imageURL, sortOrder, active })}
            className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          </button>
          <button
            onClick={onCancel}
            className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function ProductsPage() {
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category inline editing
  const [catEditing, setCatEditing] = useState<string | null>(null); // id or "__new__"
  const [catSaving, setCatSaving] = useState(false);
  const [catSectionOpen, setCatSectionOpen] = useState(false);

  // Product modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyFormData());
  const [imageInput, setImageInput] = useState("");
  const [careTipInput, setCareTipInput] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // ─── Fetch data ─────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    const q = query(collection(db, "categories"), orderBy("sortOrder", "asc"));
    const snap = await getDocs(q);
    const cats: Category[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    setCategories(cats);
  }, []);

  const fetchProducts = useCallback(async () => {
    const q = query(collection(db, "products"), orderBy("name", "asc"));
    const snap = await getDocs(q);
    const prods: Product[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
    setProducts(prods);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        await Promise.all([fetchCategories(), fetchProducts()]);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchCategories, fetchProducts]);

  // ─── Category CRUD ──────────────────────────────────────────

  async function handleSaveCategory(
    data: { name: string; description: string; imageURL: string; sortOrder: number; active: boolean },
    existingId?: string,
  ) {
    setCatSaving(true);
    try {
      if (existingId) {
        await updateDoc(doc(db, "categories", existingId), {
          ...data,
          slug: generateSlug(data.name),
        });
      } else {
        await addDoc(collection(db, "categories"), {
          ...data,
          slug: generateSlug(data.name),
        });
      }
      await fetchCategories();
      setCatEditing(null);
    } catch (err) {
      console.error("Failed to save category:", err);
    } finally {
      setCatSaving(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!window.confirm("Delete this category? Products in this category will lose their category association.")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      await fetchCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  }

  // ─── Product form helpers ───────────────────────────────────

  function openAddModal() {
    setEditingProduct(null);
    setForm(emptyFormData());
    setImageInput("");
    setCareTipInput("");
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm(productToFormData(product));
    setImageInput("");
    setCareTipInput("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
  }

  function updateForm<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCareInfo<K extends keyof CareInfo>(key: K, value: CareInfo[K]) {
    setForm((prev) => ({
      ...prev,
      careInfo: { ...prev.careInfo, [key]: value },
    }));
  }

  function updateSize(index: number, field: keyof ProductSize, value: string | number) {
    setForm((prev) => {
      const sizes = [...prev.sizes];
      sizes[index] = { ...sizes[index], [field]: value };
      return { ...prev, sizes };
    });
  }

  function addSize() {
    setForm((prev) => ({ ...prev, sizes: [...prev.sizes, blankSize()] }));
  }

  function removeSize(index: number) {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  }

  function addImage() {
    const url = imageInput.trim();
    if (!url) return;
    updateForm("images", [...form.images, url]);
    setImageInput("");
  }

  function removeImage(index: number) {
    updateForm(
      "images",
      form.images.filter((_, i) => i !== index),
    );
  }

  function addCareTip() {
    const tip = careTipInput.trim();
    if (!tip) return;
    updateCareInfo("tips", [...form.careInfo.tips, tip]);
    setCareTipInput("");
  }

  function removeCareTip(index: number) {
    updateCareInfo(
      "tips",
      form.careInfo.tips.filter((_, i) => i !== index),
    );
  }

  // ─── Product CRUD ──────────────────────────────────────────

  async function handleSaveProduct() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        slug: generateSlug(form.name.trim()),
        description: form.description,
        categoryId: form.categoryId,
        images: form.images,
        thumbnailURL: form.thumbnailURL,
        sizes: form.sizes,
        careInfo: form.careInfo,
        tags,
        featured: form.featured,
        active: form.active,
        seasonalOnly: form.seasonalOnly,
        updatedAt: Timestamp.now(),
      };

      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), payload);
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: Timestamp.now(),
        });
      }

      await fetchProducts();
      closeModal();
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "products", deleteTarget.id));
      await fetchProducts();
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  }

  // ─── Lookup helper ─────────────────────────────────────────

  function categoryName(id: string): string {
    return categories.find((c) => c.id === id)?.name ?? "Uncategorized";
  }

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Category Management Section ─────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <button
          onClick={() => setCatSectionOpen(!catSectionOpen)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {categories.length}
            </span>
          </div>
          {catSectionOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {catSectionOpen && (
          <div className="border-t border-gray-200 px-6 pb-4">
            <div className="mb-3 flex justify-end pt-3">
              <button
                onClick={() => setCatEditing("__new__")}
                disabled={catEditing !== null}
                className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Add Category
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Image URL</th>
                  <th className="px-4 py-2">Sort</th>
                  <th className="px-4 py-2 text-center">Active</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catEditing === "__new__" && (
                  <CategoryInlineForm
                    onSave={(data) => handleSaveCategory(data)}
                    onCancel={() => setCatEditing(null)}
                    saving={catSaving}
                  />
                )}
                {categories.map((cat) =>
                  catEditing === cat.id ? (
                    <CategoryInlineForm
                      key={cat.id}
                      category={cat}
                      onSave={(data) => handleSaveCategory(data, cat.id)}
                      onCancel={() => setCatEditing(null)}
                      saving={catSaving}
                    />
                  ) : (
                    <tr key={cat.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-2 text-gray-600 truncate max-w-[200px]">{cat.description}</td>
                      <td className="px-4 py-2 text-gray-500 truncate max-w-[150px] text-xs">{cat.imageURL || "—"}</td>
                      <td className="px-4 py-2 text-gray-600">{cat.sortOrder}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${cat.active ? "bg-emerald-500" : "bg-gray-300"}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setCatEditing(cat.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-emerald-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
                {categories.length === 0 && catEditing !== "__new__" && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                      No categories yet. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Products Section ────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-600">
              {products.length}
            </span>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Image</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-center">Sizes</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    {product.thumbnailURL ? (
                      <img
                        src={product.thumbnailURL}
                        alt={product.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    {product.featured && (
                      <span className="mt-0.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{categoryName(product.categoryId)}</td>
                  <td className="px-6 py-3 text-center text-gray-600">{product.sizes.length}</td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="rounded p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        title="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Package className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-gray-500">No products yet</p>
                    <button
                      onClick={openAddModal}
                      className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Add your first product
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ──────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will permanently
              remove the product and all its data.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Product Modal ───────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-8">
          <div
            className="w-full max-w-3xl rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={closeModal} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-5 space-y-6">
              {/* ── Basic Info ─────────────────────────────── */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Basic Info</legend>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="Monstera Deliciosa"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      value={form.categoryId}
                      onChange={(e) => updateForm("categoryId", e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    rows={3}
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="A beautiful tropical plant..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Thumbnail URL</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={form.thumbnailURL}
                    onChange={(e) => updateForm("thumbnailURL", e.target.value)}
                    placeholder="https://example.com/thumb.jpg"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={form.active}
                      onChange={(e) => updateForm("active", e.target.checked)}
                    />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={form.featured}
                      onChange={(e) => updateForm("featured", e.target.checked)}
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={form.seasonalOnly}
                      onChange={(e) => updateForm("seasonalOnly", e.target.checked)}
                    />
                    Seasonal Only
                  </label>
                </div>
              </fieldset>

              {/* ── Images ─────────────────────────────────── */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Images</legend>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="https://example.com/image.jpg"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((url, i) => (
                      <div key={i} className="group relative">
                        <img src={url} alt="" className="h-16 w-16 rounded-md object-cover border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>

              {/* ── Sizes ──────────────────────────────────── */}
              <fieldset className="space-y-3">
                <div className="flex items-center justify-between">
                  <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Sizes</legend>
                  <button
                    type="button"
                    onClick={addSize}
                    className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    <Plus className="h-3 w-3" /> Add Size
                  </button>
                </div>

                <div className="space-y-3">
                  {form.sizes.map((size, idx) => (
                    <div
                      key={size.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Size {idx + 1}</span>
                        {form.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSize(idx)}
                            className="rounded p-0.5 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-500">Label</label>
                          <input
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="Small"
                            value={size.label}
                            onChange={(e) => updateSize(idx, "label", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-500">Height</label>
                          <input
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder='6"'
                            value={size.height}
                            onChange={(e) => updateSize(idx, "height", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-500">Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            value={size.price || ""}
                            onChange={(e) => updateSize(idx, "price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-500">Compare Price ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            value={size.compareAtPrice ?? ""}
                            onChange={(e) => updateSize(idx, "compareAtPrice", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-500">Stock</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            value={size.stock || ""}
                            onChange={(e) => updateSize(idx, "stock", parseInt(e.target.value, 10) || 0)}
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-500">SKU</label>
                          <input
                            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                            placeholder="MON-SM-001"
                            value={size.sku}
                            onChange={(e) => updateSize(idx, "sku", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* ── Care Info ──────────────────────────────── */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Care Info</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Sunlight</label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Bright indirect light"
                      value={form.careInfo.sunlight}
                      onChange={(e) => updateCareInfo("sunlight", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Water</label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Every 1-2 weeks"
                      value={form.careInfo.water}
                      onChange={(e) => updateCareInfo("water", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Temperature</label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="65-85F"
                      value={form.careInfo.temperature}
                      onChange={(e) => updateCareInfo("temperature", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Soil</label>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Well-draining potting mix"
                      value={form.careInfo.soil}
                      onChange={(e) => updateCareInfo("soil", e.target.value)}
                    />
                  </div>
                </div>

                {/* Care tips */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Care Tips</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Add a care tip..."
                      value={careTipInput}
                      onChange={(e) => setCareTipInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCareTip())}
                    />
                    <button
                      type="button"
                      onClick={addCareTip}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Add
                    </button>
                  </div>
                  {form.careInfo.tips.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {form.careInfo.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
                        >
                          <span>{tip}</span>
                          <button
                            type="button"
                            onClick={() => removeCareTip(i)}
                            className="ml-2 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </fieldset>

              {/* ── Tags ───────────────────────────────────── */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Tags</legend>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="tropical, indoor, low-light (comma-separated)"
                    value={form.tags}
                    onChange={(e) => updateForm("tags", e.target.value)}
                  />
                </div>
              </fieldset>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProduct ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
