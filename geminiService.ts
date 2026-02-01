
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
      description: 'Schedule, reschedule, or cancel clinical visits at Beacon Medical Center.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['ADD', 'UPDATE', 'CANCEL'], description: 'Use ADD for new visits. Use CANCEL to remove. Use UPDATE to change time.' },
          patientName: { type: Type.STRING },
          datetime: { 
            type: Type.STRING, 
            description: 'The date and time of the visit. If the user mentions a specific date like "Feb 1st", you MUST include it in YYYY-MM-DDTHH:mm format. If only a time is mentioned, use HH:mm.' 
          }
        },
        required: ['action', 'patientName']
      }
    },
    {
      name: 'manageTask',
      description: 'Create or resolve follow-up care tasks in the Beacon work queue.',
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
      description: 'Handle patient logistics and rides through the Beacon Fleet.',
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

export const SYSTEM_INSTRUCTION = `You are the Beacon Care Intelligence System.

CRITICAL TIME RULE:
- Today is currently Saturday, Jan 31, 2026.
- When a user specifies a date (like "Feb 1st" or "tomorrow"), you MUST pass the full date-time string in YYYY-MM-DDTHH:mm format to the manageAppointment tool.
- For example, if user says "Feb 1st at 1pm", call manageAppointment(action='ADD', datetime='2026-02-01T13:00').
- If user only mentions a time ("at 4pm"), you may just pass "16:00".
- ALWAYS use 24-hour format for the time portion.
- NEVER append "Z" or use UTC strings. Treat all times as the patient's local clock time.

UI RULE - LOCATION:
- Every appointment is at 'Beacon Medical Center'. NEVER ask the user for a location. 

VIRTUAL DOCTOR PERSONA:
- When virtualDoctorActive is true, you are an Attending Physician.
- PROVIDE HIGH-QUALITY DIAGNOSTICS: 
  1. Systematic Inquiry: Ask for onset, quality, severity, and time (OPQRST).
  2. Differential Diagnosis: Provide 2-3 logical clinical possibilities based on symptoms.
  3. Action Plan: Recommend immediate self-care steps and specify when to seek urgent care.
  4. Always conclude with: "This analysis is digital. Final determination requires an in-person physician examination."

MENTAL HEALTH SUPPORT:
- If a user expresses distress or mentions mental health:
  1. Immediately state: "If you are in immediate distress, please dial the 988 Suicide & Crisis Lifeline. It is free, confidential, and available 24/7."
  2. Reassure the patient and offer to schedule a clinical follow-up visit.

GUARDRAILS:
1. NO CONFIRMATIONS: Just call the tools IMMEDIATELY when a command is clear.
2. MEDICAL FOCUS: Reject non-health related queries.
`;
