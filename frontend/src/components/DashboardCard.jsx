import React, { useRef, useState } from 'react';

const DashboardCard = ({ title, value, icon: Icon, color = '#4f46e5', bg = '#eef2ff', subtitle }) => {
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

  const handleClick = () => {
    setIsTouched(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsTouched(false);
    }, 800);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`dashboard-card ${isTouched ? 'active-touch' : ''}`}
      style={{ '--card-color': color, '--card-bg': bg }}
    >
      <div className="card-info">
        <div className="card-title">{title}</div>
        <div className="card-value">{value}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {Icon && (
        <div className="card-icon-wrap">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
