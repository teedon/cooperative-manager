// API Connection Test Utility
// This file helps test the connection to the backend API

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const testAPIConnection = async () => {
  console.log('=== API Connection Test ===')
  console.log('API Base URL:', API_BASE_URL)
  console.log('Environment:', import.meta.env.MODE)
  
  try {
    // Test 1: Simple GET request to check if backend is reachable
    console.log('\n1. Testing backend health...')
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/`)
    console.log('✅ Backend is reachable:', healthResponse.status)
  } catch (error: any) {
    console.error('❌ Backend health check failed:', error.message)
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Is the backend server running on port 3001?')
    }
  }

  try {
    // Test 2: Test login endpoint with CORS
    console.log('\n2. Testing login endpoint...')
    const loginResponse = await axios.post(
      `${API_BASE_URL}/auth/login`,
      { email: 'test@test.com', password: 'test123' },
      { 
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      }
    )
    console.log('✅ Login endpoint response:', loginResponse.data)
  } catch (error: any) {
    if (error.response) {
      console.log('⚠️ Login endpoint responded with error:', error.response.status)
      console.log('Error data:', error.response.data)
    } else if (error.code === 'ERR_NETWORK') {
      console.error('❌ Network error - CORS might be blocking the request')
      console.error('Error:', error.message)
    } else {
      console.error('❌ Login test failed:', error.message)
    }
  }

  console.log('\n=== Test Complete ===')
}

// Run test in browser console: window.testAPI()
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPIConnection
}
