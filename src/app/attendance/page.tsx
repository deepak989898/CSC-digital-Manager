"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { Attendance, LeaveRequest } from "@/types";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { StaffMember } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/Card";
import { Clock, LogIn, LogOut, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { differenceInHours, parseISO } from "date-fns";

export default function AttendancePage() {
  const { profile } = useAuth();
  const { data: attendance, create, update } = useShopCollection<Attendance>("attendance");
  const { data: leaves, create: createLeave } = useShopCollection<LeaveRequest>("leaveRequests");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [leaveModal, setLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ staffId: "", startDate: "", endDate: "", reason: "" });
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!profile?.shopId) return;
    getShopDocuments<StaffMember>("staff", profile.shopId).then(setStaff);
  }, [profile?.shopId]);

  const todayAttendance = attendance.filter((a) => a.date === today);
  const checkedIn = todayAttendance.filter((a) => a.status === "checked_in");

  const handleCheckIn = async (staffMember: StaffMember) => {
    if (!profile) return;
    const existing = todayAttendance.find((a) => a.staffId === staffMember.id && a.status === "checked_in");
    if (existing) { toast.error("Already checked in"); return; }
    await create({
      staffId: staffMember.id, staffName: staffMember.name, date: today,
      checkIn: new Date().toISOString(), status: "checked_in",
      userId: profile.userId, shopId: profile.shopId,
    });
    toast.success(`${staffMember.name} checked in`);
  };

  const handleCheckOut = async (record: Attendance) => {
    const checkOut = new Date().toISOString();
    const hours = record.checkIn ? differenceInHours(parseISO(checkOut), parseISO(record.checkIn)) : 0;
    await update(record.id, { checkOut, status: "checked_out", workingHours: hours });
    toast.success("Checked out");
  };

  const handleLeave = async () => {
    if (!profile || !leaveForm.staffId) return;
    const s = staff.find((st) => st.id === leaveForm.staffId)!;
    await createLeave({ ...leaveForm, staffName: s.name, status: "pending", userId: profile.userId, shopId: profile.shopId });
    toast.success("Leave request submitted");
    setLeaveModal(false);
  };

  return (
    <DashboardLayout title="Staff Attendance">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Checked In Today" value={checkedIn.length} icon={<LogIn className="h-5 w-5" />} color="green" />
          <StatCard title="Total Staff" value={staff.length} icon={<Clock className="h-5 w-5" />} color="blue" />
          <StatCard title="Pending Leaves" value={leaves.filter((l) => l.status === "pending").length} icon={<Calendar className="h-5 w-5" />} color="orange" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setLeaveModal(true)}>Request Leave</Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Quick Check-In">
            <div className="space-y-2">
              {staff.map((s) => {
                const record = todayAttendance.find((a) => a.staffId === s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500 capitalize">{s.role}</p></div>
                    {!record ? (
                      <Button size="sm" onClick={() => handleCheckIn(s)}><LogIn className="h-4 w-4" /> Check In</Button>
                    ) : record.status === "checked_in" ? (
                      <Button size="sm" variant="orange" onClick={() => handleCheckOut(record)}><LogOut className="h-4 w-4" /> Check Out</Button>
                    ) : (
                      <Badge status="completed" label={`${record.workingHours || 0}h`} />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="Today's Attendance">
            {todayAttendance.length === 0 ? <p className="text-sm text-slate-500">No attendance records today</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">Staff</th><th className="text-left py-2">In</th><th className="text-left py-2">Out</th><th className="text-left py-2">Hours</th></tr></thead>
                <tbody>{todayAttendance.map((a) => (
                  <tr key={a.id} className="border-b"><td className="py-2">{a.staffName}</td><td className="py-2">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : "—"}</td><td className="py-2">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : "—"}</td><td className="py-2">{a.workingHours || "—"}</td></tr>
                ))}</tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
      <Modal isOpen={leaveModal} onClose={() => setLeaveModal(false)} title="Leave Request" footer={<><Button variant="outline" onClick={() => setLeaveModal(false)}>Cancel</Button><Button onClick={handleLeave}>Submit</Button></>}>
        <div className="space-y-3">
          <Select label="Staff" value={leaveForm.staffId} onChange={(e) => setLeaveForm({ ...leaveForm, staffId: e.target.value })} options={staff.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select staff" />
          <Input label="Start Date" type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
          <Input label="End Date" type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
          <Textarea label="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={2} />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
