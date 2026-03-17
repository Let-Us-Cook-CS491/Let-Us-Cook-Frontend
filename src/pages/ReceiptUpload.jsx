import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  fetchReceiptUploadConfig,
  submitReceiptApproval,
  uploadReceiptPhoto,
} from '../services/receiptService';

const parseMaxBytes = (payload) => {
  if (!payload) return null;

  const maxBytes =
    payload.max_file_size_bytes ??
    payload.maxFileSizeBytes ??
    payload.max_size_bytes ??
    payload.maxSizeBytes;

  if (Number.isFinite(maxBytes)) {
    return Number(maxBytes);
  }

  const maxMb =
    payload.max_file_size_mb ??
    payload.maxFileSizeMb ??
    payload.max_size_mb ??
    payload.maxSizeMb;

  if (Number.isFinite(maxMb)) {
    return Number(maxMb) * 1024 * 1024;
  }

  const envBytes = Number.parseInt(import.meta.env.VITE_RECEIPT_UPLOAD_MAX_BYTES, 10);
  if (Number.isFinite(envBytes)) {
    return envBytes;
  }

  const envMb = Number.parseFloat(import.meta.env.VITE_RECEIPT_UPLOAD_MAX_MB);
  if (Number.isFinite(envMb)) {
    return envMb * 1024 * 1024;
  }

  return null;
};

const parseAllowedTypes = (payload) => {
  if (!payload) return null;
  return (
    payload.allowed_mime_types ??
    payload.allowedMimeTypes ??
    payload.allowed_types ??
    payload.allowedTypes ??
    null
  );
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  return (
    error.message ||
    error.error ||
    error.detail ||
    error?.data?.message ||
    'Something went wrong. Please try again.'
  );
};

const toDateInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatConfidence = (value) => {
  if (!Number.isFinite(value)) return null;
  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(normalized)}%`;
};

const formatMoney = (value, currency) => {
  const numericValue =
    typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numericValue)) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch (error) {
    return `${numericValue}`;
  }
};

const normalizeUploadResponse = (payload) => {
  const data = payload?.data ?? payload ?? {};
  const rawItems =
    data.items ??
    data.line_items ??
    data.lineItems ??
    data.ingredients ??
    data.products ??
    data.entries ??
    [];
  const itemsArray = Array.isArray(rawItems) ? rawItems : [];
  const items = itemsArray.map((item, index) => {
    const expiresOn = toDateInputValue(
      item?.expires_on ??
        item?.expiresOn ??
        item?.expiration_date ??
        item?.expirationDate ??
        item?.expiration,
    );
    return {
      id:
        item?.id ??
        item?.item_id ??
        item?.line_item_id ??
        item?.sku ??
        `${index}-${item?.name ?? item?.description ?? 'item'}`,
      name:
        item?.name ??
        item?.item_name ??
        item?.description ??
        item?.title ??
        `Item ${index + 1}`,
      quantity: item?.quantity ?? item?.qty ?? item?.amount ?? '',
      unit: item?.unit ?? item?.uom ?? item?.unit_of_measure ?? '',
      category: item?.category ?? item?.category_name ?? '',
      confidence: item?.confidence ?? item?.score ?? item?.probability ?? null,
      expiresOn,
      included: true,
      raw: item,
    };
  });

  const meta = {
    vendor:
      data.vendor ??
      data.store_name ??
      data.storeName ??
      data.merchant ??
      data.merchant_name ??
      '',
    purchaseDate: toDateInputValue(
      data.purchase_date ??
        data.purchaseDate ??
        data.transaction_date ??
        data.transactionDate ??
        data.date,
    ),
    total:
      data.total ??
      data.total_amount ??
      data.totalAmount ??
      data.grand_total ??
      data.grandTotal ??
      null,
    currency:
      data.currency ??
      data.currency_code ??
      data.currencyCode ??
      data.iso_currency ??
      '',
    receiptNumber:
      data.receipt_number ?? data.receiptNumber ?? data.transaction_id ?? '',
  };

  const receiptId =
    data.receipt_id ??
    data.receiptId ??
    data.upload_id ??
    data.uploadId ??
    data.id ??
    '';

  return {
    items,
    meta,
    receiptId,
  };
};

const ReceiptUpload = () => {
  const [configState, setConfigState] = useState({
    maxBytes: null,
    allowedTypes: null,
    loading: true,
    error: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [apiError, setApiError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [receiptMeta, setReceiptMeta] = useState(null);
  const [receiptId, setReceiptId] = useState('');
  const [extractedItems, setExtractedItems] = useState([]);
  const [approvalError, setApprovalError] = useState('');
  const [approvalResult, setApprovalResult] = useState(null);
  const [approving, setApproving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        const response = await fetchReceiptUploadConfig();
        const payload = response?.data ?? response ?? {};
        const maxBytes = parseMaxBytes(payload);
        const allowedTypes = parseAllowedTypes(payload);
        if (isMounted) {
          setConfigState({
            maxBytes,
            allowedTypes,
            loading: false,
            error: '',
          });
        }
      } catch (error) {
        if (isMounted) {
          setConfigState((prev) => ({
            ...prev,
            loading: false,
            error: 'Unable to load upload limits. The backend will still validate file size.',
          }));
        }
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const maxSizeLabel = useMemo(() => {
    if (!configState.maxBytes) return null;
    return formatBytes(configState.maxBytes);
  }, [configState.maxBytes]);

  const allowedTypesLabel = useMemo(() => {
    if (!configState.allowedTypes) return 'JPG, PNG, or HEIC recommended';
    if (Array.isArray(configState.allowedTypes)) {
      return configState.allowedTypes.join(', ');
    }
    return String(configState.allowedTypes);
  }, [configState.allowedTypes]);

  const resetReviewState = () => {
    setUploadResult(null);
    setReceiptMeta(null);
    setReceiptId('');
    setExtractedItems([]);
    setApprovalError('');
    setApprovalResult(null);
    setApiError('');
    setFormError('');
  };

  const updateItem = (itemId, updates) => {
    setExtractedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    );
  };

  const handleStartOver = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    resetReviewState();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    resetReviewState();

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (configState.maxBytes && file.size > configState.maxBytes) {
      setFormError(
        `File is too large. Max size is ${formatBytes(configState.maxBytes)}.`,
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    resetReviewState();

    if (!selectedFile) {
      setFormError('Please select a receipt photo before uploading.');
      return;
    }

    if (configState.maxBytes && selectedFile.size > configState.maxBytes) {
      setFormError(
        `File is too large. Max size is ${formatBytes(configState.maxBytes)}.`,
      );
      return;
    }

    setUploading(true);

    try {
      const response = await uploadReceiptPhoto(selectedFile);
      const payload = response?.data ?? response ?? { status: 'Uploaded' };
      const normalized = normalizeUploadResponse(payload);
      setUploadResult(payload);
      setReceiptMeta(normalized.meta);
      setReceiptId(normalized.receiptId);
      setExtractedItems(normalized.items);
    } catch (error) {
      setApiError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (event) => {
    event.preventDefault();
    setApprovalError('');
    setApprovalResult(null);

    const includedItems = extractedItems.filter((item) => item.included);
    if (includedItems.length === 0) {
      setApprovalError('Select at least one item to save.');
      return;
    }

    const missingExpiration = includedItems.filter((item) => !item.expiresOn);
    if (missingExpiration.length > 0) {
      setApprovalError(
        `Add expiration dates for ${missingExpiration.length} item${
          missingExpiration.length === 1 ? '' : 's'
        }.`,
      );
      return;
    }

    setApproving(true);
    try {
      const payload = {
        receiptId: receiptId || undefined,
        items: includedItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          expiresOn: item.expiresOn,
        })),
      };
      const response = await submitReceiptApproval(payload);
      setApprovalResult(response?.data ?? response ?? { status: 'Saved' });
    } catch (error) {
      setApprovalError(getErrorMessage(error));
    } finally {
      setApproving(false);
    }
  };

  const successMessage =
    uploadResult?.message ||
    uploadResult?.detail ||
    uploadResult?.status ||
    'Upload successful. The backend received your receipt photo.';

  const approvalMessage =
    approvalResult?.message ||
    approvalResult?.detail ||
    approvalResult?.status ||
    'Saved! Your expiration dates were sent to the backend.';

  const includedCount = extractedItems.filter((item) => item.included).length;
  const hasReceiptMeta = Boolean(
    receiptMeta &&
      (receiptMeta.vendor ||
        receiptMeta.purchaseDate ||
        receiptMeta.total ||
        receiptMeta.receiptNumber),
  );

  return (
    <div className="min-h-screen bg-brand-green px-6 py-12 text-brand-dark">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Receipt Upload"
          subtitle="Upload a receipt, review the extracted items, and confirm expiration dates before saving."
        >
          <div className="space-y-8">
            <div className="rounded-2xl border border-brand-khaki/60 bg-white/70 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-dark/50">
                    Step 1
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-brand-dark">
                    Upload your receipt
                  </h2>
                  <p className="text-sm text-brand-dark/70">
                    Send a clear receipt photo so we can extract the items.
                  </p>
                </div>
                {uploadResult && (
                  <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-dark">
                    Uploaded
                  </span>
                )}
              </div>

              <form className="mt-5 space-y-5" onSubmit={handleUpload}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-brand-dark">
                    Receipt photo
                  </label>
                  <div className="rounded-2xl border border-dashed border-brand-khaki/70 bg-white/70 p-6 text-center">
                    <input
                      id="receipt-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="receipt-photo"
                      className="mx-auto flex cursor-pointer flex-col items-center gap-3 text-sm text-brand-dark/80"
                    >
                      <span className="text-base font-semibold text-brand-dark">
                        Click to choose a receipt photo
                      </span>
                      <span className="text-xs text-brand-dark/70">
                        {allowedTypesLabel}
                        {maxSizeLabel ? ` - Max ${maxSizeLabel}` : ''}
                      </span>
                    </label>
                  </div>
                  {configState.loading && (
                    <p className="text-xs text-brand-dark/60">
                      Loading backend size limits...
                    </p>
                  )}
                  {configState.error && (
                    <p className="text-xs text-brand-brown">{configState.error}</p>
                  )}
                </div>

                {selectedFile && (
                  <div className="rounded-xl border border-brand-khaki/60 bg-white/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-brand-dark">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-brand-dark/70">
                          {formatBytes(selectedFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        className="bg-transparent border border-brand-brown text-brand-brown hover:bg-brand-brown hover:text-brand-beige"
                        onClick={handleStartOver}
                      >
                        Remove
                      </Button>
                    </div>
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="mt-4 w-full rounded-lg border border-brand-khaki/50 object-cover"
                      />
                    )}
                  </div>
                )}

                {formError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                )}

                {apiError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {apiError}
                  </p>
                )}

                {uploadResult && (
                  <div className="rounded-lg border border-brand-khaki/60 bg-brand-beige/80 px-3 py-2 text-sm text-brand-dark">
                    {successMessage}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="submit"
                    className="w-full rounded-xl py-3 text-base font-semibold"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Send to Backend'}
                  </Button>
                  {uploadResult && (
                    <Button
                      type="button"
                      className="w-full rounded-xl py-3 text-base font-semibold bg-transparent border border-brand-brown text-brand-brown hover:bg-brand-brown hover:text-brand-beige"
                      onClick={handleStartOver}
                    >
                      Start new upload
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {uploadResult && (
              <form className="space-y-6" onSubmit={handleApprove}>
                <div className="rounded-2xl border border-brand-khaki/60 bg-white/70 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-dark/50">
                        Step 2
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-brand-dark">
                        Review extracted items
                      </h3>
                      <p className="text-sm text-brand-dark/70">
                        Confirm the items we found and set an expiration date for
                        each one.
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-semibold text-brand-dark">
                      {includedCount} selected
                    </span>
                  </div>

                  {hasReceiptMeta && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-brand-khaki/50 bg-white px-3 py-2 text-xs text-brand-dark/70">
                        <span className="font-semibold text-brand-dark">
                          Vendor:
                        </span>{' '}
                        {receiptMeta.vendor || 'Not provided'}
                      </div>
                      <div className="rounded-xl border border-brand-khaki/50 bg-white px-3 py-2 text-xs text-brand-dark/70">
                        <span className="font-semibold text-brand-dark">
                          Purchase date:
                        </span>{' '}
                        {receiptMeta.purchaseDate || 'Not provided'}
                      </div>
                      <div className="rounded-xl border border-brand-khaki/50 bg-white px-3 py-2 text-xs text-brand-dark/70">
                        <span className="font-semibold text-brand-dark">
                          Total:
                        </span>{' '}
                        {receiptMeta.total
                          ? formatMoney(receiptMeta.total, receiptMeta.currency)
                          : 'Not provided'}
                      </div>
                      <div className="rounded-xl border border-brand-khaki/50 bg-white px-3 py-2 text-xs text-brand-dark/70">
                        <span className="font-semibold text-brand-dark">
                          Receipt ID:
                        </span>{' '}
                        {receiptId || receiptMeta.receiptNumber || 'Not provided'}
                      </div>
                    </div>
                  )}

                  {extractedItems.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-brand-khaki/50 bg-brand-beige/60 px-4 py-3 text-sm text-brand-dark/80">
                      We did not detect any line items yet. Upload a clearer photo
                      or continue once the backend returns items.
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {extractedItems.map((item) => {
                        const confidenceLabel = formatConfidence(item.confidence);
                        const quantityLabel = `${item.quantity || ''} ${
                          item.unit || ''
                        }`.trim();

                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-brand-khaki/60 bg-white p-4"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-brand-dark">
                                    {item.name}
                                  </span>
                                  {item.category && (
                                    <span className="rounded-full bg-brand-beige px-2 py-0.5 text-xs text-brand-dark/70">
                                      {item.category}
                                    </span>
                                  )}
                                  {confidenceLabel && (
                                    <span className="rounded-full border border-brand-khaki/60 px-2 py-0.5 text-xs text-brand-dark/60">
                                      {confidenceLabel} match
                                    </span>
                                  )}
                                  {!item.included && (
                                    <span className="rounded-full border border-brand-brown/50 bg-brand-brown/10 px-2 py-0.5 text-xs text-brand-brown">
                                      Excluded
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 text-xs text-brand-dark/60">
                                  {quantityLabel || 'Quantity not provided'}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <label className="text-xs font-semibold text-brand-dark/70">
                                  Expiration date
                                </label>
                                <input
                                  type="date"
                                  value={item.expiresOn}
                                  disabled={!item.included}
                                  onChange={(event) =>
                                    updateItem(item.id, {
                                      expiresOn: event.target.value,
                                    })
                                  }
                                  className="h-10 rounded-lg border border-brand-khaki/60 bg-white px-3 text-sm text-brand-dark outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-khaki/40 disabled:bg-brand-beige/50 disabled:text-brand-dark/50"
                                />
                              </div>
                              <Button
                                type="button"
                                className="bg-transparent border border-brand-brown text-brand-brown hover:bg-brand-brown hover:text-brand-beige"
                                onClick={() =>
                                  updateItem(item.id, {
                                    included: !item.included,
                                  })
                                }
                              >
                                {item.included ? 'Remove' : 'Restore'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-brand-khaki/60 bg-white/70 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-brand-dark/50">
                        Step 3
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-brand-dark">
                        Approve and save
                      </h3>
                      <p className="text-sm text-brand-dark/70">
                        We&apos;ll send your confirmations to the backend so the
                        items appear in My Fridge.
                      </p>
                    </div>
                    {approving && (
                      <span className="rounded-full bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-dark">
                        Saving...
                      </span>
                    )}
                  </div>

                  {approvalError && (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {approvalError}
                    </p>
                  )}

                  {approvalResult && (
                    <div className="mt-4 rounded-lg border border-brand-khaki/60 bg-brand-beige/80 px-3 py-2 text-sm text-brand-dark">
                      {approvalMessage}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="mt-4 w-full rounded-xl py-3 text-base font-semibold"
                    disabled={approving || extractedItems.length === 0}
                  >
                    {approving ? 'Saving...' : 'Approve & Save Items'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>

        <div className="rounded-3xl border border-white/20 bg-brand-dark/90 p-8 text-brand-beige shadow-xl">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-khaki/80">
                Receipt Workflow
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase italic text-brand-beige">
                From scan to fridge
              </h2>
            </div>
            <p className="text-sm text-brand-beige/80">
              Upload a clean photo, review what the backend extracted, and set
              expirations so your fridge stays accurate.
            </p>
            <div className="space-y-3">
              <div className="rounded-2xl bg-brand-green/40 p-4 text-sm text-brand-beige/90">
                <p className="text-xs uppercase tracking-[0.3em] text-brand-khaki/80">
                  Step checklist
                </p>
                <div className="mt-3 space-y-2 text-xs text-brand-beige/80">
                  <div>1. Upload the receipt image.</div>
                  <div>2. Confirm each item and add an expiration date.</div>
                  <div>3. Approve to save into your fridge.</div>
                </div>
              </div>
              <div className="rounded-2xl border border-brand-khaki/30 bg-brand-dark/60 p-4 text-xs text-brand-beige/70">
                Upload settings
                <div className="mt-2 space-y-1 text-xs text-brand-beige/80">
                  <div>
                    <span className="font-semibold">Max size:</span>{' '}
                    {maxSizeLabel || 'Server-controlled'}
                  </div>
                  <div>
                    <span className="font-semibold">Accepted:</span>{' '}
                    {allowedTypesLabel}
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-brand-dark/70 p-4 text-xs text-brand-beige/70">
                <p className="font-semibold text-brand-beige">Photo tips</p>
                <div className="mt-2 space-y-1">
                  <div>Capture the full receipt and keep it flat.</div>
                  <div>Make sure dates and line items are sharp.</div>
                  <div>Avoid glare and heavy shadows.</div>
                </div>
              </div>
            </div>
            {uploadResult && (
              <div className="rounded-2xl border border-brand-khaki/30 bg-brand-dark/70 p-4 text-xs text-brand-beige/80">
                Latest upload
                <div className="mt-2 space-y-1">
                  <div>
                    <span className="font-semibold">Items detected:</span>{' '}
                    {extractedItems.length || 'Pending'}
                  </div>
                  <div>
                    <span className="font-semibold">Selected:</span>{' '}
                    {includedCount}
                  </div>
                  <div>
                    <span className="font-semibold">Receipt ID:</span>{' '}
                    {receiptId || receiptMeta?.receiptNumber || 'Pending'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptUpload;
