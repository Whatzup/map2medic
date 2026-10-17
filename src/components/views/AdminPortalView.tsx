import React, { useState } from 'react';
import { useCareX } from '../../context/CareXContext';
import { ServiceItem, HealthcareProvider, Booking } from '../../types/carex';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Plus, 
  DollarSign, 
  Users, 
  Activity, 
  Calendar, 
  Filter, 
  Search,
  AlertTriangle,
  Save,
  X,
  RefreshCw,
  Trash2,
  Database
} from 'lucide-react';

export const AdminPortalView: React.FC = () => {
  const { 
    providers, 
    services, 
    bookings, 
    verifyProviderDocument, 
    updateServicePricing, 
    addNewService, 
    deleteService,
    resetDatabase,
    refreshData,
    isLoadingDb,
    dbStats,
    updateBookingStatus,
    showToast 
  } = useCareX();

  const [activeTab, setActiveTab] = useState<'verification' | 'catalog' | 'bookings'>('verification');

  // Document verification rejection modal
  const [rejectingDoc, setRejectingDoc] = useState<{ providerId: string; docId: string; docName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Image blur / Unreadable board registration stamp');

  // Service pricing edit state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editBaseLabel, setEditBaseLabel] = useState<string>('');

  // Add new service modal
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceItem['category']>('nursing');
  const [newServicePrice, setNewServicePrice] = useState(65);
  const [newServiceDuration, setNewServiceDuration] = useState('45 mins');
  const [newServiceType, setNewServiceType] = useState<ServiceItem['serviceType']>('Home Visit');
  const [newServiceBaseLabel, setNewServiceBaseLabel] = useState('per visit');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  // Calculate platform aggregate stats
  const totalVolume = bookings.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingDocsCount = providers.reduce((acc, prov) => {
    return acc + prov.documents.filter(d => d.status === 'pending_review').length;
  }, 0);

  const handleStartEditPricing = (srv: ServiceItem) => {
    setEditingServiceId(srv.id);
    setEditPrice(srv.price);
    setEditBaseLabel(srv.baseAmountLabel);
  };

  const handleSavePricing = (srvId: string) => {
    updateServicePricing(srvId, editPrice, editBaseLabel);
    setEditingServiceId(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingDoc) return;
    verifyProviderDocument(rejectingDoc.providerId, rejectingDoc.docId, 'rejected', rejectReason);
    setRejectingDoc(null);
  };

  const handleCreateNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    addNewService({
      name: newServiceName,
      category: newServiceCategory,
      price: newServicePrice,
      duration: newServiceDuration,
      serviceType: newServiceType,
      baseAmountLabel: newServiceBaseLabel,
      description: newServiceDescription || 'Standard clinical procedure by licensed medical staff.',
      includes: ['Certified medical supplies', 'Vitals check', 'Digital summary'],
      popular: false,
      requiresPrescription: false
    });

    setIsAddServiceOpen(false);
    setNewServiceName('');
    setNewServiceDescription('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Admin Overview Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                Map2Medic Governance & Operations
              </span>
            </div>
            <h1 className="text-3xl font-bold font-heading text-slate-900">
              Admin Review & Platform Control
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Verify practitioner licenses, oversee live medical dispatches, and manage service pricing catalog.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              Neon PostgreSQL Live
            </span>
            <button
              onClick={() => refreshData()}
              disabled={isLoadingDb}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all disabled:opacity-50"
              title="Re-query Neon PostgreSQL database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingDb ? 'animate-spin' : ''}`} />
              <span>{isLoadingDb ? 'Syncing...' : 'Sync DB'}</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to CLEAR the database and reset all platform data from scratch? This will truncate all tables and cannot be undone.")) {
                  resetDatabase();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold border border-rose-200 shadow-2xs transition-all cursor-pointer"
              title="Clear/Truncate all database tables to start completely from scratch"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Clear DB & Fresh Start</span>
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
              🛡️ SuperAdmin Access
            </span>
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Credential Reviews</span>
              <ShieldCheck className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold font-heading text-slate-900">{pendingDocsCount}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">Requires immediate board audit</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Providers</span>
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-3xl font-extrabold font-heading text-slate-900">{providers.length}</p>
            <p className="text-[10px] text-teal-600 font-semibold mt-1">100% background checked</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Bookings</span>
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-extrabold font-heading text-slate-900">{bookings.length}</p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-1">Across 5 medical specialties</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Gross Platform GMV</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold font-heading text-slate-900">₹{totalVolume}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">98.5% payment collection rate</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'verification'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Provider Credential Review Queue</span>
            {pendingDocsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">
                {pendingDocsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Service Pricing Catalog ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Dispatch & Bookings Monitor</span>
          </button>
        </div>

        {/* TAB 1: Document Verification Queue */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">
                  Medical Licensure & Credential Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify state nursing and physician licenses, BLS certifications, and photo IDs before permitting active patient dispatches.
                </p>
              </div>

              <div className="space-y-6">
                {providers.map(prov => {
                  return (
                    <div key={prov.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-3">
                          <img src={prov.avatar} alt={prov.name} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{prov.name}</h4>
                            <p className="text-xs text-teal-700">{prov.title} • {prov.email}</p>
                          </div>
                        </div>

                        <span className="text-xs text-slate-500">
                          {prov.documents.length} Submitted Documents
                        </span>
                      </div>

                      {/* Documents list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {prov.documents.map(doc => {
                          const isPending = doc.status === 'pending_review';
                          return (
                            <div
                              key={doc.id}
                              className={`p-3.5 rounded-xl border bg-white flex flex-col justify-between space-y-3 ${
                                isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-800">{doc.docType}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono mt-1">{doc.fileName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Uploaded: {doc.uploadedAt}</p>
                                </div>

                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  doc.status === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : doc.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-900 animate-pulse'
                                }`}>
                                  {doc.status.replace('_', ' ')}
                                </span>
                              </div>

                              {doc.rejectionReason && (
                                <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg">
                                  Rejection Note: {doc.rejectionReason}
                                </p>
                              )}

                              {/* Review Action Buttons */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => verifyProviderDocument(prov.id, doc.id, 'verified')}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                                    doc.status === 'verified'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{doc.status === 'verified' ? 'Approved' : 'Approve'}</span>
                                </button>

                                <button
                                  onClick={() => setRejectingDoc({ providerId: prov.id, docId: doc.id, docName: doc.docType })}
                                  className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Service Pricing Catalog Editor */}
        {activeTab === 'catalog' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900">
                  Service Pricing Catalog Management
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update base prices, duration labels, and introduce new medical care packages. Changes sync immediately.
                </p>
              </div>

              <button
                onClick={() => setIsAddServiceOpen(true)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Procedure
              </button>
            </div>

            {/* Table of services */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">Service Name</th>
                    <th className="pb-3 font-bold">Category</th>
                    <th className="pb-3 font-bold">Delivery Mode</th>
                    <th className="pb-3 font-bold">Base Price</th>
                    <th className="pb-3 font-bold">Billing Unit</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.map(srv => {
                    const isEditing = editingServiceId === srv.id;

                    return (
                      <tr key={srv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900 max-w-xs">
                          {srv.name}
                          <span className="block text-[11px] text-slate-500 font-normal truncate">{srv.description}</span>
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase">
                            {srv.category}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-600">{srv.serviceType}</td>
                        <td className="py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-500">₹</span>
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="w-20 p-1 border border-teal-500 rounded text-xs font-bold"
                              />
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 font-heading text-sm">₹{srv.price}</span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editBaseLabel}
                              onChange={(e) => setEditBaseLabel(e.target.value)}
                              className="w-32 p-1 border border-teal-500 rounded text-xs"
                            />
                          ) : (
                            srv.baseAmountLabel
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleSavePricing(srv.id)}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingServiceId(null)}
                                className="px-2 py-1 text-slate-500 hover:text-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEditPricing(srv)}
                                className="px-2.5 py-1 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded font-semibold transition-colors"
                              >
                                Edit Rate
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${srv.name}" from PostgreSQL database?`)) {
                                    deleteService(srv.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Delete service from database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Dispatch & Bookings Control */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-900">
                Live Dispatches & Patient Bookings Monitor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time status of all appointments, assigned medical specialists, and billing settlement.
              </p>
            </div>

            <div className="space-y-3">
              {bookings.map(b => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {b.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                        {b.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">• {b.date} at {b.timeSlot}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{b.serviceName}</h4>
                    <p className="text-xs text-slate-600">
                      Patient: <strong>{b.patientName}</strong> • Specialist: <strong>{b.providerName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 font-heading">₹{b.totalAmount}</span>
                      <span className="text-[10px] block text-emerald-600 font-semibold uppercase">{b.paymentStatus}</span>
                    </div>

                    <select
                      value={b.status}
                      onChange={(e) => updateBookingStatus(b.id, e.target.value as any)}
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="assigned">Assigned</option>
                      <option value="en_route">En Route</option>
                      <option value="arrived">Arrived</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Reject Reason Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Reject Credential: {rejectingDoc.docName}
            </h3>
            <p className="text-xs text-slate-600">
              Provide an explanation for the practitioner so they can upload a valid replacement document.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingDoc(null)}
                className="w-1/2 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="w-1/2 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Procedure Modal */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold font-heading text-slate-900">Add Procedure to Map2Medic Catalog</h3>
              <button onClick={() => setIsAddServiceOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewService} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Service / Procedure Name</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="e.g. Pediatric Asthma Nebulization"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="basic_nursing">Basic Nursing Care</option>
                    <option value="clinical_procedures">Clinical Procedures</option>
                    <option value="post_hospital_recovery">Post-OP Recovery</option>
                    <option value="elderly_care">Elderly Care</option>
                    <option value="rehab_support">Rehab Support</option>
                    <option value="diagnostic_assistance">Diagnostics & Labs</option>
                    <option value="emergency_support">Emergency Support</option>
                    <option value="add_on_services">Add-on Services</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    placeholder="e.g. 45 mins"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing Unit Label</label>
                  <input
                    type="text"
                    value={newServiceBaseLabel}
                    onChange={(e) => setNewServiceBaseLabel(e.target.value)}
                    placeholder="e.g. per visit"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Description</label>
                <textarea
                  rows={2}
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="Describe scope of care, sterile items included..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="w-1/2 py-2 border border-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-purple-700 text-white rounded-xl font-bold hover:bg-purple-800"
                >
                  Publish Procedure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
