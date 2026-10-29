
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import Auth from './pages/Auth'
import { supabase } from './lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight,
  Bell, CalendarDays, ChevronDown, CircleHelp,
  Clock3, CreditCard, Dumbbell, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck,
  Users, Wallet, X, ScanLine, UserRoundPlus, CheckCircle2, Receipt, Printer, QrCode, Mail,
  Pencil, Save, Building2, MapPin,
} from 'lucide-react'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Members', icon: Users },
  { label: 'Memberships', icon: CreditCard },
  { label: 'Payments', icon: Wallet },
  { label: 'Attendance', icon: ScanLine },
]

const secondaryNavigation = [
  { label: 'Settings', icon: Settings },
  { label: 'Help & support', icon: CircleHelp },
]


const pageDescriptions = {
  Overview: 'Here is what is happening at your gym today.',
  Members: 'Manage your registered gym members.',
  Memberships: 'Review plans, active periods and renewals.',
  Payments: 'Review payment records and confirmations.',
  Attendance: 'Scan member cards, verify active memberships, and review check-in history.',
  Settings: 'Manage your gym profile and preferences.',
  'Help & support': 'Find help with your GymAccess workspace.',
}


function StatCard({
  title,
  value,
  change,
  icon: Icon,
  tone,
  direction = 'up',
  comparison = 'vs. last month',
}) {
  const TrendIcon = direction === 'down' ? ArrowDownRight : ArrowUpRight

  const trendStyle =
    direction === 'down'
      ? 'bg-rose-50 text-rose-700'
      : direction === 'none'
        ? 'bg-gray-100 text-gray-600'
        : 'bg-emerald-50 text-emerald-700'

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-900/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${trendStyle}`}>
          {direction !== 'none' && <TrendIcon size={13} />}
          {change}
        </span>
        <span className="text-gray-400">{comparison}</span>
      </div>
    </div>
  )
}


function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    'Pending payment': 'bg-amber-50 text-amber-700 ring-amber-600/20',
    'Not subscribed': 'bg-sky-50 text-sky-700 ring-sky-600/20',
    'Expiring soon': 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Expired: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    Suspended: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    Inactive: 'bg-gray-100 text-gray-600 ring-gray-500/20',
    Cancelled: 'bg-gray-100 text-gray-600 ring-gray-500/20',
    Cancelled: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  }
  const className = styles[status] || styles['Not subscribed']
  const dotClass = status === 'Active' || status === 'Confirmed' ? 'bg-emerald-500'
    : status === 'Expired' || status === 'Suspended' || status === 'Rejected' ? 'bg-rose-500'
    : status === 'Pending payment' || status === 'Expiring soon' ? 'bg-amber-500'
    : 'bg-gray-400'

  return (
    <span className={`inline-flex whitespace-nowrap items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  )
}

