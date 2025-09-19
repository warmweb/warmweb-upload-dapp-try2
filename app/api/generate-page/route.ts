import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, config } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert web developer and designer who creates beautiful, responsive landing pages.

IMPORTANT INSTRUCTIONS:
- Generate a complete, single HTML file with embedded CSS and JavaScript
- The HTML should be fully self-contained and ready to deploy
- Use modern, semantic HTML5 structure
- Include responsive CSS with mobile-first design
- Implement the exact color scheme, typography, and features specified
- Use high-quality placeholder images from Unsplash with descriptive alt text
- Ensure proper SEO meta tags and accessibility features
- Make the design professional and conversion-focused
- Include smooth animations and hover effects as specified
- Ensure cross-browser compatibility

TECHNICAL REQUIREMENTS:
- Single HTML file output only
- Embedded CSS in <style> tags in the <head>
- Embedded JavaScript in <script> tags before closing </body>
- Use modern CSS features (flexbox, grid, custom properties)
- Implement responsive breakpoints (mobile, tablet, desktop)
- Include proper viewport meta tag
- Use semantic HTML elements (header, nav, main, section, footer)
- Ensure WCAG accessibility guidelines compliance

Return only the complete HTML code without any markdown formatting or explanations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const generatedHTML = completion.choices[0]?.message?.content;

    if (!generatedHTML) {
      throw new Error('No content generated');
    }

    // Clean up any markdown formatting that might be present
    const cleanHTML = generatedHTML
      .replace(/```html\n?/g, '')
      .replace(/```\n?$/g, '')
      .trim();

    return NextResponse.json({
      html: cleanHTML,
      usage: completion.usage,
    });

  } catch (error: any) {
    console.error('AI generation error:', error);

    // Return specific error messages
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your billing.' },
        { status: 429 }
      );
    }

    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to generate landing page',
        details: error.message
      },
      { status: 500 }
    );
  }
}