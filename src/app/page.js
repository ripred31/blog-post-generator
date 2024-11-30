'use client';

import { useState } from 'react';
import Image from 'next/image';

const CUSTOMIZATION_OPTIONS = {
  tone: [
    { value: 'casual', label: 'Casual', description: 'Friendly and conversational' },
    { value: 'professional', label: 'Professional', description: 'Formal and business-oriented' },
    { value: 'educational', label: 'Educational', description: 'Instructive and explanatory' },
    { value: 'technical', label: 'Technical', description: 'Detailed and precise' }
  ],
  audience: [
    { value: 'developers', label: 'Developers', description: 'Software developers and engineers' },
    { value: 'managers', label: 'Managers', description: 'Technical managers and decision-makers' },
    { value: 'enthusiasts', label: 'Tech Enthusiasts', description: 'Technology enthusiasts and hobbyists' },
    { value: 'beginners', label: 'Beginners', description: 'Those new to the subject' }
  ],
  style: [
    { value: 'tutorial', label: 'Tutorial', description: 'Step-by-step instructions' },
    { value: 'overview', label: 'Overview', description: 'High-level concepts and insights' },
    { value: 'technical', label: 'Technical Analysis', description: 'In-depth technical details' },
    { value: 'storytelling', label: 'Storytelling', description: 'Narrative-driven explanation' }
  ],
  design: [
    { value: 'modern', label: 'Modern', description: 'Clean and contemporary design' },
    { value: 'classic', label: 'Classic', description: 'Traditional blog layout' },
    { value: 'minimal', label: 'Minimal', description: 'Simple and focused presentation' },
    { value: 'technical', label: 'Technical', description: 'Code-focused documentation style' }
  ]
};

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
  const [revisionPrompt, setRevisionPrompt] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [selectedAudience, setSelectedAudience] = useState('developers');
  const [selectedStyle, setSelectedStyle] = useState('overview');
  const [selectedDesign, setSelectedDesign] = useState('modern');

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
    setRevisionPrompt('');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content: input,
          images: uploadedImages,
          tone: selectedTone,
          audience: selectedAudience,
          style: selectedStyle
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

  const handleRevision = async () => {
    if (!revisionPrompt) {
      setError('Please provide revision instructions.');
      return;
    }
    if (!generatedPost) {
      setError('No blog post to revise. Please generate one first.');
      return;
    }
    
    setIsRevising(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          revisionPrompt,
          currentPost: generatedPost,
          images: uploadedImages,
          tone: selectedTone,
          audience: selectedAudience,
          style: selectedStyle
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revise blog post');
      }

      setGeneratedPost(data.blogPost);
      setRevisionPrompt('');
    } catch (err) {
      console.error('Revision error:', err);
      setError('Failed to revise blog post. Please try again.');
    } finally {
      setIsRevising(false);
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

  const CustomSelect = ({ label, options, value, onChange }) => (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                 text-gray-900 dark:text-gray-100 
                 border border-gray-200 dark:border-gray-600
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        {options.map(option => (
          <option key={option.value} value={option.value} title={option.description}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 font-[family-name:var(--font-geist-sans)] bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-[90rem] mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            Blog Post Creator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Transform your development notes into polished blog posts using AI</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Development Notes
            </h2>
            
            {/* Customization Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <CustomSelect
                label="Writing Tone"
                options={CUSTOMIZATION_OPTIONS.tone}
                value={selectedTone}
                onChange={setSelectedTone}
              />
              <CustomSelect
                label="Target Audience"
                options={CUSTOMIZATION_OPTIONS.audience}
                value={selectedAudience}
                onChange={setSelectedAudience}
              />
              <CustomSelect
                label="Content Style"
                options={CUSTOMIZATION_OPTIONS.style}
                value={selectedStyle}
                onChange={setSelectedStyle}
              />
            </div>

            <textarea
              className="w-full h-64 p-4 border rounded-xl bg-gray-50 dark:bg-gray-900/50 
                       text-gray-900 dark:text-gray-100 
                       border-gray-200 dark:border-gray-700
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-500 dark:placeholder-gray-400
                       transition-colors"
              placeholder="Paste your development notes, process details, or technical documentation here..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
            />
            
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {file ? `Selected: ${file.name}` : 'Or upload a README file'}
                </span>
                <label className="cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 
                              dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors
                              border border-gray-200 dark:border-gray-600 shadow-sm">
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
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Add images to your blog post
                  </span>
                  <label className="cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 
                                dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors
                                border border-gray-200 dark:border-gray-600 shadow-sm">
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 
                                   group-hover:opacity-100 transition-opacity shadow-lg"
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
                className={`w-full py-4 rounded-xl font-medium text-white transition-all
                  transform hover:scale-[1.02] active:scale-[0.98]
                  ${isGenerating || !input 
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'}`}
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
                <div className="text-red-500 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <p className="font-medium">Error</p>
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generated Blog Post
              </h2>
              <div className="flex items-center gap-4">
                <CustomSelect
                  options={CUSTOMIZATION_OPTIONS.design}
                  value={selectedDesign}
                  onChange={setSelectedDesign}
                />
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                           text-gray-900 dark:text-gray-100 
                           border border-gray-200 dark:border-gray-600
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="react">React</option>
                </select>
                <button
                  onClick={handleExport}
                  disabled={isExporting || !generatedPost}
                  className={`px-6 py-2 rounded-lg font-medium text-white transition-all
                    transform hover:scale-[1.02] active:scale-[0.98]
                    ${isExporting || !generatedPost
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg'}`}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>

            <div className={`prose dark:prose-invert max-w-none min-h-[300px] bg-gray-50 dark:bg-gray-900/50 p-8 rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto design-${selectedDesign} shadow-inner`}>
              {generatedPost ? (
                <div dangerouslySetInnerHTML={{ __html: generatedPost }} />
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  Your AI-generated blog post will appear here...
                </div>
              )}
            </div>

            {/* Revision Request Section */}
            {generatedPost && (
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Request Changes
                </h3>
                <textarea
                  className="w-full h-32 p-4 border rounded-xl bg-gray-50 dark:bg-gray-900/50 
                           text-gray-900 dark:text-gray-100 
                           border-gray-200 dark:border-gray-700
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-500 dark:placeholder-gray-400
                           transition-colors shadow-inner"
                  placeholder="Describe the changes you'd like to make to the blog post..."
                  value={revisionPrompt}
                  onChange={(e) => {
                    setRevisionPrompt(e.target.value);
                    setError('');
                  }}
                />
                <button
                  onClick={handleRevision}
                  disabled={isRevising || !revisionPrompt}
                  className={`w-full py-4 rounded-xl font-medium text-white transition-all
                    transform hover:scale-[1.02] active:scale-[0.98]
                    ${isRevising || !revisionPrompt
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'}`}
                >
                  {isRevising ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Applying Changes...
                    </span>
                  ) : 'Request Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
