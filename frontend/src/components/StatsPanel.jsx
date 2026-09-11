import React, { useMemo } from 'react';
import { Flame, Trophy, Target, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const StatsPanel = ({ todos, activities }) => {
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const pending = todos.filter((t) => !t.completed).length;
    const overdue = todos.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Completion streak — consecutive days (including today) with >= 1 completed activity
    const completedDates = [
      ...new Set(
        activities
          .filter((a) => a.action === 'COMPLETED')
          .map((a) => new Date(a.createdAt).toDateString())
      ),
    ].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    for (let i = 0; i < completedDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      if (completedDates[i] === expected.toDateString()) {
        streak++;
      } else {
        break;
      }
    }

    // Last 14 days bar data
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const dateStr = d.toDateString();
      const count = activities.filter(
        (a) => a.action === 'COMPLETED' && new Date(a.createdAt).toDateString() === dateStr
      ).length;
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
        isToday: i === 13,
      };
    });

    const maxCount = Math.max(...last14.map((d) => d.count), 1);

    return { total, completed, pending, overdue, completionRate, streak, last14, maxCount };
  }, [todos, activities]);

  const streakMsg = stats.streak >= 30 ? 'Legendary!' : stats.streak >= 14 ? 'On fire!' : stats.streak >= 7 ? 'Great streak!' : null;

  return (
    <div className="stats-panel">
      {/* Streak card */}
      <div className="streak-card">
        <div className={`streak-flame ${stats.streak > 0 ? 'active' : ''}`}>
          <Flame size={36} />
        </div>
        <div className="streak-info">
          <span className="streak-number">{stats.streak}</span>
          <span className="streak-label">{stats.streak === 1 ? 'day streak' : 'day streak'}</span>
        </div>
        {streakMsg && (
          <div className="streak-badge">
            <Trophy size={13} /> {streakMsg}
          </div>
        )}
        {stats.streak === 0 && (
          <p className="streak-tip">Complete a task today to start your streak!</p>
        )}
      </div>

      {/* Quick stats grid */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <Target size={18} className="qs-icon qs-rate" />
          <span className="qs-value">{stats.completionRate}%</span>
          <span className="qs-label">Completion</span>
        </div>
        <div className="quick-stat-card">
          <CheckCircle size={18} className="qs-icon qs-done" />
          <span className="qs-value">{stats.completed}</span>
          <span className="qs-label">Completed</span>
        </div>
        <div className="quick-stat-card">
          <Clock size={18} className="qs-icon qs-pending" />
          <span className="qs-value">{stats.pending}</span>
          <span className="qs-label">Pending</span>
        </div>
        <div className="quick-stat-card">
          <AlertTriangle size={18} className="qs-icon qs-overdue" />
          <span className="qs-value">{stats.overdue}</span>
          <span className="qs-label">Overdue</span>
        </div>
      </div>

      {/* Bar chart — completions per day */}
      <div className="chart-card">
        <h4 className="chart-title">Tasks Completed — Last 14 Days</h4>
        <div className="bar-chart">
          {stats.last14.map((d, i) => (
            <div key={i} className={`bar-col ${d.isToday ? 'today' : ''}`} title={`${d.date}: ${d.count} completed`}>
              <span className="bar-value">{d.count > 0 ? d.count : ''}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ height: `${Math.max((d.count / stats.maxCount) * 100, d.count > 0 ? 8 : 0)}%` }}
                />
              </div>
              <span className="bar-day-label">{d.label}</span>
            </div>
          ))}
        </div>
        {stats.last14.every((d) => d.count === 0) && (
          <p className="chart-empty">No completed tasks in the last 14 days. Start completing tasks to see your progress!</p>
        )}
      </div>
    </div>
  );
};

export default StatsPanel;
