"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ImportContactsPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }

    return rows;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const parsed = parseCSV(text);
        setPreview(parsed.slice(0, 5)); // Preview first 5 rows
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        toast.error("No valid contacts found in file");
        return;
      }

      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to import contacts");
      }

      toast.success(`Imported ${data.imported} contacts!`);
      router.push("/dashboard/contacts");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/contacts"
          className="btn btn-ghost btn-sm mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Contacts
        </Link>
        <h1 className="text-2xl font-bold">Import Contacts</h1>
        <p className="text-base-content/70">
          Upload a CSV or Excel file to import multiple contacts at once
        </p>
      </div>

      <div className="space-y-6">
        {/* File Upload */}
        <div className="bg-base-100 rounded-box shadow p-6">
          <h2 className="font-semibold mb-4">Upload File</h2>

          <div
            className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-4xl mb-2">📄</div>
            {fileName ? (
              <p className="font-medium">{fileName}</p>
            ) : (
              <>
                <p className="font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-base-content/60">CSV or Excel file</p>
              </>
            )}
          </div>

          <div className="mt-4 text-sm text-base-content/60">
            <p className="font-medium mb-2">Expected columns:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><code>Name</code> or <code>First Name</code> + <code>Last Name</code></li>
              <li><code>Email</code> (required)</li>
              <li><code>Phone</code> (optional)</li>
              <li><code>Tags</code> (optional, comma-separated)</li>
            </ul>
          </div>
        </div>

        {/* Preview */}
        {preview && preview.length > 0 && (
          <div className="bg-base-100 rounded-box shadow p-6">
            <h2 className="font-semibold mb-4">Preview (first {preview.length} rows)</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleImport}
            className="btn btn-primary"
            disabled={isLoading || !fileName}
          >
            {isLoading && <span className="loading loading-spinner loading-sm" />}
            {isLoading ? "Importing..." : "Import Contacts"}
          </button>
          <Link href="/dashboard/contacts" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
