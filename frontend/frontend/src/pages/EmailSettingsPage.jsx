import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import { PageHeader } from '../components/common'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  MotionBanner,
  ScrollReveal,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import {
  fetchEmailConfig,
  saveEmailConfig,
  testEmailConfig,
  clearEmailSettingsFeedback,
} from '../store/emailSettingsSlice'

export default function EmailSettingsPage() {
  usePageTitle('Email Settings')
  const dispatch = useDispatch()
  const { config, loading, saving, testing, error, saveSuccess, testSuccess, testError } = useSelector(
    (state) => state.emailSettings,
  )

  const [emailUser, setEmailUser] = useState('')
  const [emailAppPassword, setEmailAppPassword] = useState('')
  const [fromName, setFromName] = useState('Smart Restaurant Management System')
  const [testTo, setTestTo] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    dispatch(fetchEmailConfig())
    return () => {
      dispatch(clearEmailSettingsFeedback())
    }
  }, [dispatch])

  useEffect(() => {
    if (!config) return
    if (config.emailUser) setEmailUser(config.emailUser)
    if (config.fromName) setFromName(config.fromName)
  }, [config])

  const configured = Boolean(config?.configured)
  const fromDatabase = config?.source === 'database'
  const showForm = !configured || updating || !fromDatabase

  const handleSave = async (e) => {
    e.preventDefault()
    dispatch(clearEmailSettingsFeedback())
    const payload = {
      emailUser: emailUser.trim(),
      fromName: fromName.trim() || 'Smart Restaurant Management System',
    }
    if (emailAppPassword.trim()) {
      payload.emailAppPassword = emailAppPassword.trim().replaceAll(' ', '')
    }
    const result = await dispatch(saveEmailConfig(payload))
    if (saveEmailConfig.fulfilled.match(result)) {
      setEmailAppPassword('')
      setUpdating(false)
    }
  }

  const handleTest = async (e) => {
    e.preventDefault()
    dispatch(clearEmailSettingsFeedback())
    dispatch(testEmailConfig(testTo.trim()))
  }

  return (
    <DashboardLayout variant="super-admin" title="Email Settings" searchPlaceholder="Search settings...">
      <PageHeader
        title="SMTP / Email"
        subtitle="Configure Gmail SMTP used for customer OTP emails. Superadmin only."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <ScrollReveal className="lg:col-span-7 space-y-stack-lg">
          <AnimatedCard className="p-6 space-y-stack-md">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="mail" className="text-primary" />
              <h2 className="font-headline-sm text-primary font-semibold">Gmail credentials</h2>
            </div>

            {loading ? (
              <SkeletonList count={2} />
            ) : (
              <>
                {configured && fromDatabase && !updating && (
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-3">
                    <p className="font-label-md text-on-surface">
                      Currently configured: <span className="font-semibold">{config.emailUser}</span>
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      App Password: {config.emailAppPasswordMasked || 'configured'}
                    </p>
                    <p className="text-sm text-on-surface-variant">From name: {config.fromName}</p>
                    <AnimatedButton variant="ghost" onClick={() => setUpdating(true)}>
                      Update
                    </AnimatedButton>
                  </div>
                )}

                {(!configured || config?.source === 'env') && !updating && (
                  <p className="text-sm text-on-surface-variant">
                    {config?.source === 'env'
                      ? `Fallback .env credentials detected for ${config.emailUser}. Save in-app settings to manage SMTP without restarting the server.`
                      : 'No SMTP config saved yet. Enter a Gmail address and 16-character App Password.'}
                  </p>
                )}

                {showForm && (
                  <form onSubmit={handleSave} className="space-y-stack-md">
                    <AnimatedInput
                      id="emailUser"
                      label="Email address"
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      required
                    />
                    <div className="relative">
                      <AnimatedInput
                        id="emailAppPassword"
                        label={fromDatabase ? 'App Password (leave blank to keep current)' : 'App Password'}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={fromDatabase ? '••••••••••••' : '16-character Gmail App Password'}
                        value={emailAppPassword}
                        onChange={(e) => setEmailAppPassword(e.target.value)}
                        required={!fromDatabase}
                        autoComplete="new-password"
                        inputClassName="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-[22px] z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                      </button>
                    </div>
                    <AnimatedInput
                      id="fromName"
                      label="From name"
                      placeholder="Smart Restaurant Management System"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-3">
                      <AnimatedButton type="submit" disabled={saving || !emailUser.trim()}>
                        <Icon name="save" size={18} />
                        {saving ? 'Saving…' : 'Save'}
                      </AnimatedButton>
                      {updating && fromDatabase && (
                        <AnimatedButton
                          variant="ghost"
                          type="button"
                          onClick={() => {
                            setUpdating(false)
                            setEmailAppPassword('')
                            if (config?.emailUser) setEmailUser(config.emailUser)
                            if (config?.fromName) setFromName(config.fromName)
                          }}
                        >
                          Cancel
                        </AnimatedButton>
                      )}
                    </div>
                  </form>
                )}
              </>
            )}

            {saveSuccess && (
              <MotionBanner type="success">{saveSuccess}</MotionBanner>
            )}
            {error && (
              <MotionBanner type="error">{error}</MotionBanner>
            )}
          </AnimatedCard>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="lg:col-span-5 space-y-stack-lg">
          <AnimatedCard className="p-6 space-y-stack-md">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="send" className="text-primary" />
              <h2 className="font-headline-sm text-primary font-semibold">Send test email</h2>
            </div>
            <p className="text-sm text-on-surface-variant">
              Uses the currently saved SMTP config (or .env fallback if nothing is saved yet).
            </p>
            <form onSubmit={handleTest} className="space-y-stack-md">
              <AnimatedInput
                id="testTo"
                label="Test recipient"
                type="email"
                placeholder="you@example.com"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                required
              />
              <AnimatedButton type="submit" variant="secondary" disabled={testing || !testTo.trim()}>
                <Icon name="send" size={18} />
                {testing ? 'Sending…' : 'Send Test Email'}
              </AnimatedButton>
            </form>
            {testSuccess && (
              <MotionBanner type="success">{testSuccess}</MotionBanner>
            )}
            {testError && (
              <MotionBanner type="error">{testError}</MotionBanner>
            )}
          </AnimatedCard>

          <AnimatedCard className="p-6 !bg-primary !text-on-primary !border-transparent">
            <h3 className="font-headline-sm font-semibold mb-2">Gmail App Password</h3>
            <p className="text-sm opacity-90">
              Use a 16-character App Password from Google Account → Security → 2-Step Verification → App passwords.
              Do not use your regular Gmail password.
            </p>
          </AnimatedCard>
        </ScrollReveal>
      </div>
    </DashboardLayout>
  )
}
