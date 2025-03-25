import '@testing-library/jest-dom'

// Mock the environment variable
process.env.NEXT_PUBLIC_BACKEND_URL_ENDPOINT = 'http://test-api'

// Mock fetch globally
global.fetch = jest.fn() 