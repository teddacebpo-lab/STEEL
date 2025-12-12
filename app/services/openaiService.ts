import OpenAI from 'openai';
import { AnalysisResult, DocumentContext, HeadingInfo, ManualEntry, ProvisionResult } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Since this is a client-side app
});

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    found: {
      type: 'boolean',
      description: 'Whether the HTS code was found under any derivative category.',
    },
    matches: {
      type: 'array',
      description: 'A list of all specific derivative HTS categories or rules that this code falls under.',
      items: {
        type: 'object',
        properties: {
          derivativeCategory: {
            type: 'string',
            description: 'The specific name, ID, or header of the derivative category (e.g., \'Aluminum Stranded Wire\', \'Heading 7604\').',
          },
          metalType: {
            type: 'string',
            enum: ['Aluminum', 'Steel', 'Both', 'Unknown'],
            description: 'The type of metal (Aluminum or Steel) associated with this specific match.',
          },
          matchDetail: {
            type: 'string',
            description: 'Detailed extract or explanation of the specific rule/description in the document that this code matches.',
          },
          confidence: {
            type: 'string',
            enum: ['High', 'Medium', 'Low'],
            description: 'Confidence level: \'High\' for direct code/range matches, \'Medium\' for broad category matches, \'Low\' for inferred/ambiguous matches.',
          },
        },
        required: ['derivativeCategory', 'metalType', 'matchDetail', 'confidence'],
      },
    },
    reasoning: {
      type: 'string',
      description: 'A general summary of why the code matches or does not match.',
    },
  },
  required: ['found', 'matches', 'reasoning'],
};

const PROVISION_SCHEMA = {
  type: 'object',
  properties: {
    found: {
      type: 'boolean',
      description: 'Whether the requested HTS provision/heading was found or defined in the text.',
    },
    code: {
      type: 'string',
      description: 'The specific HTS code or Heading found (e.g. \'9903.81.91\').',
    },
    metalType: {
      type: 'string',
      description: 'The metal type associated (Aluminum, Steel, or Both).',
    },
    description: {
      type: 'string',
      description: 'The full detailed text, scope, rules, and notes associated with this provision in the document.',
    },
  },
  required: ['found', 'code', 'metalType', 'description'],
};

const HEADINGS_SCHEMA = {
  type: 'object',
  properties: {
    headings: {
      type: 'array',
      description: 'A list of all unique HTS Headings (4-digit) mentioned in the document.',
      items: {
        type: 'object',
        properties: {
          heading: {
            type: 'string',
            description: 'The 4-digit HTS Heading code (e.g. 7604, 7306).',
          },
          description: {
            type: 'string',
            description: 'The description or title associated with this heading in the document.',
          },
          details: {
            type: 'string',
            description: 'A comprehensive summary of the specific rules, exclusions, and scope details mentioned in the text for this heading.',
          },
        },
        required: ['heading', 'description', 'details'],
      },
    },
  },
  required: ['headings'],
};

