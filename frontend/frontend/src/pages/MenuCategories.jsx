import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import { PageHeader } from '../components/common'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedInput,
  AnimatedModal,
  EmptyState,
  MotionBanner,
  SkeletonGrid,
} from '../components/motion'
import { STAT_LABEL } from '../constants/breakpoints'
import usePageTitle from '../hooks/usePageTitle'
import { fetchCategories, createCategoryThunk, updateCategoryThunk, deleteCategoryThunk } from '../store/categorySlice'
import { fetchMenuItems } from '../store/menuItemSlice'

export default function MenuCategories() {
  usePageTitle('Menu Categories')
  const dispatch = useDispatch()
  const { list: categories, loading, error } = useSelector((state) => state.categories)
  const { list: menuItems } = useSelector((state) => state.menuItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    dispatch(fetchCategories())
    dispatch(fetchMenuItems())
  }, [dispatch])

  const filtered = searchQuery.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories

  const itemCountFor = (categoryId) =>
    menuItems.filter((item) => (item.category?._id || item.category) === categoryId).length

  const openAdd = () => {
    setEditing(null)
    setName('')
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setName(category.name)
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const action = editing
      ? await dispatch(updateCategoryThunk({ id: editing._id, data: { name } }))
      : await dispatch(createCategoryThunk({ name }))
    setSaving(false)
    if (action.type.endsWith('/fulfilled')) setModalOpen(false)
  }

  const handleDelete = (category) => {
    if (window.confirm(`Delete category "${category.name}"?`)) {
      dispatch(deleteCategoryThunk(category._id))
    }
  }

  return (
    <DashboardLayout
      variant="branch-manager"
      title="Menu Categories"
      searchPlaceholder="Search categories..."
      showAdd
      addLabel="Add Category"
      onAdd={openAdd}
      onSearch={setSearchQuery}
    >
      <PageHeader
        title="Category Catalog"
        subtitle="Organize menu structure by cuisine and type"
        hideActionsBelowSm
        actions={
          <AnimatedButton onClick={openAdd}>
            <Icon name="add" size={18} />
            Add Category
          </AnimatedButton>
        }
      />

      <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 gap-stack-lg mb-stack-lg">
        <AnimatedCard staggerChild className="p-stack-lg !bg-surface-container-lowest card-elevation border-0">
          <p className={STAT_LABEL}>Total Categories</p>
          <h3 className="font-numeral-lg text-primary">{filtered.length}</h3>
        </AnimatedCard>
        <AnimatedCard staggerChild className="p-stack-lg !bg-surface-container-lowest card-elevation border-0">
          <p className={STAT_LABEL}>Menu Items</p>
          <h3 className="font-numeral-lg text-secondary">{menuItems.length}</h3>
        </AnimatedCard>
      </AnimatedCardGrid>

      {error && (
        <div className="mb-stack-md">
          <MotionBanner type="error">
            {Array.isArray(error) ? error.join(', ') : error}
          </MotionBanner>
        </div>
      )}

      {loading && categories.length === 0 ? (
        <SkeletonGrid count={4} className="xl:grid-cols-4" />
      ) : filtered.length === 0 && !searchQuery.trim() ? (
        <EmptyState
          icon="category"
          title="No categories yet"
          hint="Add a category to organize your menu."
          action={
            <AnimatedButton onClick={openAdd}>
              <Icon name="add" size={18} />
              Add Category
            </AnimatedButton>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="search_off"
          title={`No categories match "${searchQuery}"`}
        />
      ) : (
        <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-stack-lg">
          {filtered.map((c) => (
            <AnimatedCard
              key={c._id}
              staggerChild
              className="group overflow-hidden shadow-sm p-5"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-4">
                <Icon name="category" />
              </div>
              <h3 className="font-semibold text-lg text-on-surface mb-1">{c.name}</h3>
              <p className="text-label-md font-bold text-primary mb-4">{itemCountFor(c._id)} items</p>
              <div className="flex gap-1">
                <button type="button" className="p-1.5 rounded-lg hover:bg-surface-container" onClick={() => openEdit(c)}>
                  <Icon name="edit" size={16} />
                </button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-error-container text-error" onClick={() => handleDelete(c)}>
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </AnimatedCard>
          ))}

          <button
            type="button"
            onClick={openAdd}
            className="border-2 border-dashed border-outline-variant rounded-xl min-h-[180px] flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="add_circle" size={36} />
            <span className="font-label-lg font-semibold">New Category</span>
          </button>
        </AnimatedCardGrid>
      )}

      <AnimatedModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <AnimatedButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</AnimatedButton>
            <AnimatedButton type="submit" form="category-form" disabled={saving}>{saving ? 'Saving…' : 'Save'}</AnimatedButton>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSave} className="space-y-4">
          <AnimatedInput id="category-name" label="Category Name" placeholder="e.g. Fast Food" value={name} onChange={(e) => setName(e.target.value)} required />
        </form>
      </AnimatedModal>
    </DashboardLayout>
  )
}
