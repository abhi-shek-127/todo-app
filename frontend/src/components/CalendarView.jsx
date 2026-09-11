import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarView = ({ todos, onEdit }) => {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState(null);

  const year = current.getFullYear();
  const month = current.getMonth();
  const monthLabel = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // Group todos by due date (this month only)
  const byDay = {};
  todos.forEach((todo) => {
    if (!todo.dueDate) return;
    const d = new Date(todo.dueDate);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(todo);
    }
  });

  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedTodos = selectedDay ? (byDay[selectedDay] || []) : [];

  return (
    <div className="calendar-view card">
      {/* Header */}
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null); }}
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="calendar-month-title">{monthLabel}</h3>
        <button
          type="button"
          className="calendar-nav-btn"
          onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null); }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day names row */}
      <div className="calendar-day-names">
        {DAY_NAMES.map((d) => (
          <div key={d} className="calendar-day-name">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="calendar-cell empty" />;
          const dayTodos = byDay[day] || [];
          const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
          const hasOverdue = dayTodos.some((t) => {
            if (t.completed) return false;
            const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0);
            return due < todayMid;
          });
          return (
            <div
              key={day}
              className={`calendar-cell
                ${isToday(day) ? 'today' : ''}
                ${selectedDay === day ? 'selected' : ''}
                ${dayTodos.length > 0 ? 'has-tasks' : ''}
              `}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
            >
              <span className="calendar-day-num">{day}</span>
              {dayTodos.length > 0 && (
                <div className="calendar-task-dots">
                  {dayTodos.slice(0, 3).map((t, idx) => (
                    <span
                      key={idx}
                      className={`task-dot
                        ${t.completed ? 'dot-done' : hasOverdue ? 'dot-overdue' : `dot-${t.priority}`}
                      `}
                    />
                  ))}
                  {dayTodos.length > 3 && (
                    <span className="task-dot-more">+{dayTodos.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="calendar-day-panel">
          <h4 className="calendar-day-panel-title">
            <Calendar size={15} />
            {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </h4>

          {selectedTodos.length === 0 ? (
            <p className="calendar-no-tasks">No tasks due on this day.</p>
          ) : (
            <ul className="calendar-task-list">
              {selectedTodos.map((todo) => (
                <li
                  key={todo._id}
                  className={`calendar-task-item ${todo.completed ? 'done' : ''}`}
                  onClick={() => onEdit(todo)}
                >
                  <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
                  <span className="calendar-task-title">{todo.title}</span>
                  {todo.completed && <span className="calendar-done-badge">Done</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