function Sidebar({ activePage, onNavigate, mobileOpen, onClose, onLogout, userName, userEmail, gymName }) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[258px] flex-col bg-[#15251f] text-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[82px] items-center justify-between border-b border-white/10 px-6">
          <button onClick={() => onNavigate('Overview')} className="flex items-center gap-3 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-[#15251f]">
              <Dumbbell size={23} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">GymAccess</span>
              <span className="block text-[11px] text-gray-400">MEMBERSHIP MANAGEMENT</span>
            </span>
          </button>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 lg:hidden" aria-label="Close menu">
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pt-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Workspace</p>
          <button className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
              <Dumbbell size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{gymName || 'Your Gym'}</span>
              <span className="block text-xs text-gray-400">Gym owner workspace</span>
            </span>
            <ChevronDown size={15} className="text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Management</p>
          <div className="space-y-1">
            {navigation.map(({ label, icon: Icon, count }) => {
              const active = activePage === label
              return (
                <button
                  key={label}
                  onClick={() => { onNavigate(label); onClose() }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? 'bg-emerald-400 font-semibold text-[#14241d]' : 'text-gray-300 hover:bg-white/[0.07] hover:text-white'}`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left">{label}</span>
                  {count && <span className={`rounded-md px-2 py-0.5 text-xs ${active ? 'bg-black/10' : 'bg-white/10 text-gray-300'}`}>{count}</span>}
                </button>
              )
            })}
          </div>

          <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Preferences</p>
          <div className="space-y-1">
            {secondaryNavigation.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => { onNavigate(label); onClose() }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${activePage === label ? 'bg-emerald-400 font-semibold text-[#14241d]' : 'text-gray-300 hover:bg-white/[0.07] hover:text-white'}`}>
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck size={18} />
            <span className="text-sm font-semibold">Your gym, organized.</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-400">Manage memberships and keep every visit accounted for.</p>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-700 text-sm font-semibold">
              {(userName || 'Gym Owner').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{userName || 'Gym Owner'}</span>
              <span className="block truncate text-xs text-gray-400">{userEmail || 'Owner account'}</span>
            </span>
            <button type="button" onClick={onLogout} title="Sign out" aria-label="Sign out" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function Overview({
  search,
  onSearch,
  onAddMember,
  onNavigate,
  dashboard,
  apiError,
  memberRecords,
  membersLoading,
  onViewCard,
}) {
  const filteredMembers = memberRecords.filter(member =>
    `${member.name} ${member.email || ''} ${member.phone || ''} ${member.memberNumber || ''} ${member.plan} ${member.status}`
      .toLowerCase().includes(search.toLowerCase())
  )
  const totalMembers = dashboard?.total_members || 0
  const activeMemberships = dashboard?.active_memberships || 0
  const expiringSoon = dashboard?.expiring_soon || 0
  const expiredMemberships = dashboard?.expired_memberships || 0
  const percent = totalMembers ? Math.round((activeMemberships / totalMembers) * 100) : 0

  return (
    <>
      <div className="mb-7 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard title="Total members" value={dashboard ? totalMembers.toLocaleString() : '—'} change={apiError ? 'Error' : dashboard ? 'Live' : 'Loading'} comparison="Registered members" direction="none" icon={Users} tone="bg-emerald-50 text-emerald-700" />
        <StatCard title="Active memberships" value={dashboard ? activeMemberships.toLocaleString() : '—'} change={dashboard ? 'Live' : 'Loading'} comparison="Payment confirmed" direction="none" icon={ShieldCheck} tone="bg-sky-50 text-sky-700" />
        <StatCard title="Today's check-ins" value={dashboard ? dashboard.today_check_ins.toLocaleString() : '—'} change={dashboard ? 'Live' : 'Loading'} comparison="Attendance records" direction="none" icon={Activity} tone="bg-violet-50 text-violet-700" />
        <StatCard title="Expiring soon" value={dashboard ? expiringSoon.toLocaleString() : '—'} change={dashboard ? 'Next 7 days' : 'Loading'} comparison="Active memberships" direction="none" icon={Clock3} tone="bg-amber-50 text-amber-700" />
      </div>

      <div className="mb-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-900/[0.02] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">Membership overview</h2>
              <p className="mt-1 text-sm text-gray-500">Live totals from your gym's records.</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600"><CalendarDays size={14} /> Current status</span>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50/80 p-3 sm:p-4">
              <div className="mb-3 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-2xl font-semibold text-gray-900">{activeMemberships}</p>
              <p className="mt-1 text-xs text-gray-500">Active</p>
              <p className="mt-2 text-xs font-medium text-emerald-700">{percent}% of members</p>
            </div>
            <div className="rounded-xl bg-amber-50/80 p-3 sm:p-4">
              <div className="mb-3 h-1.5 rounded-full bg-amber-400" />
              <p className="text-2xl font-semibold text-gray-900">{expiringSoon}</p>
              <p className="mt-1 text-xs text-gray-500">Expiring soon</p>
              <p className="mt-2 text-xs font-medium text-amber-700">Next 7 days</p>
            </div>
            <div className="rounded-xl bg-rose-50/80 p-3 sm:p-4">
              <div className="mb-3 h-1.5 rounded-full bg-rose-400" />
              <p className="text-2xl font-semibold text-gray-900">{expiredMemberships}</p>
              <p className="mt-1 text-xs text-gray-500">Expired</p>
              <p className="mt-2 text-xs font-medium text-rose-700">Needs renewal</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">Pending payment memberships are not active.</p>
            <button onClick={() => onNavigate('Memberships')} className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">View memberships <ArrowRight size={15} /></button>
          </div>
        </section>

        <section className="rounded-2xl bg-[#15251f] p-5 text-white shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><ScanLine size={21} /></span>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">Access control</span>
          </div>
          <h2 className="mt-5 text-xl font-semibold">Ready for the next check-in?</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-400">Scan QR cards, verify live membership status, and record eligible visits from the Attendance page.</p>
          <button onClick={() => onNavigate('Attendance')} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#15251f] transition hover:bg-emerald-300"><ScanLine size={18} /> Open attendance</button>
          <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-gray-400"><ShieldCheck size={15} className="text-emerald-300" /> Membership status checked before entry</div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-900/[0.02]">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-semibold text-gray-900">Registered members</h2>
            <p className="mt-1 text-sm text-gray-500">Member records saved in your gym database.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-emerald-500"><Search size={16} className="text-gray-400" /><input value={search} onChange={onSearch} placeholder="Search members..." className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-40" /></label>
            <button onClick={onAddMember} className="flex items-center justify-center gap-2 rounded-xl bg-[#15251f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243c31]"><Plus size={17} /> Add member</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-gray-50/80 text-xs font-medium text-gray-500"><tr><th className="px-6 py-3.5">Member</th><th className="px-4 py-3.5">Membership</th><th className="px-4 py-3.5">Expires</th><th className="px-4 py-3.5">Status</th><th className="px-6 py-3.5 text-right">Digital card</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {membersLoading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">Loading members…</td></tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id} className="transition hover:bg-gray-50/70">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${member.color}`}>{member.initials}</span><span><span className="block text-sm font-medium text-gray-900">{member.name}</span><span className="mt-0.5 block text-xs text-gray-500">{member.email || member.phone || 'No contact details'}</span></span></div></td>
                  <td className="px-4 py-4 text-sm text-gray-600">{member.plan}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{member.expires}</td>
                  <td className="px-4 py-4"><StatusBadge status={member.status} /></td>
                  <td className="px-6 py-4 text-right"><button type="button" onClick={() => onViewCard(member)} disabled={!member.qrToken} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"><QrCode size={14} /> View card</button></td>
                </tr>
              ))}
              {!membersLoading && filteredMembers.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">{search ? 'No members match your search.' : 'No members registered yet. Select “Add member” to register your first member.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-gray-500">Showing {filteredMembers.length} of {memberRecords.length} saved members</p><button onClick={() => onNavigate('Members')} className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900">Manage members <ArrowRight size={15} /></button></div>
      </section>
    </>
  )
}

function MembersPage({ members, loading, search, onSearch, onAddMember, onViewCard }) {
  const filtered = members.filter(member =>
    `${member.name} ${member.memberNumber} ${member.email || ''} ${member.phone || ''} ${member.plan} ${member.status}`
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="font-semibold text-gray-900">Member directory</h2>
          <p className="mt-1 text-sm text-gray-500">Saved members for your gym, with printable digital membership cards.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-emerald-500">
            <Search size={16} className="text-gray-400" />
            <input value={search} onChange={onSearch} placeholder="Search members..." className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400 sm:w-48" />
          </label>
          <button type="button" onClick={onAddMember} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15251f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243c31]"><Plus size={16} /> Register member</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-gray-50/80 text-xs font-medium text-gray-500"><tr><th className="px-5 py-3.5">Member</th><th className="px-4 py-3.5">Member number</th><th className="px-4 py-3.5">Membership</th><th className="px-4 py-3.5">Expires</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Card</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">Loading members…</td></tr> : filtered.map(member => (
              <tr key={member.id} className="hover:bg-gray-50/70">
                <td className="px-5 py-4"><p className="text-sm font-medium text-gray-900">{member.name}</p><p className="mt-0.5 text-xs text-gray-500">{member.email || member.phone || 'No contact details'}</p></td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.memberNumber}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{member.plan}</td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{member.expires}</td>
                <td className="px-4 py-4"><StatusBadge status={member.status} /></td>
                <td className="px-5 py-4 text-right"><button type="button" onClick={() => onViewCard(member)} disabled={!member.qrToken} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"><QrCode size={14} /> View card</button></td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">{search ? 'No members match your search.' : 'No members registered yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">Showing {filtered.length} of {members.length} saved members. QR cards identify a member; entry eligibility must be checked against the live membership record.</div>
    </section>
  )
}

function MemberCardModal({ member, gymName, onClose }) {
  if (!member) return null

  function printCard() {
    window.print()
  }

  return (
    <div className="gymaccess-print-overlay fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-3 sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <style>{`
        @media print {
          @page { size: A5 portrait; margin: 10mm; }
          body * { visibility: hidden !important; }
          .gymaccess-print-overlay, .gymaccess-print-overlay * { visibility: visible !important; }
          .gymaccess-print-overlay { position: fixed !important; inset: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }
          .gymaccess-card-dialog { max-height: none !important; overflow: visible !important; padding: 0 !important; box-shadow: none !important; }
          .gymaccess-print-root { width: 90mm !important; max-width: 90mm !important; margin: 0 auto !important; box-shadow: none !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid !important; }
          .gymaccess-no-print { display: none !important; }
        }
      `}</style>
      <div className="gymaccess-card-dialog my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-7">
        <div className="gymaccess-no-print mb-4 flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-gray-900">Digital membership card</h2><p className="mt-1 text-sm text-gray-500">Print this card or save it as a PDF.</p></div>
          <button type="button" onClick={onClose} aria-label="Close membership card" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={19} /></button>
        </div>

        <div className="gymaccess-print-root mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 bg-[#15251f] p-5 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-[#15251f]"><Dumbbell size={23} /></span>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.17em] text-emerald-300">GymAccess member</p><p className="mt-1 truncate text-lg font-bold">{gymName || 'Your Gym'}</p></div>
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-wide text-gray-500">Member name</p><h3 className="mt-1 break-words text-xl font-bold text-gray-900">{member.name}</h3><p className="mt-2 text-sm font-semibold text-emerald-800">{member.memberNumber}</p></div>
              <div className="shrink-0 rounded-lg border border-gray-100 bg-white p-2"><QRCodeSVG value={member.qrToken} size={128} level="H" includeMargin /></div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <div><p className="text-xs text-gray-500">Membership</p><p className="mt-1 text-sm font-semibold text-gray-900">{member.plan || 'Membership'}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><p className={`mt-1 text-sm font-semibold ${member.status === 'Active' || member.status === 'Expiring soon' ? 'text-emerald-700' : member.status === 'Pending payment' ? 'text-amber-700' : 'text-rose-700'}`}>{member.status}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-500">Valid through</p><p className="mt-1 text-sm font-semibold text-gray-900">{member.expires && member.expires !== 'After payment confirmation' ? member.expires : member.status === 'Pending payment' ? 'Starts after payment confirmation' : member.expires || 'Not set'}</p></div>
            </div>
            <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-center text-[11px] leading-4 text-gray-500">Present this QR code at reception for membership verification. Entry is subject to live membership status and expiry.</div>
          </div>
        </div>
        <div className="gymaccess-no-print mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
          <button type="button" onClick={printCard} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243c31]"><Printer size={16} /> Print card</button>
        </div>
        <p className="gymaccess-no-print mt-3 text-xs leading-5 text-gray-500">The QR code contains only a random member token, not the member’s name, phone number, or email. Staff can scan it on the Attendance page to verify the live membership and record eligible visits.</p>
      </div>
    </div>
  )
}

function AttendancePage({ attendanceRecords, onRefresh }) {
  const scannerRef = useRef(null)
  const processingRef = useRef(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraMessage, setCameraMessage] = useState('Use the camera to scan the QR code on a member card.')
  const [cameraError, setCameraError] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [processing, setProcessing] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [actionError, setActionError] = useState('')

  async function stopCamera() {
    const scanner = scannerRef.current
    scannerRef.current = null
    setCameraActive(false)
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
    } catch {
      // The camera may already have stopped because a QR code was decoded.
    }
    try {
      await scanner.clear()
    } catch {
      // Clear can fail if the scanner DOM was already removed during navigation.
    }
  }

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      scannerRef.current = null
      if (!scanner) return
      const clearScanner = () => {
        try { scanner.clear() } catch { /* The component is unmounting. */ }
      }
      if (scanner.isScanning) scanner.stop().then(clearScanner).catch(clearScanner)
      else clearScanner()
    }
  }, [])

  async function processToken(rawToken, method = 'qr') {
    const token = String(rawToken || '').trim()
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    setActionError('')
    setScanResult(null)

    if (!uuidPattern.test(token)) {
      setActionError('This does not look like a GymAccess QR token. Scan the QR code printed on a GymAccess membership card.')
      return
    }

    setProcessing(true)
    try {
      const { data, error } = await supabase.rpc('gymaccess_check_in', {
        p_qr_token: token,
        p_check_in_method: method,
      })
      if (error) throw error
      setScanResult(data)
      if (data?.checked_in) {
        setCameraMessage('Member verified and check-in recorded. You can scan the next member.')
        setManualToken('')
        onRefresh?.()
      } else if (data?.allowed && data?.already_checked_in) {
        setCameraMessage('This member was checked in recently; no duplicate record was created.')
      } else {
        setCameraMessage('Entry was not approved. Review the reason below.')
      }
    } catch (error) {
      setActionError(error.message || 'Could not verify this QR code. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  async function startCamera() {
    setCameraError('')
    setActionError('')
    setScanResult(null)
    if (scannerRef.current) return

    const readerElement = document.getElementById('gymaccess-qr-reader')
    if (!readerElement) {
      setCameraError('The camera scanner could not initialise. Refresh the page and try again.')
      return
    }

    const scanner = new Html5Qrcode('gymaccess-qr-reader', {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    })
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 },
        async (decodedText) => {
          if (processingRef.current) return
          processingRef.current = true
          await stopCamera()
          await processToken(decodedText, 'qr')
          processingRef.current = false
        },
        () => {
          // A frame without a QR code is normal while the camera is running.
        },
      )
      setCameraActive(true)
      setCameraMessage('Camera is active. Hold the member QR code steady inside the scan box.')
    } catch (error) {
      scannerRef.current = null
      try { await scanner.clear() } catch { /* Scanner may not have started. */ }
      setCameraActive(false)
      setCameraError(`Could not start the camera. Allow camera access in your browser and try again. ${error?.message || ''}`.trim())
    }
  }

  const resultTone = scanResult?.checked_in
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : scanResult?.allowed
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-rose-200 bg-rose-50 text-rose-900'

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ScanLine size={22} /></span>
            <div><h2 className="font-semibold text-gray-900">Scan member QR card</h2><p className="mt-1 text-sm leading-6 text-gray-500">GymAccess checks the live membership dates and member status before it records entry.</p></div>
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
            <div className="relative min-h-40 overflow-hidden rounded-lg">
              <div id="gymaccess-qr-reader" className="min-h-40 w-full overflow-hidden rounded-lg" />
              {!cameraActive && (
                <div className="absolute inset-0 flex min-h-40 flex-col items-center justify-center bg-gray-50 px-3 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm"><ScanLine size={28} /></span>
                  <p className="mt-3 text-sm font-medium text-gray-700">Camera scanner is stopped</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-gray-500">Start the camera and point it at the QR code on the member's digital or printed card.</p>
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-500">{cameraMessage}</p>
          {cameraError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800">{cameraError}</p>}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {!cameraActive
              ? <button type="button" onClick={startCamera} disabled={processing} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243c31] disabled:opacity-60"><ScanLine size={17} /> Start camera scanner</button>
              : <button type="button" onClick={stopCamera} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"><X size={17} /> Stop scanner</button>}
            <button type="button" onClick={() => { setScanResult(null); setActionError(''); setCameraError(''); setCameraMessage('Use the camera to scan the QR code on a member card.') }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"><ArrowRight size={16} /> Clear result</button>
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-400">Camera access works on localhost during development and on secure HTTPS pages after deployment. If the camera is unavailable on this computer, use the manual token field.</p>
        </section>

        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><QrCode size={22} /></span>
            <div><h2 className="font-semibold text-gray-900">Manual QR token entry</h2><p className="mt-1 text-sm leading-6 text-gray-500">Fallback for testing or devices without a camera. Normally, staff should scan the card.</p></div>
          </div>
          <form className="mt-5 space-y-3" onSubmit={event => { event.preventDefault(); processToken(manualToken, 'manual') }}>
            <label className="block text-sm font-medium text-gray-700">QR token<input value={manualToken} onChange={event => setManualToken(event.target.value)} placeholder="Paste the UUID encoded in the member QR" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 font-mono text-sm outline-none focus:border-emerald-500" /></label>
            <button type="submit" disabled={processing || !manualToken.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">{processing ? 'Verifying membership…' : 'Verify token and check in'}</button>
          </form>
          {actionError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800">{actionError}</p>}
          {scanResult && (
            <div role="status" className={`mt-4 rounded-xl border p-4 ${resultTone}`}>
              <div className="flex items-start gap-2">
                {scanResult.checked_in ? <CheckCircle2 size={20} className="mt-0.5 shrink-0" /> : scanResult.allowed ? <Clock3 size={20} className="mt-0.5 shrink-0" /> : <ShieldCheck size={20} className="mt-0.5 shrink-0" />}
                <div className="min-w-0">
                  <p className="font-semibold">{scanResult.checked_in ? 'Check-in successful' : scanResult.allowed ? 'Duplicate check-in prevented' : 'Entry denied'}</p>
                  <p className="mt-1 text-sm leading-5">{scanResult.message || 'The check-in request has been processed.'}</p>
                  {scanResult.member_name && <p className="mt-2 text-sm font-medium">{scanResult.member_name}{scanResult.member_number ? ` · ${scanResult.member_number}` : ''}</p>}
                  {scanResult.membership_end_date && <p className="mt-1 text-xs">Membership valid through {new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${scanResult.membership_end_date}T00:00:00`))}</p>}
                  {scanResult.checked_in_at && <p className="mt-1 text-xs">Time: {new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(scanResult.checked_in_at))}</p>}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div><h2 className="font-semibold text-gray-900">Today's check-in history</h2><p className="mt-1 text-sm text-gray-500">Recent entries recorded for your gym, newest first.</p></div>
          <button type="button" onClick={onRefresh} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Activity size={16} /> Refresh history</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-gray-50/80 text-xs font-medium text-gray-500"><tr><th className="px-5 py-3.5">Member</th><th className="px-4 py-3.5">Member number</th><th className="px-4 py-3.5">Time</th><th className="px-5 py-3.5">Method</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceRecords.length === 0
                ? <tr><td colSpan="4" className="px-5 py-10 text-center text-sm text-gray-500">No check-ins have been recorded today.</td></tr>
                : attendanceRecords.map(record => <tr key={record.id} className="hover:bg-gray-50/70"><td className="px-5 py-4 text-sm font-medium text-gray-900">{record.memberName}</td><td className="px-4 py-4 text-sm text-gray-600">{record.memberNumber || '—'}</td><td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{record.checkedInLabel}</td><td className="px-5 py-4 text-sm text-gray-600">{record.checkInMethodLabel}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">Entry is recorded only when the member is active and has a membership valid today. Repeat scans within 30 seconds are treated as duplicates.</div>
      </section>
    </div>
  )
}


