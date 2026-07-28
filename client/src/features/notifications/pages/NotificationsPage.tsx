import React from 'react'
import { Bell, CheckCircle2, Clock, Info, ShieldAlert } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const NotificationsPage = () => {
  const notifications = [
    {
      id: 1,
      title: 'Volunteer Log Approved!',
      message: 'Your submission "Blood Donation Drive Coordination" (6.0 hrs) has been approved by Dr. Ramesh Kumar.',
      time: '2 hours ago',
      type: 'approved',
      unread: true,
    },
    {
      id: 2,
      title: 'Resume Completion Reminder',
      message: 'Your portfolio is 85% complete. Add your latest project to reach 100% resume readiness.',
      time: '1 day ago',
      type: 'info',
      unread: false,
    },
    {
      id: 3,
      title: 'New Volunteer Submission Pending Review',
      message: 'Your log "Community Cleanliness Drive" (4.0 hrs) was received and is pending zone review.',
      time: '3 days ago',
      type: 'pending',
      unread: false,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Notification Center</h2>
          <p className="text-xs text-[#45464c]">Transactional alerts, approval notifications, and profile reminders.</p>
        </div>
        <Button variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <Card key={n.id} className={`p-6 transition-all ${n.unread ? 'border-l-4 border-l-[#D4AF37] bg-white' : 'bg-[#FCF8FA]'}`}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FCF8FA] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                {n.type === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : n.type === 'pending' ? (
                  <Clock className="w-5 h-5 text-amber-600" />
                ) : (
                  <Info className="w-5 h-5 text-[#D4AF37]" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#111827]">{n.title}</h4>
                  <span className="text-[10px] text-[#76777d]">{n.time}</span>
                </div>
                <p className="text-xs text-[#45464c] leading-relaxed">{n.message}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
