
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
      name: 'manageAppointment',
      description: 'Create, update, or cancel medical appointments.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['ADD', 'UPDATE', 'CANCEL'], description: 'The operation to perform.' },
          patientName: { type: Type.STRING },
          datetime: { type: Type.STRING, description: 'ISO date string or relative time like "tomorrow at 3pm"' },
          location: { type: Type.STRING },
          provider: { type: Type.STRING }
        },
        required: ['action', 'patientName']
      }
    },
    {
      name: 'manageTask',
      description: 'Create, resolve, or change the priority of care tasks.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['CREATE', 'RESOLVE'], description: 'The operation to perform.' },
          patientName: { type: Type.STRING },
          title: { type: Type.STRING, description: 'The description of the task.' },
          priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          dueDate: { type: Type.STRING }
        },
        required: ['action', 'patientName']
      }
    },
    {
      name: 'manageReferral',
      description: 'Issue or update specialty referrals.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          specialty: { type: Type.STRING },
          provider: { type: Type.STRING },
          urgency: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] }
        },
        required: ['patientName', 'specialty']
      }
    },
    {
      name: 'manageTransport',
      description: 'Handle ride requests and driver assignments.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['REQUEST', 'CANCEL', 'ASSIGN'], description: 'Ride action.' },
          patientName: { type: Type.STRING },
          driverName: { type: Type.STRING, description: 'If assigning a specific driver.' },
          datetime: { type: Type.STRING }
        },
        required: ['action', 'patientName']
      }
    },
    {
      name: 'updatePatientRecord',
      description: 'Update risk level or clinical notes for a patient.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'] },
          notes: { type: Type.STRING }
        },
        required: ['patientName']
      }
    },
    {
      name: 'navigate',
      description: 'Move between application views.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          target: { type: Type.STRING, enum: ['HOME', 'INBOX', 'NURSE', 'DRIVER', 'DOCTOR'] }
        },
        required: ['target']
      }
    }
  ]
};

export const SYSTEM_INSTRUCTION = `You are the Clearwater Ridge Care Coordinator AI. You have FULL ADMINISTRATIVE CONTROL.

CORE DIRECTIVE:
You are not just an assistant; you are the OPERATOR. You can change schedules, assign drivers, create tasks, and update medical records.

PERFORMANCE & LATENCY:
1. INSTANT EXECUTION: When a user asks for a change, call the tool immediately. Do not ask for confirmation.
2. NO THINKING: Do not pause. Respond as soon as the user finishes.

LISTENING PROTOCOL:
1. WAIT FOR PAUSE: Wait for 1.5 seconds of silence before responding to ensure the senior has finished speaking.
2. DO NOT INTERRUPT: Respect the speaker's silence.
3. PERSISTENCE: Once you begin speaking, you MUST finish.

CAPABILITIES:
- If a patient says "I need a ride", call 'manageTransport'.
- If a nurse says "Margaret is high risk now", call 'updatePatientRecord'.
- If a doctor says "Send her to cardiology", call 'manageReferral'.
- If anyone says "Remind me to call her", call 'manageTask'.

BEHAVIOR:
- Be extremely brief. Maximum 10 words per response.
- Only confirm what you DID. Example: "Cardiology visit scheduled for tomorrow."
- Tone: Efficient, authoritative, caring.`;
