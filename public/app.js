/**
 * SlothClaw: Client Application Logic
 * Integrates Gemma Agent API, offline procedural soundscapes, and Sentry telemetry.
 */

// Preset datasets for effortless demoing
const PRESETS = {
  chat: {
    devops: `Alex [11:42 PM]: CRITICAL ALERT: Database pool exhausted on staging-west-2!
Dave [11:43 PM]: Looking at it now. Is production impacted?
Alex [11:44 PM]: No, only staging. But someone ran a script with 10,000 unbounded concurrent connections.
Sarah [11:45 PM]: Wait, wasn't that the automated load test suite scheduled for midnight?
Dave [11:47 PM]: Yes! It's just the scheduled weekly stress test!
Alex [11:48 PM]: Oh. Right. Sorry for pinging the whole channel with @channel at midnight.
Sarah [11:50 PM]: Going back to sleep. Goodnight.
Dave [11:51 PM]: False alarm. Staging recovered on its own.`,
    roommates: `Maya [8:14 AM]: Whoever left the blender soaked in protein powder in the sink please wash it.
Leo [8:20 AM]: wasn't me, I only drink tea.
Chloe [8:22 AM]: I think Jordan made a smoothie before leaving for the gym at 7 AM.
Maya [8:25 AM]: It dries into cement if it sits for two hours!
Jordan [8:35 AM]: My bad!! Rushing to catch the bus! I will deep-clean the whole kitchen tonight and bought oat milk for everyone as an apology!
Maya [8:36 AM]: Deal. Thanks Jordan.`,
    weekend: `Sam: So are we doing Lake Tahoe or Yosemite for the cabin trip?
Jess: Tahoe has the hot tub cabin!
Mike: Yosemite has better hiking though.
Jess: But it might snow on the pass and Mike doesn't have tire chains.
Sam: Mike, do you have chains?
Mike: No chains.
Jess: Tahoe it is. I'll book the cabin with the fireplace. Everyone Venmo me $85 by Thursday.`
  },
  files: {
    messy_downloads: `Screen Shot 2026-10-18 at 4.22.11 PM.png
Docker_Desktop_Installer_v4.32.dmg
Q3_AWS_Cloud_Invoice_Oct2026.pdf
github_ssh_key_backup_DO_NOT_SHARE.pem
meeting_notes_raw_unformatted.txt
temporary_node_heap_profile.heapsnapshot
tax_w2_draft_2026.pdf
slack_export_archive_september.zip`,
    tax_receipts: `W2_Statement_Employer_2026.pdf
Donation_Receipt_RedCross_50usd.pdf
Health_Insurance_1095B_Form.pdf
Lyft_Business_Expense_Oct14.pdf
Home_Office_Internet_Bill_Sep2026.pdf`,
    screenshots: `Screen Shot 2026-10-19 at 9.15.02 AM.png
Screen Shot 2026-10-19 at 11.45.22 PM.png
Screen Shot 2026-10-18 at 2.10.45 PM.png
Screen Shot 2026-10-17 at 8.04.19 PM.png
Screen Shot 2026-10-16 at 3.33.12 PM.png`
  },
  reply: {
    urgent_meeting: "Hey! Can we jump on a quick 45-minute sync right now to review the slide deck for tomorrow's executive review?",
    status_report: "Could you send over an updated weekly status report with full task breakdown before 1 PM today?",
    weekend_code: "I noticed a minor typo in the README. Could you push a hotfix commit whenever you have a minute today?"
  }
};

let currentBedtimeStory = "";

// Initialize DOM
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupPresets();
  setupEventListeners();
  checkSystemStatus();
  fetchTraces();
});

// Tab Switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'tab-traces') {
        fetchTraces();
      }
    });
  });
}

