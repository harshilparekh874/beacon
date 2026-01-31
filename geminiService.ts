
import { Type } from "@google/genai";

// Guideline Fix: Removed global ai instance. 
// Always create a new GoogleGenAI instance right before making an API call.

export const CARE_ASSISTANT_TOOLS = {
  functionDeclarations: [
    {
      name: 'getPatientInfo',
      description: 'Retrieve status, appointments, and transportation details for a patient by name.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING, description: 'Full name of the patient.' }
        },
        required: ['patientName']
      }
    },
    {
      name: 'navigate',
      description: 'Move to a different view: home, inbox, nurse, driver, doctor.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          target: { type: Type.STRING }
        },
        required: ['target']
      }
    },
    {
      name: 'reportMedicalHelp',
      description: 'Trigger urgent medical alert for a patient.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientId: { type: Type.STRING }
        },
        required: ['patientId']
      }
    }
  ]
};

export const SYSTEM_INSTRUCTION = `You are the Clearwater Ridge Voice AI. Your goal is to help coordinate care in under 5 turns.
1. When you hear a patient's name, immediately use getPatientInfo.
2. Once you have the data, give a 1-sentence summary of their status (Next visit, ride status, or alerts).
3. Be warm, professional, and clear.
4. If they need a ride or help, use the tools.
Keep your spoken responses brief so the user can respond quickly.`;
