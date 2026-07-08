"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { Appointment, Customer, Service, StaffMember } from "@/types";
import { APPOINTMENT_STATUSES, TIME_SLOTS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { addDays, format, startOfWeek, isSameDay, parseISO } from "date-fns";

type ViewMode = "day" | "week" | "month";

export default function AppointmentsPage() {
  const { profile } = useAuth();
  const { data: appointments, loading, create, update } = useShopCollection<Appointment>("appointments");
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [form, setForm] = useState({ customerId: "", serviceName: "", staffId: "", appointmentDate: format(new Date(), "yyyy-MM-dd"), appointmentTime: "09:00", duration: "30", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.shopId) return;
    Promise.all([
      getShopDocuments<Customer>("customers", profile.shopId),
      getShopDocuments<Service>("services", profile.shopId),
      getShopDocuments<StaffMember>("staff", profile.shopId),
    ]).then(([c, s, st]) => { setCustomers(c); setServices(s.filter((sv) => sv.status === "active")); setStaff(st); });
  }, [profile?.shopId]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayAppointments = useMemo(() => {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    return appointments.filter((a) => a.appointmentDate === dateStr);
  }, [appointments, currentDate]);

  const handleSave = async () => {
    if (!profile || !form.customerId) return;
    const customer = customers.find((c) => c.id === form.customerId)!;
    const staffMember = staff.find((s) => s.id === form.staffId);
    setSaving(true);
    try {
      await create({
        customerId: form.customerId,
        customerName: customer.fullName,
        serviceName: form.serviceName,
        staffId: form.staffId || undefined,
        staffName: staffMember?.name,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        duration: Number(form.duration),
        status: "scheduled",
        notes: form.notes,
        userId: profile.userId,
        shopId: profile.shopId,
      });
      toast.success("Appointment booked");
      setModalOpen(false);
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout title="Appointments">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium">{format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          </div>
          <div className="flex gap-2">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <Button key={v} variant={view === v ? "primary" : "outline"} size="sm" onClick={() => setView(v)} className="capitalize">{v}</Button>
            ))}
            <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Book</Button>
          </div>
        </div>

        {view === "week" && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayApts = appointments.filter((a) => a.appointmentDate === dateStr);
              const isToday = isSameDay(day, new Date());
              return (
                <Card key={dateStr} className={isToday ? "ring-2 ring-brand-blue" : ""}>
                  <div className="text-center mb-2">
                    <p className="text-xs text-slate-500">{format(day, "EEE")}</p>
                    <p className={`text-lg font-bold ${isToday ? "text-brand-blue" : ""}`}>{format(day, "d")}</p>
                  </div>
                  <div className="space-y-1">
                    {dayApts.map((a) => (
                      <div key={a.id} className="text-xs p-1.5 bg-brand-blue/10 rounded text-brand-blue truncate" title={`${a.customerName} - ${a.serviceName}`}>
                        {a.appointmentTime} {a.customerName}
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {view === "day" && (
          <Card title={format(currentDate, "EEEE, MMM d, yyyy")}>
            {dayAppointments.length === 0 ? <p className="text-sm text-slate-500">No appointments today</p> : (
              <div className="space-y-2">{dayAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div><p className="font-medium">{a.customerName}</p><p className="text-sm text-slate-500">{a.serviceName} · {a.appointmentTime}</p></div>
                  <Badge status={a.status === "completed" ? "completed" : "submitted"} label={a.status} />
                </div>
              ))}</div>
            )}
          </Card>
        )}

        {view === "month" && (
          <Card title="All Appointments">
            {appointments.length === 0 ? <EmptyState title="No appointments" onAction={() => setModalOpen(true)} actionLabel="Book Appointment" /> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Date</th><th className="text-left py-2">Time</th><th className="text-left py-2">Customer</th><th className="text-left py-2">Service</th><th className="text-left py-2">Staff</th><th className="text-left py-2">Status</th></tr></thead>
                <tbody>{appointments.map((a) => (
                  <tr key={a.id} className="border-b"><td className="py-2">{formatDate(a.appointmentDate)}</td><td className="py-2">{a.appointmentTime}</td><td className="py-2">{a.customerName}</td><td className="py-2">{a.serviceName}</td><td className="py-2">{a.staffName || "—"}</td><td className="py-2"><Badge status={a.status === "completed" ? "completed" : "submitted"} label={a.status} /></td></tr>
                ))}</tbody>
              </table>
            )}
          </Card>
        )}
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Book Appointment" footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Book</Button></>}>
        <div className="space-y-3">
          <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} options={customers.map((c) => ({ value: c.id, label: c.fullName }))} placeholder="Select customer" required />
          <Select label="Service" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} options={services.map((s) => ({ value: s.name, label: s.name }))} placeholder="Select service" />
          <Select label="Staff" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} options={staff.map((s) => ({ value: s.id, label: s.name }))} placeholder="Assign staff" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} />
            <Select label="Time" value={form.appointmentTime} onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })} options={TIME_SLOTS} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