// Preset Loader
function setupPresets() {
  const chatInput = document.getElementById('chat-input');
  const chatPreset = document.getElementById('chat-preset');
  if (chatPreset && chatInput) {
    chatInput.value = PRESETS.chat[chatPreset.value];
    chatPreset.addEventListener('change', (e) => {
      chatInput.value = PRESETS.chat[e.target.value] || '';
    });
  }

  const filesInput = document.getElementById('files-input');
  const filesPreset = document.getElementById('files-preset');
  if (filesPreset && filesInput) {
    filesInput.value = PRESETS.files[filesPreset.value];
    filesPreset.addEventListener('change', (e) => {
      filesInput.value = PRESETS.files[e.target.value] || '';
    });
  }

  const replyInput = document.getElementById('reply-input');
  if (replyInput) {
    replyInput.value = PRESETS.reply.urgent_meeting;
  }
}

// System status & Ollama checker
async function checkSystemStatus() {
  const badgeText = document.getElementById('ollama-status-text');
  const badgeDot = document.getElementById('ollama-dot');

  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    if (data.gemma.localOllama.online) {
      badgeDot.className = 'indicator-dot';
      badgeText.textContent = `Local Ollama (${data.gemma.targetModel})`;
    } else {
      badgeDot.className = 'indicator-dot offline';
      badgeText.textContent = `Embedded Gemma Engine (Offline Zero-Cloud)`;
    }

    // Update global stat cards
    updateStatsDisplay(data.stats);
  } catch (err) {
    badgeDot.className = 'indicator-dot offline';
    badgeText.textContent = `Embedded Gemma Engine (Offline Zero-Cloud)`;
  }
}

function updateStatsDisplay(stats) {
  if (!stats) return;
  const joulesEl = document.getElementById('stat-joules');
  const costEl = document.getElementById('stat-cost');
  const minsEl = document.getElementById('stat-minutes');

  if (joulesEl) joulesEl.textContent = stats.totalJoulesSavedFormatted || '42.5 kJ';
  if (costEl) costEl.textContent = stats.totalSavedUsdFormatted || '$0.0000';
  if (minsEl) minsEl.textContent = `${stats.totalMinutesSaved || 65} min`;
}

// Event Listeners
function setupEventListeners() {
  // Chat Condenser
  const btnChat = document.getElementById('btn-run-chat');
  if (btnChat) {
    btnChat.addEventListener('click', runChatCondenser);
  }

  // Copy chat summary
  const btnCopyChat = document.getElementById('btn-copy-chat');
  if (btnCopyChat) {
    btnCopyChat.addEventListener('click', () => {
      const summaryText = document.querySelector('#chat-output .summary-quote')?.textContent || '';
      navigator.clipboard.writeText(summaryText);
      btnCopyChat.textContent = 'Copied!';
      setTimeout(() => btnCopyChat.textContent = 'Copy Summary', 2000);
    });
  }

  // File Triage
  const btnFiles = document.getElementById('btn-run-files');
  if (btnFiles) {
    btnFiles.addEventListener('click', runFileTriage);
  }

  // Lazy Reply
  const btnReply = document.getElementById('btn-run-reply');
  if (btnReply) {
    btnReply.addEventListener('click', runLazyReply);
  }

  // Copy Lazy Reply
  const btnCopyReply = document.getElementById('btn-copy-reply');
  if (btnCopyReply) {
    btnCopyReply.addEventListener('click', () => {
      const text = document.querySelector('#reply-output .summary-quote')?.textContent || '';
      navigator.clipboard.writeText(text);
      btnCopyReply.textContent = 'Copied!';
      setTimeout(() => btnCopyReply.textContent = 'Copy to Clipboard', 2000);
    });
  }

  // Bedtime Story
  const btnStory = document.getElementById('btn-run-story');
  if (btnStory) {
    btnStory.addEventListener('click', runBedtimeStory);
  }

  // Sloth Voice Read Aloud
  const btnReadAloud = document.getElementById('btn-read-aloud');
  if (btnReadAloud) {
    btnReadAloud.addEventListener('click', playSlothNarration);
  }

  // Soundscape Toggle
  const btnSoundscape = document.getElementById('btn-soundscape-toggle');
  const waveform = document.getElementById('waveform');
  if (btnSoundscape) {
    btnSoundscape.addEventListener('click', () => {
      if (window.slothAudio.isPlaying) {
        window.slothAudio.stop();
        btnSoundscape.classList.remove('playing');
        btnSoundscape.innerHTML = '<span>🔊 Play Offline Sleep Drone</span>';
        if (waveform) waveform.classList.remove('active');
      } else {
        window.slothAudio.play();
        btnSoundscape.classList.add('playing');
        btnSoundscape.innerHTML = '<span>⏸ Pause Soundscape</span>';
        if (waveform) waveform.classList.add('active');
      }
    });
  }

  // Soundscape Volume
  const soundscapeVol = document.getElementById('soundscape-vol');
  if (soundscapeVol) {
    soundscapeVol.addEventListener('input', (e) => {
      window.slothAudio.setVolume(e.target.value);
    });
  }

  // 1-Click Autopilot
  const btnAutopilot = document.getElementById('btn-run-autopilot');
  if (btnAutopilot) {
    btnAutopilot.addEventListener('click', runAutopilot);
  }

  // Refresh Traces
  const btnRefreshTraces = document.getElementById('btn-refresh-traces');
  if (btnRefreshTraces) {
    btnRefreshTraces.addEventListener('click', fetchTraces);
  }
}

