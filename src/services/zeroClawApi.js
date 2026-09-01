import jsPDF from 'jspdf';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function callGemini(prompt) {
  if (!API_KEY) {
    throw new Error('Missing VITE_GEMINI_API_KEY environment variable.');
  }

  const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((p) => p.text && !p.thought) || parts[0];
  const text = textPart?.text || '';
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text;
}

export async function chatWithZeroClaw(message, context = {}) {
  const systemPrompt = `You are an AI assistant for a cybersecurity honeypot dashboard called Kynn. You have access to all website data and API logs. Use the provided context to answer questions, generate reports, explain risks, and help with forensic analysis. Context: ${JSON.stringify(context)}`;
  const reply = await callGemini(`${systemPrompt}\n\nUser: ${message}`);
  return { reply };
}

export async function generateForensicPDF(eventData) {
  const prompt = `Generate a detailed forensic investigation report for this security incident following this exact structure:

1. TITLE PAGE
- Case Name
- Case ID
- Date
- Department/Organization
- Investigator Name
- Contact Information

2. TABLE OF CONTENTS

3. ADMINISTRATIVE INFORMATION
- Case number and name
- Requesting department
- Participants (investigators, victims, suspects)
- Authorizations

4. EXECUTIVE SUMMARY
- Brief overview (no more than 10% of report)

5. INVESTIGATION SCOPE
- What was analyzed
- Objectives

6. ANALYSIS SUMMARY
- Key artifacts found
- Technical summary

7. ANALYSIS
- Detailed investigation steps
- Tools used (with versions)
- Hardware/software specifications

8. CONCLUSION
- Summary of findings
- Security recommendations
- Next steps

9. EXHIBITS
- Chain of custody
- Evidence details

10. REVISION HISTORY

Use the following event data: ${JSON.stringify(eventData)}

Write in past tense, active voice, clear and concise. Include tables where appropriate.`;
  const reportText = await callGemini(prompt);
  const doc = new jsPDF();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const lineH = 6;
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Forensic Investigation Report", margin, y);
  y += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toISOString()} | Case: ${eventData.session || "UNKNOWN"}`, margin, y);
  y += 8;
  doc.setDrawColor(57, 200, 60);
  doc.setLineWidth(0.5);
  doc.line(margin, y, 198, y);
  y += 8;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const lines = doc.splitTextToSize(reportText, 186);
  for (const line of lines) {
    if (y + lineH > pageH - margin) {
      doc.addPage();
      y = margin + 6;
    }
    doc.text(line, margin, y);
    y += lineH;
  }

  const pdfBase64 = doc.output('datauristring').split(',')[1];
  return { pdf: pdfBase64, caseId: eventData.session || "UNKNOWN", reportText };
}

export async function checkWebhookStatus() {
  try {
    await callGemini('Respond with a short acknowledgement.');
    return true;
  } catch {
    return false;
  }
}

export async function explainDecision(eventData) {
  const prompt = `Explain the AI decision for this event: ${JSON.stringify(eventData)}`;
  const reply = await callGemini(prompt);
  return { reply };
}

export async function verifyEvidence(hash) {
  const prompt = `Analyze and verify this forensic evidence hash for integrity in the context of a cybersecurity incident: ${hash}. Provide a brief explanation of what this hash represents and confirm its integrity status.`;
  const reply = await callGemini(prompt);
  return { reply };
}

export async function classifyLogWithAI(eventData) {
  const prompt = `Analyze this honeypot log entry and classify it into one of four safety levels: "SAFE", "LOW", "MID", or "CRITICAL".
Event Data: ${JSON.stringify(eventData)}

Return JSON ONLY with these fields:
{
  "classification": "SAFE" | "LOW" | "MID" | "CRITICAL",
  "risk_score": number (0-100),
  "confidence": number (0-100),
  "reasoning": "brief description of why this log is classified as such"
}`;

  try {
    const reply = await callGemini(prompt);
    const cleaned = reply.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    const isSafe = !eventData.input && !eventData.username?.includes("root") && !eventData.eventid?.includes("failed");
    return {
      classification: isSafe ? "SAFE" : "LOW",
      risk_score: isSafe ? 10 : 30,
      confidence: 85,
      reasoning: "Heuristic classification fallback",
    };
  }
}

export default {
  chatWithZeroClaw,
  generateForensicPDF,
  checkWebhookStatus,
  explainDecision,
  verifyEvidence,
  classifyLogWithAI,
};
