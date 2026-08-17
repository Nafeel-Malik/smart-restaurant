import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import { mediaSrc } from '../components/cards/RestaurantCard'
import StarRating from '../components/reviews/StarRating'
import ReviewFormModal from '../components/reviews/ReviewFormModal'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  EmptyState,
  MotionBanner,
  PageHero,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { deleteReview, fetchMyReviews } from '../store/customerReviewsSlice'

export default function CustomerMyReviewsPage() {
  usePageTitle('My Reviews')
  const dispatch = useDispatch()
  const { mine, loading, error, success, saving } = useSelector((state) => state.customerReviews)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    dispatch(fetchMyReviews())
  }, [dispatch])

  const handleDelete = (review) => {
    if (!window.confirm('Delete this review?')) return
    dispatch(deleteReview(review._id))
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <Link to="/customer/dashboard" className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2">
              <Icon name="arrow_back" size={16} />
              Dashboard
            </Link>
          }
          title="My Reviews"
        />

        {error && <MotionBanner type="error">{error}</MotionBanner>}
        {success && <MotionBanner type="success">{success}</MotionBanner>}

        {loading && mine.length === 0 ? (
          <SkeletonList count={4} />
        ) : mine.length === 0 ? (
          <EmptyState
            icon="rate_review"
            title="No reviews yet"
            hint="After a completed order or reservation, you can rate the restaurant."
          />
        ) : (
          <AnimatedCardGrid className="space-y-3">
            {mine.map((review) => {
              const restaurant = review.restaurant || {}
              return (
                <AnimatedCard key={review._id} staggerChild className="p-4">
                  <div className="flex gap-4">
                    <Link to={`/customer/restaurants/${restaurant._id}`} className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden shrink-0">
                      {mediaSrc(restaurant.logo) ? (
                        <img src={mediaSrc(restaurant.logo)} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline">
                          <Icon name="storefront" size={20} />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/customer/restaurants/${restaurant._id}`} className="font-semibold hover:underline">
                          {restaurant.name || 'Restaurant'}
                        </Link>
                        <p className="text-xs text-outline">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</p>
                      </div>
                      <StarRating value={review.rating} readOnly size={16} />
                      {review.food?.name && <p className="text-xs text-secondary mt-1">{review.food.name}</p>}
                      {review.comment ? <p className="text-sm text-on-surface-variant mt-2">{review.comment}</p> : null}
                      <div className="flex gap-2 mt-3">
                        <AnimatedButton variant="secondary" className="!py-2 !text-sm !px-3" onClick={() => setEditing(review)}>
                          Edit
                        </AnimatedButton>
                        <AnimatedButton variant="danger" className="!py-2 !text-sm !px-3" onClick={() => handleDelete(review)} disabled={saving}>
                          Delete
                        </AnimatedButton>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              )
            })}
          </AnimatedCardGrid>
        )}
      </div>

      <ReviewFormModal
        open={Boolean(editing)}
        existing={editing}
        restaurantId={editing?.restaurant?._id}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}