function MembershipsPage({ memberships, plans, gymId, profileRole, onRefresh }) {
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [durationValue, setDurationValue] = useState('1')
  const [durationUnit, setDurationUnit] = useState('months')
  const [planPrice, setPlanPrice] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)
  const [togglingPlanId, setTogglingPlanId] = useState(null)
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const canManagePlans = profileRole === 'owner' || profileRole === 'manager'
  const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(Number(value || 0))
  const dateLabel = value => value ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`)) : 'Not set'

  const statusCounts = {
    active: memberships.filter(item => item.status === 'Active' || item.status === 'Expiring soon').length,
    pending: memberships.filter(item => item.status === 'Pending payment').length,
    expiring: memberships.filter(item => item.status === 'Expiring soon').length,
    expired: memberships.filter(item => item.status === 'Expired').length,
  }

  const filteredMemberships = memberships.filter(item => {
    const matchesSearch = `${item.memberName} ${item.memberNumber} ${item.planName} ${item.status}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase().replaceAll(' ', '_') === statusFilter
    return matchesSearch && matchesStatus
  })

  function resetPlanForm() {
    setShowPlanForm(false)
    setEditingPlan(null)
    setPlanName('')
    setPlanDescription('')
    setDurationValue('1')
    setDurationUnit('months')
    setPlanPrice('')
    setErrorMessage('')
  }

  function beginEditPlan(plan) {
    setEditingPlan(plan)
    setPlanName(plan.name || '')
    setPlanDescription(plan.description || '')
    const days = Number(plan.duration_days || 30)
    if (days % 365 === 0) {
      setDurationValue(String(days / 365)); setDurationUnit('years')
    } else if (days % 30 === 0) {
      setDurationValue(String(days / 30)); setDurationUnit('months')
    } else if (days % 7 === 0) {
      setDurationValue(String(days / 7)); setDurationUnit('weeks')
    } else {
      setDurationValue(String(days)); setDurationUnit('days')
    }
    setPlanPrice(String(plan.price ?? ''))
    setShowPlanForm(true)
    setActiveTab('plans')
    setNotice('')
    setErrorMessage('')
  }

  async function savePlan(event) {
    event.preventDefault()
    if (!canManagePlans) {
      setErrorMessage('Only a gym owner or manager can manage membership plans.')
      return
    }
    const value = Number(durationValue)
    const multipliers = { days: 1, weeks: 7, months: 30, years: 365 }
    const durationDays = value * multipliers[durationUnit]
    const price = Number(planPrice)
    if (!planName.trim() || planName.trim().length < 2) {
      setErrorMessage('Enter a plan name with at least two characters.')
      return
    }
    if (!Number.isInteger(value) || value < 1 || !Number.isInteger(durationDays) || durationDays > 3650) {
      setErrorMessage('Choose a valid duration from 1 day up to 10 years.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setErrorMessage('Enter a valid price. Use 0 for a free plan.')
      return
    }

    setSavingPlan(true)
    setErrorMessage('')
    setNotice('')
    try {
      const payload = {
        name: planName.trim(),
        description: planDescription.trim() || null,
        duration_days: durationDays,
        price,
      }
      let query
      if (editingPlan) {
        query = supabase.from('membership_plans').update(payload).eq('id', editingPlan.id).eq('gym_id', gymId)
      } else {
        query = supabase.from('membership_plans').insert({ ...payload, gym_id: gymId, is_active: true })
      }
      const { error } = await query
      if (error) throw error
      setNotice(editingPlan ? 'Membership plan updated.' : 'Membership plan created.')
      resetPlanForm()
      await onRefresh?.()
    } catch (error) {
      setErrorMessage(error.message || 'Could not save the membership plan.')
    } finally {
      setSavingPlan(false)
    }
  }

  async function togglePlan(plan) {
    if (!canManagePlans) return
    const action = plan.is_active ? 'disable' : 'enable'
    if (!window.confirm(`${action === 'disable' ? 'Disable' : 'Enable'} “${plan.name}”? ${action === 'disable' ? 'It will remain on historical records but will no longer be available for new memberships.' : 'It will be available for new memberships again.'}`)) return
    setTogglingPlanId(plan.id)
    setErrorMessage('')
    setNotice('')
    try {
      const { error } = await supabase.from('membership_plans').update({ is_active: !plan.is_active }).eq('id', plan.id).eq('gym_id', gymId)
      if (error) throw error
      setNotice(`Plan ${plan.is_active ? 'disabled' : 'enabled'} successfully.`)
      await onRefresh?.()
    } catch (error) {
      setErrorMessage(error.message || 'Could not update this plan.')
    } finally {
      setTogglingPlanId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Active memberships</p><p className="mt-2 text-3xl font-semibold text-gray-900">{statusCounts.active}</p><p className="mt-1 text-xs text-gray-500">Includes expiring soon</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Pending payment</p><p className="mt-2 text-3xl font-semibold text-amber-700">{statusCounts.pending}</p><p className="mt-1 text-xs text-gray-500">Not active until paid</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Expiring in 7 days</p><p className="mt-2 text-3xl font-semibold text-orange-700">{statusCounts.expiring}</p><p className="mt-1 text-xs text-gray-500">Renewal follow-up</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Expired</p><p className="mt-2 text-3xl font-semibold text-rose-700">{statusCounts.expired}</p><p className="mt-1 text-xs text-gray-500">Review for renewal</p></div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div><h2 className="font-semibold text-gray-900">Membership management</h2><p className="mt-1 text-sm text-gray-500">Review active periods and configure the plans offered by your gym.</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setActiveTab('subscriptions'); setNotice(''); setErrorMessage('') }} className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold ${activeTab === 'subscriptions' ? 'bg-[#15251f] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Subscriptions</button>
            <button type="button" onClick={() => { setActiveTab('plans'); setNotice(''); setErrorMessage('') }} className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold ${activeTab === 'plans' ? 'bg-[#15251f] text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Plans ({plans.length})</button>
            {activeTab === 'plans' && canManagePlans && <button type="button" onClick={() => { resetPlanForm(); setShowPlanForm(true) }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-[#15251f] hover:bg-emerald-400"><Plus size={16} /> New plan</button>}
          </div>
        </div>

        {notice && <p role="status" className="mx-5 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 sm:mx-6">{notice}</p>}
        {errorMessage && <p role="alert" className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:mx-6">{errorMessage}</p>}

        {activeTab === 'subscriptions' ? (
          <>
            <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 focus-within:border-emerald-500"><Search size={16} className="text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member or plan..." className="w-full bg-transparent text-sm outline-none sm:w-64" /></label>
              <select aria-label="Filter memberships by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none focus:border-emerald-500"><option value="all">All statuses</option><option value="active">Active</option><option value="expiring_soon">Expiring soon</option><option value="pending_payment">Pending payment</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-gray-50/80 text-xs font-medium text-gray-500"><tr><th className="px-5 py-3.5">Member</th><th className="px-4 py-3.5">Plan</th><th className="px-4 py-3.5">Start date</th><th className="px-4 py-3.5">Expiry date</th><th className="px-4 py-3.5">Plan price</th><th className="px-5 py-3.5">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMemberships.map(item => <tr key={item.id} className="hover:bg-gray-50/70"><td className="px-5 py-4"><p className="text-sm font-medium text-gray-900">{item.memberName}</p><p className="mt-0.5 text-xs text-gray-500">{item.memberNumber || 'Member number unavailable'}</p></td><td className="px-4 py-4 text-sm text-gray-700">{item.planName}</td><td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{dateLabel(item.start_date)}</td><td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{dateLabel(item.end_date)}</td><td className="whitespace-nowrap px-4 py-4 text-sm text-gray-700">{money(item.planPrice)}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td></tr>)}
                  {filteredMemberships.length === 0 && <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">{search || statusFilter !== 'all' ? 'No memberships match your filters.' : 'No membership records yet. Register a member to create the first membership.'}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-5 py-4 text-xs leading-5 text-gray-500">Payment confirmation activates a membership and starts its validity period. Expiry is calculated from the stored membership dates.</div>
          </>
        ) : (
          <>
            {showPlanForm && (
              <form onSubmit={savePlan} className="m-5 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:m-6 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-900">{editingPlan ? 'Edit membership plan' : 'Create membership plan'}</h3><p className="mt-1 text-sm text-gray-500">Use preset-friendly or custom durations; 1 month = 30 days and 1 year = 365 days.</p></div><button type="button" onClick={resetPlanForm} aria-label="Close plan form" className="rounded-lg p-2 text-gray-500 hover:bg-white"><X size={18} /></button></div>
                <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium text-gray-700">Plan name<input required minLength="2" maxLength="120" value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. Day pass, Standard monthly" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500" /></label><label className="block text-sm font-medium text-gray-700">Price (₦)<input required type="number" min="0" step="0.01" value={planPrice} onChange={e => setPlanPrice(e.target.value)} placeholder="e.g. 5000" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500" /></label></div>
                <label className="block text-sm font-medium text-gray-700">Description (optional)<textarea value={planDescription} onChange={e => setPlanDescription(e.target.value)} rows={2} maxLength={500} placeholder="Briefly describe what's included" className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500" /></label>
                <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-gray-700">Duration<input required type="number" step="1" min="1" max={durationUnit === 'years' ? 10 : durationUnit === 'months' ? 121 : durationUnit === 'weeks' ? 521 : 3650} value={durationValue} onChange={e => setDurationValue(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500" /></label><label className="block text-sm font-medium text-gray-700">Unit<select value={durationUnit} onChange={e => setDurationUnit(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500"><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option></select></label></div>
                <div className="flex flex-wrap gap-3"><button type="button" onClick={resetPlanForm} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button><button type="submit" disabled={savingPlan} className="inline-flex items-center gap-2 rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243c31] disabled:opacity-60"><Save size={16} /> {savingPlan ? 'Saving…' : editingPlan ? 'Save changes' : 'Save plan'}</button></div>
              </form>
            )}
            <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead className="bg-gray-50/80 text-xs font-medium text-gray-500"><tr><th className="px-5 py-3.5">Plan</th><th className="px-4 py-3.5">Duration</th><th className="px-4 py-3.5">Price</th><th className="px-4 py-3.5">Availability</th><th className="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{plans.map(plan => <tr key={plan.id} className="hover:bg-gray-50/70"><td className="px-5 py-4"><p className="text-sm font-medium text-gray-900">{plan.name}</p><p className="mt-0.5 max-w-md text-xs text-gray-500">{plan.description || 'No description'}</p></td><td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">{plan.duration_days} days</td><td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-800">{money(plan.price)}</td><td className="px-4 py-4"><StatusBadge status={plan.is_active ? 'Active' : 'Inactive'} /></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => beginEditPlan(plan)} disabled={!canManagePlans} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"><Pencil size={13} /> Edit</button><button type="button" onClick={() => togglePlan(plan)} disabled={!canManagePlans || togglingPlanId === plan.id} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">{togglingPlanId === plan.id ? 'Saving…' : plan.is_active ? 'Disable' : 'Enable'}</button></div></td></tr>)}{plans.length === 0 && <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-500">No saved plans yet. Create a plan here, or the registration flow may create a duration-specific plan as needed.</td></tr>}</tbody></table></div>
            {!canManagePlans && <p className="m-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 sm:m-6">Your current role can view plans but cannot create, edit, or disable them.</p>}
            <div className="border-t border-gray-100 px-5 py-4 text-xs leading-5 text-gray-500">Disabling a plan keeps it available on historical membership records while preventing it from being selected for new memberships.</div>
          </>
        )}
      </section>
    </div>
  )
}

function SettingsPage({ gymDetails, gymId, profileName, profileRole, userId, onGymUpdated, onProfileUpdated }) {
  const [gymForm, setGymForm] = useState({ name: gymDetails?.name || '', email: gymDetails?.email || '', phone: gymDetails?.phone || '', address: gymDetails?.address || '', timezone: gymDetails?.timezone || 'Africa/Lagos' })
  const [accountName, setAccountName] = useState(profileName || '')
  const [savingGym, setSavingGym] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [gymNotice, setGymNotice] = useState('')
  const [accountNotice, setAccountNotice] = useState('')
  const [gymError, setGymError] = useState('')
  const [accountError, setAccountError] = useState('')
  const canEdit = profileRole === 'owner'

  useEffect(() => {
    setGymForm({ name: gymDetails?.name || '', email: gymDetails?.email || '', phone: gymDetails?.phone || '', address: gymDetails?.address || '', timezone: gymDetails?.timezone || 'Africa/Lagos' })
  }, [gymDetails?.id, gymDetails?.name, gymDetails?.email, gymDetails?.phone, gymDetails?.address, gymDetails?.timezone])

  useEffect(() => setAccountName(profileName || ''), [profileName])

  async function saveGymDetails(event) {
    event.preventDefault()
    setGymNotice(''); setGymError('')
    if (!canEdit) { setGymError('Only the gym owner can change workspace details.'); return }
    if (!gymForm.name.trim() || gymForm.name.trim().length < 2) { setGymError('Gym name must contain at least two characters.'); return }
    setSavingGym(true)
    try {
      const { data, error } = await supabase.from('gyms').update({ name: gymForm.name.trim(), email: gymForm.email.trim() || null, phone: gymForm.phone.trim() || null, address: gymForm.address.trim() || null, timezone: gymForm.timezone }).eq('id', gymId).select('id, name, email, phone, address, timezone').single()
      if (error) throw error
      onGymUpdated?.(data)
      setGymNotice('Gym details saved successfully.')
    } catch (error) {
      setGymError(error.message || 'Could not save gym details.')
    } finally {
      setSavingGym(false)
    }
  }

  async function saveAccountDetails(event) {
    event.preventDefault()
    setAccountNotice(''); setAccountError('')
    if (!accountName.trim() || accountName.trim().length < 2) { setAccountError('Your display name must contain at least two characters.'); return }
    setSavingAccount(true)
    try {
      const { data, error } = await supabase.from('user_profiles').update({ full_name: accountName.trim() }).eq('id', userId).eq('gym_id', gymId).select('id, full_name').single()
      if (error) throw error
      onProfileUpdated?.(data.full_name)
      setAccountNotice('Account profile updated.')
    } catch (error) {
      setAccountError(error.message || 'Could not save your account profile.')
    } finally {
      setSavingAccount(false)
    }
  }

  const fieldClass = 'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500'

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Building2 size={22} /></span><div><h2 className="font-semibold text-gray-900">Gym profile</h2><p className="mt-1 text-sm text-gray-500">Details used for the workspace and member communications.</p></div></div></div>
        <form onSubmit={saveGymDetails} className="space-y-4 p-5 sm:p-6">
          {!canEdit && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Only the gym owner can edit these details. You can still view the current profile.</p>}
          <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium text-gray-700">Gym name<input className={fieldClass} required minLength="2" maxLength="160" value={gymForm.name} onChange={e => setGymForm({ ...gymForm, name: e.target.value })} disabled={!canEdit} /></label><label className="block text-sm font-medium text-gray-700">Business email<input className={fieldClass} type="email" value={gymForm.email} onChange={e => setGymForm({ ...gymForm, email: e.target.value })} placeholder="info@yourgym.com" disabled={!canEdit} /></label><label className="block text-sm font-medium text-gray-700">Phone number<input className={fieldClass} type="tel" value={gymForm.phone} onChange={e => setGymForm({ ...gymForm, phone: e.target.value })} placeholder="Gym contact number" disabled={!canEdit} /></label><label className="block text-sm font-medium text-gray-700">Timezone<select className={fieldClass} value={gymForm.timezone} onChange={e => setGymForm({ ...gymForm, timezone: e.target.value })} disabled={!canEdit}><option value="Africa/Lagos">Africa/Lagos (Nigeria)</option><option value="Africa/Accra">Africa/Accra (Ghana)</option><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option></select></label></div>
          <label className="block text-sm font-medium text-gray-700"><span className="inline-flex items-center gap-2"><MapPin size={15} /> Gym address</span><textarea className={fieldClass} rows={3} maxLength="500" value={gymForm.address} onChange={e => setGymForm({ ...gymForm, address: e.target.value })} placeholder="Street, area, city" disabled={!canEdit} /></label>
          {gymError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{gymError}</p>}
          {gymNotice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{gymNotice}</p>}
          {canEdit && <button type="submit" disabled={savingGym} className="inline-flex items-center gap-2 rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243c31] disabled:opacity-60"><Save size={16} /> {savingGym ? 'Saving details…' : 'Save gym details'}</button>}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Users size={22} /></span><div><h2 className="font-semibold text-gray-900">Account profile</h2><p className="mt-1 text-sm text-gray-500">Update the name shown in the GymAccess workspace.</p></div></div></div>
        <form onSubmit={saveAccountDetails} className="space-y-4 p-5 sm:p-6"><label className="block max-w-xl text-sm font-medium text-gray-700">Display name<input className={fieldClass} required minLength="2" maxLength="160" value={accountName} onChange={e => setAccountName(e.target.value)} /></label><div className="grid gap-4 md:grid-cols-2"><div><p className="text-sm font-medium text-gray-700">Role</p><p className="mt-1.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm capitalize text-gray-600">{profileRole || 'Owner'}</p></div><div><p className="text-sm font-medium text-gray-700">Workspace timezone</p><p className="mt-1.5 rounded-xl bg-gray-50 px-3.5 py-3 text-sm text-gray-600">{gymForm.timezone}</p></div></div>{accountError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{accountError}</p>}{accountNotice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{accountNotice}</p>}<button type="submit" disabled={savingAccount} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"><Save size={16} /> {savingAccount ? 'Saving profile…' : 'Save account profile'}</button></form>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck size={22} className="mt-0.5 shrink-0 text-amber-800" /><div><h2 className="font-semibold text-amber-950">Security and configuration</h2><p className="mt-1 text-sm leading-6 text-amber-900">Keep Supabase secret keys, Resend API keys, and other server credentials in the backend environment only. GymAccess email is configured separately. WhatsApp delivery is paused while the core membership workflow is completed.</p></div></div></section>
    </div>
  )
}

function PlaceholderPage({ page, onAddMember }) {
  const details = {
    Members: { icon: Users, title: 'Member management', description: 'Register members, manage their details and keep membership records organized.', action: 'Register a member' },
    Payments: { icon: Wallet, title: 'Payment records', description: 'Record external payments and confirm them before activating memberships.', action: 'Record a payment' },
    Attendance: { icon: ScanLine, title: 'Gym attendance', description: 'This is where QR scanning, membership validation and check-in history will live.', action: 'Scanner coming next' },
    'Help & support': { icon: CircleHelp, title: 'Help & support', description: 'Guidance for using your gym workspace.', action: 'Support coming next' },
  }
  const item = details[page] || details.Members
  const Icon = item.icon

  return (
    <div className="flex min-h-[440px] items-center justify-center rounded-2xl border border-gray-200/80 bg-white p-8 text-center shadow-sm">
      <div className="max-w-md">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={29} /></span>
        <h2 className="mt-5 text-xl font-semibold text-gray-900">{item.title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
        {page === 'Members' ? (
          <button onClick={onAddMember} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243c31]"><Plus size={17} /> {item.action}</button>
        ) : (
          <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600"><Clock3 size={16} /> {item.action}</span>
        )}
      </div>
    </div>
  )
}

function PaymentsPage({ paymentRecords, profileRole, onRefresh }) {
  const [busyPaymentId, setBusyPaymentId] = useState(null)
  const [busyEmailPaymentId, setBusyEmailPaymentId] = useState(null)
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const canConfirm = profileRole === 'owner' || profileRole === 'manager'
  const pendingCount = paymentRecords.filter(payment => payment.status === 'pending').length
  const confirmedCount = paymentRecords.filter(payment => payment.status === 'confirmed').length
  const money = amount => new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 2,
  }).format(Number(amount || 0))
  const methodLabel = method => ({
    cash: 'Cash', bank_transfer: 'Bank transfer', pos: 'POS', other: 'Other',
  }[method] || method || '—')

  async function requestReceiptEmail(paymentId) {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    const accessToken = sessionData?.session?.access_token
    if (!accessToken) throw new Error('Your session has expired. Please sign in again.')

    const backendUrl = (import.meta.env.VITE_GYMACCESS_API_URL || 'http://127.0.0.1:5001').replace(/\/$/, '')
    const response = await fetch(`${backendUrl}/api/notifications/payment-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ payment_id: paymentId }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(result.error || `Email request failed (HTTP ${response.status}).`)
    }
    return result
  }

  async function sendReceiptEmail(payment) {
    setBusyEmailPaymentId(payment.id)
    setNotice('')
    setErrorMessage('')
    try {
      const result = await requestReceiptEmail(payment.id)
      const deliveryMessage = result.test_mode
        ? `TEST MODE: card and receipt sent to ${result.to}. The member’s actual email (${result.intended_to}) was not contacted.`
        : `Membership card and payment receipt emailed to ${result.to}.`
      setNotice(`${deliveryMessage} Receipt: ${result.receipt_number || payment.receipt_number || 'confirmed'}.`)
    } catch (error) {
      console.error('GymAccess receipt email failed:', error)
      setErrorMessage(error.message || 'Could not send the email. Please try again.')
    } finally {
      setBusyEmailPaymentId(null)
    }
  }

  async function confirmPayment(payment) {
    const approved = window.confirm(
      `Confirm that ${money(payment.amount)} has been received from ${payment.memberName}? This will activate their membership and generate a receipt.`
    )
    if (!approved) return

    setBusyPaymentId(payment.id)
    setNotice('')
    setErrorMessage('')
    try {
      const { data, error } = await supabase.rpc('confirm_gym_payment', {
        p_payment_id: payment.id,
      })
      if (error) throw error

      const confirmationMessage = data?.already_confirmed
        ? `This payment was already confirmed. Receipt: ${data.receipt_number || 'available in the payment record'}.`
        : `Payment confirmed. Membership is active until ${data?.end_date || 'the saved expiry date'}. Receipt: ${data?.receipt_number || 'generated'}.`

      // Payment confirmation has already committed. An email failure must not
      // report the payment itself as failed; staff can retry from the table.
      let emailMessage
      try {
        const emailResult = await requestReceiptEmail(payment.id)
        emailMessage = emailResult.test_mode
          ? ` TEST MODE: card and receipt sent to ${emailResult.to}; the member’s actual email (${emailResult.intended_to}) was not contacted.`
          : ` The membership card and receipt were emailed to ${emailResult.to}.`
      } catch (emailError) {
        console.warn('Payment was confirmed, but email delivery failed:', emailError)
        emailMessage = ` Email was not sent: ${emailError.message || 'provider error'}. Use “Send card + receipt” to retry after fixing email setup.`
      }
      setNotice(confirmationMessage + emailMessage)
      await onRefresh?.()
    } catch (error) {
      console.error('GymAccess payment confirmation failed:', error)
      setErrorMessage(error.message || 'Could not confirm this payment. Please try again.')
    } finally {
      setBusyPaymentId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-900/[0.02]">
      <div className="border-b border-gray-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Payment records</h2>
            <p className="mt-1 text-sm text-gray-500">Confirm cash, transfer, POS or other external payments before memberships become active.</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">{pendingCount} pending</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-medium text-amber-800">Awaiting confirmation</p><p className="mt-2 text-2xl font-semibold text-amber-950">{pendingCount}</p></div>
          <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-medium text-emerald-800">Confirmed payments</p><p className="mt-2 text-2xl font-semibold text-emerald-950">{confirmedCount}</p></div>
          <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs font-medium text-gray-600">Total records</p><p className="mt-2 text-2xl font-semibold text-gray-900">{paymentRecords.length}</p></div>
        </div>
        {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-900">{notice}</p>}
        {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800">{errorMessage}</p>}
        {!canConfirm && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Your current role can view payment records but cannot confirm them. Ask a gym owner or manager to confirm payments.</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-gray-50/80 text-xs font-medium text-gray-500">
            <tr><th className="px-5 py-3.5">Member</th><th className="px-4 py-3.5">Amount</th><th className="px-4 py-3.5">Method</th><th className="px-4 py-3.5">Payment status</th><th className="px-4 py-3.5">Receipt</th><th className="px-5 py-3.5 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paymentRecords.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50/70">
                <td className="px-5 py-4"><p className="text-sm font-medium text-gray-900">{payment.memberName}</p><p className="mt-0.5 text-xs text-gray-500">{payment.memberNumber || 'Member number unavailable'} · {payment.createdAtLabel}</p></td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">{money(payment.amount)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{methodLabel(payment.payment_method)}{payment.external_reference ? <p className="mt-1 text-xs text-gray-400">Ref: {payment.external_reference}</p> : null}</td>
                <td className="px-4 py-4"><StatusBadge status={payment.status === 'confirmed' ? 'Confirmed' : payment.status === 'rejected' ? 'Rejected' : 'Pending payment'} /></td>
                <td className="px-4 py-4 text-sm text-gray-600">{payment.receipt_number || '—'}</td>
                <td className="px-5 py-4 text-right">
                  {payment.status === 'pending' && canConfirm ? (
                    <button type="button" onClick={() => confirmPayment(payment)} disabled={busyPaymentId === payment.id} className="inline-flex items-center gap-2 rounded-lg bg-[#15251f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#243c31] disabled:cursor-not-allowed disabled:opacity-60">
                      {busyPaymentId === payment.id ? 'Confirming…' : <><CheckCircle2 size={15} /> Confirm payment</>}
                    </button>
                  ) : payment.status === 'confirmed' ? (
                    <div className="flex flex-col items-end gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Receipt size={15} /> Confirmed</span>
                      <button type="button" onClick={() => sendReceiptEmail(payment)} disabled={busyEmailPaymentId === payment.id} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
                        <Mail size={14} /> {busyEmailPaymentId === payment.id ? 'Sending…' : 'Send card + receipt'}
                      </button>
                    </div>
                  ) : <span className="text-xs text-gray-400">No action</span>}
                </td>
              </tr>
            ))}
            {paymentRecords.length === 0 && <tr><td colSpan="6" className="px-5 py-14 text-center"><Wallet size={26} className="mx-auto text-gray-300" /><p className="mt-3 text-sm font-medium text-gray-700">No payment records yet</p><p className="mt-1 text-xs text-gray-500">Register a member to create a pending payment record.</p></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="border-t border-gray-100 px-5 py-4 text-xs leading-5 text-gray-500">Confirm a payment only after you have verified that the money was received. Confirmation activates the membership and creates a receipt number. When email is configured, GymAccess emails the member a PDF receipt and printable QR membership card; use “Send card + receipt” to retry a failed delivery. WhatsApp delivery is a later milestone.</div>
    </section>
  )
}

function AddMemberModal({ onClose, onRegistered, plans = [] }) {
  const activePlans = (plans || []).filter(plan => plan.is_active)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [membershipSource, setMembershipSource] = useState(() => activePlans.length ? 'plan' : 'custom')
  const [selectedPlanId, setSelectedPlanId] = useState(() => activePlans[0]?.id || '')
  const [durationPreset, setDurationPreset] = useState('one_month')
  const [durationValue, setDurationValue] = useState('7')
  const [durationUnit, setDurationUnit] = useState('days')
  const [price, setPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [externalReference, setExternalReference] = useState('')
  const [whatsappOptIn, setWhatsappOptIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [registeredMember, setRegisteredMember] = useState(null)

  useEffect(() => {
    if (!activePlans.length) {
      if (membershipSource === 'plan') setMembershipSource('custom')
      if (selectedPlanId) setSelectedPlanId('')
      return
    }
    if (!selectedPlanId || !activePlans.some(plan => plan.id === selectedPlanId)) {
      setSelectedPlanId(activePlans[0].id)
    }
  }, [plans, membershipSource, selectedPlanId])

  const selectedPlan = activePlans.find(plan => plan.id === selectedPlanId) || null
  const formatMoney = value => new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 2,
  }).format(Number(value || 0))

  async function submit(event) {
    event.preventDefault()
    setErrorMessage('')

    let durationDays
    let amount
    let durationLabel
    let chosenPlanId = null

    if (membershipSource === 'plan') {
      if (!selectedPlan) {
        setErrorMessage('Choose an active saved membership plan, or select Custom membership.')
        return
      }
      chosenPlanId = selectedPlan.id
      durationDays = Number(selectedPlan.duration_days)
      amount = Number(selectedPlan.price)
      durationLabel = `${selectedPlan.name} (${durationDays} days)`
      if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650 || !Number.isFinite(amount) || amount < 0) {
        setErrorMessage('The selected plan has invalid duration or price. Edit the plan before using it.')
        return
      }
    } else {
      const value = Number(durationValue)
      const multipliers = { days: 1, weeks: 7, months: 30, years: 365 }
      durationDays = durationPreset === 'one_month'
        ? 30
        : durationPreset === 'one_year'
          ? 365
          : value * multipliers[durationUnit]
      amount = Number(price)

      if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650 ||
          (durationPreset === 'custom' && (!Number.isInteger(value) || value < 1))) {
        setErrorMessage('Choose a valid duration of 1 to 3,650 total days. Custom range supports days, weeks, months and years.')
        return
      }
      durationLabel = durationPreset === 'one_month'
        ? '1 month (30 days)'
        : durationPreset === 'one_year'
          ? '1 year (365 days)'
          : `${value} ${value === 1 ? durationUnit.replace(/s$/, '') : durationUnit}`
      if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) {
        setErrorMessage('Enter a valid membership fee. Use 0 for a free pass.')
        return
      }
    }

    if (!phone.trim()) {
      setErrorMessage('Enter the member’s phone number.')
      return
    }

    setSaving(true)
    try {
      const { data, error } = await supabase.rpc('register_gym_member_with_plan', {
        p_full_name: name.trim(),
        p_email: email.trim() || null,
        p_phone: phone.trim(),
        p_plan_id: chosenPlanId,
        p_duration_days: durationDays,
        p_price: amount,
        p_payment_method: paymentMethod,
        p_external_reference: externalReference.trim() || null,
        p_whatsapp_opt_in: whatsappOptIn,
      })
      if (error) throw error

      setRegisteredMember(data)
      await onRegistered?.()
      // Keep a clear success state; the payment remains pending until confirmed.
      setErrorMessage('')
      setRegisteredMember({ ...data, registered_duration_label: durationLabel, selected_plan_name: selectedPlan?.name || null })
    } catch (error) {
      console.error('GymAccess member registration failed:', error)
      setErrorMessage(error.message || 'Member registration failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-3 sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-semibold text-gray-900">Register a member</h2><p className="mt-1 text-sm text-gray-500">Choose a saved plan or set a custom membership duration and fee.</p></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close dialog" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><X size={20} /></button>
        </div>

        {registeredMember ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><p className="font-semibold">Member saved successfully</p><p className="mt-1">Member number: <strong>{registeredMember.member_number}</strong></p><p>Membership: <strong>{registeredMember.registered_duration_label || `${registeredMember.duration_days} days`}</strong></p><p>Fee recorded: <strong>{formatMoney(registeredMember.amount)}</strong></p><p>Payment status: <strong>Pending confirmation</strong></p><p>WhatsApp consent: <strong>{registeredMember.whatsapp_opt_in ? 'Recorded' : 'Not granted'}</strong></p></div>
            <p className="text-sm leading-6 text-gray-600">The member, membership and pending payment have been saved. The selected plan will be linked to this subscription, or a custom plan will be created/reused for the custom duration. After an authorised staff member confirms payment, use Payments to send the card and receipt by email. WhatsApp delivery is currently paused.</p>
            <button type="button" onClick={onClose} className="w-full rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243c31]">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">Full name<input required minLength="2" maxLength="160" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aminu Yusuf" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="member@example.com" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /></label>
              <label className="block text-sm font-medium text-gray-700">Phone number<input required minLength="5" maxLength="40" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 08012345678" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10" /></label>
            </div>

            <div>
              <label htmlFor="membership-source" className="block text-sm font-medium text-gray-700">Membership option</label>
              <select id="membership-source" value={membershipSource} onChange={e => setMembershipSource(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500">
                {activePlans.length > 0 && <option value="plan">Use a saved plan</option>}
                <option value="custom">Custom membership</option>
              </select>
              {membershipSource === 'plan' && activePlans.length > 0 && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <label htmlFor="saved-plan" className="block text-sm font-medium text-gray-800">Saved membership plan</label>
                  <select id="saved-plan" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500">
                    {activePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} — {plan.duration_days} days — {formatMoney(plan.price)}</option>)}
                  </select>
                  {selectedPlan && <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-lg border border-emerald-100 bg-white p-3"><p className="text-xs text-gray-500">Duration</p><p className="mt-1 font-semibold text-gray-900">{selectedPlan.duration_days} days</p></div><div className="rounded-lg border border-emerald-100 bg-white p-3"><p className="text-xs text-gray-500">Fee</p><p className="mt-1 font-semibold text-gray-900">{formatMoney(selectedPlan.price)}</p></div></div>}
                  <p className="mt-3 text-xs leading-5 text-gray-600">Duration and fee are taken from the saved plan. To change either value, edit the plan under Memberships → Plans.</p>
                </div>
              )}
              {activePlans.length === 0 && <p className="mt-2 text-xs leading-5 text-amber-700">There are no enabled saved plans yet. You can register using a custom duration now, or create a plan under Memberships → Plans.</p>}
            </div>

            {membershipSource === 'custom' && (
              <>
                <div className="block text-sm font-medium text-gray-700">
                  <label htmlFor="membership-duration-preset">Custom membership duration</label>
                  <select id="membership-duration-preset" value={durationPreset} onChange={e => setDurationPreset(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500">
                    <option value="one_month">1 month</option><option value="one_year">1 year</option><option value="custom">Custom range</option>
                  </select>
                  {durationPreset === 'custom' && (
                    <div className="mt-3">
                      <p className="mb-2 text-sm font-medium text-gray-700">Enter the custom duration</p>
                      <div className="grid grid-cols-[1fr_1fr] gap-3">
                        <input id="membership-duration-value" aria-label="Custom duration amount" type="number" min="1" max={durationUnit === 'years' ? 10 : durationUnit === 'months' ? 121 : durationUnit === 'weeks' ? 521 : 3650} step="1" required value={durationValue} onChange={e => setDurationValue(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3.5 py-3 outline-none focus:border-emerald-500" />
                        <select aria-label="Custom duration unit" value={durationUnit} onChange={e => setDurationUnit(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500"><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option></select>
                      </div>
                      <p className="mt-1.5 text-xs font-normal leading-5 text-gray-500">Examples: 1 day, 1 week, 10 days or 18 months. Custom durations can be from 1 day up to 10 years.</p>
                    </div>
                  )}
                  {durationPreset !== 'custom' && <p className="mt-1.5 text-xs font-normal leading-5 text-gray-500">For this initial version, 1 month is 30 days and 1 year is 365 days.</p>}
                </div>
                <label className="block text-sm font-medium text-gray-700">Agreed membership fee (₦)<input type="number" min="0" max="9999999999.99" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 5000" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 outline-none focus:border-emerald-500" /></label>
              </>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">Payment method<select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 outline-none focus:border-emerald-500"><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="pos">POS</option><option value="other">Other</option></select></label>
              <label className="block text-sm font-medium text-gray-700">Payment reference <span className="font-normal text-gray-400">(optional)</span><input value={externalReference} onChange={e => setExternalReference(e.target.value)} placeholder="Transfer reference / note" className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-3 outline-none focus:border-emerald-500" /></label>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 text-sm font-normal text-gray-700"><input type="checkbox" checked={whatsappOptIn} onChange={e => setWhatsappOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" /><span><span className="block font-medium">WhatsApp updates permission</span><span className="mt-1 block text-xs leading-5 text-gray-500">Tick only when the member agrees to receive their membership card, receipt and relevant expiry reminders through WhatsApp. This records consent; messages are not sent yet.</span></span></label>
            <div className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Registration records the payment as <strong>pending</strong>. Membership will not become active and its period will not start until authorised staff confirm the payment.</div>
            {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800">{errorMessage}</p>}
            <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} disabled={saving} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving || (membershipSource === 'plan' && !selectedPlan)} className="flex-1 rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#243c31] disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving member…' : <><UserRoundPlus size={16} className="mr-2 inline" /> Save member</>}</button></div>
          </form>
        )}
      </div>
    </div>
  )
}

function Dashboard({ session, onLogout }) {
  const [activePage, setActivePage] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [cardMember, setCardMember] = useState(null)
  const [profileName, setProfileName] = useState('')
  const [gymName, setGymName] = useState('')
  const [profileRole, setProfileRole] = useState('')
  const [memberRecords, setMemberRecords] = useState([])
  const [membershipRecords, setMembershipRecords] = useState([])
  const [planRecords, setPlanRecords] = useState([])
  const [gymId, setGymId] = useState('')
  const [gymDetails, setGymDetails] = useState(null)
  const [paymentRecords, setPaymentRecords] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [apiError, setApiError] = useState('')
  const [membersLoading, setMembersLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadGymData() {
      setMembersLoading(true)
      setApiError('')
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, gym_id, full_name, role, is_active')
          .eq('id', session.user.id)
          .single()
        if (profileError) throw new Error(`Could not load your owner profile: ${profileError.message}`)
        if (!profile?.is_active) throw new Error('Your GymAccess profile is inactive. Contact the gym administrator.')

        const { data: gym, error: gymError } = await supabase
          .from('gyms')
          .select('id, name, email, phone, address, timezone, is_active')
          .eq('id', profile.gym_id)
          .single()
        if (gymError) throw new Error(`Could not load your gym: ${gymError.message}`)
        if (!gym?.is_active) throw new Error('This gym workspace is inactive.')

        const [membersResponse, membershipsResponse, plansResponse, attendanceResponse, paymentsResponse] = await Promise.all([
          supabase.from('members').select('id, member_number, full_name, email, phone, qr_token, status, created_at').eq('gym_id', profile.gym_id).order('created_at', { ascending: false }),
          supabase.from('memberships').select('id, member_id, plan_id, start_date, end_date, status, created_at').eq('gym_id', profile.gym_id).order('created_at', { ascending: false }),
          supabase.from('membership_plans').select('id, name, description, duration_days, price, is_active').eq('gym_id', profile.gym_id).order('created_at', { ascending: false }),
          supabase.from('attendance').select('id, member_id, checked_in_at, check_in_method').eq('gym_id', profile.gym_id).gte('checked_in_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()).order('checked_in_at', { ascending: false }).limit(200),
          supabase.from('payments').select('id, member_id, membership_id, amount, payment_method, status, external_reference, receipt_number, created_at, confirmed_at').eq('gym_id', profile.gym_id).order('created_at', { ascending: false }),
        ])
        if (membersResponse.error) throw new Error(`Could not load members: ${membersResponse.error.message}`)
        if (membershipsResponse.error) throw new Error(`Could not load memberships: ${membershipsResponse.error.message}`)
        if (plansResponse.error) throw new Error(`Could not load membership plans: ${plansResponse.error.message}`)
        if (attendanceResponse.error) throw new Error(`Could not load attendance: ${attendanceResponse.error.message}`)
        if (paymentsResponse.error) throw new Error(`Could not load payments: ${paymentsResponse.error.message}`)

        const dbMembers = membersResponse.data || []
        const dbMemberships = membershipsResponse.data || []
        const dbPlans = plansResponse.data || []
        const dbPayments = paymentsResponse.data || []
        const memberById = new Map(dbMembers.map(member => [member.id, member]))
        const paymentMemberRecords = dbPayments.map(payment => {
          const member = memberById.get(payment.member_id)
          return {
            ...payment,
            memberName: member?.full_name || 'Unknown member',
            memberNumber: member?.member_number || '',
            createdAtLabel: payment.created_at
              ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(payment.created_at))
              : 'Date unavailable',
          }
        })
        const attendanceMemberRecords = (attendanceResponse.data || []).map(record => {
          const member = memberById.get(record.member_id)
          return {
            ...record,
            memberName: member?.full_name || 'Unknown member',
            memberNumber: member?.member_number || '',
            checkedInLabel: record.checked_in_at
              ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(record.checked_in_at))
              : 'Time unavailable',
            checkInMethodLabel: record.check_in_method === 'qr' ? 'QR scan' : 'Manual',
          }
        })
        const planById = new Map(dbPlans.map(plan => [plan.id, plan]))
        const latestMembershipByMember = new Map()
        for (const membership of dbMemberships) {
          if (!latestMembershipByMember.has(membership.member_id)) {
            latestMembershipByMember.set(membership.member_id, membership)
          }
        }

        const todayDate = new Date()
        todayDate.setHours(0, 0, 0, 0)
        const todayISO = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
        const soonDate = new Date(todayDate)
        soonDate.setDate(soonDate.getDate() + 7)
        const soonISO = `${soonDate.getFullYear()}-${String(soonDate.getMonth() + 1).padStart(2, '0')}-${String(soonDate.getDate()).padStart(2, '0')}`

        const formattedMemberships = dbMemberships.map(membership => {
          const member = memberById.get(membership.member_id)
          const plan = planById.get(membership.plan_id)
          let status = membership.status === 'pending_payment' ? 'Pending payment'
            : membership.status === 'cancelled' ? 'Cancelled'
            : membership.status === 'expired' || (membership.status === 'active' && membership.end_date && membership.end_date < todayISO) ? 'Expired'
            : membership.status === 'active' && membership.end_date && membership.end_date <= soonISO ? 'Expiring soon'
            : membership.status === 'active' ? 'Active' : 'Inactive'
          return {
            ...membership,
            memberName: member?.full_name || 'Unknown member',
            memberNumber: member?.member_number || '',
            planName: plan?.name || 'Custom membership',
            planPrice: plan?.price ?? 0,
            durationDays: plan?.duration_days ?? null,
            status,
          }
        })

        const activeMemberships = dbMemberships.filter(m => m.status === 'active' && m.end_date && m.end_date >= todayISO)
        const expiringSoon = activeMemberships.filter(m => m.end_date <= soonISO)
        const expiredMemberships = dbMemberships.filter(m => m.status === 'active' && m.end_date && m.end_date < todayISO)

        const colors = ['bg-emerald-100 text-emerald-800', 'bg-violet-100 text-violet-800', 'bg-amber-100 text-amber-800', 'bg-sky-100 text-sky-800', 'bg-rose-100 text-rose-800']
        const formattedMembers = dbMembers.map((member, index) => {
          const membership = latestMembershipByMember.get(member.id)
          const plan = membership ? planById.get(membership.plan_id) : null
          let status = 'Not subscribed'
          if (member.status === 'suspended') status = 'Suspended'
          else if (member.status === 'inactive') status = 'Inactive'
          else if (membership?.status === 'pending_payment') status = 'Pending payment'
          else if (membership?.status === 'cancelled') status = 'Cancelled'
          else if (membership?.status === 'expired' || (membership?.status === 'active' && membership.end_date && membership.end_date < todayISO)) status = 'Expired'
          else if (membership?.status === 'active') status = membership.end_date && membership.end_date <= soonISO ? 'Expiring soon' : 'Active'

          const expires = membership?.end_date
            ? new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${membership.end_date}T00:00:00`))
            : membership?.status === 'pending_payment' ? 'After payment confirmation' : '—'
          return {
            id: member.id,
            memberNumber: member.member_number,
            qrToken: member.qr_token,
            name: member.full_name,
            email: member.email,
            phone: member.phone,
            expiresISO: membership?.end_date || null,
            initials: member.full_name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
            color: colors[index % colors.length],
            plan: plan?.name || (membership?.status === 'pending_payment' ? 'Custom membership' : '—'),
            expires,
            status,
          }
        })

        const metrics = {
          total_members: dbMembers.length,
          active_memberships: activeMemberships.length,
          today_check_ins: (attendanceResponse.data || []).length,
          expiring_soon: expiringSoon.length,
          expired_memberships: expiredMemberships.length,
        }

        if (!cancelled) {
          setProfileName(profile.full_name)
          setGymName(gym.name)
          setProfileRole(profile.role)
          setGymId(profile.gym_id)
          setGymDetails(gym)
          setMemberRecords(formattedMembers)
          setMembershipRecords(formattedMemberships)
          setPlanRecords(dbPlans)
          setPaymentRecords(paymentMemberRecords)
          setAttendanceRecords(attendanceMemberRecords)
          setDashboard(metrics)
          setApiError('')
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(error.message || 'Could not load your gym data.')
          setDashboard(null)
          setMemberRecords([])
          setMembershipRecords([])
          setPlanRecords([])
          setPaymentRecords([])
          setAttendanceRecords([])
        }
      } finally {
        if (!cancelled) setMembersLoading(false)
      }
    }

    loadGymData()
    return () => { cancelled = true }
  }, [session.user.id, refreshKey])

  const today = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const userMetadata = session?.user?.user_metadata || {}
  const userName = profileName || userMetadata.full_name || 'Gym Owner'
  const displayedGymName = gymName || userMetadata.gym_name || 'Your Gym'
  const userEmail = session?.user?.email || ''

  return (
    <div className="min-h-screen bg-[#f7f8f7]">
      <Sidebar activePage={activePage} onNavigate={setActivePage} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={onLogout} userName={userName} userEmail={userEmail} gymName={displayedGymName} />
      <div className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"><Menu size={21} /></button><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{activePage}</p><p className="mt-0.5 hidden text-xs text-gray-500 sm:block">GymAccess / {activePage}</p></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden text-xs text-gray-500 xl:block">{today}</span><button aria-label="Notifications" title="Notifications" className="relative rounded-xl border border-gray-200 p-2.5 text-gray-600 hover:bg-gray-50"><Bell size={18} /></button><span className="hidden h-8 w-px bg-gray-200 sm:block" /><span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">{userName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span></div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-7 sm:py-8 lg:px-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-gray-500">{today}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[30px]">{activePage === 'Overview' ? `Good morning, ${userName.split(' ')[0]}` : activePage}</h1><p className="mt-2 text-sm text-gray-500">{pageDescriptions[activePage] || 'Manage your GymAccess workspace.'}</p><p className={`mt-2 text-xs font-medium ${apiError ? 'text-rose-700' : dashboard ? 'text-emerald-700' : 'text-gray-500'}`}>{apiError ? `Database connection failed: ${apiError}` : dashboard ? 'Supabase connected — this workspace shows live gym records.' : 'Loading your gym data…'}</p></div><button onClick={() => setShowMemberModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15251f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#243c31]"><Plus size={17} /> Register member</button></div>
          {activePage === 'Overview'
            ? <Overview search={search} onSearch={setSearch} onAddMember={() => setShowMemberModal(true)} onNavigate={setActivePage} dashboard={dashboard} apiError={apiError} memberRecords={memberRecords} membersLoading={membersLoading} onViewCard={setCardMember} />
            : activePage === 'Payments'
              ? <PaymentsPage paymentRecords={paymentRecords} profileRole={profileRole} onRefresh={() => setRefreshKey(key => key + 1)} />
              : activePage === 'Members'
                ? <MembersPage members={memberRecords} loading={membersLoading} search={search} onSearch={setSearch} onAddMember={() => setShowMemberModal(true)} onViewCard={setCardMember} />
                : activePage === 'Attendance'
                  ? <AttendancePage attendanceRecords={attendanceRecords} onRefresh={() => setRefreshKey(key => key + 1)} />
                  : activePage === 'Memberships'
                    ? <MembershipsPage memberships={membershipRecords} plans={planRecords} gymId={gymId} profileRole={profileRole} onRefresh={() => setRefreshKey(key => key + 1)} />
                    : activePage === 'Settings'
                      ? <SettingsPage gymDetails={gymDetails} gymId={gymId} profileName={profileName} profileRole={profileRole} userId={session.user.id} onGymUpdated={updated => { setGymDetails(updated); setGymName(updated.name) }} onProfileUpdated={updatedName => setProfileName(updatedName)} />
                      : <PlaceholderPage page={activePage} onAddMember={() => setShowMemberModal(true)} />}
        </main>
        <footer className="border-t border-gray-200/80 px-5 py-5 text-center text-xs text-gray-400 sm:px-9">GymAccess · Membership management made simple</footer>
      </div>
      {showMemberModal && <AddMemberModal plans={planRecords} onClose={() => setShowMemberModal(false)} onRegistered={() => setRefreshKey(key => key + 1)} />}
      {cardMember && <MemberCardModal member={cardMember} gymName={displayedGymName} onClose={() => setCardMember(null)} />}
    </div>
  )
}

// Keep authentication separate from the dashboard component so its hooks remain stable.
export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession)
        setAuthLoading(false)
      }
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      setSession(error ? null : data?.session ?? null)
      setAuthLoading(false)
    }).catch(() => {
      if (mounted) {
        setSession(null)
        setAuthLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('GymAccess sign-out failed:', error.message)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-400/25 border-t-emerald-400" />
          <p className="mt-4 text-sm text-slate-300">Loading GymAccess...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth onAuthenticated={setSession} />
  }

  return <Dashboard session={session} onLogout={handleLogout} />
}
