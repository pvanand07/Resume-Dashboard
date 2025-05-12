import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, File, Trash2, UploadCloud, Loader2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

// Resume upload response types
interface ResumeUploadResponse {
  message: string;
  hash_prefix: string;
  status: string;
}

interface BulkUploadResponse {
  message: string;
  hash_prefixes: string[];
  status: string;
}

interface ResumeResult {
  hash_prefix: string;
  status: string;
  filename: string;
  timestamp: string;
}

interface AllResultsResponse {
  count: number;
  results: ResumeResult[];
}

const ResumeUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedHashes, setUploadedHashes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResumeResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Fetch all results on mount and when new hashes are added
  useEffect(() => {
    fetchAllResults();
    // Set up a polling interval to check for updates
    const interval = setInterval(fetchAllResults, 5000);
    return () => clearInterval(interval);
  }, [uploadedHashes]);

  const fetchAllResults = async () => {
    setIsLoadingResults(true);
    try {
      const response = await fetch('https://resume-parser-api.elevatics.site/results');
      if (!response.ok) throw new Error('Failed to fetch results');
      
      const data: AllResultsResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      setError('Error fetching results. Please try again later.');
      console.error(err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const validFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type === 'application/pdf' || file.name.endsWith('.docx')
      );
      
      if (validFiles.length === 0) {
        setError('Only PDF and DOCX files are supported');
        return;
      }
      
      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf' || file.name.endsWith('.docx')
      );
      
      if (validFiles.length === 0) {
        setError('Only PDF and DOCX files are supported');
        return;
      }
      
      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Handle single vs bulk upload
      if (files.length === 1) {
        formData.append('file', files[0]);
        formData.append('remove_pii', 'false');
        
        const response = await fetch('https://resume-parser-api.elevatics.site/parse-resume/', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload resume');
        }
        
        const data: ResumeUploadResponse = await response.json();
        setUploadedHashes(prev => [...prev, data.hash_prefix]);
        
      } else {
        // Bulk upload
        files.forEach(file => {
          formData.append('files', file);
        });
        formData.append('remove_pii', 'false');
        
        const response = await fetch('https://resume-parser-api.elevatics.site/parse-multiple-resumes/', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload resumes');
        }
        
        const data: BulkUploadResponse = await response.json();
        setUploadedHashes(prev => [...prev, ...data.hash_prefixes]);
      }
      
      // Clear files after successful upload
      setFiles([]);
      
    } catch (err) {
      setError('Error uploading files. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResult = async (hashPrefix: string) => {
    try {
      const response = await fetch(`https://resume-parser-api.elevatics.site/results/${hashPrefix}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete result');
      
      // Remove from state
      setResults(results.filter(result => result.hash_prefix !== hashPrefix));
    } catch (err) {
      setError('Error deleting result. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition">
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Resume Upload</h1>
          <p className="text-gray-600 mt-2">Upload candidate resumes to parse and analyze</p>
        </header>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Resumes</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle size={18} className="mr-2" />
              {error}
            </div>
          )}
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadCloud size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="mb-2 text-gray-700">Drag and drop files here, or</p>
            <label className="inline-block px-4 py-2 bg-primary-500 text-white rounded-md cursor-pointer hover:bg-primary-600 transition">
              Browse Files
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">Supported formats: PDF, DOCX</p>
          </div>
          
          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Selected Files ({files.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <File size={20} className="text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(index)} 
                      className="text-gray-500 hover:text-red-500 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md flex items-center justify-center w-full md:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isUploading}
                onClick={uploadFiles}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} className="mr-2" />
                    Upload {files.length > 1 ? `${files.length} Files` : 'File'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Resume Processing Results</h2>
            {isLoadingResults && (
              <Loader2 size={20} className="animate-spin text-gray-500" />
            )}
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Upload size={48} className="mx-auto mb-4 opacity-30" />
              <p>No processed resumes found</p>
              <p className="text-sm mt-2">Upload resumes to see results here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.hash_prefix} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.filename}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.hash_prefix}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.status === 'completed' ? 'bg-green-100 text-green-800' :
                          result.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.status === 'completed' ? (
                            <CheckCircle size={12} className="mr-1" />
                          ) : result.status === 'processing' ? (
                            <Loader2 size={12} className="mr-1 animate-spin" />
                          ) : (
                            <AlertCircle size={12} className="mr-1" />
                          )}
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.timestamp}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.status === 'completed' && (
                          <Link 
                            to={`/candidate/${result.hash_prefix}`}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            View
                          </Link>
                        )}
                        <button
                          onClick={() => handleDeleteResult(result.hash_prefix)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload; 