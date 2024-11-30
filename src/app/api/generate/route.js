import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const getTonePrompt = (tone) => {
  const toneMap = {
    casual: "Use a casual, conversational tone that's friendly and approachable.",
    professional: "Maintain a professional and formal tone suitable for business contexts.",
    educational: "Use an instructive tone that focuses on clear explanations and learning.",
    technical: "Employ a detailed technical tone with precise terminology and in-depth explanations."
  };
  return toneMap[tone] || toneMap.professional;
};

const getAudiencePrompt = (audience) => {
  const audienceMap = {
    developers: "Target software developers with appropriate technical depth and code examples.",
    managers: "Target technical managers and decision-makers, focusing on high-level concepts and business value.",
    enthusiasts: "Target tech enthusiasts with a balance of technical details and accessible explanations.",
    beginners: "Target beginners with clear explanations and minimal technical jargon."
  };
  return audienceMap[audience] || audienceMap.developers;
};

const getStylePrompt = (style) => {
  const styleMap = {
    tutorial: "Structure the post as a step-by-step tutorial with clear instructions and examples.",
    overview: "Present a high-level overview with key concepts and insights.",
    technical: "Create a detailed technical analysis with in-depth explanations.",
    storytelling: "Use a narrative approach to explain the technical content through a story."
  };
  return styleMap[style] || styleMap.overview;
};

export async function POST(request) {
  try {
    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
    
    const { content, images, revisionPrompt, currentPost, tone, audience, style } = await request.json();

    if (!content && !revisionPrompt) {
      return NextResponse.json(
        { error: 'Content or revision prompt is required' },
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
    
    try {
      let promptContent;
      let systemPrompt;

      if (revisionPrompt) {
        // Handle revision request
        promptContent = `Current blog post:\n${currentPost}\n\nRequested changes:\n${revisionPrompt}`;
        systemPrompt = `You are a professional technical writer who helps revise blog posts. 
          Review the current blog post and make the requested changes while maintaining the overall structure and quality. 
          ${getTonePrompt(tone)}
          ${getAudiencePrompt(audience)}
          ${getStylePrompt(style)}
          Return the complete revised post in HTML format with proper tags and structure.
          If images were previously included, maintain them in appropriate positions.`;
      } else {
        // Handle initial blog post generation
        promptContent = content;
        if (images && images.length > 0) {
          promptContent += '\n\nInclude the following images in appropriate sections of the blog post:\n';
          images.forEach((image, index) => {
            promptContent += `\nImage ${index + 1}: ${image.url}`;
          });
        }
        systemPrompt = `You are a professional technical writer who creates engaging and informative blog posts from README files. 
          Format your response in HTML with proper tags and structure. 
          ${getTonePrompt(tone)}
          ${getAudiencePrompt(audience)}
          ${getStylePrompt(style)}
          When image URLs are provided, include them in the blog post using appropriate HTML img tags with responsive classes. 
          Place images in relevant sections to enhance the content.`;
      }

      const message = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: revisionPrompt
              ? `Please revise this blog post according to the following request: ${promptContent}`
              : `Please create a detailed blog post from this content and include any provided images in relevant sections: ${promptContent}`
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
