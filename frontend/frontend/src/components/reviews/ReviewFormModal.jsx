import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnimatedModal from '../motion/AnimatedModal'
import AnimatedButton from '../motion/AnimatedButton'
import AnimatedSelect from '../motion/AnimatedSelect'
import MotionBanner from '../motion/MotionBanner'
import StarRating from './StarRating'
import { clearReviewFeedback, createReview, updateReview } from '../../store/customerReviewsSlice'

export default function ReviewFormModal({
  open,
  onClose,
  restaurantId,
  orderId,
  reservationId,
  foodOptions = [],
  existing = null,
  onSaved,
}) {
  const dispatch = useDispatch()
  const { saving, error, success } = useSelector((state) => state.customerReviews)
  const [rating, setRating] = useState(existing?.rating || 0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [foodId, setFoodId] = useState(existing?.food?._id || '')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (!open) return
    dispatch(clearReviewFeedback())
    setRating(existing?.rating || 0)
    setComment(existing?.comment || '')
    setFoodId(existing?.food?._id || '')
    setLocalError('')
  }, [open, existing, dispatch])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!rating) {
      setLocalError('Please choose a rating from 1 to 5 stars')
      return
    }
    setLocalError('')
    const result = existing?._id
      ? await dispatch(updateReview({ id: existing._id, data: { rating, comment } }))
      : await dispatch(
          createReview({
            restaurantId,
            orderId: orderId || undefined,
            reservationId: reservationId || undefined,
            foodId: foodId || undefined,
            rating,
            comment,
          }),
        )
    const ok = existing?._id ? updateReview.fulfilled.match(result) : createReview.fulfilled.match(result)
    if (ok) {
      onSaved?.(result.payload)
      onClose?.()
    }
  }

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit review' : 'Leave a review'}
      footer={
        <>
          <AnimatedButton variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </AnimatedButton>
          <AnimatedButton onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : existing ? 'Update review' : 'Submit review'}
          </AnimatedButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(localError || error) && <MotionBanner type="error">{localError || error}</MotionBanner>}
        {success && !existing && <MotionBanner type="success">{success}</MotionBanner>}
        <div>
          <p className="text-sm font-semibold mb-2 text-[var(--color-text)]">Rating</p>
          <StarRating value={rating} onChange={setRating} size={28} />
        </div>
        {!existing && foodOptions.length > 0 && (
          <AnimatedSelect
            label="Dish (optional)"
            value={foodId}
            onChange={(e) => setFoodId(e.target.value)}
          >
            <option value="">Restaurant overall</option>
            {foodOptions.map((item) => (
              <option key={item.foodId || item._id} value={item.foodId || item._id}>
                {item.name}
              </option>
            ))}
          </AnimatedSelect>
        )}
        <label className="block text-sm font-semibold text-[var(--color-text)]">
          Comment (optional)
          <textarea
            className="mt-1 w-full min-h-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm font-normal text-[var(--color-text)] outline-none focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(255,77,0,0.22)] transition-[border-color,box-shadow] duration-300"
            maxLength={1000}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the food and service?"
          />
        </label>
      </form>
    </AnimatedModal>
  )
}