// MODULE 1: Run Chat Condenser
async function runChatCondenser() {
  const input = document.getElementById('chat-input').value;
  const output = document.getElementById('chat-output');
  const btn = document.getElementById('btn-run-chat');
  const copyBtn = document.getElementById('btn-copy-chat');

  if (!input.trim()) return;

  btn.disabled = true;
  btn.innerHTML = '<span>🦥 Inching through chat at 0.15 mph...</span>';
  output.innerHTML = `
    <div class="result-empty">
      <span style="font-size: 2.2rem; animation: pulseDot 1s infinite;">🌱</span>
      <p>Filtering 98% drama, memes, and noise through local Gemma...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/chat-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatText: input, chatName: 'Group Chat' })
    });
    const result = await res.json();
    const data = result.data;

    output.innerHTML = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <span class="result-badge badge-green">Drama: ${data.drama_level}</span>
        <span class="result-badge badge-amber">${data.laziness_rating}</span>
        <span class="result-badge badge-purple">Noise Filtered: ${data.noise_reduction_ratio || '96%'}</span>
      </div>

      <div class="summary-quote">"${data.summary}"</div>

      <div style="margin-top: 14px;">
        <strong style="font-size: 0.85rem; color: #fff;">Sloth Verdict:</strong>
        <p style="font-size: 0.9rem; color: var(--emerald-light); margin-top: 4px;">${data.sloth_verdict}</p>
      </div>

      <div style="margin-top: 14px;">
        <strong style="font-size: 0.85rem; color: #fff;">Action Items Required:</strong>
        <ul class="action-list">
          ${(data.action_items || []).map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="telemetry-meta">
        <span>Model: ${result.trace.model} (${result.mode})</span>
        <span>Duration: ${result.trace.durationMs}ms</span>
        <span>Cost Saved: $${result.trace.cloudCostSavedUsd.toFixed(5)}</span>
      </div>
    `;

    copyBtn.style.display = 'block';
    checkSystemStatus();
  } catch (err) {
    output.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🦥 Condense Chat at Sloth Pace</span>';
  }
}

