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
import { fetchChefs, createChefThunk, updateChefThunk, deleteChefThunk } from '../store/chefSlice'

const emptyForm = { name: '', email: '', timeIn: '09:00', timeOut: '17:00' }

export default function ChefsList() {
  usePageTitle('Chefs')
  const dispatch = useDispatch()
  const { list: chefs, loading, error } = useSelector((state) => state.chefs)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchChefs())
  }, [dispatch])

  const filtered = searchQuery.trim()
    ? chefs.filter((c) =>
        `${c.name} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chefs

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (chef) => {
    setEditing(chef)
    setForm({
      name: chef.name || '',
      email: chef.email || '',
      timeIn: chef.timeIn || '09:00',
      timeOut: chef.timeOut || '17:00',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const action = editing
      ? await dispatch(updateChefThunk({ id: editing._id, data: form }))
      : await dispatch(createChefThunk(form))
    setSaving(false)
    if (action.type.endsWith('/fulfilled')) setModalOpen(false)
  }

  const handleDelete = (chef) => {
    if (window.confirm(`Delete chef "${chef.name}"?`)) {
      dispatch(deleteChefThunk(chef._id))
    }
  }

  return (
    <DashboardLayout
      variant="branch-manager"
      title="Chef Roster"
      searchPlaceholder="Search chefs..."
      showAdd
      addLabel="Add Chef"
      onAdd={openAdd}
      onSearch={setSearchQuery}
    >
      <PageHeader
        title="Kitchen Team"
        subtitle="Manage chefs assigned to this branch"
        hideActionsBelowSm
        actions={
          <AnimatedButton onClick={openAdd}>
            <Icon name="add" size={18} />
            Add Chef
          </AnimatedButton>
        }
      />

      <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 gap-stack-lg mb-stack-lg">
        <AnimatedCard staggerChild className="p-stack-lg flex items-center gap-4 !bg-surface-container-lowest card-elevation border-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="chef_hat" size={24} />
          </div>
          <div className={STAT_BODY}>
            <p className={STAT_LABEL}>Total Chefs</p>
            <h3 className="font-numeral-lg text-numeral-lg text-primary">{filtered.length}</h3>
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

      {loading && chefs.length === 0 ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="chef_hat"
          title={searchQuery.trim() ? `No chefs match "${searchQuery}"` : 'No chefs yet'}
          hint={searchQuery.trim() ? undefined : 'Add one to get started.'}
          action={
            !searchQuery.trim() ? (
              <AnimatedButton onClick={openAdd}>
                <Icon name="add" size={18} />
                Add Chef
              </AnimatedButton>
            ) : null
          }
        />
      ) : (
        <ResponsiveDataTable
          columns={[
            { key: 'name', label: 'Chef', render: (c) => <span className="font-semibold">{c.name}</span> },
            { key: 'email', label: 'Email', hideOnTablet: true, render: (c) => c.email },
            { key: 'timeIn', label: 'Time In', hideOnTablet: true, render: (c) => c.timeIn },
            { key: 'timeOut', label: 'Time Out', hideOnTablet: true, render: (c) => c.timeOut },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (c) => (
                <div className="flex justify-end gap-1">
                  <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 hover:bg-surface-container-high" onClick={() => openEdit(c)}>
                    <Icon name="edit" size={18} />
                  </button>
                  <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-error hover:bg-error-container" onClick={() => handleDelete(c)}>
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
        title={editing ? 'Edit Chef' : 'Add Chef'}
        footer={
          <>
            <AnimatedButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AnimatedButton>
            <AnimatedButton type="submit" form="chef-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </AnimatedButton>
          </>
        }
      >
        <form id="chef-form" onSubmit={handleSave} className="space-y-4">
          <AnimatedInput id="chef-name" label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <AnimatedInput id="chef-email" label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatedInput id="chef-in" label="Time In" type="time" value={form.timeIn} onChange={(e) => setForm((f) => ({ ...f, timeIn: e.target.value }))} required />
            <AnimatedInput id="chef-out" label="Time Out" type="time" value={form.timeOut} onChange={(e) => setForm((f) => ({ ...f, timeOut: e.target.value }))} required />
          </div>
        </form>
      </AnimatedModal>
    </DashboardLayout>
  )
}