export const checkHtsCode = async (
  context: DocumentContext | null,
  manualEntries: ManualEntry[],
  htsCode: string
): Promise<AnalysisResult> => {
  try {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // 1. Add Manual Entries Context
    if (manualEntries && manualEntries.length > 0) {
      const entriesText = manualEntries.map(e =>
        `- Code/Range: ${e.code}\n  Category: ${e.category}\n  Metal: ${e.metalType}\n  Rule: ${e.description}`
      ).join('\n\n');

      messages.push({
        role: 'user',
        content: `MANUAL OVERRIDE / SUPPLEMENTARY RULES:\nThe following are specific user-defined rules that MUST be checked. If the HTS code matches any of these, consider it a match.\n\n${entriesText}\n\n`
      });
    }

    // 2. Add Document Context (File or Text)
    if (context) {
      if (context.type === 'file' && context.mimeType) {
        // For files, OpenAI can handle text, but for images or other, might need vision
        // Assuming text for now
        messages.push({
          role: 'user',
          content: `The reference document contains: ${context.content}`,
        });
      } else {
        messages.push({
          role: 'user',
          content: `REFERENCE DOCUMENT CONTENT:\n\n${context.content}\n\n`,
        });
      }
    } else {
      messages.push({
        role: 'user',
        content: 'No external reference document provided. Please rely strictly on the Manual Override Rules provided above, if any.',
      });
    }

    // 3. Add Prompt
    messages.push({
      role: 'user',
      content: `
      You are a Trade Compliance Expert.
      Analyze the provided reference document (if any) and the Manual Override Rules carefully.

      Task: Determine if the HTS Code "${htsCode}" falls under any "Derivative HTS" category for Aluminum or Steel.

      Rules:
      1. The user might provide a 4, 6, 8, or 10 digit code. Check if it matches any specific code or falls within any ranges/categories defined in the text or manual rules.
      2. If the code falls under multiple categories (e.g., it is under a general heading AND a specific sub-derivative list), YOU MUST LIST ALL OF THEM in the 'matches' array.
      3. For EACH match, provide the specific 'derivativeCategory' name and a 'matchDetail' explaining the exact text/rule it matched.
      4. Identify if each match relates to Aluminum, Steel, or both.
      5. For each match, assign a 'confidence' level ('High', 'Medium', 'Low'). Manual Override Rules usually imply 'High' confidence if the code matches explicitly.
      6. Return the result in JSON format.
      `,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or gpt-4o for better performance
      messages,
      response_format: { type: 'json_schema', json_schema: { name: 'hts_analysis', schema: RESPONSE_SCHEMA } },
      temperature: 0,
    });

    if (!response.choices[0].message.content) {
      throw new Error('No response from OpenAI.');
    }

    const result = JSON.parse(response.choices[0].message.content) as AnalysisResult;
    return result;

  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
};

export const lookupHtsProvision = async (
  context: DocumentContext | null,
  provisionCode: string
): Promise<ProvisionResult> => {
  try {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add Document Context (File or Text)
    if (context) {
      if (context.type === 'file' && context.mimeType) {
        messages.push({
          role: 'user',
          content: `The reference document contains: ${context.content}`,
        });
      } else {
        messages.push({
          role: 'user',
          content: `REFERENCE DOCUMENT CONTENT:\n\n${context.content}\n\n`,
        });
      }
    } else {
      return { found: false, code: provisionCode, metalType: 'Unknown', description: 'No reference document loaded to search.' };
    }

    // Add Prompt
    messages.push({
      role: 'user',
      content: `
      You are a Trade Compliance Expert.
      Analyze the provided reference document.

      Task: The user is asking for the details of a specific HTS Provision or Heading: "${provisionCode}".
      (Example: 9903.81.91, Heading 7604, etc.)

      Requirements:
      1. Search the text for this specific code or heading.
      2. If found, extract the FULL text description, scope, and any notes (e.g. effective dates, exclusions, specific countries) associated with it.
      3. Identify if it relates to Steel, Aluminum, or Both.
      4. If the exact code is not found, but a parent range or very similar provision is found, provide that detail but note it in the description.
      5. Return the result in JSON format using the provided schema.
      `,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_schema', json_schema: { name: 'provision_lookup', schema: PROVISION_SCHEMA } },
      temperature: 0,
    });

    if (!response.choices[0].message.content) throw new Error('No response from OpenAI.');

    const result = JSON.parse(response.choices[0].message.content) as ProvisionResult;
    return result;

  } catch (error) {
    console.error('Error looking up provision:', error);
    throw error;
  }
};

export const extractDocumentHeadings = async (
  context: DocumentContext
): Promise<HeadingInfo[]> => {
  try {
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (context.type === 'file' && context.mimeType) {
      messages.push({
        role: 'user',
        content: `Reference document: ${context.content}`,
      });
    } else {
      messages.push({
        role: 'user',
        content: `REFERENCE DOCUMENT CONTENT:\n\n${context.content}\n\n`,
      });
    }

    messages.push({
      role: 'user',
      content: `
      Analyze the document and extract a list of all HTS Headings (typically 4-digit codes like 7601, 7604, 7301, etc.) that are explicitly mentioned as having derivatives or being part of the scope.
      For each heading:
      1. Provide the heading code.
      2. Provide a brief title/description.
      3. Provide a detailed summary of the text content related to this heading (rules, scope, exclusions).
      Return the data in JSON format with a 'headings' array.
      `,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_schema', json_schema: { name: 'headings_extraction', schema: HEADINGS_SCHEMA } },
      temperature: 0,
    });

    if (!response.choices[0].message.content) throw new Error('No response');

    const result = JSON.parse(response.choices[0].message.content);
    return result.headings || [];

  } catch (error) {
    console.error('Error extracting headings:', error);
    return [];
  }
};