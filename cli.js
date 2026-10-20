#!/usr/bin/env node

/**
 * SlothClaw CLI: The Terminal Companion for Radical Procrastination
 * Run: npm run sloth:cli
 */

import { GemmaAgent } from './gemma-agent.js';

const agent = new GemmaAgent();

const banner = `
  🦥 ======================================================== 🦥
     SLOTHCLAW: The Open-Weight AI Agent for Radical Laziness
     Theme: Slow and Steady | Model: Google Gemma (Open-Weight)
  🦥 ======================================================== 🦥
`;

console.log(banner);

const args = process.argv.slice(2);
const command = args[0] || '--autopilot';

async function main() {
  const status = await agent.checkLocalModelStatus();
  console.log(`[Status] Ollama: ${status.online ? '🟢 Connected' : '🟡 Offline (Using Embedded Gemma Fallback)'}`);
  console.log(`[Status] Target: ${agent.model}\n`);

  if (command === '--autopilot') {
    console.log(`🚀 Running 1-Click Total Sloth Autopilot...\n`);
    
    console.log(`1️⃣  Triaging Chaotic Midnight Chat...`);
    const chat = `Alex: EMERGENCY! Deploy broke at 2 AM!
Dave: Wait, no, it was just a cached redirect.
Sarah: Fixed it in 20 seconds. False alarm. Go back to sleep everyone.`;
    const chatRes = await agent.condenseGroupChat(chat, 'Ops Alerts');
    console.log(`   Summary: ${chatRes.data.summary}`);
    console.log(`   Action:  ${chatRes.data.action_items.join(', ')}`);
    console.log(`   Verdict: ${chatRes.data.sloth_verdict}\n`);

    console.log(`2️⃣  Cleaning Desktop Graveyard...`);
    const files = ['invoice_oct.pdf', 'Screen Shot 2026.png', 'installer.dmg'];
    const fileRes = await agent.triageFileGraveyard(files);
    console.log(`   Proposed renames: ${fileRes.data.proposed_renames.length} files`);
    console.log(`   Storage freed:    ${fileRes.data.storage_savings_estimate}\n`);

    console.log(`3️⃣  Drafting Low-Effort Diplomatic Reply...`);
    const replyRes = await agent.generateLazyReply("Can you write a 10-page spec by tomorrow morning?", 'diplomatic_sloth');
    console.log(`   Suggested Reply: "${replyRes.data.recommended_reply}"`);
    console.log(`   Effort Score:    ${replyRes.data.effort_score}\n`);

    console.log(`4️⃣  Generating Offline Bedtime Story...`);
    const storyRes = await agent.generateBedtimeStory('mossy_forest_canopy');
    console.log(`   Excerpt: "${storyRes.story.substring(0, 160)}..."\n`);

    console.log(`✨ Total Joules Conserved: ~20,000 J`);
    console.log(`💵 Cloud API Cost: $0.0000 (100% Free Open-Source Local AI)`);
    console.log(`🦥 "Why rush today what an open-weight model can automate tomorrow?"`);
  } else if (command === '--story') {
    const res = await agent.generateBedtimeStory('mossy_forest_canopy');
    console.log(`🌙 Bedtime Story:\n\n${res.story}\n`);
  } else if (command === '--help') {
    console.log(`Commands:
  --autopilot   Run full morning routine triage
  --story       Generate offline bedtime story
  --help        Show this help message`);
  }
}

main().catch(console.error);
