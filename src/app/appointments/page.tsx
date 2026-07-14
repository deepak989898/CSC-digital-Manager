"use client";

import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { Appointment, Customer, Service, StaffMember } from "@/types";
import { TIME_SLOTS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Clock, User, Briefcase, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";

type ViewMode = "day" | "week" | "month";

export default function SchedulePage() {
  const { profile } = useAuth();
  const { data: appointments, create } = useShopCollection<Appointment>("appointments");
  const [view, setView] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [form, setForm] = useState({
    customerId: "",
    serviceName: "",
    staffId: "",
    appointmentDate: format(new Date(), "yyyy-MM-dd"),
    appointmentTime: "09:00",
    duration: "30",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.shopId) return;
    Promise.all([
      getShopDocuments<Customer>("customers", profile.shopId),
      getShopDocuments<Service>("services", profile.shopId),
      getShopDocuments<StaffMember>("staff", profile.shopId),
    ]).then(([c, s, st]) => {
      setCustomers(c);
      setServices(s.filter((sv) => sv.status === "active"));
      setStaff(st);
    });
  }, [profile?.shopId]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selectedDayAppointments = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return appointments
      .filter((a) => a.appointmentDate === dateStr)
      .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
  }, [appointments, selectedDate]);

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    setView("week");
    setForm((f) => ({ ...f, appointmentDate: format(day, "yyyy-MM-dd") }));
  };

  const openBookForSelected = () => {
    setForm((f) => ({ ...f, appointmentDate: format(selectedDate, "yyyy-MM-dd") }));
    setModalOpen(true);
  };

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
      toast.success("Scheduled successfully");
      setSelectedDate(new Date(`${form.appointmentDate}T12:00:00`));
      setModalOpen(false);
    } catch {
      toast.error("Failed to book");
    } finally {
      setSaving(false);
    }
  };

  const shiftWeek = (dir: -1 | 1) => {
    setCurrentDate(addDays(currentDate, dir * 7));
  };

  return (
    <DashboardLayout title="Schedule">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => shiftWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <Button variant="ghost" size="sm" onClick={() => shiftWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDate(today);
              }}
            >
              Today
            </Button>
          </div>
          <div className="flex gap-2">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <Button
                key={v}
                variant={view === v ? "primary" : "outline"}
                size="sm"
                onClick={() => setView(v)}
                className="capitalize"
              >
                {v}
              </Button>
            ))}
            <Button onClick={openBookForSelected}>
              <Plus className="h-4 w-4" /> Book
            </Button>
          </div>
        </div>

        {view === "week" && (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayApts = appointments.filter((a) => a.appointmentDate === dateStr);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className="text-left w-full"
                >
                  <Card
                    className={
                      isSelected
                        ? "ring-2 ring-brand-blue bg-blue-50/40 dark:bg-blue-950/20"
                        : isToday
                          ? "ring-1 ring-brand-blue/40"
                          : "hover:border-brand-blue/40"
                    }
                  >
                    <div className="text-center mb-2">
                      <p className="text-xs text-slate-500">{format(day, "EEE")}</p>
                      <p className={`text-lg font-bold ${isSelected || isToday ? "text-brand-blue" : ""}`}>
                        {format(day, "d")}
                      </p>
                      {dayApts.length > 0 && (
                        <p className="text-[10px] text-slate-500">{dayApts.length} item{dayApts.length !== 1 ? "s" : ""}</p>
                      )}
                    </div>
                    <div className="space-y-1 min-h-[2.5rem]">
                      {dayApts.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          className="text-xs p-1.5 bg-brand-blue/10 rounded text-brand-blue truncate"
                          title={`${a.appointmentTime} ${a.customerName} - ${a.serviceName}`}
                        >
                          {a.appointmentTime} {a.customerName}
                        </div>
                      ))}
                      {dayApts.length > 3 && (
                        <p className="text-[10px] text-center text-slate-500">+{dayApts.length - 3} more</p>
                      )}
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {(view === "week" || view === "day") && (
          <Card
            title={`Schedule — ${format(selectedDate, "EEEE, MMM d, yyyy")}`}
            action={
              <Button size="sm" variant="outline" onClick={openBookForSelected}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            }
          >
            {selectedDayAppointments.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500 mb-3">No schedule for this day</p>
                <Button size="sm" onClick={openBookForSelected}>
                  <Plus className="h-4 w-4" /> Book for this day
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayAppointments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{a.customerName}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {a.serviceName || "Service not set"}
                        </p>
                      </div>
                      <Badge
                        status={a.status === "completed" ? "completed" : a.status === "cancelled" ? "rejected" : "submitted"}
                        label={a.status}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {a.appointmentTime}
                        {a.duration ? ` · ${a.duration} min` : ""}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {a.staffName || "No staff assigned"}
                      </p>
                      <p className="text-slate-500">{formatDate(a.appointmentDate)}</p>
                    </div>
                    {a.notes ? (
                      <p className="text-xs text-slate-500 flex items-start gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                        <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {a.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {view === "month" && (
          <Card title="All Schedule">
            {appointments.length === 0 ? (
              <EmptyState title="No schedule yet" onAction={() => setModalOpen(true)} actionLabel="Book Schedule" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Time</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Service</th>
                      <th className="text-left py-2">Staff</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        onClick={() => {
                          const d = new Date(`${a.appointmentDate}T12:00:00`);
                          setSelectedDate(d);
                          setCurrentDate(d);
                          setView("week");
                        }}
                      >
                        <td className="py-2">{formatDate(a.appointmentDate)}</td>
                        <td className="py-2">{a.appointmentTime}</td>
                        <td className="py-2">{a.customerName}</td>
                        <td className="py-2">{a.serviceName}</td>
                        <td className="py-2">{a.staffName || "—"}</td>
                        <td className="py-2">
                          <Badge
                            status={a.status === "completed" ? "completed" : "submitted"}
                            label={a.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Book Schedule"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Book
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Customer"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            options={customers.map((c) => ({ value: c.id, label: c.fullName }))}
            placeholder="Select customer"
            required
          />
          <Select
            label="Service"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
            options={services.map((s) => ({ value: s.name, label: s.name }))}
            placeholder="Select service"
          />
          <Select
            label="Staff"
            value={form.staffId}
            onChange={(e) => setForm({ ...form, staffId: e.target.value })}
            options={staff.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Assign staff"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={form.appointmentDate}
              onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
            />
            <Select
              label="Time"
              value={form.appointmentTime}
              onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
              options={TIME_SLOTS}
            />
          </div>
          <Input
            label="Duration (minutes)"
            type="number"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes"
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
