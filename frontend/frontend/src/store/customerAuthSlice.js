import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  registerCustomerApi,
  loginCustomerApi,
  verifyOtpApi,
  resendOtpApi,
  getCurrentCustomerApi,
  getCustomerProfileApi,
  updateCustomerProfileApi,
  changeCustomerPasswordApi,
  uploadCustomerPictureApi,
} from '../services/customerAuthApi'

const CUSTOMER_TOKEN_KEY = 'customerToken'
const CUSTOMER_KEY = 'customer'

const getStoredCustomer = () => {
  try {
    const customer = localStorage.getItem(CUSTOMER_KEY)
    return customer ? JSON.parse(customer) : null
  } catch {
    localStorage.removeItem(CUSTOMER_KEY)
    return null
  }
}

const persistCustomer = (token, customer) => {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token)
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer))
}

const clearCustomerStorage = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY)
  localStorage.removeItem(CUSTOMER_KEY)
}

const extractError = (error, fallback) => {
  if (!error.response) {
    return 'Cannot reach the server. Make sure the backend is running on port 5001.'
  }
  const message = error.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  return message || fallback
}

const storedCustomer = getStoredCustomer()
const storedToken = localStorage.getItem(CUSTOMER_TOKEN_KEY) || null

const persistProfile = (customer) => {
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
  if (token && customer) {
    persistCustomer(token, customer)
  }
}

const initialState = {
  customer: storedCustomer,
  token: storedToken,
  isAuthenticated: Boolean(storedToken && storedCustomer),
  loading: false,
  error: null,
  otpLoading: false,
  otpError: null,
  resendLoading: false,
  resendError: null,
  resendMessage: null,
  resendRetryAfter: null,
  updating: false,
  updateError: null,
  updateSuccess: null,
  passwordUpdating: false,
  passwordError: null,
  passwordSuccess: null,
  pictureUploading: false,
  pictureError: null,
  pictureSuccess: null,
}

export const registerCustomer = createAsyncThunk(
  'customerAuth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await registerCustomerApi(data)
      return {
        message: res.data?.message || 'Registration successful, OTP sent to email',
        email: res.data?.email,
        id: res.data?.id,
      }
    } catch (error) {
      const body = error.response?.data
      if (body?.code === 'ACCOUNT_CREATED_EMAIL_FAILED') {
        return rejectWithValue({
          code: 'ACCOUNT_CREATED_EMAIL_FAILED',
          message: body.message || 'Account created but verification email failed to send — please use Resend OTP',
          email: body.email,
        })
      }
      return rejectWithValue(extractError(error, 'Registration failed'))
    }
  }
)

export const loginCustomer = createAsyncThunk(
  'customerAuth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await loginCustomerApi(data)
      const { access_token, customer } = res.data
      persistCustomer(access_token, customer)
      return { token: access_token, customer }
    } catch (error) {
      const body = error.response?.data
      if (body?.code === 'EMAIL_NOT_VERIFIED' || body?.message === 'Please verify your email first') {
        return rejectWithValue({
          code: 'EMAIL_NOT_VERIFIED',
          message: body.message || 'Please verify your email first',
          email: body.email,
        })
      }
      return rejectWithValue(extractError(error, 'Login failed'))
    }
  }
)

export const verifyOtp = createAsyncThunk(
  'customerAuth/verifyOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await verifyOtpApi(data)
      const { access_token, customer } = res.data
      persistCustomer(access_token, customer)
      return { token: access_token, customer }
    } catch (error) {
      return rejectWithValue(extractError(error, 'OTP verification failed'))
    }
  }
)

export const resendOtp = createAsyncThunk(
  'customerAuth/resendOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await resendOtpApi(data)
      return {
        message: res.data?.message || 'A new OTP has been sent to your email',
        email: res.data?.email,
      }
    } catch (error) {
      const body = error.response?.data
      if (body?.retryAfterSeconds) {
        return rejectWithValue({
          message: body.message || extractError(error, 'Please wait before requesting another OTP'),
          retryAfterSeconds: Number(body.retryAfterSeconds),
        })
      }
      return rejectWithValue(extractError(error, 'Failed to resend OTP'))
    }
  }
)

export const fetchCurrentCustomer = createAsyncThunk(
  'customerAuth/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCurrentCustomerApi()
      const token = localStorage.getItem(CUSTOMER_TOKEN_KEY)
      persistCustomer(token, res.data)
      return res.data
    } catch (error) {
      return rejectWithValue(extractError(error, 'Failed to load customer profile'))
    }
  }
)

export const logoutCustomer = createAsyncThunk('customerAuth/logout', async () => {
  clearCustomerStorage()
  return true
})

export const fetchCustomerProfile = createAsyncThunk(
  'customerAuth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCustomerProfileApi()
      persistProfile(res.data)
      return res.data
    } catch (error) {
      return rejectWithValue(extractError(error, 'Failed to load profile'))
    }
  }
)

export const updateCustomerProfile = createAsyncThunk(
  'customerAuth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const res = await updateCustomerProfileApi(data)
      persistProfile(res.data)
      return res.data
    } catch (error) {
      return rejectWithValue(extractError(error, 'Failed to update profile'))
    }
  }
)

