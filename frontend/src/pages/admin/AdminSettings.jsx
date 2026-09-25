import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, Save, CheckCircle } from 'lucide-react';

const AdminSettings = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'TalentFlow Enterprise Global Inc.',
    officialEmail: 'contact@talentflow.internal',
    workHoursPerDay: 8,
    standardLeaveQuota: 20,
    allowRemotePunch: true,
    emailAlerts: true,
    twoFactorEnforced: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {saved && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>System configuration parameters updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave}>
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

        <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Shield size={22} color="#059669" />
            <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Security & Access Controls</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label className="checkbox-label" style={{ fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={settings.allowRemotePunch}
                onChange={(e) => setSettings({ ...settings, allowRemotePunch: e.target.checked })}
              />
              <div>
                <strong>Allow Remote / IP-less Attendance Punch</strong>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Permit staff to punch in/out from verified mobile and remote browsers</p>
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
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
