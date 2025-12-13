import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DocumentContext, HeadingInfo, ManualEntry, ProvisionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "Whether the HTS code was found under any derivative category.",
    },
    matches: {
      type: Type.ARRAY,
      description: "A list of all specific derivative HTS categories or rules that this code falls under.",
      items: {
        type: Type.OBJECT,
        properties: {
          derivativeCategory: {
            type: Type.STRING,
            description: "The specific name, ID, or header of the derivative category (e.g., 'Aluminum Stranded Wire', 'Heading 7604').",
          },
          metalType: {
            type: Type.STRING,
            enum: ["Aluminum", "Steel", "Both", "Unknown"],
            description: "The type of metal (Aluminum or Steel) associated with this specific match.",
          },
          matchDetail: {
            type: Type.STRING,
            description: "Detailed extract or explanation of the specific rule/description in the document that this code matches.",
          },
          confidence: {
            type: Type.STRING,
            enum: ["High", "Medium", "Low"],
            description: "Confidence level: 'High' for direct code/range matches, 'Medium' for broad category matches, 'Low' for inferred/ambiguous matches.",
          },
        },
        required: ["derivativeCategory", "metalType", "matchDetail", "confidence"],
      },
    },
    reasoning: {
      type: Type.STRING,
      description: "A general summary of why the code matches or does not match.",
    },
  },
  required: ["found", "matches", "reasoning"],
};

const PROVISION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "Whether the requested HTS provision/heading was found or defined in the text.",
    },
    code: {
      type: Type.STRING,
      description: "The specific HTS code or Heading found (e.g. '9903.81.91').",
    },
    metalType: {
      type: Type.STRING,
      description: "The metal type associated (Aluminum, Steel, or Both).",
    },
    description: {
      type: Type.STRING,
      description: "The full detailed text, scope, rules, and notes associated with this provision in the document.",
    },
  },
  required: ["found", "code", "metalType", "description"],
};

const HEADINGS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headings: {
      type: Type.ARRAY,
      description: "A list of all unique HTS Headings (4-digit) mentioned in the document.",
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: "The 4-digit HTS Heading code (e.g. 7604, 7306).",
          },
          description: {
            type: Type.STRING,
            description: "The description or title associated with this heading in the document.",
          },
          details: {
            type: Type.STRING,
            description: "A comprehensive summary of the specific rules, exclusions, and scope details mentioned in the text for this heading.",
          },
        },
        required: ["heading", "description", "details"],
      },
    },
  },
  required: ["headings"],
};

export const checkHtsCode = async (
  context: DocumentContext | null,
  manualEntries: ManualEntry[],
  htsCode: string
): Promise<AnalysisResult> => {
  try {
    const parts = [];

    // 1. Add Manual Entries Context
    if (manualEntries && manualEntries.length > 0) {
      const entriesText = manualEntries.map(e => 
        `- Code/Range: ${e.code}\n  Category: ${e.category}\n  Metal: ${e.metalType}\n  Rule: ${e.description}`
      ).join('\n\n');
      
      parts.push({
        text: `MANUAL OVERRIDE / SUPPLEMENTARY RULES:\nThe following are specific user-defined rules that MUST be checked. If the HTS code matches any of these, consider it a match.\n\n${entriesText}\n\n`
      });
    }

    // 2. Add Document Context (File or Text)
    if (context) {
      if (context.type === 'file' && context.mimeType) {
        parts.push({
          inlineData: {
            mimeType: context.mimeType,
            data: context.content,
          },
        });
        parts.push({
          text: "The above is the reference document containing Derivative HTS details for Aluminum and Steel.",
        });
      } else {
        parts.push({
          text: `REFERENCE DOCUMENT CONTENT:\n\n${context.content}\n\n`,
        });
      }
    } else {
      parts.push({
        text: "No external reference document provided. Please rely strictly on the Manual Override Rules provided above, if any.",
      });
    }

    // 3. Add Prompt
    parts.push({
      text: `
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0, // Deterministic for compliance
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    const result = JSON.parse(response.text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error;
  }
};

export const lookupHtsProvision = async (
  context: DocumentContext | null,
  provisionCode: string
): Promise<ProvisionResult> => {
  try {
    const parts = [];

    // Add Document Context (File or Text)
    if (context) {
      if (context.type === 'file' && context.mimeType) {
        parts.push({
          inlineData: {
            mimeType: context.mimeType,
            data: context.content,
          },
        });
        parts.push({
          text: "The above is the reference document containing Derivative HTS details.",
        });
      } else {
        parts.push({
          text: `REFERENCE DOCUMENT CONTENT:\n\n${context.content}\n\n`,
        });
      }
    } else {
      // Return not found immediately if no context
      return { found: false, code: provisionCode, metalType: "Unknown", description: "No reference document loaded to search." };
    }

    // Add Prompt
    parts.push({
      text: `
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: PROVISION_SCHEMA,
        temperature: 0,
      },
    });

    if (!response.text) throw new Error("No response from Gemini.");

    const result = JSON.parse(response.text) as ProvisionResult;
    return result;

  } catch (error) {
    console.error("Error looking up provision:", error);
    throw error;
  }
};

export const extractDocumentHeadings = async (
  context: DocumentContext
): Promise<HeadingInfo[]> => {
  try {
    const parts = [];

    if (context.type === 'file' && context.mimeType) {
      parts.push({
        inlineData: {
          mimeType: context.mimeType,
          data: context.content,
        },
      });
      parts.push({
        text: "Reference document.",
      });
    } else {
      parts.push({
        text: `REFERENCE DOCUMENT CONTENT:\n\n${context.content}\n\n`,
      });
    }

    parts.push({
      text: `
      Analyze the document and extract a list of all HTS Headings (typically 4-digit codes like 7601, 7604, 7301, etc.) that are explicitly mentioned as having derivatives or being part of the scope.
      For each heading:
      1. Provide the heading code.
      2. Provide a brief title/description.
      3. Provide a detailed summary of the text content related to this heading (rules, scope, exclusions).
      Return the data in JSON format with a 'headings' array.
      `,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: HEADINGS_SCHEMA,
        temperature: 0,
      },
    });

    if (!response.text) throw new Error("No response");

    const result = JSON.parse(response.text);
    return result.headings || [];

  } catch (error) {
    console.error("Error extracting headings:", error);
    return [];
  }
};