export const changeCustomerPassword = createAsyncThunk(
  'customerAuth/changePassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await changeCustomerPasswordApi(data)
      return res.data?.message || 'Password updated successfully'
    } catch (error) {
      return rejectWithValue(extractError(error, 'Failed to change password'))
    }
  }
)

export const uploadCustomerPicture = createAsyncThunk(
  'customerAuth/uploadPicture',
  async (file, { rejectWithValue }) => {
    try {
      const res = await uploadCustomerPictureApi(file)
      persistProfile(res.data)
      return res.data
    } catch (error) {
      return rejectWithValue(extractError(error, 'Failed to upload picture'))
    }
  }
)

const customerAuthSlice = createSlice({
  name: 'customerAuth',
  initialState,
  reducers: {
    clearCustomerError: (state) => {
      state.error = null
      state.otpError = null
      state.resendError = null
      state.resendMessage = null
    },
    clearProfileFeedback: (state) => {
      state.updateError = null
      state.updateSuccess = null
      state.passwordError = null
      state.passwordSuccess = null
      state.pictureError = null
      state.pictureSuccess = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerCustomer.fulfilled, (state) => {
        state.loading = false
        state.error = null
        state.isAuthenticated = false
      })
      .addCase(registerCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'object' ? action.payload?.message : action.payload
        state.isAuthenticated = false
      })
      .addCase(loginCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.customer = action.payload.customer
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = typeof action.payload === 'object' ? action.payload?.message : action.payload
        state.isAuthenticated = false
      })
      .addCase(verifyOtp.pending, (state) => {
        state.otpLoading = true
        state.otpError = null
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.otpLoading = false
        state.token = action.payload.token
        state.customer = action.payload.customer
        state.isAuthenticated = true
        state.otpError = null
        state.error = null
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.otpLoading = false
        state.otpError = action.payload
        state.isAuthenticated = false
      })
      .addCase(resendOtp.pending, (state) => {
        state.resendLoading = true
        state.resendError = null
        state.resendMessage = null
        state.resendRetryAfter = null
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.resendLoading = false
        state.resendMessage = action.payload.message
        state.resendError = null
        state.resendRetryAfter = 60
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.resendLoading = false
        if (typeof action.payload === 'object' && action.payload?.retryAfterSeconds) {
          state.resendError = action.payload.message
          state.resendRetryAfter = action.payload.retryAfterSeconds
        } else {
          state.resendError = action.payload
        }
      })
      .addCase(fetchCurrentCustomer.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCurrentCustomer.fulfilled, (state, action) => {
        state.loading = false
        state.customer = action.payload
        state.isAuthenticated = Boolean(state.token && action.payload)
        state.error = null
      })
      .addCase(fetchCurrentCustomer.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        if (!localStorage.getItem(CUSTOMER_TOKEN_KEY)) {
          state.token = null
          state.customer = null
          state.isAuthenticated = false
        }
      })
      .addCase(logoutCustomer.fulfilled, (state) => {
        state.customer = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
        state.updateError = null
        state.updateSuccess = null
        state.passwordError = null
        state.passwordSuccess = null
        state.pictureError = null
        state.pictureSuccess = null
        state.otpLoading = false
        state.otpError = null
        state.resendLoading = false
        state.resendError = null
        state.resendMessage = null
        state.resendRetryAfter = null
      })
      .addCase(fetchCustomerProfile.pending, (state) => {
        state.updating = true
        state.updateError = null
      })
      .addCase(fetchCustomerProfile.fulfilled, (state, action) => {
        state.updating = false
        state.customer = action.payload
      })
      .addCase(fetchCustomerProfile.rejected, (state, action) => {
        state.updating = false
        state.updateError = action.payload
      })
      .addCase(updateCustomerProfile.pending, (state) => {
        state.updating = true
        state.updateError = null
        state.updateSuccess = null
      })
      .addCase(updateCustomerProfile.fulfilled, (state, action) => {
        state.updating = false
        state.customer = action.payload
        state.updateSuccess = 'Profile updated successfully'
      })
      .addCase(updateCustomerProfile.rejected, (state, action) => {
        state.updating = false
        state.updateError = action.payload
      })
      .addCase(changeCustomerPassword.pending, (state) => {
        state.passwordUpdating = true
        state.passwordError = null
        state.passwordSuccess = null
      })
      .addCase(changeCustomerPassword.fulfilled, (state, action) => {
        state.passwordUpdating = false
        state.passwordSuccess = action.payload
      })
      .addCase(changeCustomerPassword.rejected, (state, action) => {
        state.passwordUpdating = false
        state.passwordError = action.payload
      })
      .addCase(uploadCustomerPicture.pending, (state) => {
        state.pictureUploading = true
        state.pictureError = null
        state.pictureSuccess = null
      })
      .addCase(uploadCustomerPicture.fulfilled, (state, action) => {
        state.pictureUploading = false
        state.customer = action.payload
        state.pictureSuccess = 'Profile picture updated'
      })
      .addCase(uploadCustomerPicture.rejected, (state, action) => {
        state.pictureUploading = false
        state.pictureError = action.payload
      })
  },
})

export const { clearCustomerError, clearProfileFeedback } = customerAuthSlice.actions
export default customerAuthSlice.reducer