// MODULE 2: Run File Triage
async function runFileTriage() {
  const input = document.getElementById('files-input').value;
  const output = document.getElementById('files-output');
  const btn = document.getElementById('btn-run-files');

  const files = input.split('\n').map(s => s.trim()).filter(Boolean);
  if (files.length === 0) return;

  btn.disabled = true;
  btn.innerHTML = '<span>🧹 Tidying digital nest...</span>';
  output.innerHTML = `
    <div class="result-empty">
      <span style="font-size: 2.2rem; animation: pulseDot 1s infinite;">📦</span>
      <p>Local Gemma is inspecting files offline (zero surveillance)...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/file-triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
    const result = await res.json();
    const data = result.data;

    let categoriesHtml = '';
    for (const [catName, fileList] of Object.entries(data.categories || {})) {
      if (fileList.length > 0) {
        categoriesHtml += `
          <div style="margin-bottom: 12px;">
            <span class="result-badge badge-green">${catName} (${fileList.length})</span>
            <ul style="list-style: none; font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; padding-left: 8px;">
              ${fileList.map(f => `<li>↳ ${f}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    }

    let renamesHtml = (data.proposed_renames || []).map(r => `
      <div style="font-family: var(--font-mono); font-size: 0.76rem; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 4px; margin-bottom: 4px;">
        <span style="color: var(--text-dim);">${r.from}</span>
        <span style="color: var(--emerald-light);"> ➔ ${r.to}</span>
      </div>
    `).join('');

    output.innerHTML = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
        <span class="result-badge badge-amber">Storage Recoverable: ${data.storage_savings_estimate}</span>
        <span class="result-badge badge-purple">${data.sloth_comfort_score}</span>
      </div>

      <div>${categoriesHtml}</div>

      <div style="margin-top: 14px;">
        <strong style="font-size: 0.85rem; color: #fff;">Proposed Snake_Case Renames:</strong>
        <div style="margin-top: 8px;">${renamesHtml}</div>
      </div>

      <div class="telemetry-meta">
        <span>Model: ${result.trace.model}</span>
        <span>Duration: ${result.trace.durationMs}ms</span>
        <span>Joules Saved: ${result.trace.joulesSaved} J</span>
      </div>
    `;

    checkSystemStatus();
  } catch (err) {
    output.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🧹 Triage File Graveyard</span>';
  }
}

// MODULE 3: Run Lazy Reply
async function runLazyReply() {
  const message = document.getElementById('reply-input').value;
  const tone = document.getElementById('reply-tone').value;
  const output = document.getElementById('reply-output');
  const btn = document.getElementById('btn-run-reply');
  const copyBtn = document.getElementById('btn-copy-reply');

  if (!message.trim()) return;

  btn.disabled = true;
  btn.innerHTML = '<span>🕊️ Crafting polite escape hatch...</span>';
  output.innerHTML = `
    <div class="result-empty">
      <span style="font-size: 2.2rem; animation: pulseDot 1s infinite;">🍵</span>
      <p>Formulating minimum-viable effort response...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/lazy-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tone })
    });
    const result = await res.json();
    const data = result.data;

    output.innerHTML = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <span class="result-badge badge-green">Effort: ${data.effort_score}</span>
        <span class="result-badge badge-amber">${data.mental_energy_conserved}</span>
        <span class="result-badge badge-purple">Thread Stopper: ${data.conversation_stopper_rating}</span>
      </div>

      <div style="margin-top: 12px;">
        <strong style="font-size: 0.85rem; color: var(--emerald-light);">Recommended Response:</strong>
        <div class="summary-quote">"${data.recommended_reply}"</div>
      </div>

      <div style="margin-top: 14px;">
        <strong style="font-size: 0.85rem; color: var(--amber-light);">Ultra-Short Alternative:</strong>
        <p style="font-size: 0.92rem; color: #fff; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 6px; margin-top: 4px;">
          "${data.alternative_quick_reply}"
        </p>
      </div>

      <div class="telemetry-meta">
        <span>Model: ${result.trace.model}</span>
        <span>Duration: ${result.trace.durationMs}ms</span>
        <span>Cloud Savings: $${result.trace.cloudCostSavedUsd.toFixed(5)}</span>
      </div>
    `;

    copyBtn.style.display = 'block';
    checkSystemStatus();
  } catch (err) {
    output.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🕊️ Generate Zero-Effort Reply</span>';
  }
}

