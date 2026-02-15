import { industryRepository } from "lib/db/repository";

export interface PlaybookInput {
  tenantId: string;
  industryId?: string;
  type: string;
  targetCompetitor?: string;
  targetPersona?: string;
}

export interface GeneratedPlaybook {
  title: string;
  content: string;
  sections: Array<{ title: string; content: string; type: string }>;
  tags: string[];
}

export async function generatePlaybook(
  input: PlaybookInput,
): Promise<GeneratedPlaybook> {
  const sections: Array<{ title: string; content: string; type: string }> = [];
  let industryName = "General";
  let tags: string[] = [];

  // Load industry context
  if (input.industryId) {
    const industry = await industryRepository.selectIndustryById(
      input.industryId,
    );
    if (industry) {
      industryName = industry.name;
      tags = [...(industry.keywords || []).slice(0, 5)];
    }
  }

  switch (input.type) {
    case "industry-playbook":
      sections.push(
        {
          title: "Industry Overview",
          content: `Overview of the ${industryName} industry and key market dynamics.\n\nKey trends and drivers affecting buying decisions in this vertical.`,
          type: "overview",
        },
        {
          title: "Discovery Questions",
          content: generateDiscoveryQuestions(industryName),
          type: "discovery-questions",
        },
        {
          title: "Common Objections & Responses",
          content: generateObjectionHandling(industryName),
          type: "objections",
        },
        {
          title: "ROI Framework",
          content: generateROIFramework(industryName),
          type: "roi-analysis",
        },
        {
          title: "Next Steps Template",
          content:
            "1. Schedule technical deep-dive\n2. Identify pilot project scope\n3. Build business case with champion\n4. Present to economic buyer\n5. Negotiate terms and timeline",
          type: "next-steps",
        },
      );
      break;

    case "competitor-battle-card":
      const competitor = input.targetCompetitor || "Competitor";
      sections.push(
        {
          title: `${competitor} Overview`,
          content: `Competitive analysis of ${competitor} in the ${industryName} space.`,
          type: "overview",
        },
        {
          title: "Head-to-Head Comparison",
          content: generateCompetitiveComparison(competitor),
          type: "competitive-comparison",
        },
        {
          title: "Competitive Objection Handling",
          content: `When prospect mentions ${competitor}:\n\n1. **"We're already using ${competitor}"**\n   Response: "That's great that you've invested in this area. Many of our customers switched from ${competitor} because..."\n\n2. **"${competitor} is cheaper"**\n   Response: "Let's compare total cost of ownership including implementation, training, and ongoing maintenance..."`,
          type: "objections",
        },
        {
          title: "Win Themes",
          content: `Key differentiation points vs ${competitor}:\n- Superior regulatory coverage\n- Faster time to value\n- Better integration capabilities\n- Industry-specific expertise`,
          type: "talking-points",
        },
      );
      tags.push(competitor.toLowerCase());
      break;

    case "objection-handler":
      sections.push(
        {
          title: "Common Objections",
          content: generateObjectionHandling(industryName),
          type: "objections",
        },
        {
          title: "Price Objections",
          content:
            '**"Too expensive"**\nResponse: Calculate compliance cost savings. Show 3-year ROI.\n\n**"No budget"**\nResponse: Explore regulatory penalty risk. Calculate cost of non-compliance.',
          type: "objections",
        },
        {
          title: "Status Quo Objections",
          content:
            '**"We handle it in-house"**\nResponse: Calculate true cost of FTEs dedicated to compliance. Show automation potential.\n\n**"Not a priority right now"**\nResponse: Reference upcoming regulatory changes and deadlines.',
          type: "objections",
        },
      );
      break;

    case "discovery-guide":
      sections.push(
        {
          title: "Pre-Call Research Checklist",
          content:
            "- [ ] Review company profile and recent filings\n- [ ] Check compliance history in EPA ECHO\n- [ ] Identify key contacts and decision-makers\n- [ ] Review recent signals and buying indicators\n- [ ] Prepare industry-specific talking points",
          type: "overview",
        },
        {
          title: "Discovery Questions",
          content: generateDiscoveryQuestions(industryName),
          type: "discovery-questions",
        },
        {
          title: "Qualification Criteria",
          content:
            "BANT Framework:\n- **Budget:** Annual compliance spend > $100K\n- **Authority:** Director-level or above\n- **Need:** Active regulatory programs (CAA, CWA, RCRA)\n- **Timeline:** Permit renewal or audit within 12 months",
          type: "overview",
        },
      );
      break;

    default:
      sections.push({
        title: "Overview",
        content: `Playbook for ${industryName}`,
        type: "overview",
      });
  }

  const title = buildPlaybookTitle(
    input.type,
    industryName,
    input.targetCompetitor,
  );
  const content = sections
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n---\n\n");

  return { title, content, sections, tags };
}

function buildPlaybookTitle(
  type: string,
  industry: string,
  competitor?: string,
): string {
  switch (type) {
    case "industry-playbook":
      return `${industry} Industry Sales Playbook`;
    case "competitor-battle-card":
      return `Battle Card: vs ${competitor || "Competitor"}`;
    case "objection-handler":
      return `${industry} Objection Handling Guide`;
    case "discovery-guide":
      return `${industry} Discovery Guide`;
    case "roi-calculator":
      return `${industry} ROI Calculator`;
    case "demo-script":
      return `${industry} Demo Script`;
    default:
      return `${industry} Sales Playbook`;
  }
}

function generateDiscoveryQuestions(_industry: string): string {
  return `**Situation Questions:**
1. How many facilities do you currently operate?
2. What regulatory programs are you subject to (CAA, CWA, RCRA)?
3. How do you currently manage compliance reporting?
4. How many FTEs are dedicated to environmental compliance?

**Problem Questions:**
5. What are your biggest compliance challenges right now?
6. Have you received any violations or notices of non-compliance recently?
7. How much time do you spend on regulatory reporting each month?
8. What happens when regulations change - how quickly can you adapt?

**Implication Questions:**
9. What would a compliance failure cost you in terms of fines and downtime?
10. How does manual compliance tracking affect your team's productivity?
11. What's the risk if a key compliance person leaves?

**Need-Payoff Questions:**
12. If you could automate 80% of compliance reporting, what would that mean for your team?
13. How would real-time compliance monitoring change your risk profile?
14. What would it be worth to have proactive alerts before issues arise?`;
}

function generateObjectionHandling(industry: string): string {
  return `**"We already have a solution"**
Response: "Great - what specifically does it cover? We often complement existing solutions by adding regulatory intelligence and proactive monitoring that most tools lack."

**"We'll handle it next quarter"**
Response: "I understand timing. Are you aware of the upcoming regulatory changes in ${industry} that take effect soon? Let me share what we're seeing..."

**"Too expensive"**
Response: "Let's look at your current compliance costs. On average, companies in ${industry} spend $X per facility annually. Our clients typically see 30-40% reduction in compliance overhead."

**"We need to involve more people"**
Response: "Absolutely. Who else should be part of this conversation? We've prepared materials for both technical and executive stakeholders."`;
}

function generateROIFramework(industry: string): string {
  return `### ROI Calculation Framework for ${industry}

**Cost Savings:**
- Reduced manual reporting hours: ___ hours/month × $__/hour = $____/year
- Avoided violation penalties: Average fine $37,500 × risk reduction = $____/year
- Reduced consulting fees: Current spend $____ × automation rate = $____/year

**Efficiency Gains:**
- Faster permit renewals: ___ days saved × $__/day opportunity cost
- Automated data collection: ___ hours/week freed for strategic work
- Real-time monitoring vs. periodic audits: Reduced audit prep time

**Risk Reduction:**
- Compliance violation probability reduction: ___%
- Insurance premium reduction potential: ___%
- Reputational risk mitigation: Qualitative benefit

**Total 3-Year ROI:**
- Year 1: Implementation cost offset by immediate savings
- Year 2: Full cost savings realized
- Year 3: Expanded value through optimization`;
}

function generateCompetitiveComparison(competitor: string): string {
  return `| Feature | Us | ${competitor} |
|---------|-------|------------|
| Regulatory Coverage | Comprehensive (EPA, State, Local) | Limited |
| Real-time Monitoring | Yes | Periodic |
| AI-Powered Insights | Yes | Basic |
| Industry Specialization | Deep vertical expertise | Horizontal |
| Implementation Time | 2-4 weeks | 8-12 weeks |
| Integration Options | Open API + Connectors | Limited |
| Customer Support | Dedicated success manager | Tiered |`;
}
