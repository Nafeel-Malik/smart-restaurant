import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import { PageHeader } from '../components/common'
import ResponsiveDataTable from '../components/tables/ResponsiveDataTable'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedInput,
  AnimatedModal,
  EmptyState,
  MotionBanner,
  SkeletonList,
} from '../components/motion'
import { STAT_BODY, STAT_LABEL } from '../constants/breakpoints'
import usePageTitle from '../hooks/usePageTitle'
import { fetchWaiters, createWaiterThunk, updateWaiterThunk, deleteWaiterThunk } from '../store/waiterSlice'

const emptyForm = { name: '', email: '', timeIn: '10:00', timeOut: '18:00' }

export default function WaitersList() {
  usePageTitle('Waiters')
  const dispatch = useDispatch()
  const { list: waiters, loading, error } = useSelector((state) => state.waiters)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchWaiters())
  }, [dispatch])

  const filtered = searchQuery.trim()
    ? waiters.filter((w) =>
        `${w.name} ${w.email}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : waiters

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (waiter) => {
    setEditing(waiter)
    setForm({
      name: waiter.name || '',
      email: waiter.email || '',
      timeIn: waiter.timeIn || '10:00',
      timeOut: waiter.timeOut || '18:00',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const action = editing
      ? await dispatch(updateWaiterThunk({ id: editing._id, data: form }))
      : await dispatch(createWaiterThunk(form))
    setSaving(false)
    if (action.type.endsWith('/fulfilled')) setModalOpen(false)
  }

  const handleDelete = (waiter) => {
    if (window.confirm(`Delete waiter "${waiter.name}"?`)) {
      dispatch(deleteWaiterThunk(waiter._id))
    }
  }

  return (
    <DashboardLayout
      variant="branch-manager"
      title="Waiters Management"
      searchPlaceholder="Search waiters..."
      showAdd
      addLabel="Add Waiter"
      onAdd={openAdd}
      onSearch={setSearchQuery}
    >
      <PageHeader
        title="Floor Staff"
        subtitle="Track waiters and their assigned tables"
        hideActionsBelowSm
        actions={
          <AnimatedButton onClick={openAdd}>
            <Icon name="add" size={18} />
            Add Waiter
          </AnimatedButton>
        }
      />

      <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 gap-stack-lg mb-stack-lg">
        <AnimatedCard staggerChild className="p-stack-lg flex items-center gap-4 !bg-surface-container-lowest card-elevation border-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="person" size={24} />
          </div>
          <div className={STAT_BODY}>
            <p className={STAT_LABEL}>Total Waiters</p>
            <h3 className="font-numeral-lg text-numeral-lg text-secondary">{filtered.length}</h3>
          </div>
        </AnimatedCard>
      </AnimatedCardGrid>

      {error && (
        <div className="mb-stack-md">
          <MotionBanner type="error">
            {Array.isArray(error) ? error.join(', ') : error}
          </MotionBanner>
        </div>
      )}

      {loading && waiters.length === 0 ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="person"
          title={searchQuery.trim() ? `No waiters match "${searchQuery}"` : 'No waiters yet'}
          hint={searchQuery.trim() ? undefined : 'Add one to get started.'}
          action={
            !searchQuery.trim() ? (
              <AnimatedButton onClick={openAdd}>
                <Icon name="add" size={18} />
                Add Waiter
              </AnimatedButton>
            ) : null
          }
        />
      ) : (
        <ResponsiveDataTable
          columns={[
            { key: 'name', label: 'Waiter', render: (w) => <span className="font-semibold">{w.name}</span> },
            { key: 'email', label: 'Email', hideOnTablet: true, render: (w) => w.email },
            { key: 'timeIn', label: 'Time In', hideOnTablet: true, render: (w) => w.timeIn },
            { key: 'timeOut', label: 'Time Out', hideOnTablet: true, render: (w) => w.timeOut },
            {
              key: 'tables',
              label: 'Tables',
              hideOnTablet: true,
              render: (w) => {
                const tables = Array.isArray(w.assignedTables) ? w.assignedTables : []
                return tables.length ? (
                  <div className="flex flex-wrap justify-end gap-1 sm:justify-start">
                    {tables.map((t) => (
                      <span key={t._id || t} className="rounded bg-surface-container-high px-2 py-0.5 text-[11px] font-bold">
                        {t.number || t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-outline">None</span>
                )
              },
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (w) => (
                <div className="flex justify-end gap-1">
                  <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-surface-container-high" onClick={() => openEdit(w)}>
                    <Icon name="edit" size={18} />
                  </button>
                  <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-error hover:bg-error-container" onClick={() => handleDelete(w)}>
                    <Icon name="delete" size={18} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={filtered}
          rowKey="_id"
        />
      )}

      <AnimatedModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Waiter' : 'Add Waiter'}
        footer={
          <>
            <AnimatedButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AnimatedButton>
            <AnimatedButton type="submit" form="waiter-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </AnimatedButton>
          </>
        }
      >
        <form id="waiter-form" onSubmit={handleSave} className="space-y-4">
          <AnimatedInput id="waiter-name" label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <AnimatedInput id="waiter-email" label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatedInput id="waiter-in" label="Time In" type="time" value={form.timeIn} onChange={(e) => setForm((f) => ({ ...f, timeIn: e.target.value }))} required />
            <AnimatedInput id="waiter-out" label="Time Out" type="time" value={form.timeOut} onChange={(e) => setForm((f) => ({ ...f, timeOut: e.target.value }))} required />
          </div>
        </form>
      </AnimatedModal>
    </DashboardLayout>
  )
}
