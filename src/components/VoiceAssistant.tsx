import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { sendMessage } from "../services/aiService";
import api from '../services/api';
import "../styles/Billing.css";


const DEBUG = true; // set true only when debugging
const dlog = (...args: any[]) => { if (DEBUG) console.log(...args); };

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentPayload = {
  intent?: any;
  action?: any;
  text?: any;
  message?: any;
  command?: any;
  productName?: string;
  qty?: number;
  unit?: string;
  isLoose?: boolean | null;
  productSku?: string | null;
  brand?: string;
  [k: string]: any;
};

type PaymentOptions = {
  applyWallet?: boolean;
  walletBalance?: number;
};

type VoiceConfig = {
  autoSendDelayMs: number;
  recognitionSafetyTimeoutMs: number;
  noResponseTimeoutMs: number;
  maxListenRetries: number;
  paymentModalOpenDelayMs: number;
  speechLang: { hi: string; default: string };
  recognition: { interimResults: boolean; continuous: boolean };
};

// FIX: states where the assistant is actively waiting on a specific answer
// from the user (as opposed to idling for the wake word). Shared by speak()'s
// onend handler and the recognition retry logic so both agree on what counts
// as "still need an answer".
const INPUT_WAITING_STATES = [
  "WAITING_FOR_BRAND_SELECTION",
  "WAITING_FOR_PACKAGING",
  "WAITING_FOR_MOBILE_CONSENT",
  "WAITING_FOR_MOBILE_NUMBER",
  "WAITING_FOR_WALLET_CONSENT",
  "WAITING_FOR_PAY_CONFIRM",
  "WAITING_FOR_RECEIPT_ACTION",
];

type Props = {
  onIntent?: (
    payload: IntentPayload,
    helpers: { speak: (text: string) => void; appendAssistantMessage: (text: string) => void; }
  ) => void;
  onOpenPayment?: (mobileNumber?: string, options?: PaymentOptions) => void;
};

// ─── Internal Payment Modal ───────────────────────────────────────────────────

