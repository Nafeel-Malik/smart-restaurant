import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import DarkSelect from '../components/ui/DarkSelect'
import { PageHeader } from '../components/common'
import ResponsiveDataTable from '../components/tables/ResponsiveDataTable'
import { GRID, STAT_BODY, STAT_LABEL } from '../constants/breakpoints'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedInput,
  AnimatedModal,
  EmptyState,
  MotionBanner,
  ScrollReveal,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import {
  fetchManagers,
  deleteManagerThunk,
  updateManagerThunk,
  assignManagerThunk,
  unassignManagerThunk,
} from '../store/managerSlice.js'
import { fetchRestaurants } from '../store/restaurantSlice.js'

function refId(ref) {
  if (!ref) return ''
  if (typeof ref === 'object') return String(ref._id || ref.id || '')
  return String(ref)
}

export default function ManagersList() {
  usePageTitle('Managers')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { list: managers, loading, error } = useSelector((state) => state.managers)
  const { list: restaurants } = useSelector((state) => state.restaurants)

  const [searchQuery, setSearchQuery] = useState('')
  const [editingManager, setEditingManager] = useState(null)
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [editRestaurantId, setEditRestaurantId] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState(null)

  useEffect(() => {
    dispatch(fetchManagers())
    dispatch(fetchRestaurants())
  }, [dispatch])

  const filtered = searchQuery.trim()
    ? managers.filter((m) => {
        const q = searchQuery.toLowerCase()
        const restaurantName = m.assignedRestaurant?.name?.toLowerCase() || ''
        return m.username.toLowerCase().includes(q) || restaurantName.includes(q)
      })
    : managers

  const unassignedCount = managers.filter((m) => !m.assignedRestaurant).length
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    const aManaged = a.assignedManager ? 1 : 0
    const bManaged = b.assignedManager ? 1 : 0
    if (aManaged !== bManaged) return aManaged - bManaged
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

  const handleDelete = (id, username) => {
    if (window.confirm(`Are you sure you want to delete manager "${username}"?`)) {
      dispatch(deleteManagerThunk(id))
        .unwrap()
        .then(() => {
          dispatch(fetchRestaurants())
        })
    }
  }

  const openEditModal = (manager) => {
    setEditingManager(manager)
    setEditUsername(manager.username)
    setEditPassword('')
    setShowPassword(false)
    setEditRestaurantId(refId(manager.assignedRestaurant))
    setUpdateError(null)
  }

  const closeEditModal = () => {
    setEditingManager(null)
    setEditUsername('')
    setEditPassword('')
    setShowPassword(false)
    setEditRestaurantId('')
    setUpdateError(null)
  }

  const confirmRestaurantChange = (nextRestaurantId) => {
    if (!editingManager) return true

    const currentRestaurantId = refId(editingManager.assignedRestaurant)
    if (nextRestaurantId === currentRestaurantId) return true

    if (!nextRestaurantId && currentRestaurantId) {
      const currentName = editingManager.assignedRestaurant?.name || 'the current restaurant'
      return window.confirm(`Unassign "${editingManager.username}" from "${currentName}"?`)
    }

    const target = restaurants.find((r) => r._id === nextRestaurantId)
    const occupyingId = refId(target?.assignedManager)
    if (occupyingId && occupyingId !== editingManager._id) {
      const occupyingName = target?.assignedManager?.username || 'another manager'
      return window.confirm(
        `"${target?.name || 'This restaurant'}" is currently assigned to "${occupyingName}". Reassign it to "${editingManager.username}"?`
      )
    }

    return true
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    if (!editingManager) return

    setUpdating(true)
    setUpdateError(null)

    const currentRestaurantId = refId(editingManager.assignedRestaurant)
    const nextRestaurantId = editRestaurantId

    if (!confirmRestaurantChange(nextRestaurantId)) {
      setUpdating(false)
      return
    }

    try {
      const payload = {}
      if (editUsername.trim() !== editingManager.username) {
        payload.username = editUsername.trim()
      }
      if (editPassword) {
        payload.password = editPassword
      }

      if (Object.keys(payload).length > 0) {
        await dispatch(updateManagerThunk({ id: editingManager._id, data: payload })).unwrap()
      }

      if (nextRestaurantId !== currentRestaurantId) {
        if (!nextRestaurantId && currentRestaurantId) {
          await dispatch(unassignManagerThunk(currentRestaurantId)).unwrap()
        } else if (nextRestaurantId) {
          await dispatch(assignManagerThunk({
            restaurantId: nextRestaurantId,
            managerId: editingManager._id,
          })).unwrap()
        }
      }

      closeEditModal()
    } catch (err) {
      setUpdateError(err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <DashboardLayout
      title="Managers"
      searchPlaceholder="Search managers..."
      showAdd
      addLabel="Add New"
      addPath="/managers/assign"
      onSearch={setSearchQuery}
    >
      <PageHeader
        title="Manager Directory"
        subtitle="Assign and oversee branch leadership"
      />

      <AnimatedCardGrid className={`${GRID.stats} mb-stack-lg`}>
        <AnimatedCard staggerChild className="p-stack-lg flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="badge" size={24} />
          </div>
          <div className={STAT_BODY}>
            <p className={STAT_LABEL}>Total Managers</p>
            <h3 className="font-numeral-lg text-numeral-lg text-primary">{managers.length}</h3>
          </div>
        </AnimatedCard>
        <AnimatedCard staggerChild className="p-stack-lg flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="link_off" size={24} />
          </div>
          <div className={STAT_BODY}>
            <p className={STAT_LABEL}>Unassigned</p>
            <h3 className="font-numeral-lg text-numeral-lg text-secondary">{unassignedCount}</h3>
          </div>
        </AnimatedCard>
      </AnimatedCardGrid>

      {error && (
        <MotionBanner type="error" className="mb-stack-md">
          {Array.isArray(error) ? error.join(', ') : error}
        </MotionBanner>
      )}

      <ScrollReveal>
        {loading && managers.length === 0 ? (
          <SkeletonList count={4} />
        ) : !loading && filtered.length === 0 ? (
          <EmptyState
            icon="badge"
            title={searchQuery.trim() ? 'No matches' : 'No managers yet'}
            hint={
              searchQuery.trim()
                ? `No managers match "${searchQuery}"`
                : 'Add one to get started.'
            }
            action={
              !searchQuery.trim() ? (
                <AnimatedButton onClick={() => navigate('/managers/assign')}>
                  <Icon name="person_add" size={18} />
                  Add Manager
                </AnimatedButton>
              ) : null
            }
          />
        ) : (
          <ResponsiveDataTable
            columns={[
              {
                key: 'username',
                label: 'Username',
                render: (m) => {
                  const initials = m.username.substring(0, 2).toUpperCase()
                  return (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-on-primary-container">
                        {initials}
                      </div>
                      <span className="font-semibold text-body-md">{m.username}</span>
                    </div>
                  )
                },
              },
              {
                key: 'role',
                label: 'Role',
                hideOnTablet: true,
                render: (m) => m.role,
              },
              {
                key: 'restaurant',
                label: 'Assigned Restaurant',
                render: (m) =>
                  m.assignedRestaurant?.name ? (
                    m.assignedRestaurant.name
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditModal(m)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary-container px-3 py-2 text-xs font-semibold text-on-primary-container hover:opacity-90"
                    >
                      <Icon name="add_link" size={14} />
                      Assign restaurant
                    </button>
                  ),
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (m) => (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(m)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"
                      title="Edit manager"
                    >
                      <Icon name="edit" size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m._id, m.username)}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-error hover:bg-error-container"
                      title="Delete manager"
                    >
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                ),
              },
            ]}
            rows={filtered}
            rowKey="_id"
            footer={
              managers.length > 0 ? (
                <>
                  {filtered.length} manager{filtered.length !== 1 ? 's' : ''}
                  {searchQuery.trim() ? ' matching search' : ' total'}
                  {unassignedCount > 0 && !searchQuery.trim() ? ` · ${unassignedCount} unassigned` : ''}
                </>
              ) : null
            }
          />
        )}
      </ScrollReveal>

      <AnimatedModal
        open={Boolean(editingManager)}
        onClose={closeEditModal}
        title={editingManager?.assignedRestaurant ? 'Edit Manager' : 'Assign Restaurant'}
        footer={
          <>
            <AnimatedButton variant="ghost" type="button" onClick={closeEditModal} disabled={updating}>
              Cancel
            </AnimatedButton>
            <AnimatedButton type="submit" form="edit-manager-form" disabled={updating}>
              {updating ? 'Saving...' : 'Save Changes'}
            </AnimatedButton>
          </>
        }
      >
        {updateError && (
          <MotionBanner type="error" className="mb-4">
            {Array.isArray(updateError) ? updateError.join(', ') : updateError}
          </MotionBanner>
        )}

        <form id="edit-manager-form" onSubmit={handleUpdateSubmit} className="space-y-4">
          <AnimatedInput
            id="editUsername"
            label="Username"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            required
          />
          <div className="relative">
            <AnimatedInput
              id="editPassword"
              label="New Password (optional)"
              type={showPassword ? 'text' : 'password'}
              placeholder="Leave blank to keep current"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              inputClassName="pr-11"
            />
            <button
              type="button"
              className="absolute right-3 top-[22px] z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
            </button>
          </div>
          <DarkSelect
            id="editRestaurant"
            label="Assigned Restaurant"
            icon="store"
            value={editRestaurantId}
            onChange={(e) => setEditRestaurantId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {sortedRestaurants.map((r) => {
              const occupyingId = refId(r.assignedManager)
              const occupyingName = r.assignedManager?.username
              const isCurrent = occupyingId === editingManager?._id
              return (
                <option key={r._id} value={r._id}>
                  {occupyingName && !isCurrent
                    ? `${r.name} — currently ${occupyingName}`
                    : r.name}
                </option>
              )
            })}
          </DarkSelect>
          <p className="text-xs text-outline -mt-2">
            You can assign an unassigned restaurant, or reassign one that already has a manager.
          </p>
        </form>
      </AnimatedModal>
    </DashboardLayout>
  )
}
