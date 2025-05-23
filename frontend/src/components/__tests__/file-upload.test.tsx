import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../file-upload';

// Mock the react-dropzone module
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn().mockImplementation(({ onDrop }: { onDrop: (acceptedFiles: File[], rejectedFiles: any[], event: Event) => void }) => ({
    getRootProps: jest.fn().mockReturnValue({
      onClick: jest.fn(),
      onKeyDown: jest.fn(),
      tabIndex: 0,
      role: 'button'
    }),
    getInputProps: jest.fn().mockReturnValue({
      type: 'file',
      accept: '.pdf,.docx,.xlsx,.txt,.csv',
      multiple: true
    }),
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    open: jest.fn().mockImplementation(() => {
      // Simulate file selection
      const files = [
        new File(['file content'], 'test.pdf', { type: 'application/pdf' }),
        new File(['file content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      ];
      onDrop(files, [], new Event('drop'));
    })
  }))
}));

// Mock fetch
global.fetch = jest.fn();

describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful upload
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 'doc-123',
          title: 'test.pdf',
          status: 'pending'
        }
      })
    });
  });
  
  it('renders the dropzone correctly', () => {
    render(<FileUpload onUpload={jest.fn()} />);
    
    expect(screen.getByText(/drag and drop your files here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/supported formats:/i)).toBeInTheDocument();
    expect(screen.getByText(/pdf, docx, xlsx, txt, csv/i)).toBeInTheDocument();
  });
  
  it('handles file upload correctly', async () => {
    const mockOnUpload = jest.fn();
    render(<FileUpload onUpload={mockOnUpload} />);
    
    // Click the dropzone to trigger file selection
    const dropzone = screen.getByText(/drag and drop your files here/i).closest('div');
    const user = userEvent.setup();
    await user.click(dropzone!);
    
    // Check if the upload started
    expect(screen.getByText(/uploading 2 files/i)).toBeInTheDocument();
    
    // Wait for the upload to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    // Verify fetch was called with correct arguments
    expect(global.fetch).toHaveBeenCalledWith('/api/documents/upload', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData)
    }));
    
    // Verify onUpload callback was called
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledTimes(1);
    });
  });
  
  it('displays error message on upload failure', async () => {
    // Mock failed upload
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        success: false,
        error: 'Upload failed'
      })
    });
    
    render(<FileUpload onUpload={jest.fn()} />);
    
    // Click the dropzone to trigger file selection
    const dropzone = screen.getByText(/drag and drop your files here/i).closest('div');
    const user = userEvent.setup();
    await user.click(dropzone!);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to upload/i)).toBeInTheDocument();
    });
  });
  
  it('validates file types', async () => {
    // Mock the useDropzone hook to simulate invalid file type
    require('react-dropzone').useDropzone.mockImplementationOnce(({ onDrop }: { onDrop: (acceptedFiles: File[], rejectedFiles: any[], event: Event) => void }) => ({
      getRootProps: jest.fn().mockReturnValue({
        onClick: jest.fn(),
        onKeyDown: jest.fn(),
        tabIndex: 0,
        role: 'button'
      }),
      getInputProps: jest.fn().mockReturnValue({
        type: 'file',
        accept: '.pdf,.docx,.xlsx,.txt,.csv',
        multiple: true
      }),
      isDragActive: false,
      isDragAccept: false,
      isDragReject: false,
      open: jest.fn().mockImplementation(() => {
        // Simulate invalid file selection
        const files = [
          new File(['file content'], 'test.exe', { type: 'application/x-msdownload' })
        ];
        onDrop([], [{ file: files[0], errors: [{ code: 'file-invalid-type', message: 'Invalid file type' }] }], new Event('drop'));
      })
    }));
    
    render(<FileUpload onUpload={jest.fn()} />);
    
    // Click the dropzone to trigger file selection
    const dropzone = screen.getByText(/drag and drop your files here/i).closest('div');
    const user = userEvent.setup();
    await user.click(dropzone!);
    
    // Check if the error message appears
    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
  });
});
