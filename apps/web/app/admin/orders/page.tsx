"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { formatDate, formatInr, orderStatusLabel, paymentStatusLabel } from "@/lib/format";

type Row = {
  orderNumber: string;
  email: string;
  shippingName: string;
  shippingCity: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalPaise: number;
  createdAt: string;
  itemCount: number;
};

export default function AdminOrdersPage() {
  const token = useAuth((state) => state.token);
  const [status, setStatus] = useState("ALL");
  const [orders, setOrders] = useState<Row[]>([]);

  useEffect(() => {
    if (!token) return;
    api<{ orders: Row[] }>(`/api/admin/orders?status=${status}`, { token }).then((data) => setOrders(data.orders));
  }, [token, status]);

  return (
    <div>
      <p className="eyebrow">Fulfilment</p>
      <h1 className="mt-2 font-serif text-4xl">Orders</h1>
      <label className="mt-6 block max-w-xs">
        <span className="label">Status</span>
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All</option>
          {Object.keys(orderStatusLabel).map((key) => (
            <option key={key} value={key}>
              {orderStatusLabel[key]}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-ink/45">
            <tr>
              <th className="py-2">Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.orderNumber} className="border-t border-sand">
                <td className="py-3">
                  <Link href={`/admin/orders/${order.orderNumber}`} className="font-semibold">
                    {order.orderNumber}
                  </Link>
                  <p className="text-ink-soft">{formatDate(order.createdAt)}</p>
                </td>
                <td>
                  {order.shippingName}
                  <p className="text-ink-soft">
                    {order.shippingCity} · {order.itemCount} items
                  </p>
                </td>
                <td>{formatInr(order.totalPaise)}</td>
                <td>{paymentStatusLabel[order.paymentStatus] || order.paymentStatus}</td>
                <td>{orderStatusLabel[order.status] || order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
