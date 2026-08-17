import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import MenuItemCard from '../components/cards/MenuItemCard'
import { PageHeader } from '../components/common'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedInput,
  AnimatedModal,
  AnimatedSelect,
  EmptyState,
  MotionBanner,
  SkeletonGrid,
} from '../components/motion'
import { STAT_LABEL } from '../constants/breakpoints'
import usePageTitle from '../hooks/usePageTitle'
import { fetchMenuItems, createMenuItemThunk, updateMenuItemThunk, deleteMenuItemThunk } from '../store/menuItemSlice'
import { fetchCategories } from '../store/categorySlice'

const emptyForm = { name: '', price: '', image: '', categoryId: '' }

export default function MenuItems() {
  usePageTitle('Menu Items')
  const dispatch = useDispatch()
  const { list: items, loading, error } = useSelector((state) => state.menuItems)
  const { list: categories } = useSelector((state) => state.categories)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchMenuItems())
    dispatch(fetchCategories())
  }, [dispatch])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const categoryId = item.category?._id || item.category
      const matchesFilter = filter === 'all' || categoryId === filter
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
      return matchesFilter && matchesQuery
    })
  }, [items, filter, query])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, categoryId: categories[0]?._id || '' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name || '',
      price: item.price ?? '',
      image: item.image || '',
      categoryId: item.category?._id || item.category || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: form.name,
      price: Number(form.price),
      categoryId: form.categoryId,
      ...(form.image ? { image: form.image } : {}),
    }
    const action = editing
      ? await dispatch(updateMenuItemThunk({ id: editing._id, data: payload }))
      : await dispatch(createMenuItemThunk(payload))
    setSaving(false)
    if (action.type.endsWith('/fulfilled')) setModalOpen(false)
  }

  const handleDelete = (item) => {
    if (window.confirm(`Delete menu item "${item.name}"?`)) {
      dispatch(deleteMenuItemThunk(item._id))
    }
  }

  return (
    <DashboardLayout
      variant="branch-manager"
      title="Menu Items"
      searchPlaceholder="Search menu..."
      showAdd
      addLabel="Add Item"
      onAdd={openAdd}
      onSearch={setQuery}
    >
      <PageHeader
        title="Menu Catalog"
        subtitle="Create and manage dishes for this branch"
        hideActionsBelowSm
        actions={
          <AnimatedButton onClick={openAdd} disabled={categories.length === 0}>
            <Icon name="add" size={18} />
            Add Item
          </AnimatedButton>
        }
      />

      <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 gap-stack-lg mb-stack-lg">
        <AnimatedCard staggerChild className="p-stack-lg !bg-surface-container-lowest card-elevation border-0">
          <p className={STAT_LABEL}>Total Items</p>
          <h3 className="font-numeral-lg text-primary">{filtered.length}</h3>
        </AnimatedCard>
        <AnimatedCard staggerChild className="p-stack-lg !bg-surface-container-lowest card-elevation border-0">
          <p className={STAT_LABEL}>Categories</p>
          <h3 className="font-numeral-lg text-secondary">{categories.length}</h3>
        </AnimatedCard>
      </AnimatedCardGrid>

      {categories.length === 0 && (
        <div className="mb-stack-md">
          <MotionBanner type="success" className="!bg-surface-container-high !text-on-surface">
            Create a category first before adding menu items.
          </MotionBanner>
        </div>
      )}

      {error && (
        <div className="mb-stack-md">
          <MotionBanner type="error">
            {Array.isArray(error) ? error.join(', ') : error}
          </MotionBanner>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-stack-lg">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-label-md font-semibold ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}
        >
          All Items
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => setFilter(c._id)}
            className={`px-4 py-1.5 rounded-full text-label-md font-semibold ${filter === c._id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 && items.length === 0 ? (
        <EmptyState
          icon="restaurant_menu"
          title="No menu items yet"
          hint={categories.length === 0 ? 'Create a category first.' : 'Add a dish to get started.'}
          action={
            categories.length > 0 ? (
              <AnimatedButton onClick={openAdd}>
                <Icon name="add" size={18} />
                Add Item
              </AnimatedButton>
            ) : null
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="No items match this filter"
          hint="Try another category or search term."
        />
      ) : (
        <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-stack-lg">
          {filtered.map((item) => (
            <MenuItemCard
              key={item._id}
              staggerChild
              name={item.name}
              priceDisplay={item.price}
              categoryName={item.category?.name || 'Uncategorized'}
              image={item.image}
              footer={
                <div className="mt-auto flex justify-end gap-1">
                  <button type="button" className="rounded-lg p-1.5 hover:bg-surface-container" onClick={() => openEdit(item)}>
                    <Icon name="edit" size={16} />
                  </button>
                  <button type="button" className="rounded-lg p-1.5 hover:bg-error-container text-error" onClick={() => handleDelete(item)}>
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              }
            />
          ))}

          <button
            type="button"
            onClick={openAdd}
            disabled={categories.length === 0}
            className="border-2 border-dashed border-outline-variant rounded-xl min-h-[220px] flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            <Icon name="add_circle" size={40} />
            <span className="font-label-lg font-semibold">Add Menu Item</span>
          </button>
        </AnimatedCardGrid>
      )}

      <AnimatedModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Menu Item' : 'Add Menu Item'}
        footer={
          <>
            <AnimatedButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AnimatedButton>
            <AnimatedButton type="submit" form="menu-item-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</AnimatedButton>
          </>
        }
      >
        <form id="menu-item-form" onSubmit={handleSave} className="space-y-4">
          <AnimatedInput id="item-name" label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <AnimatedInput id="item-price" label="Price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
          <AnimatedSelect
            id="item-category"
            label="Category"
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </AnimatedSelect>
          <AnimatedInput id="item-image" label="Image URL (optional)" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
        </form>
      </AnimatedModal>
    </DashboardLayout>
  )
}