// MODULE 4: Run Bedtime Story
async function runBedtimeStory() {
  const theme = document.getElementById('story-theme').value;
  const output = document.getElementById('story-output');
  const btn = document.getElementById('btn-run-story');
  const voiceBtn = document.getElementById('btn-read-aloud');

  btn.disabled = true;
  btn.innerHTML = '<span>🌙 Weaving tranquil bedtime tale...</span>';
  output.innerHTML = `
    <div class="result-empty">
      <span style="font-size: 2.2rem; animation: pulseDot 1s infinite;">✨</span>
      <p>Gemma is composing calming imagery offline...</p>
    </div>
  `;

  try {
    const res = await fetch('/api/bedtime-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    });
    const result = await res.json();
    currentBedtimeStory = result.story;

    output.innerHTML = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
        <span class="result-badge badge-purple">Calibrated Cadence: ${result.suggestedBpm} BPM</span>
        <span class="result-badge badge-green">Setting: ${result.theme}</span>
      </div>

      <p style="font-size: 0.95rem; line-height: 1.8; color: #f1f5f9; font-style: italic; white-space: pre-wrap;">
        ${result.story}
      </p>

      <div class="telemetry-meta">
        <span>Tokens: ${result.trace.totalTokens}</span>
        <span>Duration: ${result.trace.durationMs}ms</span>
        <span>Joules Saved: ${result.trace.joulesSaved} J</span>
      </div>
    `;

    voiceBtn.style.display = 'block';
    checkSystemStatus();
  } catch (err) {
    output.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>📖 Generate Offline Gemma Bedtime Tale</span>';
  }
}

// ElevenLabs / Web Speech Voice Narration
async function playSlothNarration() {
  if (!currentBedtimeStory) return;
  const voiceBtn = document.getElementById('btn-read-aloud');
  voiceBtn.textContent = '🔊 Speaking at 0.75x Sloth Pace...';
  voiceBtn.disabled = true;

  try {
    // Check if ElevenLabs API key is configured on server
    const res = await fetch('/api/elevenlabs-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: currentBedtimeStory })
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('audio/mpeg')) {
      // Real ElevenLabs stream returned
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        voiceBtn.textContent = '🎙️ Sloth Voice (ElevenLabs / WebSpeech)';
        voiceBtn.disabled = false;
      };
      audio.play();
      return;
    }

    // Fallback to client Web Speech API with calibrated slow rate
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentBedtimeStory);
      utterance.rate = 0.78; // 22% slower than normal for relaxing sloth effect
      utterance.pitch = 0.9;
      utterance.onend = () => {
        voiceBtn.textContent = '🎙️ Sloth Voice (ElevenLabs / WebSpeech)';
        voiceBtn.disabled = false;
      };
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Speech synthesis is not supported on this browser.');
      voiceBtn.textContent = '🎙️ Sloth Voice (ElevenLabs / WebSpeech)';
      voiceBtn.disabled = false;
    }
  } catch (e) {
    voiceBtn.textContent = '🎙️ Sloth Voice (ElevenLabs / WebSpeech)';
    voiceBtn.disabled = false;
  }
}

// MODULE 5: 1-Click Autopilot
async function runAutopilot() {
  const btn = document.getElementById('btn-run-autopilot');
  const progress = document.getElementById('autopilot-progress');
  const bar = document.getElementById('autopilot-bar');
  const label = document.getElementById('autopilot-status-label');
  const pct = document.getElementById('autopilot-percent');
  const output = document.getElementById('autopilot-output');

  btn.disabled = true;
  progress.style.display = 'block';
  output.style.display = 'none';

  const steps = [
    { p: 25, msg: 'Phase 1: Barnaby is digesting midnight group chats...' },
    { p: 55, msg: 'Phase 2: Barnaby is triaging desktop clutter...' },
    { p: 80, msg: 'Phase 3: Barnaby is composing safe diplomatic auto-replies...' },
    { p: 100, msg: 'Phase 4: Barnaby has completed the lazy morning routine!' }
  ];

  let stepIdx = 0;
  const interval = setInterval(() => {
    if (stepIdx < steps.length) {
      bar.style.width = steps[stepIdx].p + '%';
      pct.textContent = steps[stepIdx].p + '%';
      label.textContent = steps[stepIdx].msg;
      stepIdx++;
    }
  }, 400);

  try {
    const res = await fetch('/api/lazy-autopilot', { method: 'POST' });
    const data = await res.json();
    clearInterval(interval);

    bar.style.width = '100%';
    pct.textContent = '100%';
    label.textContent = '✨ Complete! You did absolutely zero work.';

    output.style.display = 'block';
    output.innerHTML = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
        <span class="result-badge badge-green">Motto: "${data.slothMotto}"</span>
        <span class="result-badge badge-amber">Energy Conserved: ${data.telemetry.cumulativeEnergyConserved}</span>
        <span class="result-badge badge-purple">4 Tasks Automated at $0.00 Cost</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px;">
        <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;">
          <strong style="color: var(--emerald-light); font-size: 0.85rem;">🌅 Morning Chat Digest:</strong>
          <p style="font-size: 0.82rem; color: #fff; margin-top: 4px;">"${data.results.chatDigest.summary}"</p>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;">
          <strong style="color: var(--amber-light); font-size: 0.85rem;">📁 File Graveyard Freed:</strong>
          <p style="font-size: 0.82rem; color: #fff; margin-top: 4px;">${data.results.fileGraveyardTriage.storage_savings_estimate} (${data.results.fileGraveyardTriage.proposed_renames.length} files organized)</p>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;">
          <strong style="color: var(--slumber-purple); font-size: 0.85rem;">💬 Safe Auto-Reply:</strong>
          <p style="font-size: 0.82rem; color: #fff; margin-top: 4px;">"${data.results.lazyDiplomaticReply.recommended_reply}"</p>
        </div>

        <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px;">
          <strong style="color: #38bdf8; font-size: 0.85rem;">🌙 Tonight's Bedtime Story:</strong>
          <p style="font-size: 0.82rem; color: #fff; margin-top: 4px;">${data.results.calmingBedtimeStory.substring(0, 110)}...</p>
        </div>
      </div>
    `;

    checkSystemStatus();
  } catch (err) {
    clearInterval(interval);
    output.style.display = 'block';
    output.innerHTML = `<p style="color: #ef4444;">Error: ${err.message}</p>`;
  } finally {
    btn.disabled = false;
  }
}

// MODULE 6: Fetch Sentry & Agent Telemetry Traces
async function fetchTraces() {
  const container = document.getElementById('trace-feed-list');
  if (!container) return;

  try {
    const res = await fetch('/api/traces');
    const data = await res.json();

    if (!data.traces || data.traces.length === 0) {
      container.innerHTML = `<div style="color: var(--text-dim); text-align: center; padding: 30px;">No agent operations logged yet. Run any module to inspect real-time traces.</div>`;
      return;
    }

    container.innerHTML = data.traces.map(t => `
      <div class="trace-item">
        <div class="trace-head">
          <span>⚡ [${t.operation}] <strong style="color: var(--emerald-light);">${t.model}</strong></span>
          <span style="color: var(--amber-light);">${t.durationMs}ms</span>
        </div>
        <div class="trace-detail">
          <span>Tokens: ${t.totalTokens} (Prompt: ${t.promptTokens}, Gen: ${t.completionTokens})</span>
          &bull;
          <span>Cloud Saved: $${t.cloudCostSavedUsd.toFixed(5)}</span>
          &bull;
          <span>Joules: ${t.joulesSaved} J</span>
          &bull;
          <span>${t.timestamp.replace('T', ' ').substring(0, 19)}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {}
}
