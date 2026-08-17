import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import { PageHeader } from '../components/common'
import ResponsiveDataTable from '../components/tables/ResponsiveDataTable'
import {
  EmptyState,
  MotionBanner,
  ScrollReveal,
  SkeletonList,
} from '../components/motion'
import OrderStatusSelect from '../components/orders/OrderStatusSelect'
import usePageTitle from '../hooks/usePageTitle'
import { fetchStaffOrders, updateOrderStatusThunk } from '../store/orderSlice'

const formatStatus = (s) => String(s || '').replaceAll('_', ' ')

export default function OrdersList() {
  usePageTitle('Orders')
  const dispatch = useDispatch()
  const role = useSelector((state) => state.auth.user?.role)
  const isManager = role === 'branch_manager'
  const { list, loading, error } = useSelector((state) => state.staffOrders)

  useEffect(() => {
    dispatch(fetchStaffOrders())
  }, [dispatch])

  const handleStatus = (order, status) => {
    if (status === order.status) return
    dispatch(updateOrderStatusThunk({ id: order._id, status }))
  }

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (order) => (
        <>
          <p className="font-semibold">{order.customerId?.fullName || 'Customer'}</p>
          <p className="text-xs text-on-surface-variant">
            {order.customerId?.phone || order.customerId?.email || ''}
          </p>
        </>
      ),
    },
    ...(!isManager
      ? [
          {
            key: 'restaurant',
            label: 'Restaurant',
            hideOnTablet: true,
            render: (order) => order.restaurantId?.name || '—',
          },
        ]
      : []),
    {
      key: 'items',
      label: 'Items',
      hideOnTablet: true,
      mobile: false,
      render: (order) => (
        <>
          <p className="mb-1 text-xs capitalize text-on-surface-variant">
            {formatStatus(order.orderType || 'delivery')}
          </p>
          <p className="text-sm">{order.items?.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</p>
        </>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (order) => (
        <span className="font-semibold">
          {order.restaurantId?.currency || 'PKR'} {Number(order.totalAmount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'payment',
      label: 'Payment',
      hideOnTablet: true,
      render: (order) => <span className="capitalize">{order.paymentStatus || 'pending'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => (
        <OrderStatusSelect
          value={order.status}
          onChange={(e) => handleStatus(order, e.target.value)}
        />
      ),
    },
  ]

  return (
    <DashboardLayout
      variant={isManager ? 'branch-manager' : 'super-admin'}
      title="Orders"
    >
      <PageHeader
        title="Incoming Orders"
        subtitle={
          isManager ? 'Delivery orders for your restaurant' : 'All customer delivery orders'
        }
      />

      {error && (
        <MotionBanner type="error" className="mb-stack-md">
          {error}
        </MotionBanner>
      )}

      <ScrollReveal>
        {loading && list.length === 0 ? (
          <SkeletonList count={4} />
        ) : !loading && list.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No orders yet"
            hint="Incoming delivery orders will appear here."
          />
        ) : (
          <ResponsiveDataTable columns={columns} rows={list} rowKey="_id" />
        )}
      </ScrollReveal>
    </DashboardLayout>
  )
}
