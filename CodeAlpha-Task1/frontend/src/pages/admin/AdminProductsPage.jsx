import { useState } from "react";
import { getApiErrorMessage } from "../../api/axios.js";
import ConfirmDialog from "../../components/admin/ConfirmDialog.jsx";
import ProductFormDialog from "../../components/admin/ProductFormDialog.jsx";
import Button from "../../components/common/Button.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import ProductImage from "../../components/common/ProductImage.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import useApiData from "../../hooks/useApiData.js";
import useDebounce from "../../hooks/useDebounce.js";
import useToast from "../../hooks/useToast.js";
import productService from "../../services/productService.js";
import { formatPrice } from "../../utils/format.js";

export default function AdminProductsPage() {
  const toast = useToast();
  const [searchText, setSearchText] = useState("");
  const search = useDebounce(searchText.trim(), 400);
  const [page, setPage] = useState(1);

  const [formState, setFormState] = useState(null); // null | { product: null | product }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categories = useApiData(() => productService.categories(), []);
  const products = useApiData(() => productService.list({ search: search || undefined, page, limit: 10, sort: "newest" }), [search, page]);

  const handleSaved = (product, wasEdit) => {
    setFormState(null);
    toast.success(wasEdit ? `${product.name} was updated.` : `${product.name} was added.`);
    products.reload();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await productService.remove(deleteTarget.id);
      toast.success(`${deleteTarget.name} was removed from the store.`);
      setDeleteTarget(null);
      // If that was the last item on this page, step back one page.
      if (products.data.items.length === 1 && page > 1) setPage(page - 1);
      else products.reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The product could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby="admin-products-title">
      <div className="admin-toolbar">
        <h2 id="admin-products-title" className="section-title">
          Products
        </h2>
        <div className="admin-toolbar__actions">
          <div className="field field--inline">
            <label htmlFor="admin-search" className="field__label">
              Search
            </label>
            <input
              id="admin-search"
              type="search"
              className="field__control"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button onClick={() => setFormState({ product: null })} disabled={!categories.data}>
            Add product
          </Button>
        </div>
      </div>

      {products.loading && !products.data && <Spinner label="Loading products…" />}
      {products.error && !products.data && <ErrorMessage message={products.error} onRetry={products.reload} />}

      {products.data && products.data.items.length === 0 && <EmptyState title="No products found">Add your first product with the button above.</EmptyState>}

      {products.data && products.data.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="table table--stack">
              <caption className="visually-hidden">Products in the store</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Category</th>
                  <th scope="col" className="num">Price</th>
                  <th scope="col" className="num">Stock</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.data.items.map((product) => (
                  <tr key={product.id}>
                    <td data-label="Product">
                      <div className="table-product">
                        <ProductImage src={product.imageUrl} alt="" />
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td data-label="Category">{product.category.name}</td>
                    <td data-label="Price" className="num">{formatPrice(product.price)}</td>
                    <td data-label="Stock" className="num">{product.stock}</td>
                    <td className="table__actions">
                      <Button variant="secondary" onClick={() => setFormState({ product })}>
                        Edit<span className="visually-hidden"> {product.name}</span>
                      </Button>
                      <Button variant="ghost" onClick={() => setDeleteTarget(product)}>
                        Delete<span className="visually-hidden"> {product.name}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={products.data.meta.page} totalPages={products.data.meta.totalPages} onChange={setPage} />
        </>
      )}

      {formState && categories.data && (
        <ProductFormDialog product={formState.product} categories={categories.data} onClose={() => setFormState(null)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog title="Delete this product?" confirmLabel="Delete product" busy={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)}>
          <p>
            <strong>{deleteTarget.name}</strong> will disappear from the store and from customers' carts. Past orders keep their record of it.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
