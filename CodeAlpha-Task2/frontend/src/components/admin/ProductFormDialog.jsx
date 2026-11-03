import { useEffect, useState } from "react";
import { getApiErrorMessage, getFieldErrors } from "../../api/axios.js";
import productService from "../../services/productService.js";
import { hasErrors, validateImageFile, validateProduct } from "../../utils/validation.js";
import Button from "../common/Button.jsx";
import Dialog from "../common/Dialog.jsx";
import { SelectField, TextAreaField, TextField } from "../common/Field.jsx";
import ProductImage from "../common/ProductImage.jsx";

/*
 * Create / edit form. The parent mounts it only while it is open, so the form
 * always starts fresh. `product` = null means "create".
 */
export default function ProductFormDialog({ product, categories, onClose, onSaved }) {
  const isEdit = Boolean(product);

  const [values, setValues] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "",
    categoryId: product ? String(product.category.id) : "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Local preview of the chosen file; released when it changes or the dialog closes.
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const setField = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleFile = (event) => {
    const file = event.target.files?.[0] ?? null;
    setErrors((current) => ({ ...current, image: undefined }));

    const problem = file ? validateImageFile(file) : "";

    if (problem) {
      setErrors((current) => ({ ...current, image: problem }));
      event.target.value = "";
      return;
    }
    setImageFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const clientErrors = validateProduct(values);
    setErrors(clientErrors);
    if (hasErrors(clientErrors)) return;

    const body = new FormData();
    body.append("name", values.name.trim());
    body.append("description", values.description.trim());
    body.append("price", values.price);
    body.append("stock", values.stock);
    body.append("categoryId", values.categoryId);
    if (imageFile) body.append("image", imageFile);

    setSaving(true);
    try {
      const saved = isEdit ? await productService.update(product.id, body) : await productService.create(body);
      onSaved(saved, isEdit);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getApiErrorMessage(error, "The product could not be saved."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEdit ? "Edit product" : "Add product"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            {isEdit ? "Save changes" : "Add product"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className="error-box" role="alert">
            {formError}
          </p>
        )}
        <TextField label="Name" value={values.name} onChange={setField("name")} error={errors.name} />
        <SelectField label="Category" value={values.categoryId} onChange={setField("categoryId")} error={errors.categoryId}>
          <option value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
        <div className="form-row">
          <TextField label="Price" type="number" inputMode="decimal" min="0" step="0.01" value={values.price} onChange={setField("price")} error={errors.price} />
          <TextField label="Stock" type="number" inputMode="numeric" min="0" step="1" value={values.stock} onChange={setField("stock")} error={errors.stock} />
        </div>
        <TextAreaField label="Description" rows={4} value={values.description} onChange={setField("description")} error={errors.description} />

        <div className="image-input">
          {(previewUrl || product?.imageUrl) && (
            <div className="image-input__preview">
              {previewUrl ? <img src={previewUrl} alt="Selected product" width="96" height="96" /> : <ProductImage src={product.imageUrl} alt="Current product" />}
            </div>
          )}
          <TextField
            label={isEdit ? "Replace image (optional)" : "Image (optional)"}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            error={errors.image}
            hint="JPEG, PNG or WebP, up to 2 MB."
          />
        </div>
      </form>
    </Dialog>
  );
}
