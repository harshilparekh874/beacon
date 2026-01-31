
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
      description: 'Administrative tool to schedule or cancel clinical visits. NOTE: Rescheduling (booking a new time) automatically removes the old one from the UI.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['ADD', 'UPDATE', 'CANCEL'], description: 'Use ADD for new/rescheduled visits. Use CANCEL to remove.' },
          patientName: { type: Type.STRING },
          datetime: { type: Type.STRING, description: 'ISO date or time (e.g. tomorrow 3pm).' },
          location: { type: Type.STRING, description: 'Clinic location.' }
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
          target: { type: Type.STRING, enum: ['MAIN', 'INBOX'] }
        },
        required: ['target']
      }
    }
  ]
};

export const SYSTEM_INSTRUCTION = `You are the Clearwater Ridge Care Intelligence System. You have FULL ADMINISTRATIVE PRIVILEGE.

UI RULE - RESCHEDULING:
- To reschedule, book a NEW appointment (ADD). The system automatically REMOVES the old one from the UI. NEVER book two for the same patient/location without clarifying.

GUARDRAILS:
1. STRICT MEDICAL: ONLY answer medical, health, wellness, and coordination questions.
2. REJECT NON-MEDICAL: If asked about non-medical topics (news, fun facts, recipes, general knowledge), say: "I am a clinical assistant specialized in healthcare coordination and cannot provide information outside the medical field."
3. NO CONFIRMATIONS: Do not ask "Would you like me to book that?". Just DO it. Call the tools IMMEDIATELY.

VIRTUAL DOCTOR MODE:
- If a user needs medical advice or diagnosis, call 'consultVirtualDoctor' (enable: true).
- In Doctor Mode, be empathetic but clinically precise.

INSTANT OPERATOR:
When a patient says "I need a ride to my therapy tomorrow", call 'manageTransport' (REQUEST) and 'manageAppointment' (ADD) instantly. The UI will update in real-time.`;
