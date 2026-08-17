import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../ui/Icon'
import { Pagination } from '../common'
import StarRating from './StarRating'
import { fetchRestaurantReviews } from '../../store/customerReviewsSlice'

export default function RestaurantReviewsSection({ restaurantId, averageRating, reviewCount }) {
  const dispatch = useDispatch()
  const { restaurantReviews, restaurantMeta, page, totalPages, total, loadingPublic } = useSelector(
    (state) => state.customerReviews,
  )
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    if (!restaurantId) return
    dispatch(fetchRestaurantReviews({ restaurantId, page: 1, limit: 5, sort }))
  }, [dispatch, restaurantId, sort])

  const rating = restaurantMeta?.averageRating ?? averageRating ?? 0
  const count = restaurantMeta?.reviewCount ?? reviewCount ?? total ?? 0

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-sm font-semibold">Reviews</h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={Math.round(rating)} readOnly size={18} />
            <span className="text-sm text-on-surface-variant">
              {Number(rating || 0).toFixed(1)} · {count} review{count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <select
          className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest rating</option>
          <option value="lowest">Lowest rating</option>
        </select>
      </div>

      {loadingPublic && restaurantReviews.length === 0 ? (
        <div className="p-6 text-center text-on-surface-variant bg-surface border border-outline-variant rounded-xl">
          Loading reviews…
        </div>
      ) : restaurantReviews.length === 0 ? (
        <div className="p-6 text-center bg-surface border border-outline-variant rounded-xl">
          <Icon name="rate_review" size={32} />
          <p className="font-semibold mt-2">No reviews yet</p>
          <p className="text-sm text-on-surface-variant mt-1">Be the first to share your experience after a completed visit.</p>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <ul className="divide-y divide-outline-variant">
            {restaurantReviews.map((review) => (
              <li key={review._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{review.customer?.fullName || 'Customer'}</p>
                    <StarRating value={review.rating} readOnly size={16} />
                  </div>
                  <p className="text-xs text-outline">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</p>
                </div>
                {review.food?.name && (
                  <p className="text-xs text-secondary mt-1">Reviewed {review.food.name}</p>
                )}
                {review.comment ? <p className="text-sm text-on-surface-variant mt-2">{review.comment}</p> : null}
              </li>
            ))}
          </ul>
          <Pagination
            summary={`Showing ${total === 0 ? 0 : (page - 1) * 5 + 1}-${Math.min(page * 5, total)} of ${total}`}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(next) => dispatch(fetchRestaurantReviews({ restaurantId, page: next, limit: 5, sort }))}
          />
        </div>
      )}
    </section>
  )
}
