import React, { useState, useEffect } from 'react';
import {
  Activity,
  PlusCircle,
  CheckCircle,
  RotateCcw,
  Edit2,
  Trash2,
  Clock,
  Trash,
} from 'lucide-react';

const ActivityList = ({ activities = [], onClearActivities, onDeleteSelected, loading }) => {
  const [selected, setSelected] = useState(new Set());

  // Clear selection whenever the activities list changes (after deletion)
  useEffect(() => { setSelected(new Set()); }, [activities]);

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allChecked = activities.length > 0 && selected.size === activities.length;
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(activities.map((a) => a._id)));
  const getActionConfig = (action) => {
    switch (action) {
      case 'CREATED':
        return {
          icon: <PlusCircle size={15} className="text-emerald" />,
          badgeClass: 'badge-emerald',
          label: 'Created',
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle size={15} className="text-primary" />,
          badgeClass: 'badge-primary',
          label: 'Completed',
        };
      case 'UNCOMPLETED':
        return {
          icon: <RotateCcw size={15} className="text-amber" />,
          badgeClass: 'badge-amber',
          label: 'Reopened',
        };
      case 'UPDATED':
        return {
          icon: <Edit2 size={15} className="text-blue" />,
          badgeClass: 'badge-blue',
          label: 'Updated',
        };
      case 'DELETED':
        return {
          icon: <Trash2 size={15} className="text-rose" />,
          badgeClass: 'badge-rose',
          label: 'Deleted',
        };
      default:
        return {
          icon: <Clock size={15} className="text-muted" />,
          badgeClass: 'badge-muted',
          label: action,
        };
    }
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card activity-panel">
      <div className="activity-header">
        <div className="activity-title-wrap">
          <Activity size={18} className="activity-header-icon" />
          <h3 className="activity-title">Activity Log</h3>
          <span className="activity-count">{activities.length}</span>
        </div>

        <div className="activity-header-actions">
          {selected.size > 0 && (
            <button
              type="button"
              className="delete-selected-btn"
              onClick={() => onDeleteSelected(Array.from(selected))}
              title={`Delete ${selected.size} selected`}
            >
              <Trash2 size={13} /> Delete ({selected.size})
            </button>
          )}
          {activities.length > 0 && (
            <button
              type="button"
              className="clear-activity-btn"
              onClick={onClearActivities}
              title="Clear all activity history"
            >
              <Trash size={13} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="activity-timeline">
        {loading ? (
          <div className="activity-loading">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="activity-empty">
            <Clock size={28} className="text-muted mb-2" />
            <p className="empty-subtext">No activity recorded yet.</p>
            <p className="empty-hint">Create, update, or complete tasks to see your history here.</p>
          </div>
        ) : (
          <div className="timeline-items">
            {/* Select-all row */}
            <div className="activity-select-all-row">
              <label className="activity-checkbox-label">
                <input
                  type="checkbox"
                  className="activity-checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                />
                <span>{allChecked ? 'Deselect all' : 'Select all'}</span>
              </label>
            </div>

            {activities.map((act) => {
              const config = getActionConfig(act.action);
              const isSelected = selected.has(act._id);
              return (
                <div
                  key={act._id}
                  className={`timeline-item ${isSelected ? 'timeline-item-selected' : ''}`}
                  onClick={() => toggleOne(act._id)}
                >
                  <input
                    type="checkbox"
                    className="activity-checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(act._id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="timeline-icon-box">{config.icon}</div>
                  <div className="timeline-content">
                    <div className="timeline-top">
                      <span className={`timeline-badge ${config.badgeClass}`}>
                        {config.label}
                      </span>
                      <span className="timeline-time">
                        {formatTimestamp(act.createdAt)}
                      </span>
                    </div>
                    <p className="timeline-text">
                      <strong className="timeline-task-title">
                        {act.todoTitle}
                      </strong>
                    </p>
                    {act.details && act.details !== act.todoTitle && (
                      <span className="timeline-details">{act.details}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityList;
