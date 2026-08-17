import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import DarkSelect from '../components/ui/DarkSelect'
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
  SkeletonGrid,
  SkeletonList,
} from '../components/motion'
import { STAT_LABEL } from '../constants/breakpoints'
import usePageTitle from '../hooks/usePageTitle'
import { fetchTables, createTableThunk, deleteTableThunk, assignTableWaiterThunk } from '../store/tableSlice'
import { fetchWaiters } from '../store/waiterSlice'

export default function TablesList() {
  usePageTitle('Tables')
  const dispatch = useDispatch()
  const { list: tables, loading, error } = useSelector((state) => state.tables)
  const { list: waiters } = useSelector((state) => state.waiters)
  const [view, setView] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [number, setNumber] = useState('')
  const [capacity, setCapacity] = useState(4)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchTables())
    dispatch(fetchWaiters())
  }, [dispatch])

  const filtered = searchQuery.trim()
    ? tables.filter((t) => t.number.toLowerCase().includes(searchQuery.toLowerCase()))
    : tables

  const assignedCount = filtered.filter((t) => t.assignedWaiter).length

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const action = await dispatch(createTableThunk({ number, capacity: Number(capacity) || 4 }))
    setSaving(false)
    if (createTableThunk.fulfilled.match(action)) {
      setModalOpen(false)
      setNumber('')
      setCapacity(4)
    }
  }

  const handleAssign = (tableId, waiterId) => {
    dispatch(assignTableWaiterThunk({ tableId, waiterId: waiterId || null }))
  }

  const handleDelete = (table) => {
    if (window.confirm(`Delete table "${table.number}"?`)) {
      dispatch(deleteTableThunk(table._id))
    }
  }

  return (
    <DashboardLayout
      variant="branch-manager"
      title="Tables Management"
      searchPlaceholder="Search tables..."
      showAdd
      addLabel="Add Table"
      onAdd={() => setModalOpen(true)}
      onSearch={setSearchQuery}
    >
      <PageHeader
        title="Dining Floor"
        subtitle="Create tables and assign waiters"
        hideActionsBelowSm
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1 border border-outline-variant">
              <button type="button" onClick={() => setView('grid')} className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 ${view === 'grid' ? 'bg-surface shadow-sm text-primary' : 'text-outline'}`}>
                <Icon name="grid_view" size={20} />
              </button>
              <button type="button" onClick={() => setView('list')} className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 ${view === 'list' ? 'bg-surface shadow-sm text-primary' : 'text-outline'}`}>
                <Icon name="view_list" size={20} />
              </button>
            </div>
            <AnimatedButton onClick={() => setModalOpen(true)}>
              <Icon name="add" size={18} />
              Add Table
            </AnimatedButton>
          </div>
        }
      />

      <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 gap-stack-lg mb-stack-lg">
        <AnimatedCard staggerChild className="p-stack-lg !bg-surface-container-lowest card-elevation border-0">
          <p className={STAT_LABEL}>Total Tables</p>
          <h3 className="font-numeral-lg text-primary">{filtered.length}</h3>
        </AnimatedCard>
        <AnimatedCard staggerChild className="p-stack-lg !bg-surface-container-lowest card-elevation border-0">
          <p className={STAT_LABEL}>Assigned</p>
          <h3 className="font-numeral-lg text-secondary">{assignedCount}</h3>
        </AnimatedCard>
      </AnimatedCardGrid>

      {error && (
        <div className="mb-stack-md">
          <MotionBanner type="error">
            {Array.isArray(error) ? error.join(', ') : error}
          </MotionBanner>
        </div>
      )}

      {loading && tables.length === 0 ? (
        view === 'grid' ? <SkeletonGrid count={6} /> : <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="table_restaurant"
          title={searchQuery.trim() ? `No tables match "${searchQuery}"` : 'No tables yet'}
          hint={searchQuery.trim() ? undefined : 'Add one to get started.'}
          action={
            !searchQuery.trim() ? (
              <AnimatedButton onClick={() => setModalOpen(true)}>
                <Icon name="add" size={18} />
                Add Table
              </AnimatedButton>
            ) : null
          }
        />
      ) : view === 'list' ? (
        <ResponsiveDataTable
          columns={[
            { key: 'number', label: 'Table', render: (t) => <span className="font-semibold">{t.number}</span> },
            { key: 'capacity', label: 'Seats', hideOnTablet: true, render: (t) => t.capacity || 4 },
            {
              key: 'waiter',
              label: 'Assigned Waiter',
              render: (t) => (
                <DarkSelect
                  compact
                  value={t.assignedWaiter?._id || t.assignedWaiter || ''}
                  onChange={(e) => handleAssign(t._id, e.target.value)}
                  selectClassName="min-w-[9rem] max-w-full"
                >
                  <option value="">Unassigned</option>
                  {waiters.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </DarkSelect>
              ),
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (t) => (
                <button
                  type="button"
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-error hover:bg-error-container"
                  onClick={() => handleDelete(t)}
                >
                  <Icon name="delete" size={18} />
                </button>
              ),
            },
          ]}
          rows={filtered}
          rowKey="_id"
        />
      ) : (
        <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <AnimatedCard key={t._id} staggerChild className="p-4 !bg-surface-container-lowest space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-primary">{t.number}</h4>
                <button type="button" className="text-error" onClick={() => handleDelete(t)}>
                  <Icon name="delete" size={16} />
                </button>
              </div>
              <p className="text-xs text-outline">{t.capacity || 4} seats</p>
              <DarkSelect
                compact
                label="Assigned waiter"
                value={t.assignedWaiter?._id || t.assignedWaiter || ''}
                onChange={(e) => handleAssign(t._id, e.target.value)}
              >
                <option value="">Unassigned</option>
                {waiters.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </DarkSelect>
            </AnimatedCard>
          ))}
        </AnimatedCardGrid>
      )}

      <AnimatedModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Table"
        footer={
          <>
            <AnimatedButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AnimatedButton>
            <AnimatedButton type="submit" form="table-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</AnimatedButton>
          </>
        }
      >
        <form id="table-form" onSubmit={handleSave} className="space-y-4">
          <AnimatedInput id="table-number" label="Table Number" placeholder="e.g. A1" value={number} onChange={(e) => setNumber(e.target.value)} required />
          <AnimatedInput id="table-capacity" label="Seat capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
        </form>
      </AnimatedModal>
    </DashboardLayout>
  )
}
