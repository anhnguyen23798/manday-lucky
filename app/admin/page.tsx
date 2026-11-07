import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Admin: Vio Manday Lucky",
};

export default function AdminPage() {
  return <AdminApp />;
}
