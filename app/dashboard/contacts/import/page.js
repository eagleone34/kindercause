"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import toast from "react-hot-toast";

export default function ImportContactsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: done
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [defaultTags, setDefaultTags] = useState("");
  const [importResults, setImportResults] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast.error("No data found in CSV");
          return;
        }

        setParsedData(results.data);
        setHeaders(results.meta.fields || []);

        // Auto-detect column mapping
        const fields = results.meta.fields || [];
        const autoMapping = { name: "", email: "", phone: "" };

        fields.forEach((field) => {
          const lower = field.toLowerCase();
          if (lower.includes("name") && !autoMapping.name) {
            autoMapping.name = field;
          }
          if (lower.includes("email") && !autoMapping.email) {
            autoMapping.email = field;
          }
          if (lower.includes("phone") && !autoMapping.phone) {
            autoMapping.phone = field;
          }
        });

        setMapping(autoMapping);
        setStep(2);
        toast.success(`Loaded ${results.data.length} rows`);
      },
      error: (error) => {
        toast.error("Failed to parse CSV: " + error.message);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!mapping.email) {
      toast.error("Email column is required");
      return;
    }

    setIsLoading(true);

    try {
      // Transform data based on mapping
      const contacts = parsedData
        .map((row) => ({
          name: row[mapping.name] || row[mapping.email]?.split("@")[0] || "Unknown",
          email: row[mapping.email]?.trim().toLowerCase(),
          phone: row[mapping.phone]?.trim() || null,
          tags: defaultTags
            ? defaultTags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
        }))
        .filter((c) => c.email && isValidEmail(c.email));

      if (contacts.length === 0) {
        toast.error("No valid contacts found");
        return;
      }

      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResults(data);
      setStep(3);
      toast.success(`Imported ${data.imported} contacts!`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const previewContacts = parsedData.slice(0, 5).map((row) => ({
    name: row[mapping.name] || row[mapping.email]?.split("@")[0] || "—",
    email: row[mapping.email] || "—",
    phone: row[mapping.phone] || "—",
  }));

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/contacts" className="btn btn-ghost btn-sm mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Contacts
        </Link>
        <h1 className="text-2xl font-bold">Import Contacts</h1>
        <p className="text-base-content/70">
          Upload a CSV file to import your parent email list
        </p>
      </div>

      {/* Progress Steps */}
      <ul className="steps steps-horizontal w-full mb-8">
        <li className={`step ${step >= 1 ? "step-primary" : ""}`}>Upload</li>
        <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Map Columns</li>
        <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Done</li>
      </ul>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-base-100 rounded-box shadow p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-base-300 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-5xl mb-4">📄</div>
            <p className="font-medium mb-2">
              {isDragActive
                ? "Drop your CSV file here"
                : "Drag & drop your CSV file here"}
            </p>
            <p className="text-sm text-base-content/60 mb-4">
              or click to browse
            </p>
            <button className="btn btn-primary btn-sm">Select File</button>
          </div>

          <div className="mt-6 p-4 bg-base-200 rounded-lg">
            <h3 className="font-medium text-sm mb-2">CSV Format Tips:</h3>
            <ul className="text-sm text-base-content/70 space-y-1">
              <li>• First row should be column headers</li>
              <li>• Include columns: Name, Email, Phone (optional)</li>
              <li>• Works with exports from Google Sheets, Excel, etc.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Map Columns</h2>
            <p className="text-sm text-base-content/70 mb-4">
              Match your CSV columns to contact fields
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Name</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={mapping.name}
                  onChange={(e) =>
                    setMapping({ ...mapping, name: e.target.value })
                  }
                >
                  <option value="">— Select column —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Email <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={mapping.email}
                  onChange={(e) =>
                    setMapping({ ...mapping, email: e.target.value })
                  }
                >
                  <option value="">— Select column —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Phone</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={mapping.phone}
                  onChange={(e) =>
                    setMapping({ ...mapping, phone: e.target.value })
                  }
                >
                  <option value="">— Select column —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text font-medium">Default Tags</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <input
                type="text"
                placeholder="Current Parents, 2024 Import"
                value={defaultTags}
                onChange={(e) => setDefaultTags(e.target.value)}
                className="input input-bordered w-full"
              />
              <label className="label">
                <span className="label-text-alt">
                  Separate multiple tags with commas
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Preview</h2>
            <p className="text-sm text-base-content/70 mb-4">
              Showing first 5 of {parsedData.length} contacts
            </p>

            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {previewContacts.map((contact, i) => (
                    <tr key={i}>
                      <td>{contact.name}</td>
                      <td>{contact.email}</td>
                      <td>{contact.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setStep(1);
                setParsedData([]);
                setHeaders([]);
              }}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={isLoading || !mapping.email}
            >
              {isLoading && <span className="loading loading-spinner loading-sm" />}
              Import {parsedData.length} Contacts
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && importResults && (
        <div className="bg-base-100 rounded-box shadow p-8 text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-success">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-2">Import Complete!</h2>

          <div className="stats shadow my-6">
            <div className="stat">
              <div className="stat-title">Imported</div>
              <div className="stat-value text-success">{importResults.imported}</div>
            </div>
            {importResults.skipped > 0 && (
              <div className="stat">
                <div className="stat-title">Skipped</div>
                <div className="stat-value text-warning">{importResults.skipped}</div>
                <div className="stat-desc">Duplicates or invalid</div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/dashboard/contacts" className="btn btn-primary">
              View Contacts
            </Link>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setStep(1);
                setParsedData([]);
                setHeaders([]);
                setImportResults(null);
              }}
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
