import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
  try {
    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    
    const { content, images } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Anthropic API key is not configured');
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY.trim(),
    });

    console.log('Attempting to create message with Claude...');
    
    // Prepare content with image references
    let promptContent = content;
    if (images && images.length > 0) {
      promptContent += '\n\nInclude the following images in appropriate sections of the blog post:\n';
      images.forEach((image, index) => {
        promptContent += `\nImage ${index + 1}: ${image.url}`;
      });
    }

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1500,
        system: `You are a professional technical writer who creates engaging and informative blog posts from README files. Format your response in HTML with proper tags and structure. When image URLs are provided, include them in the blog post using appropriate HTML img tags with responsive classes. Place images in relevant sections to enhance the content.`,
        messages: [
          {
            role: "user",
            content: `Please create a detailed blog post from this content and include any provided images in relevant sections: ${promptContent}`
          }
        ]
      });

      console.log('Successfully received Claude response');
      
      // Extract the response text
      const blogPost = message.content[0].text;
      return NextResponse.json({ blogPost });
      
    } catch (claudeError) {
      console.error('Claude API Error:', {
        message: claudeError.message,
        type: claudeError.type,
        status: claudeError.status,
      });
      
      // Check if the error is related to the API key format
      if (claudeError.message?.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API key format. The key should start with "sk-ant-".' },
          { status: 500 }
        );
      }
      
      throw claudeError;
    }

  } catch (error) {
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      status: error.status,
      stack: error.stack,
    });
    
    // Handle specific error cases
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Anthropic API key. Please check your configuration.' },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate blog post. Please try again.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}