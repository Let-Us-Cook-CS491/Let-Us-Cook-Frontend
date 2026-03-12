import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fetchFridgeUploadConfig, uploadFridgePhoto } from '../services/fridgeService';

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

  const envBytes = Number.parseInt(import.meta.env.VITE_FRIDGE_UPLOAD_MAX_BYTES, 10);
  if (Number.isFinite(envBytes)) {
    return envBytes;
  }

  const envMb = Number.parseFloat(import.meta.env.VITE_FRIDGE_UPLOAD_MAX_MB);
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

const FridgeUpload = () => {
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        const response = await fetchFridgeUploadConfig();
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFormError('');
    setApiError('');
    setUploadResult(null);

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
    setFormError('');
    setApiError('');
    setUploadResult(null);

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
      const response = await uploadFridgePhoto(selectedFile);
      setUploadResult(response?.data ?? response ?? { status: 'Uploaded' });
    } catch (error) {
      setApiError(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const successMessage =
    uploadResult?.message ||
    uploadResult?.detail ||
    uploadResult?.status ||
    'Upload successful. The backend received your receipt photo.';

  return (
    <div className="min-h-screen bg-brand-green px-6 py-12 text-brand-dark">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card
          title="Upload your receipt"
  subtitle="Send a clear receipt photo so our backend can extract ingredients. File size is validated against the backend limit."
        >
          <form className="space-y-6" onSubmit={handleUpload}>
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
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
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

            <Button
              type="submit"
              className="w-full rounded-xl py-3 text-base font-semibold"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Send to Backend'}
            </Button>
          </form>
        </Card>

        <div className="rounded-3xl border border-white/20 bg-brand-dark/90 p-8 text-brand-beige shadow-xl">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-khaki/80">
                Receipt Scan
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase italic text-brand-beige">
                Make it easy for the model
              </h2>
            </div>
            <p className="text-sm text-brand-beige/80">
              For best results, photograph the receipt in bright lighting with
              minimal glare and the full paper visible. The backend will reject
              files above its size limit and return a message that will appear
              here.
            </p>
            <div className="rounded-2xl bg-brand-green/40 p-4 text-sm text-brand-beige/90">
              <p className="font-semibold text-brand-beige">Tips</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                <li>Capture the entire receipt and keep it flat.</li>
                <li>Make sure the store name, dates, and item lines are sharp.</li>
                <li>Avoid heavy filters or shadows.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-brand-khaki/30 bg-brand-dark/60 p-4 text-xs text-brand-beige/70">
              Upload settings:
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default FridgeUpload;
