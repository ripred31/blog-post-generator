'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [isExporting, setIsExporting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInput(e.target.result);
        setError('');
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
      setFile(file);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);
    setError('');

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload image');
          }

          const data = await response.json();
          return {
            filename: data.filename,
            url: data.url
          };
        })
      );

      setUploadedImages(prev => [...prev, ...uploadedFiles]);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!input) {
      setError('Please provide some development notes or upload a README file.');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: input,
          images: uploadedImages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blog post');
      }

      setGeneratedPost(data.blogPost);
    } catch (err) {
      console.error('Generation error:', err);
      setError(
        err.message.includes('API key') 
          ? 'OpenAI API key not configured. Please check your environment variables.'
          : 'Failed to generate blog post. Please try again.'
      );
      setGeneratedPost('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!generatedPost) {
      setError('Please generate a blog post first');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: generatedPost,
          format: selectedFormat,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert content');
      }

      // Create and download the file
      const blob = new Blob([data.content], { 
        type: selectedFormat === 'html' ? 'text/html' : 'text/plain' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export content. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900">
      <main className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Blog Post Creator</h1>
          <p className="text-gray-600 dark:text-gray-400">Transform your development notes into polished blog posts using AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Development Notes</h2>
              <textarea
                className="w-full h-64 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 
                         text-gray-900 dark:text-gray-100 
                         border-gray-200 dark:border-gray-700
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Paste your development notes, process details, or technical documentation here..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
              />
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {file ? `Selected: ${file.name}` : 'Or upload a README file'}
                  </span>
                  <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
                                dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors
                                border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Choose File</span>
                    <input
                      type="file"
                      accept=".md,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Add images to your blog post
                    </span>
                    <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
                                  dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors
                                  border border-gray-200 dark:border-gray-600">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {isUploading ? 'Uploading...' : 'Upload Images'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 
                                     group-hover:opacity-100 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !input}
                  className={`w-full py-3 rounded-lg font-medium text-white transition-colors
                    ${isGenerating || !input 
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'}`}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Blog Post...
                    </span>
                  ) : 'Generate Blog Post'}
                </button>

                {error && (
                  <div className="text-red-500 dark:text-red-400 text-sm mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                    <p className="font-medium">Error</p>
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Blog Post</h2>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                           text-gray-900 dark:text-gray-100 
                           border border-gray-200 dark:border-gray-600
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="react">React</option>
                </select>
                <button
                  onClick={handleExport}
                  disabled={isExporting || !generatedPost}
                  className={`px-4 py-2 rounded-lg font-medium text-white transition-colors
                    ${isExporting || !generatedPost
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'}`}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none min-h-[300px] bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto">
              {generatedPost ? (
                <div dangerouslySetInnerHTML={{ __html: generatedPost }} />
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  Your AI-generated blog post will appear here...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
