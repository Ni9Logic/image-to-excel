import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Upload } from './Upload'
import toast from 'react-hot-toast'

// Mock react-hot-toast
jest.mock('react-hot-toast')

describe('Upload Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('renders upload area correctly', () => {
    render(<Upload />)
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
    expect(screen.getByText(/PDF or PNG \(Max size: 10MB\)/i)).toBeInTheDocument()
  })

  it('handles file selection for valid PDF', async () => {
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' })
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ text: 'Extracted text' }),
    })

    render(<Upload />)
    const input = screen.getByLabelText(/Click to upload/i)
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!')
      expect(screen.getByText('Extracted text')).toBeInTheDocument()
    })
  })

  it('handles file selection for valid PNG', async () => {
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' })

    render(<Upload />)
    const input = screen.getByLabelText(/Click to upload/i)
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('test.png')).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!')
    })
  })

  it('shows error for invalid file type', async () => {
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' })

    render(<Upload />)
    const input = screen.getByLabelText(/Click to upload/i)
    
    fireEvent.change(input, { target: { files: [file] } })

    expect(toast.error).toHaveBeenCalledWith('Please upload a PDF or PNG file')
  })

  it('handles file removal', async () => {
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' })

    render(<Upload />)
    const input = screen.getByLabelText(/Click to upload/i)
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      const removeButton = screen.getByLabelText('Remove file')
      fireEvent.click(removeButton)
      expect(toast.success).toHaveBeenCalledWith('File removed')
      expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
    })
  })
}) 