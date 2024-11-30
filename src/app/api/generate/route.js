import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const getTonePrompt = (tone) => {
  const toneMap = {
    casual: "Write in a casual, conversational tone that's friendly and approachable. Use informal language, personal anecdotes, and relatable examples.",
    professional: "Maintain a professional and formal tone suitable for business contexts. Use clear, precise language and industry-standard terminology.",
    educational: "Adopt an instructive tone that prioritizes learning. Break down complex concepts, provide examples, and include explanatory notes.",
    technical: "Employ a detailed technical tone with precise terminology and in-depth explanations. Include technical specifications and implementation details."
  };
  return toneMap[tone] || toneMap.professional;
};

const getAudiencePrompt = (audience) => {
  const audienceMap = {
    developers: "Write for software developers by including code examples, technical implementation details, and development best practices. Assume familiarity with programming concepts.",
    managers: "Write for technical managers by focusing on high-level concepts, business value, and strategic implications. Minimize technical jargon and emphasize decision-making factors.",
    enthusiasts: "Write for tech enthusiasts by balancing technical details with accessible explanations. Include both high-level concepts and interesting technical insights.",
    beginners: "Write for beginners by explaining concepts from first principles. Define technical terms, provide context for industry concepts, and include helpful analogies."
  };
  return audienceMap[audience] || audienceMap.developers;
};

const getStylePrompt = (style) => {
  const styleMap = {
    tutorial: "Structure the post as a comprehensive tutorial with clear steps, code examples, and practical implementation guidance. Include prerequisites, steps to reproduce, and expected outcomes.",
    overview: "Present a high-level overview that focuses on key concepts, benefits, and use cases. Organize content around main themes and takeaways.",
    technical: "Create a detailed technical analysis that dives deep into implementation details, architecture decisions, and technical trade-offs. Include specific technical examples and considerations.",
    storytelling: "Use a narrative approach to explain technical content through a story. Start with a problem or scenario, describe the journey of solving it, and conclude with lessons learned."
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
          
          Writing Guidelines:
          1. ${getTonePrompt(tone)}
          2. ${getAudiencePrompt(audience)}
          3. ${getStylePrompt(style)}
          
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
        systemPrompt = `You are a professional technical writer who creates engaging and informative blog posts. Your task is to transform the provided content into a well-structured, engaging blog post that tells a compelling story about the product or project.

          Key Responsibilities:
          1. Don't just reformat the content - create a proper blog post that explains the project's value, use cases, and unique features
          2. Add an engaging introduction that hooks the reader
          3. Organize information into logical sections with clear headings
          4. Include relevant examples and use cases
          5. Add a conclusion that summarizes key points and includes a call to action
          
          Writing Guidelines:
          1. ${getTonePrompt(tone)}
          2. ${getAudiencePrompt(audience)}
          3. ${getStylePrompt(style)}
          
          Format your response in HTML with proper tags and structure. When image URLs are provided, include them in relevant sections using appropriate HTML img tags with responsive classes.
          
          Remember: This is not just a reformatting task - you need to transform the technical content into an engaging blog post that provides value to the reader while maintaining technical accuracy.`;
      }

      const message = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: revisionPrompt
              ? `Please revise this blog post according to the following request: ${promptContent}`
              : `Please analyze this content and create an engaging blog post that tells the story of this project/product. Transform the technical details into a narrative that resonates with the target audience while maintaining accuracy: ${promptContent}`
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