type PaymentModalProps = {
  show: boolean;
  mobileNumber?: string;
  walletBalance?: number;
  applyWallet?: boolean;
  onClose: () => void;
  onConfirmPayment: (mobile?: string, useWallet?: boolean) => void;
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  mobileNumber,
  walletBalance,
  applyWallet,
  onClose,
  onConfirmPayment,
}) => {
  const [mobile, setMobile] = useState(mobileNumber || '');
  const [mobileError, setMobileError] = useState('');
  const [useWallet, setUseWallet] = useState<boolean>(applyWallet ?? false);

  useEffect(() => { setMobile(mobileNumber || ''); }, [mobileNumber]);
  useEffect(() => { setUseWallet(applyWallet ?? false); }, [applyWallet]);

  const handleSubmit = () => {
    dlog("[47] ******** PaymentModal.handleSubmit method *******", 'state:', (window as any).conversationState || 'IDLE');
    if (mobile && !/^\d{10}$/.test(mobile)) {
      setMobileError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setMobileError('');
    onConfirmPayment(mobile || undefined, useWallet);
  };

  const hasWallet = walletBalance !== undefined && walletBalance > 0;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>💳 Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted mb-3" style={{ fontSize: '0.92rem' }}>
          Providing your mobile number is <strong>optional</strong>. If you share it, a
          discount will be credited to your wallet.
        </p>

        <Form.Group className="mb-3">
          <Form.Label>Mobile Number <span className="text-muted">(optional)</span></Form.Label>
          <Form.Control
            type="tel"
            inputMode="numeric"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            maxLength={10}
            onChange={e => {
              setMobileError('');
              setMobile(e.target.value.replace(/\D/g, ''));
            }}
          />
          {mobileError && (
            <Form.Text className="text-danger">{mobileError}</Form.Text>
          )}
          {mobile.length === 10 && !mobileError && (
            <Form.Text className="text-success">
              ✓ Discount will be credited to your wallet.
            </Form.Text>
          )}
          {!mobile && (
            <Form.Text className="text-muted">
              Skip to proceed without a discount.
            </Form.Text>
          )}
        </Form.Group>

        {hasWallet && (
          <Form.Group
            className="mb-2 p-3 rounded"
            style={{
              background: 'var(--bs-light, #f8f9fa)',
              border: '1px solid var(--bs-border-color, #dee2e6)',
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-1">
              <Form.Label className="mb-0 fw-semibold">
                💰 Wallet Balance: <span className="text-success">₹{walletBalance}</span>
              </Form.Label>
              <Form.Check
                type="switch"
                id="wallet-switch"
                label={useWallet ? 'Applied' : 'Apply'}
                checked={useWallet}
                onChange={e => setUseWallet(e.target.checked)}
              />
            </div>
            {useWallet ? (
              <Form.Text className="text-success">
                ✓ ₹{walletBalance} will be deducted from wallet at checkout.
              </Form.Text>
            ) : (
              <Form.Text className="text-muted">
                Toggle to apply your wallet balance toward this bill.
              </Form.Text>
            )}
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => onConfirmPayment(undefined, false)}>
          Skip &amp; Pay
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {mobile ? 'Confirm &amp; Pay' : 'Pay Now'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const VoiceAssistant: React.FC<Props> = ({ onIntent, onOpenPayment }) => {
   dlog("[1] ******** VoiceAssistant component render *******", 'state:', (window as any).conversationState || 'IDLE');

  // ── Config ref ─────────────────────────────────────────────────────────────
  const voiceConfigRef = useRef<VoiceConfig>({
    autoSendDelayMs: 1,
    recognitionSafetyTimeoutMs: 15000,
    noResponseTimeoutMs: 5000,
    // FIX: was 2 — bumped way up so that while we're waiting on a specific
    // answer (a WAITING_FOR_* stage) the assistant essentially never gives
    // up and falls back to the wake-word listener on its own; it just keeps
    // re-opening the mic for that same stage. INPUT_WAITING_STATES-gated
    // retry loops now also log the stage name on every attempt (see
    // logRetryAttempt below) so this is easy to trace/tune from the console.
    maxListenRetries: 999,
    paymentModalOpenDelayMs: 300,
    speechLang: {
      hi: 'hi-IN',
      default: 'en-IN',
    },
    recognition: {
      interimResults: true,
      continuous: false,
    },
  });

  // ── State ──────────────────────────────────────────────────────────────────
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'assistant'; text: string }>>([]);
  const [visible, setVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Live caption (speech-synced text reveal) ──────────────────────────────
  const [liveCaption, setLiveCaption] = useState<string>("");
  const liveCaptionSourceRef = useRef<string>(""); // full text currently being spoken

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMobile, setPaymentMobile] = useState<string | undefined>(undefined);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions>({});

  // ── Refs ───────────────────────────────────────────────────────────────────
  const { i18n } = useTranslation();
  const recognitionRef = useRef<any>(null);
  const autoSendRef = useRef(true);
  // FIX: store transcript in a ref so onend closure always reads the latest value
  const transcriptRef = useRef<string>("");

  const wakeRecognitionRef = useRef<any>(null);
  const wakeEnabledRef = useRef(true);
  const activeSessionRef = useRef(false);
  const wakeStartedRef = useRef(false);
  const assistantSpeakingRef = useRef(false);
  const processingRef = useRef(false); // mirrors processing state for use in callbacks

  // Timer refs
  const recognitionSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noResponseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX: counts consecutive empty/erroring listen attempts for the current
  // WAITING_FOR_* prompt so we can retry listening instead of giving up.
  const listenRetryCountRef = useRef(0);
  const paymentModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX: remembers the last stage we were retrying in, purely for logging —
  // lets us tell "still retrying stage X" apart from "just switched stages"
  // in the console without having to cross-reference timestamps.
  const lastRetryStageRef = useRef<string | null>(null);

  // ── Voice history stream auto-scroll ──────────────────────────────────────
  // FIX: ref to the scrollable message-log container so we can drive its
  // scrollTop directly, plus a ref tracking whether the user has manually
  // scrolled away from the bottom. We use a ref (not state) for the scrolled
  // flag so that rapid scroll events don't cause extra re-renders.
  const historyStreamRef = useRef<HTMLDivElement | null>(null);
  const isUserScrolledUpRef = useRef(false);

  // FIX: single, reusable logger for every retry decision point (onend /
  // onerror / catch in startListening). Centralising this means every retry
  // path prints the same shape of log line: which stage, which reason,
  // which attempt number, and whether we're continuing to listen on that
  // same stage or bailing out.
  const logRetryAttempt = (
    source: string,
    reason: string,
    state: string,
    willRetry: boolean
  ) => {
    if (willRetry) {
      lastRetryStageRef.current = state;
      dlog(
        `[R] [${source}] issue="${reason}" stage="${state}" attempt=${listenRetryCountRef.current + 1}/${voiceConfigRef.current.maxListenRetries} -> RETRY LISTENING on same stage`,
        'state:', (window as any).conversationState || 'IDLE'
      );
    } else {
      dlog(
        `[R] [${source}] issue="${reason}" stage="${state}" attempts_used=${listenRetryCountRef.current} -> GIVING UP on stage, falling back to wake listener`,
        'state:', (window as any).conversationState || 'IDLE'
      );
      lastRetryStageRef.current = null;
    }
  };


  // FIX: single source of truth for "is it safe to re-arm the wake listener"
  const WAKE_ALLOWED_STATES = ["IDLE", "COMPLETE"];
  const canRestartWake = () => {
    dlog("[48] ******** canRestartWake method *******", 'state:', (window as any).conversationState || 'IDLE');
    const state = (window as any).conversationState || "IDLE";
    return WAKE_ALLOWED_STATES.includes(state);
  };


  // ── Timer helpers ──────────────────────────────────────────────────────────
  const clearSafetyTimer = () => {

    dlog("[2] ******** clearSafetyTimer method *******", 'state:', (window as any).conversationState || 'IDLE');

    if (recognitionSafetyTimerRef.current) {
      clearTimeout(recognitionSafetyTimerRef.current);
      recognitionSafetyTimerRef.current = null;
    }
  };

  const clearAutoSendTimer = () => {
    dlog("[3] ******** clearAutoSendTimer method *******", 'state:', (window as any).conversationState || 'IDLE');

    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
  };

  const clearNoResponseTimer = () => {
    dlog("[44] ******** clearNoResponseTimer method *******", 'state:', (window as any).conversationState || 'IDLE');

    if (noResponseTimerRef.current) {
      clearTimeout(noResponseTimerRef.current);
      noResponseTimerRef.current = null;
    }
  };

  const clearPaymentModalTimer = () => {
    dlog("[4] ******** clearPaymentModalTimer method *******", 'state:', (window as any).conversationState || 'IDLE');
    if (paymentModalTimerRef.current) {
      clearTimeout(paymentModalTimerRef.current);
      paymentModalTimerRef.current = null;
    }
  };

  // ── Language helper ────────────────────────────────────────────────────────
  const getLang = () => {
    dlog("[49] ******** getLang method *******", 'state:', (window as any).conversationState || 'IDLE');
    return (i18n?.language || navigator.language || 'en').startsWith('hi')
      ? voiceConfigRef.current.speechLang.hi
      : voiceConfigRef.current.speechLang.default;
  };




  // ── Session reset — centralised so every exit path calls it ───────────────
  // FIX: single function to clean up after a session ends (success or failure)
  const resetSession = useCallback((shouldRestartWake: boolean = true) => {
    dlog("[5] ******** resetSession method *******", 'state:', (window as any).conversationState || 'IDLE');
    activeSessionRef.current = false;
    processingRef.current = false;
    setProcessing(false);
    // FIX: a full session reset means we're no longer mid-retry on any prompt
    listenRetryCountRef.current = 0;
    lastRetryStageRef.current = null;

    if (shouldRestartWake) {
      if (
        wakeEnabledRef.current &&
        !assistantSpeakingRef.current &&
        canRestartWake()
      ) {
        // Small delay to avoid immediately re-triggering on residual audio
        wakeRestartTimerRef.current = setTimeout(() => {
          startWakeWordListener();
        }, 800);
      }
    }
  }, []);


  

  // ── Speech recognition setup ───────────────────────────────────────────────
  useEffect(() => {
    dlog("[6] ******** Speech recognition setup method *******", 'state:', (window as any).conversationState || 'IDLE');
    const SpeechClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const cfg = voiceConfigRef.current;
    const r = new SpeechClass();
    r.lang = getLang();
    r.interimResults = cfg.recognition.interimResults;
    r.continuous = cfg.recognition.continuous;

    r.onresult = (ev: any) => {
      const parts: string[] = [];
      for (let i = 0; i < ev.results.length; i++) {
        parts.push(ev.results[i][0].transcript);
      }
      const text = parts.join(' ');
      // FIX: update both state and ref simultaneously
      setTranscript(text);
      transcriptRef.current = text;

      // FIX: user has responded — cancel the 5s no-response watchdog and
      // reset the retry counter since we got real input.
      if (text && text.trim()) {
        listenRetryCountRef.current = 0;
        lastRetryStageRef.current = null;
        if (noResponseTimerRef.current) {
          dlog("[45] User responded within 5s — clearing no-response timer", 'state:', (window as any).conversationState || 'IDLE');
          clearNoResponseTimer();
        }
      }
    };

    r.onend = () => {
      dlog("[50] ******** recognition.onend method *******", 'state:', (window as any).conversationState || 'IDLE');
      clearSafetyTimer();
      clearNoResponseTimer();
      setListening(false);

      // FIX: read from ref, not state — avoids stale closure
      const currentTranscript = transcriptRef.current;

      if (!autoSendRef.current) {
        // User manually stopped — don't auto-send
        return;
      }

      // FIX: if nothing was heard, either retry listening (if the assistant
      // is still waiting on a specific answer and retries remain) or reset
      // session and go back to the wake listener.
      if (!currentTranscript || !currentTranscript.trim()) {
        dlog("[7] No transcript captured, resetting session.", 'state:', (window as any).conversationState || 'IDLE');

        const state = (window as any).conversationState || "IDLE";
        const canRetry =
          INPUT_WAITING_STATES.includes(state) &&
          listenRetryCountRef.current < voiceConfigRef.current.maxListenRetries;

        if (canRetry) {
          logRetryAttempt('recognition.onend', 'no-transcript', state, true);
          listenRetryCountRef.current += 1;
          setTimeout(() => { startListening(); }, 300);
          return;
        }

        if (INPUT_WAITING_STATES.includes(state)) {
          logRetryAttempt('recognition.onend', 'no-transcript', state, false);
        }
        listenRetryCountRef.current = 0;
        resetSession(true);
        return;
      }

      const delay = voiceConfigRef.current.autoSendDelayMs;
      if (delay > 0) {
        autoSendTimerRef.current = setTimeout(() => {
          void handleSendRef.current?.();
        }, delay);
      } else {
        void handleSendRef.current?.();
      }
    };

    r.onerror = (e: any) => {
      dlog("[51] ******** recognition.onerror method *******", 'state:', (window as any).conversationState || 'IDLE');
      clearSafetyTimer();
      clearAutoSendTimer();
      clearNoResponseTimer();

      const errCode = String(e.error || '');
      const state = (window as any).conversationState || "IDLE";
      const canRetry =
        INPUT_WAITING_STATES.includes(state) &&
        listenRetryCountRef.current < voiceConfigRef.current.maxListenRetries;

      // FIX: "no-speech" and "aborted" are non-fatal — don't show error, just recover
      if (errCode === 'no-speech' || errCode === 'aborted') {
        dlog(`[8] Recognition ended with: ${errCode} — recovering silently.`, 'state:', (window as any).conversationState || 'IDLE');
        setListening(false);
        if (canRetry) {
          logRetryAttempt('recognition.onerror', errCode, state, true);
          listenRetryCountRef.current += 1;
          setTimeout(() => { startListening(); }, 300);
          return;
        }
        logRetryAttempt('recognition.onerror', errCode, state, false);
        listenRetryCountRef.current = 0;
        resetSession(true);
        return;
      }

      // FIX: "network" errors are transient — recover with a user-visible message
      if (errCode === 'network') {
        setError('Network issue with speech recognition. Retrying...');
        setListening(false);
        if (canRetry) {
          logRetryAttempt('recognition.onerror', 'network', state, true);
          listenRetryCountRef.current += 1;
          setTimeout(() => { startListening(); }, 300);
          return;
        }
        logRetryAttempt('recognition.onerror', 'network', state, false);
        listenRetryCountRef.current = 0;
        resetSession(true);
        return;
      }

      setError(`Speech error: ${errCode || 'unknown'}`);
      setListening(false);
      // FIX: for unexpected errors, still retry listening if we're mid-way
      // through collecting an answer — otherwise the app would silently
      // drop the user's in-progress flow. Fall back to a full reset once
      // retries are exhausted so the app never gets stuck.
      if (canRetry) {
        logRetryAttempt('recognition.onerror', errCode || 'unknown', state, true);
        listenRetryCountRef.current += 1;
        setTimeout(() => { startListening(); }, 300);
        return;
      }
      logRetryAttempt('recognition.onerror', errCode || 'unknown', state, false);
      listenRetryCountRef.current = 0;
      resetSession(true);
    };

    recognitionRef.current = r;

    return () => {
      clearSafetyTimer();
      clearAutoSendTimer();
      clearNoResponseTimer();
      clearPaymentModalTimer();
      if (wakeRestartTimerRef.current) clearTimeout(wakeRestartTimerRef.current);
      try { r.stop(); } catch (_) { }
    };
  }, [i18n?.language]);




  // ── Auto-scroll voice-history-stream to bottom on new messages ───────────
  // FIX: whenever `messages` changes (assistant or user bubble appended),
  // snap the log to the bottom so the latest message is visible by default.
  // If the user has manually scrolled up to read earlier history, we don't
  // yank them back down — auto-scroll resumes once they scroll back near
  // the bottom themselves (see handleHistoryScroll below).
  useEffect(() => {
    dlog("[58] ******** auto-scroll history stream on new message *******", 'state:', (window as any).conversationState || 'IDLE');
    const el = historyStreamRef.current;
    if (!el) return;

    if (!isUserScrolledUpRef.current) {
      // rAF ensures the DOM has painted the new bubble before we measure scrollHeight
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  // FIX: tracks whether the user is currently scrolled away from the bottom
  // of the history stream. Uses a small threshold (40px) so being "close
  // enough" to the bottom still counts as "at bottom" for auto-scroll
  // purposes. Kept as a ref (not state) to avoid re-rendering on every
  // scroll tick.
  const handleHistoryScroll = () => {
    const el = historyStreamRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isUserScrolledUpRef.current = distanceFromBottom > 40;
  };




  // ── Speech synthesis ───────────────────────────────────────────────────────
const speak = useCallback((text: string) => {

    dlog("[9] ******** speak method *******", 'state:', (window as any).conversationState || 'IDLE');
    try {

      if (!("speechSynthesis" in window)) return;

      assistantSpeakingRef.current = true;
      try { 
        wakeRecognitionRef.current?.stop();
       } catch
        { 

        dlog('[10] ---------------error in stopping wake recognition-------', 'state:', (window as any).conversationState || 'IDLE');
      }

      const ut = new SpeechSynthesisUtterance(text);

      dlog("[11] ******** speak method (utterance created) *******", 'state:', (window as any).conversationState || 'IDLE');
      ut.lang = getLang();

      // FIX: live caption — reset and prime the reveal buffer for this utterance
      liveCaptionSourceRef.current = text;
      setLiveCaption("");

      ut.onstart = () => {
        dlog("[12] ASSISTANT SPEAKING", 'state:', (window as any).conversationState || 'IDLE');
      };

      // FIX: live caption — fires at each word/sentence boundary while speaking;
      // charIndex tells us how far into `text` the voice currently is, so we
      // reveal the caption in lockstep with the audio instead of dumping it
      // all at once.
      ut.onboundary = (event: any) => {
        if (event.name && event.name !== 'word' && event.name !== 'sentence') return;
        const idx = typeof event.charIndex === 'number' ? event.charIndex : 0;
        const end = idx + (event.charLength || 0);
        const revealed = liveCaptionSourceRef.current.slice(0, end > idx ? end : idx);
        setLiveCaption(revealed);
      };

      ut.onend = () => {
        assistantSpeakingRef.current = false;

        // FIX: live caption — caught up with full text, clear the buffer
        setLiveCaption("");
        liveCaptionSourceRef.current = "";

        const state = (window as any).conversationState || "IDLE";
        dlog("[13] STATE AFTER SPEAK:", state, 'state:', (window as any).conversationState || 'IDLE');

        if (INPUT_WAITING_STATES.includes(state)) {
          // FIX: a fresh prompt just went out — reset the retry counter so
          // the upcoming listening attempt gets its full retry budget.
          listenRetryCountRef.current = 0;
          lastRetryStageRef.current = null;
          setTimeout(() => { startListening(); }, 400);
        } else if (canRestartWake() && !activeSessionRef.current && !processingRef.current) {
          startWakeWordListener();
        }
      };

      // FIX: recover if speech synthesis itself errors
      ut.onerror = (e) => {
        dlog("[14] Speech synthesis error:", e, 'state:', (window as any).conversationState || 'IDLE');
        assistantSpeakingRef.current = false;
        // FIX: live caption — clear buffer on error too
        setLiveCaption("");
        liveCaptionSourceRef.current = "";
        // Still try to restart wake listener
        const state = (window as any).conversationState || "IDLE";
        if (state === "IDLE" && !activeSessionRef.current) {
          setTimeout(() => { startWakeWordListener(); }, 500);
        }
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(ut);

    } catch (err) {
      dlog("[15] speak() threw:", err, 'state:', (window as any).conversationState || 'IDLE');
      // FIX: ensure flag resets even if speak() throws synchronously
      assistantSpeakingRef.current = false;
    }
  }, []);





  const appendAssistantMessage = useCallback((text: string) => {
    dlog("[52] ******** appendAssistantMessage method *******", 'state:', (window as any).conversationState || 'IDLE');
    setMessages(s => [...s, { from: 'assistant', text }]);
  }, []);

  // ── Wake word listener ─────────────────────────────────────────────────────
  const handleWakeDetected = () => {
    dlog("[16] WAKE DETECTED", 'state:', (window as any).conversationState || 'IDLE');
    activeSessionRef.current = true;

    try { wakeRecognitionRef.current?.stop(); } catch { }
    wakeRecognitionRef.current = null;

    speak("Yes?");
    setTimeout(() => { startListening(); }, 1000);
  };



  //======================================================================

  const startWakeWordListener = useCallback(() => {

    dlog("[17] ******** startWakeWordListener method *******", 'state:', (window as any).conversationState || 'IDLE');


    if (assistantSpeakingRef.current) return;
    if (wakeRecognitionRef.current) return;
    if (!wakeEnabledRef.current) return;

    const SpeechClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechClass) return;

    dlog("[18] STARTING WAKE LISTENER", 'state:', (window as any).conversationState || 'IDLE');

    const wakeRec = new SpeechClass();
    wakeRec.lang = getLang();
    wakeRec.continuous = true;
    wakeRec.interimResults = false;

    dlog("[19] WAKE STARTED", 'state:', (window as any).conversationState || 'IDLE');

    wakeRec.onresult = (event: any) => {
      const state = (window as any).conversationState;
      dlog("[20] CURRENT STATE:", state, 'state:', (window as any).conversationState || 'IDLE');

      dlog('[21] ---2------------CURRENT STATE: ' + state + '-------', 'state:', (window as any).conversationState || 'IDLE');

      const wakeAllowed = !state || state === "IDLE" || state === "COMPLETE";
      if (!wakeAllowed) return;

      const text = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();

      dlog("[22] WAKE:", text, 'state:', (window as any).conversationState || 'IDLE');

      dlog('[23] ---4------------WAKE TEXT: ' + text + '-------', 'state:', (window as any).conversationState || 'IDLE');

      if (text.includes("raghav") || text.includes("Raghav") 
        || text.includes("RAGHAV") || text.includes("राघव") 
        || text.includes("राघव") || text.includes("राघव") 
        || text.includes("राघव") || text.includes("राघव") 
        || text.includes("राघव") || text.includes("राघव") ) {
        handleWakeDetected();
      }
    };





    wakeRec.onerror = (e: any) => {
      dlog('[24] ---3------------WAKE ERROR: ' + e.error + '-------', 'state:', (window as any).conversationState || 'IDLE');
      dlog("[25] WAKE ERROR", e.error, 'state:', (window as any).conversationState || 'IDLE');
      // FIX: clear ref on error so onend can attempt restart
      wakeRecognitionRef.current = null;
    };

    wakeRec.onend = () => {
      dlog("[26] WAKE ENDED", 'state:', (window as any).conversationState || 'IDLE');
      wakeRecognitionRef.current = null;

      if (
        wakeEnabledRef.current &&
        !assistantSpeakingRef.current &&
        !activeSessionRef.current &&
        canRestartWake()
      ) {
        // FIX: track this timer so we can cancel it on unmount
        wakeRestartTimerRef.current = setTimeout(() => {
          startWakeWordListener();
        }, 1000);
      }
    };

    wakeRecognitionRef.current = wakeRec;

    try {
      wakeRec.start();
    } catch (e) {
      console.error("[27] Failed to start wake listener:", e, 'state:', (window as any).conversationState || 'IDLE');
      wakeRecognitionRef.current = null;
    }
  }, []);

  // ── Payment modal opener ───────────────────────────────────────────────────
  const openPaymentModal = (mobileNumber?: string, options?: PaymentOptions) => {
    dlog("[53] ******** openPaymentModal method *******", 'state:', (window as any).conversationState || 'IDLE');
    if (onOpenPayment) {
      onOpenPayment(mobileNumber, options);
    } else {
      clearPaymentModalTimer();
      paymentModalTimerRef.current = setTimeout(() => {
        setPaymentMobile(mobileNumber ?? '');
        setPaymentOptions(prev => ({ ...prev, ...(options ?? {}) }));
        setShowPaymentModal(true);
      }, voiceConfigRef.current.paymentModalOpenDelayMs);
    }
  };

  const handlePaymentConfirm = (mobile?: string, useWallet?: boolean) => {
    setShowPaymentModal(false);
    dlog('[28] Payment confirmed — mobile:', mobile ?? '(none)', '| useWallet:', useWallet, 'state:', (window as any).conversationState || 'IDLE');
    const parts: string[] = ['Payment processed.'];
    if (mobile) parts.push(`Discount credited to ${mobile}.`);
    if (useWallet && paymentOptions.walletBalance) {
      parts.push(`₹${paymentOptions.walletBalance} deducted from wallet.`);
    }
    const msg = parts.join(' ');
    appendAssistantMessage(msg);
    speak(msg);
  };

  // ── Listening controls ─────────────────────────────────────────────────────
  const startListening = () => {

    dlog("[29] ******** startListening method *******", 'state:', (window as any).conversationState || 'IDLE');
    activeSessionRef.current = true;

    try { 
      wakeRecognitionRef.current?.stop(); 
    } catch { 
      dlog('[30] ---------------error in stopping wake recognition-------', 'state:', (window as any).conversationState || 'IDLE');
    }
    wakeRecognitionRef.current = null;

    setError(null);
    setTranscript('');
    transcriptRef.current = ''; // FIX: clear ref too
    autoSendRef.current = true;

    if (!recognitionRef.current) {
      setError('Speech recognition not initialised.');
      resetSession(true);
      return;
    }

    try {
      recognitionRef.current.start();
      setListening(true);

      clearSafetyTimer();
      recognitionSafetyTimerRef.current = setTimeout(() => {
        console.warn("[31] Recognition safety timeout — force stopping.", 'state:', (window as any).conversationState || 'IDLE');
        try { recognitionRef.current?.stop(); } catch { }
        setListening(false);
        setError('Listening timed out. Please try again.');
        // FIX: recognitionRef.current.stop() triggers r.onend, which now
        // contains the retry-vs-reset decision for WAITING_FOR_* states —
        // so we don't duplicate that logic here.
      }, voiceConfigRef.current.recognitionSafetyTimeoutMs);

      // FIX: separate, shorter watchdog — if the user hasn't said anything
      // within 5s of a WAITING_FOR_* prompt, don't wait for the full 15s
      // safety timeout: force-stop now so r.onend's retry-or-reset logic
      // can kick in immediately and the assistant can listen again sooner.
      clearNoResponseTimer();
      noResponseTimerRef.current = setTimeout(() => {
        if (!transcriptRef.current || !transcriptRef.current.trim()) {
          dlog(
            "[46] No response from user within 5 seconds — treating as not listening / silence.",
            'state:', (window as any).conversationState || 'IDLE'
          );
          try { recognitionRef.current?.stop(); } catch { }
        }
      }, voiceConfigRef.current.noResponseTimeoutMs);

    } catch (err) {
      dlog("[32] Failed to start recognition:", err, 'state:', (window as any).conversationState || 'IDLE');
      setError('Could not start listening. Please try again.');

      // FIX: if we were waiting on a specific answer, try again instead of
      // silently dropping back to the wake listener on the first failure.
      const state = (window as any).conversationState || "IDLE";
      const canRetry =
        INPUT_WAITING_STATES.includes(state) &&
        listenRetryCountRef.current < voiceConfigRef.current.maxListenRetries;

      if (canRetry) {
        logRetryAttempt('startListening.catch', (err as any)?.message || 'start-failed', state, true);
        listenRetryCountRef.current += 1;
        setTimeout(() => { startListening(); }, 300);
        return;
      }

      logRetryAttempt('startListening.catch', (err as any)?.message || 'start-failed', state, false);
      listenRetryCountRef.current = 0;
      // FIX: recover instead of getting stuck
      resetSession(true);
    }
  };

  const stopListening = () => {
    dlog("[33] ******** stopListening method *******", 'state:', (window as any).conversationState || 'IDLE');
    clearSafetyTimer();
    clearAutoSendTimer();
    clearNoResponseTimer();
    autoSendRef.current = false;
    try { recognitionRef.current?.stop(); } catch (_) { }
    setListening(false);
    // FIX: reset session when user manually stops
    resetSession(true);
  };



  //==============================================================================
  // ── Send transcript to AI ──────────────────────────────────────────────────
  const handleSend = async () => {

    dlog("[34] ******** handleSend method *******", 'state:', (window as any).conversationState || 'IDLE');
    // FIX: read from ref for latest value, fall back to state
    const userText = (transcriptRef.current || transcript || '').trim();

    dlog('[35] ---------------handleSend method----userText---'+userText, 'state:', (window as any).conversationState || 'IDLE');

    if (!userText) {
      dlog("[36] handleSend called with empty transcript — skipping.", 'state:', (window as any).conversationState || 'IDLE');
      resetSession(true);
      return;
    }

    setProcessing(true);
    processingRef.current = true;

    setError(null);
    setTranscript(userText);
    transcriptRef.current = '';

    setMessages(s => [...s, { from: 'user', text: userText }]);

    try {
      const currentContextState = (window as any).conversationState || 'IDLE';
      let data;

      if (currentContextState === 'WAITING_FOR_BRAND_SELECTION') {
        const response = await api.post('/ai/intent', { command: userText }, {
          params: { sessionMode: 'BRAND_SELECTION' },
        });
        data = response.data;

      } else if (currentContextState === 'WAITING_FOR_PACKAGING') {
        const response = await api.post('/ai/intent', { command: userText }, {
          params: { sessionMode: 'CONFIRM_PACKAGING' },
        });
        data = response.data;

      } else if (
        currentContextState === 'WAITING_FOR_MOBILE_CONSENT' ||
        currentContextState === 'WAITING_FOR_MOBILE_NUMBER' ||
        currentContextState === 'WAITING_FOR_WALLET_CONSENT' ||
        currentContextState === 'WAITING_FOR_PAY_CONFIRM' ||
        currentContextState === 'WAITING_FOR_RECEIPT_ACTION'
      ) {
        dlog('[37] currentContextState:', currentContextState, 'state:', (window as any).conversationState || 'IDLE');
        dlog('[38] userText:', userText, 'state:', (window as any).conversationState || 'IDLE');

        const isNegativeResponse = /\b(no|nahi|nope|skip|don'?t|dont|without|bypass)\b/i.test(userText);
        dlog('[39] isNegativeResponse:', isNegativeResponse, 'state:', (window as any).conversationState || 'IDLE');

        const sessionMode =
          currentContextState === 'WAITING_FOR_MOBILE_CONSENT' && isNegativeResponse
            ? 'CONFIRM_WITHOUTMOBILE'
            : currentContextState;

        dlog('[40] sessionMode being sent:', sessionMode, 'state:', (window as any).conversationState || 'IDLE');

        const response = await api.post('/ai/intent', { command: userText }, {
          params: { sessionMode },
        });
        data = { ...response.data, command: userText };

      } 
      else if (/\b(take\s*payment|payment|pay|checkout|bill\s*pay|make\s*payment|collect\s*payment|payment\s*karo|pay\s*karo|payment\s*kar\s*do|bhugtan)\b/i.test(userText) 
        || /(पेमेंट|भुगतान|पैसे\s*लो|पैसे\s*ले\s*लो|भुगतान\s*करो|पेमेंट\s*करो|बिल\s*का\s*पेमेंट)/i.test(userText)) {
        const response = await api.post('/ai/intent', { command: userText }, {
          params: { sessionMode: 'TAKE_PAYMENT' },
        });
        data = response.data;

      } else {
        data = await sendMessage(userText);
      }

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // FIX: if response is plain text (not JSON), wrap it so the rest of the code works
          data = { text: data };
        }
      }

      // FIX: guard against null/undefined response
      if (!data) {
        throw new Error('Empty response from server.');
      }

      const txt = data?.text || data?.message || data?.response || JSON.stringify(data);
      const intentPayload: IntentPayload = {
        intent: data?.intent,
        action: data?.action,
        text: txt,
        command: data?.command ?? userText,
        ...data,
      };

      if (onIntent) {
        // FIX: wrap onIntent in try/catch — a crash here would skip the finally block
        dlog('[41] ---------------onIntent method-------', 'state:', (window as any).conversationState || 'IDLE');
        try {
          onIntent(intentPayload, { speak, appendAssistantMessage });
        } catch (intentErr) {
          dlog("[42] onIntent handler threw:", intentErr, 'state:', (window as any).conversationState || 'IDLE');
          const fallback = "Sorry, there was an issue processing that.";
          appendAssistantMessage(fallback);
          speak(fallback);
        }
      }

    } catch (err: any) {
      dlog("[43] handleSend error:", err, 'state:', (window as any).conversationState || 'IDLE');
      const errMsg = err?.response?.data?.message || err?.message || String(err);
      setError(errMsg);

      // FIX: an error mid-flow must not leave conversationState stuck on a
      // WAITING_FOR_* value forever — bail back to IDLE so wake word can re-arm
      (window as any).conversationState = 'IDLE';

      const voiceError = "Sorry, I couldn't process that. Please try again.";
      appendAssistantMessage(voiceError);
      speak(voiceError);

    } finally {
      // FIX: always reset active session flag so wake listener can restart

      activeSessionRef.current = false;
      processingRef.current = false;
      setProcessing(false);
    }
  };

  // FIX: ref must capture the latest handleSend *and* the latest transcript
  const handleSendRef = useRef<() => Promise<void>>(handleSend);
  useEffect(() => {
    dlog("[54] ******** handleSendRef sync effect *******", 'state:', (window as any).conversationState || 'IDLE');
    handleSendRef.current = handleSend;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => {
    dlog("[55] ******** mount effect: setVisible *******", 'state:', (window as any).conversationState || 'IDLE');
    setVisible(true);
  }, []);

  useEffect(() => {
    dlog("[56] ******** mount effect: wake word lifecycle *******", 'state:', (window as any).conversationState || 'IDLE');
    if (wakeStartedRef.current) return;
    wakeStartedRef.current = true;
    startWakeWordListener();

    return () => {
      dlog("[57] ******** unmount cleanup: wake word lifecycle *******", 'state:', (window as any).conversationState || 'IDLE');
      wakeEnabledRef.current = false;
      if (wakeRestartTimerRef.current) clearTimeout(wakeRestartTimerRef.current);
      try { wakeRecognitionRef.current?.stop(); } catch { }
      wakeRecognitionRef.current = null;
    };
  }, []);

  (window as any).__voiceOpenPaymentModal = openPaymentModal;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {!onOpenPayment && (
        <PaymentModal
          key={`${paymentMobile || 'no-mobile'}-${paymentOptions.applyWallet}-${paymentOptions.walletBalance}`}
          show={showPaymentModal}
          mobileNumber={paymentMobile}
          walletBalance={paymentOptions.walletBalance}
          applyWallet={paymentOptions.applyWallet}
          onClose={() => setShowPaymentModal(false)}
          onConfirmPayment={handlePaymentConfirm}
        />
      )}

      {collapsed ? (
        <div className="voice-floating-trigger">
          <Button onClick={() => setCollapsed(false)}>🎙️ Voice Terminal</Button>
        </div>
      ) : (
        <div
          className="voice-terminal-window"
          style={{
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            opacity: visible ? 1 : 0,
          }}
        >
          <div className="voice-terminal-card">
            <div className="voice-terminal-header">
              <div>
                <div className="voice-terminal-title">Voice Terminal Logging</div>
                <div className="voice-terminal-subtitle">Realtime operations stream</div>
              </div>
              <div className="voice-terminal-header-controls">
                <Button
                  size="sm"
                  variant={listening ? 'danger' : 'primary'}
                  onClick={() => (listening ? stopListening() : startListening())}
                  disabled={processing}
                >
                  {listening ? 'Stop' : processing ? 'Processing…' : 'Listen'}
                </Button>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => setCollapsed(true)}
                  className="voice-terminal-collapse-btn"
                >
                  —
                </Button>
              </div>
            </div>

            <div className="voice-terminal-body">
                <div className="voice-transcript-box">
                  {liveCaption
                    ? liveCaption
                    : (transcript || (processing
                      ? 'Processing operation routing...'
                      : 'Awaiting live voice input sequence...'
                    ))
                  }
                </div>
              <div
                className="voice-history-stream"
                ref={historyStreamRef}
                onScroll={handleHistoryScroll}
              >
                {messages.length === 0 ? (
                  <div className="voice-empty-log">No execution records in current cycle.</div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className="voice-bubble-wrapper"
                      style={{ justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}
                    >
                      <div className={`voice-bubble ${m.from}`}>{m.text}</div>
                    </div>
                  ))
                )}
              </div>
              {error && <div className="voice-runtime-error">⚠️ {error}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistant;