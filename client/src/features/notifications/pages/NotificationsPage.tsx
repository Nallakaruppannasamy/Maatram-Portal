import React from 'react'
import { Bell } from 'lucide-react'
import { Card } from '@/components/ui/Card'

export const NotificationsPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Notification Center</h2>
          <p className="text-xs text-[#45464c]">Transactional alerts, approval notifications, and profile reminders.</p>
        </div>
      </div>

      <Card className="text-center py-16 space-y-3 bg-white border border-[#E5E7EB] rounded-2xl">
        <div className="w-12 h-12 bg-amber-50 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto border border-amber-200">
          <Bell className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#111827]">No Unread Notifications</h3>
        <p className="text-xs text-[#76777d] max-w-sm mx-auto">
          You are all caught up! System notifications and approval alerts will appear here.
        </p>
      </Card>
    </div>
  )
}

export default NotificationsPage
