import { NextResponse } from 'next/server';

function convertToMarkdown(content) {
  // Basic HTML to Markdown conversion
  let markdown = content
    .replace(/<h1.*?>(.*?)<\/h1>/g, '# $1\n\n')
    .replace(/<h2.*?>(.*?)<\/h2>/g, '## $1\n\n')
    .replace(/<h3.*?>(.*?)<\/h3>/g, '### $1\n\n')
    .replace(/<p.*?>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<ul.*?>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/<li.*?>(.*?)<\/li>/g, '- $1\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<pre.*?><code.*?>(.*?)<\/code><\/pre>/gs, '```\n$1\n```\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  
  return markdown.trim();
}

function convertToReact(content) {
  // Convert to React component
  return `import React from 'react';

export default function BlogPost() {
  return (
    <article className="prose lg:prose-xl mx-auto">
      ${content}
    </article>
  );
}`;
}

export async function POST(request) {
  try {
    const { content, format } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    let convertedContent;
    let filename;

    switch (format) {
      case 'markdown':
        convertedContent = convertToMarkdown(content);
        filename = 'blog-post.md';
        break;
      case 'html':
        convertedContent = content; // Already in HTML format
        filename = 'blog-post.html';
        break;
      case 'react':
        convertedContent = convertToReact(content);
        filename = 'BlogPost.jsx';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid format specified' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      content: convertedContent,
      filename: filename
    });

  } catch (error) {
    console.error('Format conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert content' },
      { status: 500 }
    );
  }
}
