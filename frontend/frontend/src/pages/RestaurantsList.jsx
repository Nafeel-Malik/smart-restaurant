import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import DarkSelect from '../components/ui/DarkSelect'
import Toggle from '../components/ui/Toggle'
import { PageHeader } from '../components/common'
import ResponsiveDataTable from '../components/tables/ResponsiveDataTable'
import { GRID, STAT_BODY, STAT_LABEL } from '../constants/breakpoints'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedModal,
  EmptyState,
  MotionBanner,
  ScrollReveal,
  SkeletonList,
} from '../components/motion'
import { fetchRestaurants, deleteRestaurantThunk, updateRestaurantThunk } from '../store/restaurantSlice'
import { fetchManagers, assignManagerThunk, unassignManagerThunk } from '../store/managerSlice'
import usePageTitle from '../hooks/usePageTitle'

function refId(ref) {
  if (!ref) return ''
  if (typeof ref === 'object') return String(ref._id || ref.id || '')
  return String(ref)
}

function restaurantIdOfManager(manager) {
  return refId(manager?.assignedRestaurant)
}

export default function RestaurantsList() {
  usePageTitle('Restaurants')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { list: restaurants, loading, error } = useSelector((state) => state.restaurants)
  const { list: managers } = useSelector((state) => state.managers)

  useEffect(() => {
    dispatch(fetchRestaurants())
    dispatch(fetchManagers())
  }, [dispatch])

  const [searchQuery, setSearchQuery] = useState('')
  const [assigningRestaurant, setAssigningRestaurant] = useState(null)
  const [selectedManagerId, setSelectedManagerId] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)
  const [assignError, setAssignError] = useState(null)

  const filtered = searchQuery.trim()
    ? restaurants.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : restaurants

  const totalActive = filtered.filter((r) => r.status === 1).length
  const totalRestaurants = filtered.length
  const unassignedCount = restaurants.filter((r) => !r.assignedManager).length
  const idleManagers = managers.filter((m) => !m.assignedRestaurant)
  const busyManagers = managers.filter((m) => m.assignedRestaurant)

  const handleToggle = (restaurant) => {
    const newStatus = restaurant.status === 1 ? 0 : 1
    dispatch(updateRestaurantThunk({ id: restaurant._id, data: { status: newStatus } }))
  }

  const handleDelete = (restaurant) => {
    if (window.confirm(`Delete "${restaurant.name}"? This cannot be undone.`)) {
      dispatch(deleteRestaurantThunk(restaurant._id))
    }
  }

  const openAssignModal = (restaurant) => {
    setAssigningRestaurant(restaurant)
    setSelectedManagerId(refId(restaurant.assignedManager))
    setAssignError(null)
  }

  const closeAssignModal = () => {
    setAssigningRestaurant(null)
    setSelectedManagerId('')
    setAssignError(null)
  }

  const handleAssignSubmit = async (e) => {
    e.preventDefault()
    if (!assigningRestaurant) return

    const currentManagerId = refId(assigningRestaurant.assignedManager)
    const nextManagerId = selectedManagerId

    if (nextManagerId === currentManagerId) {
      closeAssignModal()
      return
    }

    const nextManager = managers.find((m) => m._id === nextManagerId)
    const nextManagerRestaurantId = restaurantIdOfManager(nextManager)
    if (nextManager && nextManagerRestaurantId && nextManagerRestaurantId !== assigningRestaurant._id) {
      const currentBranch = nextManager.assignedRestaurant?.name || 'another restaurant'
      const confirmed = window.confirm(
        `"${nextManager.username}" is currently assigned to "${currentBranch}". Move them to "${assigningRestaurant.name}"?`
      )
      if (!confirmed) return
    }

    if (!nextManagerId && currentManagerId) {
      const confirmed = window.confirm(
        `Unassign "${assigningRestaurant.assignedManager?.username || 'this manager'}" from "${assigningRestaurant.name}"?`
      )
      if (!confirmed) return
    }

    setSavingAssign(true)
    setAssignError(null)
    try {
      if (!nextManagerId) {
        await dispatch(unassignManagerThunk(assigningRestaurant._id)).unwrap()
      } else {
        await dispatch(assignManagerThunk({
          restaurantId: assigningRestaurant._id,
          managerId: nextManagerId,
        })).unwrap()
      }
      closeAssignModal()
    } catch (err) {
      setAssignError(err)
    } finally {
      setSavingAssign(false)
    }
  }

  return (
    <DashboardLayout
      title="Restaurants"
      searchPlaceholder="Search restaurants…"
      onSearch={(val) => setSearchQuery(val)}
      showAdd
      addLabel="Add Restaurant"
      addPath="/restaurants/new"
    >
      <PageHeader
        title="Manage Establishments"
        subtitle="Oversee all restaurant branches across the network"
        hideActionsBelowSm
        actions={
          <AnimatedButton onClick={() => navigate('/restaurants/new')}>
            <Icon name="add" size={18} className="text-[18px]" />
            Add New Restaurant
          </AnimatedButton>
        }
      />

      <AnimatedCardGrid className={`${GRID.cardsThree} mb-stack-lg`}>
        <AnimatedCard staggerChild className="p-stack-lg flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="store" size={24} />
          </div>
          <div className={STAT_BODY}>
            <p className={STAT_LABEL}>Total Branches</p>
            <h3 className="font-numeral-lg text-numeral-lg text-primary">{totalRestaurants}</h3>
          </div>
        </AnimatedCard>
        <AnimatedCard staggerChild className="p-stack-lg flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="check_circle" size={24} />
          </div>
          <div className={STAT_BODY}>
            <p className={STAT_LABEL}>Active Branches</p>
            <h3 className="font-numeral-lg text-numeral-lg text-secondary">{totalActive}</h3>
          </div>
        </AnimatedCard>
        <AnimatedCard staggerChild className="p-stack-lg flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container">
            <Icon name="person_off" size={24} />
          </div>
          <div className={STAT_BODY}>
            <p className={STAT_LABEL}>Unassigned</p>
            <h3 className="font-numeral-lg text-numeral-lg text-tertiary">{unassignedCount}</h3>
          </div>
        </AnimatedCard>
      </AnimatedCardGrid>

      {error && (
        <MotionBanner type="error" className="mb-stack-md">
          {Array.isArray(error) ? error.join(', ') : error}
        </MotionBanner>
      )}

      <ScrollReveal>
        {loading && restaurants.length === 0 ? (
          <SkeletonList count={4} />
        ) : !loading && filtered.length === 0 ? (
          <EmptyState
            icon="storefront"
            title={searchQuery.trim() ? 'No matches' : 'No restaurants yet'}
            hint={
              searchQuery.trim()
                ? `No restaurants match "${searchQuery}"`
                : 'Add one to get started.'
            }
            action={
              !searchQuery.trim() ? (
                <AnimatedButton onClick={() => navigate('/restaurants/new')}>
                  <Icon name="add" size={18} />
                  Add Restaurant
                </AnimatedButton>
              ) : null
            }
          />
        ) : (
          <ResponsiveDataTable
            columns={[
              {
                key: 'logo',
                label: 'Logo',
                hideOnTablet: true,
                mobile: false,
                render: (r) =>
                  r.logo ? (
                    <img src={r.logo} alt={r.name} className="h-10 w-10 rounded-lg border border-outline-variant object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant">
                      <Icon name="restaurant" size={20} />
                    </div>
                  ),
              },
              {
                key: 'name',
                label: 'Restaurant',
                render: (r) => <span className="font-semibold text-body-md">{r.name}</span>,
              },
              {
                key: 'opening',
                label: 'Opening',
                hideOnTablet: true,
                render: (r) => r.openingTime,
              },
              {
                key: 'closing',
                label: 'Closing',
                hideOnTablet: true,
                render: (r) => r.closingTime,
              },
              {
                key: 'currency',
                label: 'Currency',
                hideOnTablet: true,
                render: (r) => r.currency,
              },
              {
                key: 'manager',
                label: 'Manager',
                render: (r) => {
                  const manager = r.assignedManager
                  const managerName = manager?.username
                  const initials = managerName ? managerName.substring(0, 2).toUpperCase() : null
                  return initials ? (
                    <button
                      type="button"
                      onClick={() => openAssignModal(r)}
                      className="group/manager flex items-center gap-2 text-left"
                      title="Change manager"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold text-on-primary-container">
                        {initials}
                      </div>
                      <span className="text-body-md">{managerName}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAssignModal(r)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary-container px-3 py-2 text-xs font-semibold text-on-primary-container hover:opacity-90"
                    >
                      <Icon name="add_link" size={14} />
                      Assign manager
                    </button>
                  )
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => (
                  <Toggle
                    id={`rest-${r._id}`}
                    checked={r.status === 1}
                    onChange={() => handleToggle(r)}
                    label={r.status === 1 ? 'Active' : 'Inactive'}
                  />
                ),
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (r) => (
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"
                      title="Assign manager"
                      onClick={() => openAssignModal(r)}
                    >
                      <Icon name="person_add" size={18} />
                    </button>
                    <Link
                      to={`/restaurants/${r._id}/edit`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"
                      title="Edit restaurant"
                    >
                      <Icon name="edit" size={18} />
                    </Link>
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-error hover:bg-error-container"
                      title="Delete restaurant"
                      onClick={() => handleDelete(r)}
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
              filtered.length > 0 ? (
                <>
                  {totalRestaurants} restaurant{totalRestaurants !== 1 ? 's' : ''} total · {totalActive} active
                  {unassignedCount > 0 ? ` · ${unassignedCount} unassigned` : ''}
                </>
              ) : null
            }
          />
        )}
      </ScrollReveal>

      <AnimatedModal
        open={Boolean(assigningRestaurant)}
        onClose={closeAssignModal}
        title={assigningRestaurant?.assignedManager ? `Change manager · ${assigningRestaurant?.name}` : `Assign manager · ${assigningRestaurant?.name || ''}`}
        footer={
          <>
            <AnimatedButton variant="ghost" type="button" onClick={closeAssignModal} disabled={savingAssign}>
              Cancel
            </AnimatedButton>
            <AnimatedButton type="submit" form="assign-manager-form" disabled={savingAssign || managers.length === 0}>
              {savingAssign ? 'Saving…' : 'Save assignment'}
            </AnimatedButton>
          </>
        }
      >
        {assignError && (
          <MotionBanner type="error" className="mb-4">
            {Array.isArray(assignError) ? assignError.join(', ') : assignError}
          </MotionBanner>
        )}

        {managers.length === 0 ? (
          <div className="space-y-3">
            <p className="text-body-md text-on-surface-variant">
              No branch managers exist yet. Create one first, then assign them to this restaurant.
            </p>
            <AnimatedButton type="button" onClick={() => navigate('/managers/assign')}>
              <Icon name="person_add" size={18} />
              Add manager
            </AnimatedButton>
          </div>
        ) : (
          <form id="assign-manager-form" onSubmit={handleAssignSubmit} className="space-y-4">
            <DarkSelect
              id="assignManager"
              label="Manager"
              icon="badge"
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {idleManagers.length > 0 && (
                <optgroup label="Idle managers">
                  {idleManagers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.username}
                    </option>
                  ))}
                </optgroup>
              )}
              {busyManagers.length > 0 && (
                <optgroup label="Already assigned">
                  {busyManagers.map((m) => {
                    const branch = m.assignedRestaurant?.name || 'another restaurant'
                    const isCurrent = refId(assigningRestaurant?.assignedManager) === m._id
                    return (
                      <option key={m._id} value={m._id}>
                        {isCurrent ? `${m.username} — current` : `${m.username} — ${branch}`}
                      </option>
                    )
                  })}
                </optgroup>
              )}
            </DarkSelect>
            <p className="text-xs text-outline -mt-2">
              Idle managers are listed first. Choosing a busy manager will move them to this restaurant.
            </p>
              {idleManagers.length === 0 && (
                <p className="text-xs text-on-surface-variant">
                  No idle managers right now. You can still move an assigned manager here, or{' '}
                  <button
                    type="button"
                    className="text-primary font-semibold hover:underline"
                    onClick={() => navigate('/managers/assign')}
                  >
                    create a new one
                  </button>
                  .
                </p>
              )}
          </form>
        )}
      </AnimatedModal>
    </DashboardLayout>
  )
}
