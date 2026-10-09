"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
};

export default function CustomersPage() {
  const token = useAuth((state) => state.token);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (!token) return;
    api<{ customers: Customer[] }>("/api/admin/customers", { token }).then((data) => setCustomers(data.customers));
  }, [token]);

  return (
    <div>
      <p className="eyebrow">People</p>
      <h1 className="mt-2 font-serif text-4xl">Customers</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/45">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-sand">
                <td className="py-3">{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone || "—"}</td>
                <td>{customer.orderCount}</td>
                <td>{formatDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
