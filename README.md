# Blog Post Creator

A Next.js application that transforms development notes and README files into polished blog posts using AI. The application leverages Claude AI to generate well-structured, professional blog posts and supports multiple export formats.

## Features

- 🤖 AI-powered blog post generation
- 📝 Support for uploading README files
- 🖼️ Image upload and integration
- 📤 Multiple export formats (Markdown, HTML, React)
- 🌓 Dark mode support
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Anthropic API key (Claude AI)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blog-post-creator.git
cd blog-post-creator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your-api-key-here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## Usage

### Converting Development Notes to Blog Posts

1. Enter your development notes in the text area or upload a README file
2. (Optional) Upload relevant images to enhance your blog post
3. Click "Generate Blog Post" to create your AI-generated blog post
4. Select your preferred format (Markdown, HTML, or React)
5. Click "Export" to download your blog post in the selected format

### Image Upload

- Click "Upload Images" to add screenshots or relevant images
- Images will be automatically integrated into appropriate sections of your blog post
- You can remove uploaded images by hovering over them and clicking the remove button
- Supported formats: PNG, JPG, JPEG, GIF
- Images are stored in the `public/uploads` directory

## API Endpoints

### `/api/generate`
Generates a blog post from provided content and images.
- Method: POST
- Body:
  ```json
  {
    "content": "Your development notes or README content",
    "images": [
      {
        "filename": "image1.jpg",
        "url": "/uploads/image1.jpg"
      }
    ]
  }
  ```

### `/api/upload`
Handles image uploads for the blog post.
- Method: POST
- Body: FormData with 'file' field
- Returns: 
  ```json
  {
    "success": true,
    "filename": "uploaded-image.jpg",
    "url": "/uploads/uploaded-image.jpg"
  }
  ```

### `/api/convert`
Converts the blog post to different formats.
- Method: POST
- Body:
  ```json
  {
    "content": "Blog post content",
    "format": "markdown" // or "html" or "react"
  }
  ```

## Project Structure

```
blog-post-creator/
├── public/
│   └── uploads/        # Stored uploaded images
├── src/
│   └── app/
│       ├── api/        # API routes
│       │   ├── convert/
│       │   ├── generate/
│       │   └── upload/
│       ├── globals.css # Global styles
│       ├── layout.js   # Root layout
│       └── page.js     # Main application page
└── ...
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
