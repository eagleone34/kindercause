"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (data.contacts) {
        setContacts(data.contacts);
        // Extract unique tags
        const tags = new Set();
        data.contacts.forEach((c) => c.tags?.forEach((t) => tags.add(t)));
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || contact.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContacts(contacts.filter((c) => c.id !== id));
        toast.success("Contact deleted");
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete contact");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-base-content/70">
            Manage your parent and donor email list
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/contacts/import" className="btn btn-outline">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Import CSV
          </Link>
          <Link href="/dashboard/contacts/new" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Contact
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="form-control flex-1">
          <label className="input input-bordered flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-base-content/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grow"
            />
          </label>
        </div>
        <select
          className="select select-bordered w-full sm:w-48"
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="stats shadow bg-base-100 w-full">
        <div className="stat">
          <div className="stat-title">Total Contacts</div>
          <div className="stat-value text-primary">{contacts.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">With Email</div>
          <div className="stat-value text-secondary">
            {contacts.filter((c) => c.email).length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Tags Used</div>
          <div className="stat-value text-accent">{allTags.length}</div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-base-100 rounded-box shadow overflow-x-auto">
        {isLoading ? (
          <div className="p-12 text-center">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="font-semibold mb-2">
              {contacts.length === 0 ? "No contacts yet" : "No matches found"}
            </h3>
            <p className="text-base-content/60 mb-4">
              {contacts.length === 0
                ? "Import a CSV or add contacts manually"
                : "Try adjusting your search or filters"}
            </p>
            {contacts.length === 0 && (
              <Link href="/dashboard/contacts/import" className="btn btn-primary btn-sm">
                Import Contacts
              </Link>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tags</th>
                <th>Total Donated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover">
                  <td className="font-medium">{contact.name}</td>
                  <td>
                    <a
                      href={`mailto:${contact.email}`}
                      className="link link-primary"
                    >
                      {contact.email}
                    </a>
                  </td>
                  <td className="text-base-content/70">
                    {contact.phone || "—"}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags?.map((tag) => (
                        <span key={tag} className="badge badge-sm badge-outline">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {contact.total_donated > 0 ? (
                      <span className="text-success font-medium">
                        ${contact.total_donated.toLocaleString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                        </svg>
                      </div>
                      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-10">
                        <li>
                          <Link href={`/dashboard/contacts/${contact.id}`}>
                            Edit
                          </Link>
                        </li>
                        <li>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="text-error"
                          >
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Export Button */}
      {contacts.length > 0 && (
        <div className="flex justify-end">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              // Export to CSV
              const csv = [
                ["Name", "Email", "Phone", "Tags", "Total Donated"],
                ...contacts.map((c) => [
                  c.name,
                  c.email,
                  c.phone || "",
                  c.tags?.join("; ") || "",
                  c.total_donated || 0,
                ]),
              ]
                .map((row) => row.join(","))
                .join("\n");

              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "contacts.csv";
              a.click();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      )}
    </div>
  );
}
