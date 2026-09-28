import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  color = '#4f46e5',
  bg = '#eef2ff',
  subtitle,
  to,
  onClick,
}) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [isTouched, setIsTouched] = useState(false);
  const timerRef = useRef(null);

  const updateCoordinates = (clientX, clientY) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseMove = (e) => {
    updateCoordinates(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsTouched(true);
    if (e.touches && e.touches[0]) {
      updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      updateCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    timerRef.current = setTimeout(() => {
      setIsTouched(false);
    }, 700);
  };

  const handleClick = (e) => {
    setIsTouched(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsTouched(false);
    }, 800);

    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  const isClickable = Boolean(to || onClick);

  return (
    <div
      ref={cardRef}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`dashboard-card ${isTouched ? 'active-touch' : ''} ${isClickable ? 'clickable' : ''}`}
      style={{
        '--card-color': color,
        '--card-bg': bg,
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
      }}
      title={isClickable ? `View details for ${title}` : undefined}
    >
      <div className="card-info">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{title}</span>
          {isClickable && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                opacity: 0.65,
                transition: 'all 0.2s ease',
              }}
              className="card-arrow-icon"
            >
              <ArrowUpRight size={14} />
            </span>
          )}
        </div>
        <div className="card-value">{value}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {Icon && (
        <div className="card-icon-wrap">
          <Icon size={20} />
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
