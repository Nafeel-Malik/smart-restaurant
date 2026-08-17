import { AnimatePresence, motion } from 'framer-motion'
import Icon from '../ui/Icon'
import Button from '../ui/Button'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${widths[size]} bg-surface-container-lowest rounded-xl border border-outline-variant shadow-2xl overflow-hidden`}
          >
            <div className="flex items-center justify-between px-gutter py-4 border-b border-outline-variant">
              <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="p-gutter">{children}</div>
            {footer && (
              <div className="px-gutter py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low">
                {footer}
              </div>
            )}
            {!footer && (
              <div className="px-gutter py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
