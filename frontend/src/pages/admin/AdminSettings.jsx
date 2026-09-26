import React, { useState, useEffect } from 'react';
import { Settings, Shield, MapPin, Save, CheckCircle, Navigation, AlertCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { getDeviceCoordinates } from '../../utils/locationService';

const AdminSettings = () => {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsMessage, setGpsMessage] = useState({ type: '', text: '' });

  const [settings, setSettings] = useState({
    companyName: 'TalentFlow Enterprise Global Inc.',
    officialEmail: 'contact@talentflow.internal',
    workHoursPerDay: 8,
    standardLeaveQuota: 20,
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    halfDayCutoffTime: '10:00',
    absentCutoffTime: '14:00',
    timezone: 'Asia/Kolkata',
    allowRemotePunch: false,
    emailAlerts: true,
    twoFactorEnforced: true,
    officeLocation: {
      name: 'Main Office Headquarters',
      latitude: 12.9716,
      longitude: 77.5946,
      radiusMeters: 500,
      enforceLocation: true,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/attendance/office-location');
        if (res.data?.success) {
          setSettings((prev) => ({
            ...prev,
            companyName: res.data.companyName || prev.companyName,
            officialEmail: res.data.officialEmail || prev.officialEmail,
            workHoursPerDay: res.data.workHoursPerDay ?? prev.workHoursPerDay,
            standardLeaveQuota: res.data.standardLeaveQuota ?? prev.standardLeaveQuota,
            shiftStartTime: res.data.shiftStartTime || prev.shiftStartTime,
            shiftEndTime: res.data.shiftEndTime || prev.shiftEndTime,
            halfDayCutoffTime: res.data.halfDayCutoffTime || prev.halfDayCutoffTime,
            absentCutoffTime: res.data.absentCutoffTime || prev.absentCutoffTime,
            timezone: res.data.timezone || prev.timezone,
            allowRemotePunch: Boolean(res.data.allowRemotePunch),
            emailAlerts: res.data.emailAlerts !== undefined ? Boolean(res.data.emailAlerts) : prev.emailAlerts,
            twoFactorEnforced: res.data.twoFactorEnforced !== undefined ? Boolean(res.data.twoFactorEnforced) : prev.twoFactorEnforced,
            officeLocation: res.data.officeLocation || prev.officeLocation,
          }));
        }
      } catch (e) {
        console.warn('Failed to load office location settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const handleDetectCurrentLocation = async () => {
    setGpsDetecting(true);
    setGpsMessage({ type: '', text: '' });
    try {
      const coords = await getDeviceCoordinates();
      setSettings((prev) => ({
        ...prev,
        officeLocation: {
          ...prev.officeLocation,
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
        },
      }));
      setGpsMessage({
        type: 'success',
        text: `GPS coordinates captured! Lat: ${coords.latitude.toFixed(6)}, Lon: ${coords.longitude.toFixed(6)}`,
      });
    } catch (err) {
      setGpsMessage({
        type: 'danger',
        text: err.message || 'Failed to detect current GPS location.',
      });
    } finally {
      setGpsDetecting(false);
    }
  };

    const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/attendance/office-location', {
        name: settings.officeLocation.name,
        latitude: settings.officeLocation.latitude,
        longitude: settings.officeLocation.longitude,
        radiusMeters: settings.officeLocation.radiusMeters,
        enforceLocation: settings.officeLocation.enforceLocation,
        allowRemotePunch: settings.allowRemotePunch,
        companyName: settings.companyName,
        officialEmail: settings.officialEmail,
        workHoursPerDay: settings.workHoursPerDay,
        standardLeaveQuota: settings.standardLeaveQuota,
        shiftStartTime: settings.shiftStartTime,
        shiftEndTime: settings.shiftEndTime,
        halfDayCutoffTime: settings.halfDayCutoffTime,
        absentCutoffTime: settings.absentCutoffTime,
        timezone: settings.timezone,
        emailAlerts: settings.emailAlerts,
        twoFactorEnforced: settings.twoFactorEnforced,
      });

      // Broadcast update across windows & tabs
      window.dispatchEvent(new CustomEvent('office-location-updated', { detail: res.data?.officeLocation }));
      localStorage.setItem('office_location_last_updated', Date.now().toString());

      setSaved(true);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px' }}>
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>System configuration and authorized office location saved successfully!</span>
        </div>
      )}

      {gpsMessage.text && (
        <div className={`alert alert-${gpsMessage.type}`} style={{ marginBottom: '20px' }}>
          {gpsMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{gpsMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Office Geofencing Configuration */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid #0ea5e9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={22} color="#0ea5e9" />
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Authorized Workplace Geofence Location</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                  All employee check-in, check-out, break and lunch actions are restricted to this authorized perimeter
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDetectCurrentLocation}
              disabled={gpsDetecting}
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Navigation size={14} />
              <span>{gpsDetecting ? 'Detecting GPS...' : 'Use My Current Location'}</span>
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group col-span-2">
              <label>Authorized Workplace Name</label>
              <input
                type="text"
                className="form-control"
                value={settings.officeLocation.name}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    officeLocation: { ...settings.officeLocation, name: e.target.value },
                  })
                }
                placeholder="e.g. Main Corporate Headquarters"
                required
              />
            </div>

            <div className="form-group">
              <label>Authorized Latitude</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={settings.officeLocation.latitude}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    officeLocation: { ...settings.officeLocation, latitude: Number(e.target.value) },
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Authorized Longitude</label>
              <input
                type="number"
                step="any"
                className="form-control"
                value={settings.officeLocation.longitude}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    officeLocation: { ...settings.officeLocation, longitude: Number(e.target.value) },
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Allowed Geofence Radius (Meters)</label>
              <input
                type="number"
                min="50"
                max="50000"
                className="form-control"
                value={settings.officeLocation.radiusMeters}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    officeLocation: { ...settings.officeLocation, radiusMeters: Number(e.target.value) },
                  })
                }
                required
              />
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Recommended: 500m (covers standard campus/building radius)
              </span>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label className="checkbox-label" style={{ fontSize: '13.5px', marginTop: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.officeLocation.enforceLocation}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      officeLocation: { ...settings.officeLocation, enforceLocation: e.target.checked },
                    })
                  }
                />
                <div>
                  <strong>Strict Geofence Enforcement</strong>
                  <p style={{ fontSize: '11.5px', color: '#64748b' }}>Reject attendance actions if employee is outside the radius</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Shift Timings & Late Attendance Policy Rules */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Clock size={22} color="#f59e0b" />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Shift Timings & Late Attendance Cutoff Rules</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Automated status rules applied to employee check-ins based on check-in arrival time
              </p>
            </div>
          </div>

          {/* Policy Summary Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '12px',
              padding: '14px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }}></span>
              <div>
                <strong style={{ fontSize: '12.5px', color: '#047857' }}>On-Time Arrival</strong>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>Check-in ≤ {settings.halfDayCutoffTime || '10:00'} → <strong>Present</strong></p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }}></span>
              <div>
                <strong style={{ fontSize: '12.5px', color: '#b45309' }}>Half-Day Late Cutoff</strong>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>Check-in &gt; {settings.halfDayCutoffTime || '10:00'} → <strong>Half Day</strong></p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }}></span>
              <div>
                <strong style={{ fontSize: '12.5px', color: '#b91c1c' }}>Full Day Absent Cutoff</strong>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>Check-in ≥ {settings.absentCutoffTime || '14:00'} → <strong>Full Day Absent</strong></p>
              </div>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Shift Start Time</label>
              <input
                type="time"
                className="form-control"
                value={settings.shiftStartTime || '09:00'}
                onChange={(e) => setSettings({ ...settings, shiftStartTime: e.target.value })}
                required
              />
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Default: 09:00 AM (scheduled work start)
              </span>
            </div>

            <div className="form-group">
              <label>Shift End Time</label>
              <input
                type="time"
                className="form-control"
                value={settings.shiftEndTime || '18:00'}
                onChange={(e) => setSettings({ ...settings, shiftEndTime: e.target.value })}
                required
              />
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Default: 06:00 PM (scheduled work end)
              </span>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Half-Day Check-in Cutoff</span>
                <span className="badge badge-halfday" style={{ fontSize: '11px', padding: '1px 6px' }}>Half Day</span>
              </label>
              <input
                type="time"
                className="form-control"
                value={settings.halfDayCutoffTime || '10:00'}
                onChange={(e) => setSettings({ ...settings, halfDayCutoffTime: e.target.value })}
                required
              />
              <span style={{ fontSize: '11.5px', color: '#d97706', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                Check-ins after this time (10:00 AM) are automatically marked as Half Day
              </span>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Full Day Absent Check-in Cutoff</span>
                <span className="badge badge-absent" style={{ fontSize: '11px', padding: '1px 6px' }}>Full Day Absent</span>
              </label>
              <input
                type="time"
                className="form-control"
                value={settings.absentCutoffTime || '14:00'}
                onChange={(e) => setSettings({ ...settings, absentCutoffTime: e.target.value })}
                required
              />
              <span style={{ fontSize: '11.5px', color: '#dc2626', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                Check-ins at or after this time (2:00 PM) are automatically marked as Absent
              </span>
            </div>

            <div className="form-group col-span-2">
              <label>Operational Timezone</label>
              <input
                type="text"
                className="form-control"
                value={settings.timezone || 'Asia/Kolkata'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                placeholder="e.g. Asia/Kolkata, UTC, America/New_York"
                required
              />
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Company headquarters time zone used to evaluate check-in clock timestamps
              </span>
            </div>
          </div>
        </div>

        {/* Company Working Hours Policy */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Settings size={22} color="#4f46e5" />
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Company & Working Hours Policy</h3>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Organization Legal Entity Name</label>
              <input
                type="text"
                className="form-control"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Official HR Notification Email</label>
              <input
                type="email"
                className="form-control"
                value={settings.officialEmail}
                onChange={(e) => setSettings({ ...settings, officialEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Standard Working Hours per Day</label>
              <input
                type="number"
                className="form-control"
                value={settings.workHoursPerDay}
                onChange={(e) => setSettings({ ...settings, workHoursPerDay: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label>Annual Paid Leave Allotment (Days)</label>
              <input
                type="number"
                className="form-control"
                value={settings.standardLeaveQuota}
                onChange={(e) => setSettings({ ...settings, standardLeaveQuota: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Security & Access Controls */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Shield size={22} color="#059669" />
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Security & Remote Punch Controls</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="checkbox-label" style={{ fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={settings.allowRemotePunch}
                onChange={(e) => setSettings({ ...settings, allowRemotePunch: e.target.checked })}
              />
              <div>
                <strong>Allow Remote / IP-less Attendance Punch (Bypass Geofence)</strong>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Permit staff to punch in/out remotely without physical workplace verification</p>
              </div>
            </label>

            <label className="checkbox-label" style={{ fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
              />
              <div>
                <strong>Send Automated Leave Decision Emails</strong>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Dispatch instant status update emails upon manager review</p>
              </div>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 24px' }}>
            <Save size={16} />
            <span>{loading ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

