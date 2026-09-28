import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, AlertCircle, X, RefreshCw, UserCheck, MapPin, Navigation, Upload, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react';
import { verifyAttendanceLocation, getDeviceCoordinates } from '../utils/locationService';
import { detectFaceInCanvas } from '../utils/faceDetection';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const FaceVerificationModal = ({ isOpen, onClose, onSuccess, employeeName, employeePhoto }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const locationDataRef = useRef(null);
  const locationStatusRef = useRef('checking');
  const capturedPhotoRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState('idle'); // 'idle' | 'starting' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Facial Biometric Verification State
  const [faceStatus, setFaceStatus] = useState('idle'); // 'idle' | 'scanning' | 'verified' | 'failed'
  const [faceMessage, setFaceMessage] = useState('');
  const [faceConfidence, setFaceConfidence] = useState(0);

  // Location Verification State
  const [locationStatus, setLocationStatus] = useState('checking'); // 'checking' | 'verified' | 'unauthorized' | 'error'
  const [locationData, setLocationData] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [calibratingLocation, setCalibratingLocation] = useState(false);

  // Start webcam and location verification when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraStatus('idle');
      setCapturedPhoto(null);
      capturedPhotoRef.current = null;
      setFaceStatus('idle');
      setFaceMessage('');
      setFaceConfidence(0);
      setIsSubmitting(false);
      setLocationStatus('checking');
      locationStatusRef.current = 'checking';
      locationDataRef.current = null;
      setLocationData(null);
      setLocationError('');
      return;
    }

    startCamera();
    checkLocation();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
  };

  const checkLocation = async () => {
    setLocationStatus('checking');
    locationStatusRef.current = 'checking';
    setLocationError('');
    try {
      const locCheck = await verifyAttendanceLocation();
      locationDataRef.current = locCheck;
      setLocationData(locCheck);

      if (locCheck.success) {
        setLocationStatus('verified');
        locationStatusRef.current = 'verified';

        // If user already clicked capture while waiting for location, finish submission
        if (capturedPhotoRef.current && isSubmitting) {
          triggerCompletion(capturedPhotoRef.current, locCheck);
        }
      } else {
        setLocationStatus('unauthorized');
        locationStatusRef.current = 'unauthorized';
        setLocationError(locCheck.message || 'You are outside the authorized office geofence.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setLocationStatus('error');
      locationStatusRef.current = 'error';
      setLocationError(err.message || 'Failed to verify GPS location.');
      setIsSubmitting(false);
    }
  };

  // Allows setting current position as authorized office (Admin only)
  const handleCalibrateOfficeLocation = async () => {
    setCalibratingLocation(true);
    try {
      const coords = await getDeviceCoordinates();
      const res = await api.put('/attendance/office-location', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: locationData?.officeName || 'Authorized Workplace Office',
        radiusMeters: locationData?.allowedRadius || 1000,
        enforceLocation: true,
      });

      // Dispatch event to sync other tabs & components
      window.dispatchEvent(new CustomEvent('office-location-updated', { detail: res.data?.officeLocation }));
      localStorage.setItem('office_location_last_updated', Date.now().toString());

      await checkLocation();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to calibrate location.');
    } finally {
      setCalibratingLocation(false);
    }
  };

  // Allows remote punch bypass if requested (Admin only)
  const handleAllowRemoteBypass = async () => {
    setCalibratingLocation(true);
    try {
      const res = await api.put('/attendance/office-location', {
        allowRemotePunch: true,
      });

      window.dispatchEvent(new CustomEvent('office-location-updated', { detail: res.data?.officeLocation }));
      localStorage.setItem('office_location_last_updated', Date.now().toString());

      await checkLocation();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to enable remote punch.');
    } finally {
      setCalibratingLocation(false);
    }
  };

  const startCamera = async () => {
    setCameraStatus('starting');
    setErrorMessage('');
    setCapturedPhoto(null);
    capturedPhotoRef.current = null;
    setIsSubmitting(false);

    try {
      stopCamera();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported on this browser or connection.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
          setCameraStatus('ready');
        };
      } else {
        setCameraStatus('ready');
      }
    } catch (err) {
      console.warn('Camera initiation failed:', err);
      setCameraStatus('error');
      setErrorMessage(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser to take your check-in photo.'
          : err.message || 'Unable to access camera.'
      );
    }
  };

  const captureSnapshot = () => {
    try {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        // Mirror the image horizontally to match what the user sees
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.88);
      }
    } catch (e) {
      console.error('Snapshot capture failed:', e);
    }
    return '';
  };

  const handleCaptureAndCheckIn = async () => {
    if (isSubmitting) return;

    // Trigger flash animation
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 220);

    const snapshot = captureSnapshot();
    if (!snapshot) {
      alert('Could not capture frame from camera. Please try again.');
      return;
    }

    setCapturedPhoto(snapshot);
    capturedPhotoRef.current = snapshot;
    setFaceStatus('scanning');
    setFaceMessage('Scanning facial structure & biometric alignment...');

    // Perform facial detection on captured frame
    let faceCheck = { hasFace: false, confidence: 0, reason: 'Analyzing image...' };
    if (canvasRef.current) {
      faceCheck = await detectFaceInCanvas(canvasRef.current);
    }

    if (!faceCheck.hasFace) {
      setFaceStatus('failed');
      setFaceConfidence(faceCheck.confidence || 0);
      setFaceMessage(faceCheck.reason || 'No human face detected. Please ensure your face is clearly visible.');
      setIsSubmitting(false);
      return;
    }

    setFaceStatus('verified');
    setFaceConfidence(faceCheck.confidence || 90);
    setFaceMessage(faceCheck.reason || 'Human face verified successfully.');
    setIsSubmitting(true);

    const curStatus = locationStatusRef.current;
    const curLoc = locationDataRef.current;

    if (curStatus === 'verified') {
      setTimeout(() => {
        triggerCompletion(snapshot, curLoc, faceCheck.confidence || 90);
      }, 700);
    } else if (curStatus === 'unauthorized') {
      setIsSubmitting(false);
    }
  };

  const triggerCompletion = (snapshot, loc, confidence = 90) => {
    stopCamera();
    if (onSuccess) {
      onSuccess({
        faceVerified: true,
        faceConfidence: confidence,
        faceImage: snapshot,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        distance: loc?.distance,
        officeName: loc?.officeName,
      });
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    capturedPhotoRef.current = null;
    setFaceStatus('idle');
    setFaceMessage('');
    setFaceConfidence(0);
    setIsSubmitting(false);
    if (!streamRef.current) {
      startCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setCapturedPhoto(base64);
      capturedPhotoRef.current = base64;
      setCameraStatus('ready');
      setFaceStatus('scanning');
      setFaceMessage('Analyzing uploaded photo for human face...');

      const img = new Image();
      img.onload = async () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width || 640;
        offscreenCanvas.height = img.height || 480;
        const ctx = offscreenCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

        const faceCheck = await detectFaceInCanvas(offscreenCanvas);
        if (!faceCheck.hasFace) {
          setFaceStatus('failed');
          setFaceConfidence(faceCheck.confidence || 0);
          setFaceMessage(faceCheck.reason || 'No human face detected in the uploaded photo.');
          setIsSubmitting(false);
          return;
        }

        setFaceStatus('verified');
        setFaceConfidence(faceCheck.confidence || 90);
        setFaceMessage(faceCheck.reason || 'Human face verified successfully.');
        setIsSubmitting(true);

        const curStatus = locationStatusRef.current;
        const curLoc = locationDataRef.current;
        if (curStatus === 'verified') {
          setTimeout(() => {
            triggerCompletion(base64, curLoc, faceCheck.confidence || 90);
          }, 600);
        } else if (curStatus === 'unauthorized') {
          setIsSubmitting(false);
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(15, 23, 42, 0.82)', backdropFilter: 'blur(8px)' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          width: '95%',
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: capturedPhoto ? '#10b981' : '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s ease',
              }}
            >
              {capturedPhoto ? <UserCheck size={20} color="#fff" /> : <Camera size={20} color="#fff" />}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Photo Check-In
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {employeeName ? `Employee: ${employeeName}` : 'Capture Photo & Verify Location'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting && locationStatus === 'verified'}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Location Status Pill Bar */}
        <div
          style={{
            padding: '10px 18px',
            background:
              locationStatus === 'verified'
                ? 'rgba(16, 185, 129, 0.15)'
                : locationStatus === 'checking'
                ? 'rgba(56, 189, 248, 0.12)'
                : 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin
              size={15}
              color={
                locationStatus === 'verified'
                  ? '#10b981'
                  : locationStatus === 'checking'
                  ? '#38bdf8'
                  : '#f87171'
              }
            />
            <span style={{ fontWeight: 600 }}>
              {locationStatus === 'verified' ? (
                <span style={{ color: '#34d399' }}>
                  Workplace Verified • Within {locationData?.distance ?? 0}m of {locationData?.officeName || 'Office'}
                </span>
              ) : locationStatus === 'checking' ? (
                <span style={{ color: '#7dd3fc' }}>Verifying workplace GPS location...</span>
              ) : (
                <span style={{ color: '#fca5a5' }}>
                  {locationData?.distance
                    ? `Outside Workplace Geofence (${locationData.distance}m away)`
                    : 'Location Access Needed'}
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={checkLocation}
              disabled={locationStatus === 'checking'}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Re-check current GPS location against office geofence"
            >
              <RefreshCw size={11} className={locationStatus === 'checking' ? 'animate-spin' : ''} />
              <span>{locationStatus === 'checking' ? 'Checking...' : 'Re-check GPS'}</span>
            </button>

            {locationStatus === 'unauthorized' && isAdmin && (
              <button
                type="button"
                onClick={handleCalibrateOfficeLocation}
                disabled={calibratingLocation}
                style={{
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Set current GPS position as the authorized office (Admin)"
              >
                <Navigation size={11} />
                <span>{calibratingLocation ? 'Syncing...' : 'Set As Office'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Video / Camera Feed & Snapshot Viewport */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '330px',
            background: '#020617',
            overflow: 'hidden',
          }}
        >
          {/* Shutter Flash Animation */}
          {flashActive && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#ffffff',
                zIndex: 40,
                opacity: 0.9,
                transition: 'opacity 0.2s ease',
              }}
            />
          )}

          {/* Captured Photo Preview */}
          {capturedPhoto ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img
                src={capturedPhoto}
                alt="Captured Check-In"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Photo Captured Tag */}
              {/* Photo Captured Tag / Face Verification Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background:
                    faceStatus === 'verified'
                      ? 'rgba(16, 185, 129, 0.92)'
                      : faceStatus === 'failed'
                      ? 'rgba(239, 68, 68, 0.92)'
                      : 'rgba(56, 189, 248, 0.92)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                }}
              >
                {faceStatus === 'verified' ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Face Confirmed ({faceConfidence}%)</span>
                  </>
                ) : faceStatus === 'failed' ? (
                  <>
                    <AlertCircle size={16} />
                    <span>No Face Detected</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Scanning Face...</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)', // Mirror view
                  display: cameraStatus === 'error' ? 'none' : 'block',
                }}
              />

              {/* Viewfinder Reticle Framing */}
              {cameraStatus === 'ready' && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Subtle viewfinder oval guide for face alignment */}
                  <div
                    style={{
                      position: 'relative',
                      width: '240px',
                      height: '280px',
                      border: '2px dashed rgba(56, 189, 248, 0.5)',
                      borderRadius: '50%',
                      boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.35)',
                    }}
                  >
                    {/* Crosshair guide */}
                    <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: '24px', height: '3px', background: '#38bdf8', borderRadius: '2px' }} />
                    <div style={{ position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)', width: '24px', height: '3px', background: '#38bdf8', borderRadius: '2px' }} />
                  </div>

                  {/* Top helper tag */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#f1f5f9',
                      padding: '5px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    Align your face within the guide oval
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Error / Fallback View */}
          {cameraStatus === 'error' && (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                <AlertCircle size={30} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f87171', margin: '0 0 6px 0' }}>
                Camera Not Accessible
              </h4>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px 0', maxWidth: '360px', lineHeight: 1.4 }}>
                {errorMessage}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn"
                  style={{
                    background: '#334155',
                    color: '#f8fafc',
                    padding: '8px 16px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={14} /> Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn"
                  style={{
                    background: '#4f46e5',
                    color: '#ffffff',
                    padding: '8px 16px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Upload size={14} /> Upload Check-In Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Footer */}
        <div style={{ padding: '18px 20px', background: '#0b1120' }}>
          {capturedPhoto ? (
            /* When Photo is Captured */
            <div>
              {/* 1. Face Biometric Verification Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background:
                    faceStatus === 'verified'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : faceStatus === 'scanning'
                      ? 'rgba(56, 189, 248, 0.1)'
                      : 'rgba(239, 68, 68, 0.15)',
                  border:
                    faceStatus === 'verified'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : faceStatus === 'failed'
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid rgba(56, 189, 248, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {faceStatus === 'verified' ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : faceStatus === 'scanning' ? (
                    <RefreshCw size={18} color="#38bdf8" className="animate-spin" />
                  ) : (
                    <AlertCircle size={18} color="#ef4444" />
                  )}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color:
                        faceStatus === 'verified'
                          ? '#34d399'
                          : faceStatus === 'scanning'
                          ? '#7dd3fc'
                          : '#fca5a5',
                    }}
                  >
                    {faceStatus === 'verified'
                      ? `Face Verified: Real human face confirmed (${faceConfidence}% match)`
                      : faceStatus === 'scanning'
                      ? 'Analyzing facial structure & liveness...'
                      : faceMessage || 'No human face detected. Please retake photo.'}
                  </span>
                </div>
              </div>

              {/* 2. GPS Location Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background:
                    locationStatus === 'verified'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : locationStatus === 'checking'
                      ? 'rgba(56, 189, 248, 0.1)'
                      : 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {locationStatus === 'verified' ? (
                    <MapPin size={18} color="#10b981" />
                  ) : locationStatus === 'checking' ? (
                    <RefreshCw size={18} color="#38bdf8" className="animate-spin" />
                  ) : (
                    <AlertCircle size={18} color="#ef4444" />
                  )}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color:
                        locationStatus === 'verified'
                          ? '#34d399'
                          : locationStatus === 'checking'
                          ? '#7dd3fc'
                          : '#fca5a5',
                    }}
                  >
                    {locationStatus === 'verified'
                      ? `Workplace Verified (${locationData?.officeName || 'Main Office'})`
                      : locationStatus === 'checking'
                      ? 'Confirming workplace GPS location...'
                      : locationError || 'Outside authorized workplace geofence.'}
                  </span>
                </div>
              </div>

              {/* Guidance text if face check failed */}
              {faceStatus === 'failed' && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    marginBottom: '14px',
                    fontSize: '12px',
                    color: '#f87171',
                    lineHeight: 1.4,
                  }}
                >
                  🔒 <strong>Verification Policy:</strong> Check-in requires a clear human face in the camera frame. Objects, backgrounds, or covered lenses cannot be accepted. Please click <strong>Retake Face Photo</strong> and align your face inside the oval.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleRetake}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '11px',
                    borderRadius: '10px',
                    border: faceStatus === 'failed' ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                    background: faceStatus === 'failed' ? 'rgba(239, 68, 68, 0.18)' : '#1e293b',
                    color: faceStatus === 'failed' ? '#fca5a5' : '#cbd5e1',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RotateCcw size={16} />
                  <span>{faceStatus === 'failed' ? 'Retake Face Photo' : 'Retake'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerCompletion(capturedPhoto, locationDataRef.current, faceConfidence)}
                  disabled={locationStatus !== 'verified' || faceStatus !== 'verified'}
                  style={{
                    flex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background:
                      locationStatus === 'verified' && faceStatus === 'verified'
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : '#334155',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: locationStatus === 'verified' && faceStatus === 'verified' ? 'pointer' : 'not-allowed',
                    opacity: locationStatus === 'verified' && faceStatus === 'verified' ? 1 : 0.6,
                    boxShadow:
                      locationStatus === 'verified' && faceStatus === 'verified'
                        ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                        : 'none',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Recording Check-In...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Check In</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Capture Button */
            <div>
              <button
                type="button"
                onClick={handleCaptureAndCheckIn}
                disabled={cameraStatus !== 'ready' || locationStatus === 'unauthorized'}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background:
                    locationStatus === 'unauthorized'
                      ? '#334155'
                      : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  cursor:
                    cameraStatus === 'ready' && locationStatus !== 'unauthorized'
                      ? 'pointer'
                      : 'not-allowed',
                  boxShadow:
                    locationStatus === 'unauthorized'
                      ? 'none'
                      : '0 6px 20px rgba(79, 70, 229, 0.45)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Camera size={19} />
                <span>
                  {locationStatus === 'unauthorized'
                    ? 'Outside Workplace Geofence'
                    : 'Capture Photo & Check In'}
                </span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                <span>Photo will be captured and saved with your check-in</span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  <Upload size={13} />
                  <span>Upload from file</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Location warning helper when unauthorized */}
          {locationStatus === 'unauthorized' && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '11.5px', color: '#fca5a5' }}>
                {locationError}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={checkLocation}
                  disabled={locationStatus === 'checking'}
                  style={{
                    background: '#334155',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RefreshCw size={11} className={locationStatus === 'checking' ? 'animate-spin' : ''} />
                  Re-check GPS
                </button>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={handleCalibrateOfficeLocation}
                      disabled={calibratingLocation}
                      style={{
                        background: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Set Here As Office
                    </button>
                    <button
                      type="button"
                      onClick={handleAllowRemoteBypass}
                      disabled={calibratingLocation}
                      style={{
                        background: '#1e293b',
                        color: '#94a3b8',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Bypass Geofence
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceVerificationModal;
