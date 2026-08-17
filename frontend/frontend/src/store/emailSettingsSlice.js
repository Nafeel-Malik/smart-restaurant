import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getEmailConfig, updateEmailConfig, sendTestEmail } from '../services/emailSettingsApi'

const errorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback

export const fetchEmailConfig = createAsyncThunk(
  'emailSettings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getEmailConfig()
      return res.data
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to load email settings'))
    }
  },
)

export const saveEmailConfig = createAsyncThunk(
  'emailSettings/save',
  async (data, { rejectWithValue }) => {
    try {
      const res = await updateEmailConfig(data)
      return res.data
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to save email settings'))
    }
  },
)

export const testEmailConfig = createAsyncThunk(
  'emailSettings/test',
  async (to, { rejectWithValue }) => {
    try {
      const res = await sendTestEmail(to)
      return res.data
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Failed to send test email'))
    }
  },
)

const emailSettingsSlice = createSlice({
  name: 'emailSettings',
  initialState: {
    config: null,
    loading: false,
    saving: false,
    testing: false,
    error: null,
    saveSuccess: null,
    testSuccess: null,
    testError: null,
  },
  reducers: {
    clearEmailSettingsFeedback: (state) => {
      state.error = null
      state.saveSuccess = null
      state.testSuccess = null
      state.testError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailConfig.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmailConfig.fulfilled, (state, action) => {
        state.loading = false
        state.config = action.payload
      })
      .addCase(fetchEmailConfig.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(saveEmailConfig.pending, (state) => {
        state.saving = true
        state.error = null
        state.saveSuccess = null
      })
      .addCase(saveEmailConfig.fulfilled, (state, action) => {
        state.saving = false
        state.config = action.payload
        state.saveSuccess = 'Email settings saved'
      })
      .addCase(saveEmailConfig.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
      })
      .addCase(testEmailConfig.pending, (state) => {
        state.testing = true
        state.testError = null
        state.testSuccess = null
      })
      .addCase(testEmailConfig.fulfilled, (state, action) => {
        state.testing = false
        state.testSuccess = action.payload?.message || 'Test email sent!'
      })
      .addCase(testEmailConfig.rejected, (state, action) => {
        state.testing = false
        state.testError = action.payload
      })
  },
})

export const { clearEmailSettingsFeedback } = emailSettingsSlice.actions
export default emailSettingsSlice.reducer
