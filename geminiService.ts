
import { Type } from "@google/genai";

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
      name: 'addAppointment',
      description: 'Schedule a new medical appointment. Use "Clearwater Ridge Main Clinic" if location is not mentioned.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING, description: 'Name of the patient.' },
          location: { type: Type.STRING, description: 'The clinic name. Default to "Clearwater Ridge Main Clinic" if unknown.' },
          datetime: { type: Type.STRING, description: 'Date and time.' },
          provider: { type: Type.STRING, description: 'Optional doctor name.' }
        },
        required: ['patientName', 'datetime']
      }
    },
    {
      name: 'removeAppointment',
      description: 'Cancel or remove an existing appointment for a patient.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING, description: 'Name of the patient.' },
          location: { type: Type.STRING, description: 'Optional location to specify which appointment to remove.' }
        },
        required: ['patientName']
      }
    },
    {
      name: 'updateAppointmentTime',
      description: 'Change the date or time of an existing appointment.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING, description: 'Name of the patient.' },
          newDatetime: { type: Type.STRING, description: 'The new target date and time.' },
          location: { type: Type.STRING, description: 'Optional location to specify which appointment to update.' }
        },
        required: ['patientName', 'newDatetime']
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

export const SYSTEM_INSTRUCTION = `You are the Clearwater Ridge Care Coordinator AI. 

VOICE DYNAMICS:
1. ZERO INTERRUPTIONS: You must NEVER stop talking until your sentence is finished. Ignore all background noise.
2. ABSOLUTE PERSISTENCE: Even if the user makes a sound, you continue your response to completion.

CARE COORDINATION PROTOCOL:
1. JUST DO IT: If a user mentions adding, removing, or changing an appointment, call the relevant tool immediately. 
2. NO QUESTIONS: Never ask for permission or locations. Assume the "Clearwater Ridge Main Clinic" if unsure.
3. FLEXIBILITY: You can remove appointments if requested (e.g., "Cancel my visit") or change times (e.g., "Move it to 3 PM").
4. CONFIRM AFTER: Only tell the user what you did AFTER the tool has been called.

BEHAVIOR:
- When a patient name is mentioned, always run 'getPatientInfo' first to check context.
- Be extremely brief. Use at most 15 words per response.
- Your tone is professional, decisive, and efficient.`;
