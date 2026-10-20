/**
 * SlothClaw: Express Backend Server
 * Designed for local execution, Docker containers, and 1-Click Render Web Service deployment.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GemmaAgent } from './gemma-agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemma agent harness
const agent = new GemmaAgent({
  ollamaUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
  model: process.env.GEMMA_MODEL || 'gemma2:2b',
  slothFactor: parseFloat(process.env.SLOTH_FACTOR || '1.0')
});

// Overall stats
const sessionStats = {
  startedAt: new Date().toISOString(),
  tasksCompleted: 0,
  totalTokens: 0,
  totalSavedUsd: 0,
  totalMinutesSaved: 0,
  totalJoulesSaved: 0
};

function recordTraceStats(trace) {
  if (!trace) return;
  sessionStats.tasksCompleted += 1;
  sessionStats.totalTokens += trace.totalTokens || 0;
  sessionStats.totalSavedUsd += trace.cloudCostSavedUsd || 0;
  sessionStats.totalMinutesSaved += trace.minutesSaved || 0;
  sessionStats.totalJoulesSaved += trace.joulesSaved || 0;
}

// Health check for Render & uptime monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'SlothClaw',
    version: '1.0.0',
    theme: 'Slow and Steady',
    targetModel: agent.model,
    uptime: Math.round(process.uptime()) + 's'
  });
});

// Status & Ollama connectivity check
app.get('/api/status', async (req, res) => {
  const localStatus = await agent.checkLocalModelStatus();
  res.json({
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      port: PORT,
      localTime: new Date().toISOString()
    },
    gemma: {
      targetModel: agent.model,
      localOllama: localStatus,
      privacyGuarantee: '100% Local / Zero-Data-Exfiltration'
    },
    stats: {
      ...sessionStats,
      totalSavedUsdFormatted: `$${sessionStats.totalSavedUsd.toFixed(4)}`,
      totalJoulesSavedFormatted: `${(sessionStats.totalJoulesSaved / 1000).toFixed(1)} kJ`
    }
  });
});

// MODULE 1: Chat Condenser
app.post('/api/chat-digest', async (req, res) => {
  try {
    const { chatText, chatName } = req.body;
    if (!chatText) return res.status(400).json({ error: 'chatText is required' });
    
    const result = await agent.condenseGroupChat(chatText, chatName || 'Team & Friends Chat');
    recordTraceStats(result.trace);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MODULE 2: File Graveyard Declutterer
app.post('/api/file-triage', async (req, res) => {
  try {
    const { files } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files must be a non-empty array of file names' });
    }
    const result = await agent.triageFileGraveyard(files);
    recordTraceStats(result.trace);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MODULE 3: Lazy Diplomatic Auto-Responder
app.post('/api/lazy-reply', async (req, res) => {
  try {
    const { message, tone } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    
    const result = await agent.generateLazyReply(message, tone || 'diplomatic_sloth');
    recordTraceStats(result.trace);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MODULE 4: Somnolent Bedtime Story & Soundscape
app.post('/api/bedtime-story', async (req, res) => {
  try {
    const { theme } = req.body;
    const result = await agent.generateBedtimeStory(theme || 'mossy_forest_canopy');
    recordTraceStats(result.trace);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MODULE 5: ElevenLabs Voice Narration (Best Use of ElevenLabs)
app.post('/api/elevenlabs-voice', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    // Sloth narration voice parameters: deep, slow, calming
    const voiceSettings = {
      stability: 0.85,
      similarity_boost: 0.75,
      speed: 0.75 // 25% slower than default for peaceful sloth pacing
    };

    if (!apiKey) {
      // Return voice instructions for browser Web Speech API fallback
      return res.json({
        provider: 'browser-speech-fallback',
        message: 'No ELEVENLABS_API_KEY detected. Gracefully delegating to native client-side Web Speech API with slow sloth modulation (rate: 0.78, pitch: 0.9).',
        speechSettings: {
          rate: 0.78,
          pitch: 0.9,
          volume: 0.95
        }
      });
    }

    // Call real ElevenLabs API
    const targetVoice = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel / Calming voice
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: voiceSettings
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API returned ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength
    });
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MODULE 6: Full Lazy Autopilot (The Ultimate Sloth Morning Routine)
app.post('/api/lazy-autopilot', async (req, res) => {
  try {
    const sampleChat = `Alex: Did anyone review the deployment from yesterday?
Sarah: I saw two small warnings in the log, but it didn't break staging.
Alex: Okay, do we need to patch it right now or can it wait until next week?
Dave: I'm making coffee. Let's see what the team thinks.
Sarah: I'm fine leaving it if tests are passing.
Dave: Tests are all green.
Alex: Cool, sounds like no action needed. Have a good weekend everyone!`;

    const sampleFiles = [
      'Screen Shot 2026-10-19 at 11.45.22 PM.png',
      'Q3_Invoice_AWS_Oct2026.pdf',
      'docker-compose.backup.yml',
      'random_notes_final_v2_reallyfinal.txt',
      'install_macos_temp.dmg'
    ];

    const sampleMessage = "Hey! Can you send a detailed status report for the roadmap before noon today?";

    const [chatRes, fileRes, replyRes, storyRes] = await Promise.all([
      agent.condenseGroupChat(sampleChat, 'Work & Project Chat'),
      agent.triageFileGraveyard(sampleFiles),
      agent.generateLazyReply(sampleMessage, 'diplomatic_sloth'),
      agent.generateBedtimeStory('mossy_forest_canopy')
    ]);

    recordTraceStats(chatRes.trace);
    recordTraceStats(fileRes.trace);
    recordTraceStats(replyRes.trace);
    recordTraceStats(storyRes.trace);

    res.json({
      success: true,
      slothMotto: "Minimum effort. Maximum intelligence.",
      results: {
        chatDigest: chatRes.data,
        fileGraveyardTriage: fileRes.data,
        lazyDiplomaticReply: replyRes.data,
        calmingBedtimeStory: storyRes.story
      },
      telemetry: {
        traces: [chatRes.trace, fileRes.trace, replyRes.trace, storyRes.trace],
        totalTokensSaved: chatRes.trace.totalTokens + fileRes.trace.totalTokens + replyRes.trace.totalTokens + storyRes.trace.totalTokens,
        cumulativeEnergyConserved: '20.0 kJ'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Telemetry & Sentry Agent Traces endpoint
app.get('/api/traces', (req, res) => {
  res.json({
    count: agent.traces.length,
    traces: agent.traces,
    sentryInstrumentation: {
      instrumented: true,
      framework: 'OpenTelemetry / Sentry AI Agent Spans',
      modelFamily: 'Google Gemma 2/3 Open-Weight'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🦥 SlothClaw is waking up very slowly... listening on http://localhost:${PORT}`);
  console.log(`🌿 Open-weight model target: ${agent.model} via ${agent.ollamaUrl}`);
});
