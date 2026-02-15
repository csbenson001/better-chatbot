export interface OutreachInput {
  prospectName: string;
  contactName: string;
  contactTitle: string;
  industry?: string;
  regulatoryContext?: string[];
  recentSignals?: string[];
  companySize?: string;
}

export interface GeneratedSequence {
  name: string;
  steps: Array<{
    stepNumber: number;
    type: string;
    subject: string | null;
    content: string;
    delayDays: number;
  }>;
}

export function generateOutreachSequence(
  input: OutreachInput,
): GeneratedSequence {
  const steps: Array<{
    stepNumber: number;
    type: string;
    subject: string | null;
    content: string;
    delayDays: number;
  }> = [];
  const firstName = input.contactName.split(" ")[0];

  // Step 1: Initial email
  steps.push({
    stepNumber: 1,
    type: "email",
    subject: buildSubjectLine(input),
    content: buildInitialEmail(input, firstName),
    delayDays: 0,
  });

  // Step 2: LinkedIn connect
  steps.push({
    stepNumber: 2,
    type: "linkedin-connect",
    subject: null,
    content: `Hi ${firstName}, I noticed your work in ${input.industry || "environmental compliance"} at ${input.prospectName}. I'd love to connect and share some insights about how companies in your space are approaching regulatory challenges. Looking forward to connecting!`,
    delayDays: 1,
  });

  // Step 3: Follow-up email
  steps.push({
    stepNumber: 3,
    type: "email",
    subject: `Re: ${buildSubjectLine(input)}`,
    content: buildFollowUpEmail(input, firstName),
    delayDays: 3,
  });

  // Step 4: Value-add email
  steps.push({
    stepNumber: 4,
    type: "email",
    subject: `${input.industry || "Industry"} compliance trends - thought you'd find this useful`,
    content: `Hi ${firstName},\n\nI came across this and thought of ${input.prospectName}:\n\n${generateValueAdd(input)}\n\nWould any of these trends affect your compliance strategy? Happy to discuss.\n\nBest,\n[Your Name]`,
    delayDays: 5,
  });

  // Step 5: Phone call
  steps.push({
    stepNumber: 5,
    type: "phone-call",
    subject: null,
    content: `Call script for ${firstName}:\n\n"Hi ${firstName}, this is [Name] from [Company]. I've been following ${input.prospectName}'s regulatory landscape and wanted to share how we're helping similar companies streamline their compliance. Do you have 5 minutes to chat about your biggest compliance challenges?"`,
    delayDays: 7,
  });

  // Step 6: Break-up email
  steps.push({
    stepNumber: 6,
    type: "email",
    subject: `Closing the loop on compliance at ${input.prospectName}`,
    content: `Hi ${firstName},\n\nI've reached out a few times about helping ${input.prospectName} with compliance management, but I understand timing may not be right.\n\nI'll step back for now, but I'm here if:\n- You face an upcoming audit or inspection\n- Regulatory requirements change for your facilities\n- You want to explore automating compliance workflows\n\nFeel free to reach out anytime. Wishing you and the team well.\n\nBest regards,\n[Your Name]`,
    delayDays: 10,
  });

  return {
    name: `Outreach: ${input.contactName} at ${input.prospectName}`,
    steps,
  };
}

function buildSubjectLine(input: OutreachInput): string {
  if (input.recentSignals?.includes("violation")) {
    return `Compliance support for ${input.prospectName}`;
  }
  if (input.recentSignals?.includes("expansion")) {
    return `Scaling compliance at ${input.prospectName}`;
  }
  if (input.regulatoryContext?.length) {
    return `${input.regulatoryContext[0]} compliance at ${input.prospectName}`;
  }
  return `Environmental compliance at ${input.prospectName}`;
}

function buildInitialEmail(input: OutreachInput, firstName: string): string {
  let hook = "";

  if (input.recentSignals?.includes("violation")) {
    hook = `I noticed ${input.prospectName} recently had a regulatory matter come up. Many companies we work with have faced similar situations, and we've helped them not only resolve immediate issues but prevent future ones.`;
  } else if (input.recentSignals?.includes("expansion")) {
    hook = `Congratulations on ${input.prospectName}'s recent growth. As you expand operations, compliance requirements typically multiply. We help growing companies scale their environmental compliance without scaling their compliance team.`;
  } else if (input.regulatoryContext?.length) {
    hook = `I've been following the regulatory landscape in ${input.industry || "your industry"}, particularly around ${input.regulatoryContext.join(" and ")}. Companies like ${input.prospectName} are often spending 40%+ more than necessary on manual compliance processes.`;
  } else {
    hook = `I work with companies in ${input.industry || "your industry"} to automate and streamline environmental compliance. Given ${input.prospectName}'s operations, I thought this might be relevant.`;
  }

  return `Hi ${firstName},\n\n${hook}\n\nSpecifically, we help with:\n- Automated regulatory reporting and filing\n- Real-time compliance monitoring\n- Proactive alert systems for regulatory changes\n\nWould you be open to a brief conversation about how ${input.prospectName} handles compliance today? Even if the timing isn't right, I'd love to share what we're seeing in the market.\n\nBest,\n[Your Name]`;
}

function buildFollowUpEmail(input: OutreachInput, firstName: string): string {
  return `Hi ${firstName},\n\nJust following up on my previous note. I know ${input.contactTitle ? `as ${input.contactTitle}` : "in your role"}, you're likely juggling many priorities.\n\nQuick question: Is compliance reporting still largely manual at ${input.prospectName}? \n\nI ask because companies similar to yours typically spend 500-1,000 hours annually on compliance reporting that could be automated. That's a significant cost that often flies under the radar.\n\nHappy to share a brief analysis of what that might look like for ${input.prospectName} - no strings attached.\n\nBest,\n[Your Name]`;
}

function generateValueAdd(input: OutreachInput): string {
  const trends: string[] = [];
  if (
    input.regulatoryContext?.includes("CAA") ||
    input.regulatoryContext?.includes("MACT")
  ) {
    trends.push(
      "- EPA's tightened emissions standards are increasing reporting requirements by 30-40% for affected facilities",
    );
  }
  if (
    input.regulatoryContext?.includes("LDAR") ||
    input.regulatoryContext?.includes("OGI")
  ) {
    trends.push(
      "- New methane monitoring technologies are reducing LDAR costs by 50% while improving detection rates",
    );
  }
  trends.push(
    "- Digital compliance platforms are replacing manual processes, with early adopters seeing 3x ROI",
  );
  trends.push(
    "- Proactive compliance monitoring is reducing violation rates by 60% for companies that implement it",
  );

  return trends.join("\n");
}
