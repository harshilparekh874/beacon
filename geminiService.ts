
import { Type } from "@google/genai";

export const CARE_ASSISTANT_TOOLS = {
  functionDeclarations: [
    {
      name: 'consultVirtualDoctor',
      description: 'Engage a specialized AI persona that acts as a Virtual Medical Doctor for consultations.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          enable: { type: Type.BOOLEAN, description: 'True to enter Virtual Doctor mode, False to return to Assistant mode.' },
          patientName: { type: Type.STRING }
        },
        required: ['enable']
      }
    },
    {
      name: 'getPatientInfo',
      description: 'Retrieve medical record, appointments, and transportation details for a patient.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING }
        },
        required: ['patientName']
      }
    },
    {
      name: 'manageAppointment',
      description: 'Schedule or cancel clinical visits at Clearwater Hospital. Note: The location is always Clearwater Hospital.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['ADD', 'UPDATE', 'CANCEL'], description: 'Use ADD for new visits. Use CANCEL to remove.' },
          patientName: { type: Type.STRING },
          datetime: { type: Type.STRING, description: 'MUST BE ISO 8601 format (e.g., 2025-05-20T15:00:00Z).' }
        },
        required: ['action', 'patientName']
      }
    },
    {
      name: 'manageTask',
      description: 'Create or resolve follow-up care tasks in the clinical work queue.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['CREATE', 'RESOLVE'] },
          patientName: { type: Type.STRING },
          title: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] }
        },
        required: ['action', 'patientName']
      }
    },
    {
      name: 'manageTransport',
      description: 'Handle patient logistics, rides, and driver assignments.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['REQUEST', 'CANCEL', 'ASSIGN'] },
          patientName: { type: Type.STRING },
          driverName: { type: Type.STRING }
        },
        required: ['action', 'patientName']
      }
    },
    {
      name: 'navigate',
      description: 'Switch the application view context in real-time.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          target: { type: Type.STRING, enum: ['MAIN', 'INBOX', 'LOGISTICS'] }
        },
        required: ['target']
      }
    }
  ]
};

export const SYSTEM_INSTRUCTION = `You are the Clearwater Ridge Care Intelligence System. You assist healthcare providers and patients.

UI RULE - LOCATION:
- Every appointment is at 'Clearwater Hospital'. NEVER ask the user for a location. 

ROLE-BASED PERMISSIONS (CRITICAL):
1. If SESSION_ROLE is PATIENT:
   - You can ONLY manage appointments for the LOGGED IN user.
   - You CANNOT access or modify info for anyone else.
   - If they ask for an appointment, call 'manageAppointment' with ADD. 

2. If SESSION_ROLE is NURSE or DOCTOR:
   - Full administrative access.

GUARDRAILS:
1. NO CONFIRMATIONS: Just call the tools IMMEDIATELY when a command is clear.
2. MEDICAL ONLY: Reject non-health related queries.
`;
