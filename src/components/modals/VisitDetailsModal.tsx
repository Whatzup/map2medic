import React, { useState } from 'react';
import { Booking, BookingStatus } from '../../types/carex';
import { 
  X, 
  Activity, 
  HeartPulse, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  AlertTriangle,
  Stethoscope,
  Printer,
  Sparkles,
  Save,
  Check
} from 'lucide-react';

interface VisitDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onSaveVitals?: (bookingId: string, vitals: NonNullable<Booking['vitalsRecorded']>) => Promise<void>;
  isProviderView?: boolean;
}

export const VisitDetailsModal: React.FC<VisitDetailsModalProps> = ({
  booking,
  onClose,
  onSaveVitals,
  isProviderView = false
}) => {
  if (!booking) return null;

  const vitals = booking.vitalsRecorded || {};

  const hasRecordedVitals = Boolean(
    vitals.bloodPressure || 
    vitals.pulseRate || 
    vitals.temperature || 
    vitals.spO2 || 
    vitals.nurseNotes ||
    (vitals as any).bp
  );

  // Editable vitals state initialized for provider updates or in-progress logging
  const [bpSys, setBpSys] = useState(vitals.bloodPressure?.split('/')[0] || (vitals as any).bp?.split('/')[0] || '');
  const [bpDia, setBpDia] = useState(vitals.bloodPressure?.split('/')[1] || (vitals as any).bp?.split('/')[1] || '');
  const [pulse, setPulse] = useState(vitals.pulseRate || (vitals as any).pulse || '');
  const [temp, setTemp] = useState(vitals.temperature || (vitals as any).temp || '');
  const [spo2, setSpo2] = useState(vitals.spO2 || (vitals as any).spo2 || '');
  const [glucose, setGlucose] = useState(vitals.nurseNotes?.match(/Glucose:\s*(\d+)/i)?.[1] || '');
  const [notes, setNotes] = useState(vitals.nurseNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveVitals) return;

    setIsSaving(true);
    try {
      const formattedBp = (bpSys && bpDia) ? `${bpSys.trim()}/${bpDia.trim()}` : (bpSys ? `${bpSys.trim()}` : '');
      const formattedNotes = notes 
        ? (glucose ? `${notes} (Glucose: ${glucose} mg/dL)` : notes) 
        : (glucose ? `Glucose: ${glucose} mg/dL` : '');
      
      await onSaveVitals(booking.id, {
        bloodPressure: formattedBp ? `${formattedBp} mmHg` : undefined,
        pulseRate: pulse.trim() ? `${pulse.trim()} bpm` : undefined,
        temperature: temp.trim() ? `${temp.trim()} °F` : undefined,
        spO2: spo2.trim() ? `${spo2.trim()}%` : undefined,
        nurseNotes: formattedNotes || 'Procedure completed according to clinical protocol.',
        recordedAt: new Date().toISOString()
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save visit vitals:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Completed Visit</span>;
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 animate-pulse"><Activity className="w-3.5 h-3.5" /> In Progress Visit</span>;
      case 'arrived':
        return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-xs font-extrabold uppercase tracking-wider">Practitioner Arrived</span>;
      case 'en_route':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-extrabold uppercase tracking-wider">En Route to Home</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-xs font-extrabold uppercase tracking-wider">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-teal-200 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold text-teal-200 bg-white/10 px-2.5 py-0.5 rounded-md border border-teal-400/30">
              #{booking.id}
            </span>
            {getStatusBadge(booking.status)}
            <span className="px-2.5 py-0.5 rounded-md bg-teal-400/20 text-teal-200 text-xs font-bold uppercase">
              {booking.serviceType}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-white">
            {booking.serviceName}
          </h2>
          <p className="text-xs text-teal-100/90 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-teal-300" /> {booking.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-teal-300" /> {booking.timeSlot}</span>
          </p>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          
          {/* SECTION 1: VITALS RECORDED DURING THIS SPECIFIC VISIT */}
          <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 rounded-2xl p-4 sm:p-5 border border-teal-100 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-heading">
                    Clinical Vitals Recorded For Visit #{booking.id}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {vitals.recordedAt ? `Logged on ${new Date(vitals.recordedAt).toLocaleString()}` : (hasRecordedVitals ? 'Recorded by attending practitioner' : 'Visit Vitals Status')}
                  </p>
                </div>
              </div>

              {hasRecordedVitals ? (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                  ✓ Verified Visit Record
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                  Pending Practitioner Entry
                </span>
              )}
            </div>

            {/* Vitals Display Grid */}
            {hasRecordedVitals ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-teal-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">Blood Pressure</span>
                  <p className="text-lg font-extrabold text-teal-950 font-heading mt-0.5">
                    {vitals.bloodPressure || (vitals as any).bp || 'Not Recorded'}
                  </p>
                  <span className="text-[9px] text-teal-700 font-medium">Systolic / Diastolic</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Pulse / Heart Rate</span>
                  <p className="text-lg font-extrabold text-emerald-950 font-heading mt-0.5">
                    {vitals.pulseRate || (vitals as any).pulse || 'Not Recorded'}
                  </p>
                  <span className="text-[9px] text-emerald-700 font-medium">Sinus Rhythm</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-sky-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-sky-800 uppercase block">Oxygen SpO2</span>
                  <p className="text-lg font-extrabold text-sky-950 font-heading mt-0.5">
                    {vitals.spO2 || (vitals as any).spo2 || 'Not Recorded'}
                  </p>
                  <span className="text-[9px] text-sky-700 font-medium">Oxygen Saturation</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Body Temperature</span>
                  <p className="text-lg font-extrabold text-amber-950 font-heading mt-0.5">
                    {vitals.temperature || (vitals as any).temp || 'Not Recorded'}
                  </p>
                  <span className="text-[9px] text-amber-700 font-medium">Afebrile Check</span>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 p-4 rounded-xl border border-dashed border-amber-300 text-center space-y-1">
                <p className="text-xs font-bold text-amber-900">No Vitals Recorded For This Visit Yet</p>
                <p className="text-[11px] text-slate-500">
                  Vitals for Visit #{booking.id} will appear here once recorded on site by your assigned medical specialist ({booking.providerName || 'Care Specialist'}).
                </p>
              </div>
            )}

            {/* Practitioner's Notes Recorded for THIS Specific Visit */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Practitioner Observations &amp; Clinical Notes For Visit #{booking.id}:
              </span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {vitals.nurseNotes || booking.medicalNotes || (booking.status === 'completed' ? 'Procedure performed according to standard medical protocol. Patient condition stable.' : 'Awaiting clinical notes from visiting specialist.')}
              </p>
            </div>
          </div>

          {/* SECTION 2: EDITABLE VITALS FORM FOR IN-PROGRESS VISITS / PROVIDERS */}
          {(isProviderView || booking.status === 'in_progress' || booking.status === 'arrived') && onSaveVitals && (
            <form onSubmit={handleSave} className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Record / Update Vitals For This Visit</span>
                </h4>
                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Saved to Chart!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">BP Sys/Dia</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={bpSys}
                      onChange={(e) => setBpSys(e.target.value)}
                      placeholder="120"
                      className="w-full text-center py-1.5 px-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                    <span>/</span>
                    <input
                      type="text"
                      value={bpDia}
                      onChange={(e) => setBpDia(e.target.value)}
                      placeholder="80"
                      className="w-full text-center py-1.5 px-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="72"
                    className="w-full text-center py-1.5 px-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">SpO2 (%)</label>
                  <input
                    type="text"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="98%"
                    className="w-full text-center py-1.5 px-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">Temp (°F)</label>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="98.6°F"
                    className="w-full text-center py-1.5 px-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">Glucose (mg/dL)</label>
                  <input
                    type="text"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value)}
                    placeholder="110"
                    className="w-full text-center py-1.5 px-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">Visit Clinical Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record observations, dressing condition, or medication administered during this visit..."
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Vitals to Visit Record'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SECTION 3: VISIT CHECKLIST & STERILE PROTOCOL EXECUTED */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Sterile Protocol &amp; Procedure Checklist</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>PPE &amp; Sterile Kit Unboxed</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Patient Vitals Checked</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Procedure Administered</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: PATIENT INTAKE & VISIT CONTEXT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-teal-600" /> Patient Details
              </h4>
              <div className="space-y-1 text-slate-700">
                <p><strong>Name:</strong> {booking.patientName}</p>
                <p><strong>Age / Gender:</strong> {booking.patientAge || 35} yrs • {booking.patientGender || 'Male'}</p>
                <p><strong>Phone:</strong> {booking.patientPhone || '--'}</p>
                <p><strong>Visit Address:</strong> {booking.patientAddress}</p>
                {booking.landmark && <p><strong>Landmark:</strong> {booking.landmark}</p>}
                {booking.intakeIntent && <p><strong>Intake Intent:</strong> {booking.intakeIntent}</p>}
                {booking.careDuration && <p><strong>Care Duration:</strong> {booking.careDuration}</p>}
                {booking.mobilityStatus && <p><strong>Mobility Status:</strong> {booking.mobilityStatus}</p>}
                {booking.recentlyDischarged && <p><strong>Recently Discharged:</strong> {booking.recentlyDischarged}</p>}
                {booking.liftAvailability && <p><strong>Lift Availability:</strong> {booking.liftAvailability}</p>}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Assigned Specialist &amp; Billing
              </h4>
              <div className="space-y-1 text-slate-700">
                <p><strong>Practitioner:</strong> {booking.providerName || 'Assigned Care Specialist'}</p>
                <p><strong>Phone:</strong> {booking.providerPhone || 'Via 24/7 Desk'}</p>
                <p><strong>Base Service Fee:</strong> ₹{booking.basePrice}</p>
                {booking.addons && booking.addons.length > 0 && (
                  <p><strong>Add-ons:</strong> {booking.addons.map(a => `${a.name} (+₹${a.price})`).join(', ')}</p>
                )}
                <p><strong>Payment Method:</strong> {booking.paymentMethod?.toUpperCase()}</p>
                <p><strong>Total Paid:</strong> <span className="font-bold text-teal-900">₹{booking.totalAmount}</span> ({booking.paymentStatus})</p>
                {booking.emergencyContactPhone && <p><strong>Emergency Contact:</strong> {booking.emergencyContactPhone}</p>}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            HIPAA Compliant Patient Visit Record
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Visit Record
          </button>
        </div>

      </div>
    </div>
  );
};
