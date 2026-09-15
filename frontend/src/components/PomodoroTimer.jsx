import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, X, Play, Pause, SkipForward, RotateCcw, Minimize2, Maximize2, Settings } from 'lucide-react';

const MODES = {
  focus:     { label: 'Focus',       color: '#4f46e5' },
  break:     { label: 'Short Break', color: '#10b981' },
  longBreak: { label: 'Long Break',  color: '#f59e0b' },
};

const DEFAULT_MINS = { focus: 25, break: 5, longBreak: 15 };

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch (_) {}
};

const PomodoroTimer = ({ todos = [], onClose }) => {
  const [mode, setMode] = useState('focus');
  const [customMins, setCustomMins] = useState(DEFAULT_MINS);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_MINS.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [draftMins, setDraftMins] = useState(DEFAULT_MINS);
  const intervalRef = useRef(null);

  const pendingTodos = todos.filter(t => !t.completed);
  const selectedTask = todos.find(t => t._id === selectedTaskId);

  const switchMode = useCallback((newMode) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(customMins[newMode] * 60);
  }, [customMins]);

  useEffect(() => {
    if (!isRunning) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          playBeep();
          if (mode === 'focus') {
            const newSessions = sessions + 1;
            setSessions(newSessions);
            setTimeout(() => switchMode(newSessions % 4 === 0 ? 'longBreak' : 'break'), 800);
          } else {
            setTimeout(() => switchMode('focus'), 800);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode, sessions, switchMode]);

  const handleSaveSettings = () => {
    const validated = {
      focus:     Math.max(1, Math.min(480, Number(draftMins.focus)     || DEFAULT_MINS.focus)),
      break:     Math.max(1, Math.min(480, Number(draftMins.break)     || DEFAULT_MINS.break)),
      longBreak: Math.max(1, Math.min(480, Number(draftMins.longBreak) || DEFAULT_MINS.longBreak)),
    };
    setCustomMins(validated);
    setTimeLeft(validated[mode] * 60);
    setIsRunning(false);
    setShowSettings(false);
  };

  const openSettings = () => {
    setDraftMins(customMins);
    setShowSettings(true);
  };

  const fmtMins = (m) => {
    const v = Math.max(1, Number(m) || 1);
    const h = Math.floor(v / 60);
    const rem = v % 60;
    if (h === 0) return `${rem}m`;
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
  };

  const hours = Math.floor(timeLeft / 3600);
  const mins = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const timeDisplay = hours > 0 ? `${hours}:${mins}:${secs}` : `${mins}:${secs}`;
  const totalSecs = customMins[mode] * 60;
  const progress = (totalSecs - timeLeft) / totalSecs;
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const modeColor = MODES[mode].color;

  return (
    <div className={`pomodoro-widget ${minimized ? 'pomodoro-minimized' : ''}`}>
      {/* Header */}
      <div className="pomodoro-header">
        <div className="pomodoro-header-left">
          <Timer size={15} />
          <span className="pomodoro-title">Pomodoro</span>
          <div className="session-dots">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className={`session-dot ${i < (sessions % 4) || (sessions % 4 === 0 && sessions > 0 && i < 4) ? 'filled' : ''}`} />
            ))}
          </div>
        </div>
        <div className="pomodoro-header-right">
          {!minimized && (
            <button type="button" className="pom-icon-btn" onClick={openSettings} title="Edit timer durations">
              <Settings size={13} />
            </button>
          )}
          <button type="button" className="pom-icon-btn" onClick={() => setMinimized(v => !v)}>
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button type="button" className="pom-icon-btn" onClick={onClose}>
            <X size={13} />
          </button>
        </div>
      </div>

      {minimized ? (
        <div className="pomodoro-mini" style={{ color: modeColor }}>
          <span className="pomodoro-mini-time">{timeDisplay}</span>
          <span className="pomodoro-mini-mode">{MODES[mode].label}</span>
          {isRunning && <span className="pom-running-dot" style={{ background: modeColor }} />}
        </div>
      ) : (
        <>
          {/* Mode tabs */}
          <div className="pomodoro-modes">
            {Object.entries(MODES).map(([key, val]) => (
              <button
                key={key}
                type="button"
                className={`pom-mode-btn ${mode === key ? 'active' : ''}`}
                style={mode === key ? { background: val.color, color: '#fff', borderColor: val.color } : {}}
                onClick={() => switchMode(key)}
              >
                {val.label}
              </button>
            ))}
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="pom-settings-panel">
              <div className="pom-settings-title">Edit Timer Durations</div>
              {[
                { key: 'focus',     label: 'Focus' },
                { key: 'break',     label: 'Short Break' },
                { key: 'longBreak', label: 'Long Break' },
              ].map(({ key, label }) => (
                <div key={key} className="pom-settings-row">
                  <label className="pom-settings-label">{label}</label>
                  <input
                    type="number"
                    className="pom-settings-input"
                    min="1"
                    max="480"
                    value={draftMins[key]}
                    onChange={e => setDraftMins(d => ({ ...d, [key]: e.target.value }))}
                  />
                  <span className="pom-settings-unit">min</span>
                  <span className="pom-settings-preview">{fmtMins(draftMins[key])}</span>
                </div>
              ))}
              <div className="pom-settings-actions">
                <button className="pom-settings-cancel" onClick={() => setShowSettings(false)}>Cancel</button>
                <button className="pom-settings-save" onClick={handleSaveSettings}>Save</button>
              </div>
            </div>
          )}

          {/* Task selector */}
          <select
            className="pom-task-select"
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
          >
            <option value="">— Focus on a task (optional) —</option>
            {pendingTodos.map(t => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>

          {selectedTask && (
            <p className="pom-task-badge">
              🎯 {selectedTask.title}
            </p>
          )}

          {/* SVG ring timer */}
          <div className="pomodoro-ring-wrap">
            <svg viewBox="0 0 100 100" className="pomodoro-svg">
              <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle
                cx="50" cy="50" r={r}
                fill="none"
                stroke={modeColor}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.9s linear' }}
              />
            </svg>
            <div className="pomodoro-time-overlay">
              <span className="pomodoro-digits" style={{ color: modeColor }}>{timeDisplay}</span>
              <span className="pomodoro-mode-label">{MODES[mode].label}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="pomodoro-controls">
            <button type="button" className="pom-icon-btn pom-ctrl" onClick={() => switchMode(mode)} title="Reset">
              <RotateCcw size={17} />
            </button>
            <button
              type="button"
              className="pom-play-btn"
              style={{ background: modeColor }}
              onClick={() => setIsRunning(v => !v)}
              aria-label={isRunning ? 'Pause' : 'Start'}
            >
              {isRunning ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button type="button" className="pom-icon-btn pom-ctrl" onClick={() => {
              const next = mode === 'focus'
                ? ((sessions + 1) % 4 === 0 ? 'longBreak' : 'break')
                : 'focus';
              switchMode(next);
            }} title="Skip">
              <SkipForward size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PomodoroTimer;
