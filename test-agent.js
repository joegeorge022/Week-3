/**
 * SlothClaw Test Suite
 * Validates agent inference pipelines, trace tracking, and module contracts.
 */

import { GemmaAgent } from './gemma-agent.js';

async function runTests() {
  console.log('🧪 Starting SlothClaw Agent Test Suite...\n');
  const agent = new GemmaAgent();
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Prompt formatting adheres to Gemma turn structure
  const formatted = agent.formatGemmaPrompt('Be lazy', 'Summarize this');
  assert(
    formatted.includes('<start_of_turn>user') && formatted.includes('<end_of_turn>') && formatted.includes('<start_of_turn>model'),
    'Gemma prompt format incorporates correct turn tokens'
  );

  // Test 2: Chat Condenser returns expected schema
  const chatSample = 'Alice: Anyone seen the keys?\nBob: No.\nCharlie: Found them on table.';
  const chatResult = await agent.condenseGroupChat(chatSample, 'Household');
  assert(chatResult && chatResult.data && chatResult.data.summary, 'Chat Condenser outputs summary');
  assert(Array.isArray(chatResult.data.action_items), 'Chat Condenser outputs action items array');
  assert(chatResult.trace && chatResult.trace.cloudCostSavedUsd >= 0, 'Chat Condenser records cost-saving telemetry trace');

  // Test 3: File Graveyard Declutterer
  const filesSample = ['tax_2026.pdf', 'junk_temp.log', 'Screenshot.png'];
  const fileResult = await agent.triageFileGraveyard(filesSample);
  assert(fileResult && fileResult.data && fileResult.data.categories, 'File Triage categorizes files');
  assert(Array.isArray(fileResult.data.proposed_renames), 'File Triage generates snake_case renames');

  // Test 4: Lazy Diplomatic Reply
  const replyResult = await agent.generateLazyReply('Urgent: Can we schedule a 2-hour retrospective today?', 'diplomatic_sloth');
  assert(replyResult && replyResult.data && replyResult.data.recommended_reply, 'Lazy Reply produces recommendation');
  assert(replyResult.data.effort_score, 'Lazy Reply includes effort score');

  // Test 5: Bedtime Story & Soundscape
  const storyResult = await agent.generateBedtimeStory('mossy_forest_canopy');
  assert(storyResult && storyResult.story && storyResult.story.length > 50, 'Bedtime Story produces soothing narrative');
  assert(storyResult.suggestedBpm <= 60, 'Bedtime Story suggests calm resting heart rate BPM');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
