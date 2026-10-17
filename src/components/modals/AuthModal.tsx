import React, { useState, useEffect } from 'react';
import { useCareX } from '../../context/CareXContext';
import { UserRole } from '../../types/carex';
import { Map2MedicLogo } from '../Map2MedicLogo';
import { 
  X, 
  ShieldCheck, 
  Phone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  UserPlus, 
  LogIn, 
  User, 
  Stethoscope, 
  FileText, 
  MapPin, 
  Briefcase, 
  Award,
  DollarSign,
  Camera,
  Upload
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../../lib/firebase.ts';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authModalRole, 
    authModalInitialMode,
    setActiveRole, 
    loginWithOtp,
    refreshData,
    setActiveProviderId,
    updatePatientProfile,
    setIsLoggedIn,
    showToast 
  } = useCareX();

  // Mode: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(authModalInitialMode || 'login');

  // Role: patient | provider | admin
  const [selectedRole, setSelectedRole] = useState<UserRole>(authModalRole || 'patient');

  // Login states
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [loginStep, setLoginStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('8421');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  // Signup form states
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupAvatar, setSignupAvatar] = useState<string>('');
  // Provider specific fields
  const [providerTitle, setProviderTitle] = useState('Registered Nurse (RN), Home Care');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('3');
  const [hourlyRate, setHourlyRate] = useState('65');
  // Admin specific field
  const [adminOrgCode, setAdminOrgCode] = useState('MAP2MEDIC-BOARD-2026');
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Please select an image smaller than 5MB.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSignupAvatar(reader.result);
        showToast('Photo Attached', 'Profile picture ready for account creation.', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isAuthModalOpen) {
      setLoginError(null);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (authModalRole) {
      setSelectedRole(authModalRole);
    }
    if (authModalInitialMode) {
      setAuthMode(authModalInitialMode);
    }
  }, [authModalRole, authModalInitialMode, isAuthModalOpen]);

  // Auto-copy mobile/email from login identifier to signup fields when switching to signup mode
  useEffect(() => {
    if (authMode === 'signup' && identifier.trim()) {
      const trimmed = identifier.trim();
      if (trimmed.includes('@')) {
        setSignupEmail(trimmed);
      } else {
        setSignupPhone(trimmed);
      }
    }
  }, [authMode, identifier]);

  const switchToSignup = () => {
    const trimmed = identifier.trim();
    if (trimmed) {
      if (trimmed.includes('@')) {
        setSignupEmail(trimmed);
      } else {
        setSignupPhone(trimmed);
      }
    }
    setAuthMode('signup');
  };

  if (!isAuthModalOpen) return null;

  // Handle Google Sign-in (Available in Login mode)
  const handleGoogleSignIn = async () => {
    try {
      setIsSigningInGoogle(true);
      const cred = await signInWithPopup(auth, googleAuthProvider);
      // Sync with PostgreSQL backend
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: cred.user.uid,
          email: cred.user.email,
          name: cred.user.displayName,
          role: selectedRole
        })
      }).catch(err => console.warn('User sync notice:', err));

      setActiveRole(selectedRole);
      await refreshData();
      setIsAuthModalOpen(false);
      showToast('Signed In with Google', `Welcome, ${cred.user.displayName || cred.user.email}!`, 'success');
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      showToast('Google Sign-In', error.message || 'Could not complete Google Sign-In.', 'error');
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Login: Send OTP
  const handleSendLoginCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, role: selectedRole })
      });

      if (!res.ok) {
        const errorMsg = 'User is not registered. We pre-filled your mobile/email on the sign up form below.';
        setLoginError(errorMsg);
        showToast('Account Not Found', errorMsg, 'info');

        const trimmed = identifier.trim();
        if (trimmed.includes('@')) {
          setSignupEmail(trimmed);
        } else {
          setSignupPhone(trimmed);
        }

        setAuthMode('signup');
        return;
      }

      const data = await res.json();
      const testOtp = data.otp || '8421';
      setGeneratedOtp(testOtp);
      setOtpCode('');
      setLoginStep('otp');
      showToast('Verification Code Sent', `Your secure OTP is: ${testOtp}`, 'success');
    } catch (err) {
      console.warn('Backend send OTP warning:', err);
      const testOtp = '8421';
      setGeneratedOtp(testOtp);
      setOtpCode('');
      setLoginStep('otp');
      showToast('Verification Code Sent', `Your demo OTP is: ${testOtp}`, 'info');
    }
  };

  // Login: Verify OTP and navigate to profile
  const handleVerifyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp && otpCode !== '1234' && otpCode !== '8421') {
      showToast('Invalid Code', 'Please enter the demo OTP shown on screen or use 8421', 'error');
      return;
    }

    await loginWithOtp(identifier, selectedRole, otpCode);
    setLoginStep('input');
    setOtpCode('');
  };

  // Quick 1-Click Demo Profile Switch (navigates directly to profile)
  const handleQuickDemo = (role: UserRole) => {
    setSelectedRole(role);
    setActiveRole(role, true);
    setIsAuthModalOpen(false);
    setLoginStep('input');
    showToast('Demo Access Granted', `Switched to ${role.toUpperCase()} profile`, 'success');
  };

  // Signup: Submit Registration to PostgreSQL Database and go to profile
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !signupEmail.trim()) {
      showToast('Missing Fields', 'Please provide your full name and email address.', 'warning');
      return;
    }

    setIsSubmittingSignup(true);
    try {
      const payload = {
        name: fullName,
        email: signupEmail,
        phone: signupPhone || '',
        role: selectedRole,
        address: signupAddress || '',
        title: selectedRole === 'provider' ? providerTitle : undefined,
        licenseNumber: selectedRole === 'provider' ? licenseNumber : undefined,
        experienceYears: parseInt(experienceYears, 10) || 3,
        hourlyRate: parseInt(hourlyRate, 10) || 60,
        avatar: signupAvatar || '',
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete registration');
      }

      const responseData = await res.json();
      const u = responseData.user;
      const prov = responseData.provider;

      await refreshData();

      if (u) {
        if (selectedRole === 'patient') {
          const mergedPatient = {
            id: u.uid || `user-patient-${Date.now()}`,
            name: u.name || fullName,
            email: u.email || signupEmail,
            phone: u.phone || signupPhone || '',
            address: u.address || signupAddress || '',
            avatar: signupAvatar || '',
            dateOfBirth: '',
            bloodGroup: '',
            allergies: '',
            medicalHistory: '',
            emergencyContact: {
              name: '',
              relationship: '',
              phone: u.phone || signupPhone || ''
            },
            prescriptions: []
          };
          await updatePatientProfile(mergedPatient);
        } else if (selectedRole === 'provider' && prov) {
          setActiveProviderId(prov.id);
        }
        setIsLoggedIn(true);
      }

      setActiveRole(selectedRole, true);
      setIsAuthModalOpen(false);

      // Reset form
      setFullName('');
      setSignupEmail('');
      setSignupPhone('');
      setSignupAddress('');
      setLicenseNumber('');
      setSignupAvatar('');

      showToast(
        'Account Registered!',
        `Welcome to Map2Medic, ${fullName}! Opened your new ${selectedRole.toUpperCase()} profile.`,
        'success'
      );
    } catch (err: any) {
      console.error('Registration error:', err);
      setLoginError(err.message || 'Could not save account to database.');
      showToast('Registration Restriction', err.message || 'Could not save account to database.', 'error');
    } finally {
      setIsSubmittingSignup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden my-8">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 p-6 text-white relative">
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 p-2 text-teal-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <Map2MedicLogo variant="light" size="sm" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-200 bg-white/10 px-2 py-0.5 rounded">
              Secure Access
            </span>
          </div>

          <h2 className="text-2xl font-extrabold font-heading">
            {authMode === 'login' ? 'Log In to Map2Medic' : 'Create Free Account'}
          </h2>
          <p className="text-teal-100 text-xs mt-1">
            {authMode === 'login' 
              ? 'Access your home visit appointments, clinical dispatches, or medical governance.' 
              : 'Join as a patient, certified healthcare specialist, or medical board administrator.'}
          </p>

          {/* MODE TOGGLE TABS: LOGIN vs SIGN UP */}
          <div className="flex items-center gap-2 mt-4 p-1 bg-black/20 rounded-xl max-w-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginStep('input');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'login' 
                  ? 'bg-white text-teal-900 shadow-sm' 
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              type="button"
              onClick={switchToSignup}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'signup' 
                  ? 'bg-white text-teal-900 shadow-sm' 
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* THREE ROLE SELECTION CARDS */}
          <div className="mb-5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              1. Choose Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  selectedRole === 'patient' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-500' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <User className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <p className="text-xs font-bold">Patient</p>
                <p className="text-[10px] text-slate-400">Home Care</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('provider')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  selectedRole === 'provider' 
                    ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-xs ring-1 ring-teal-500' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Stethoscope className="w-4 h-4 mx-auto mb-1 text-teal-600" />
                <p className="text-xs font-bold">Care Provider</p>
                <p className="text-[10px] text-slate-400">Clinicians</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  selectedRole === 'admin' 
                    ? 'border-purple-500 bg-purple-50 text-purple-900 shadow-xs ring-1 ring-purple-500' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                <p className="text-xs font-bold">Admin</p>
                <p className="text-[10px] text-slate-400">Review Board</p>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TAB CONTENT: LOG IN FLOW                                  */}
          {/* ======================================================== */}
          {authMode === 'login' && (
            <div>
              {loginStep === 'input' ? (
                <form onSubmit={handleSendLoginCode} className="space-y-4">
                  {loginError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                      <span>{loginError}</span>
                      <button 
                        type="button" 
                        onClick={() => setLoginError(null)}
                        className="text-rose-400 hover:text-rose-600 font-bold ml-2 text-sm cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        {loginMethod === 'phone' ? 'Registered Mobile Number' : 'Registered Email Address'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone')}
                        className="text-xs text-teal-700 hover:underline font-semibold"
                      >
                        Use {loginMethod === 'phone' ? 'Email' : 'Phone'} instead
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        {loginMethod === 'phone' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      </div>
                      <input
                        type={loginMethod === 'phone' ? 'tel' : 'email'}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={loginMethod === 'phone' ? '+1 (555) 123-4567' : 'name@domain.com'}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-700/20 active:scale-98"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="bg-white px-2 text-slate-400 font-bold uppercase">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningInGoogle}
                    className="w-full py-2.5 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    {isSigningInGoogle ? 'Connecting Google Account...' : 'Sign in with Google'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyLogin} className="space-y-4">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                    <span>Demo Security Code: <strong className="font-mono text-sm tracking-wider text-teal-800">{generatedOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(generatedOtp)}
                      className="px-2 py-1 bg-teal-700 text-white rounded text-[11px] font-bold hover:bg-teal-800"
                    >
                      Auto-fill
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Enter 4-Digit Security Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="••••"
                      autoFocus
                      required
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 font-bold"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginStep('input')}
                      className="w-1/3 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 active:scale-98 transition-all"
                    >
                      Verify OTP &amp; Enter Profile
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom toggle to Switch to Sign Up */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Don&apos;t have a Map2Medic account yet?{' '}
                  <button
                    type="button"
                    onClick={switchToSignup}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    Sign up now →
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB CONTENT: SIGN UP / REGISTRATION FLOW                   */}
          {/* ======================================================== */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              {loginError && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center justify-between animate-pulse">
                  <span>{loginError}</span>
                  <button 
                    type="button" 
                    onClick={() => setLoginError(null)}
                    className="text-amber-500 hover:text-amber-700 font-bold ml-2 text-sm cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-700 shrink-0" />
                <span>
                  Registering as: <strong className="text-teal-900 uppercase">{selectedRole}</strong>. 
                  Saved directly to PostgreSQL database.
                </span>
              </div>

              {/* Profile Picture Upload Section */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-700" />
                    <span>Upload Profile Picture</span>
                  </label>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                    No default photo set
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Please upload your picture. Default picture is removed; your uploaded photo will be set for your new profile.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative shrink-0">
                    {signupAvatar ? (
                      <img
                        src={signupAvatar}
                        alt="Uploaded Profile Picture"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-600 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-dashed border-teal-400 text-teal-600 flex flex-col items-center justify-center">
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">No Photo</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm active:scale-98 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{signupAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                      </label>
                      {signupAvatar && (
                        <button
                          type="button"
                          onClick={() => setSignupAvatar('')}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Select JPG or PNG (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Common Field: Full Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedRole === 'provider' ? 'e.g. Nurse Sarah Jenkins, RN' : 'e.g. Michael Henderson'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Common Field: Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    {signupEmail && identifier && signupEmail === identifier.trim() && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Copied from login
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Phone Number
                    </label>
                    {signupPhone && identifier && signupPhone === identifier.trim() && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Copied from login
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Common Field: Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  {selectedRole === 'patient' ? 'Home Visit Address / City' : 'Operating Territory / City'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                    placeholder="742 Evergreen Terrace, Springfield, IL"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* ROLE SPECIFIC: CARE PROVIDER FIELDS */}
              {selectedRole === 'provider' && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                    Provider Professional Credentials
                  </span>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Clinical Specialty / Title
                    </label>
                    <select
                      value={providerTitle}
                      onChange={(e) => setProviderTitle(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Registered Nurse (RN), Critical & Wound Care">Registered Nurse (RN), Critical & Wound Care</option>
                      <option value="Family Physician (MD), Home Consultations">Family Physician (MD), Home Consultations</option>
                      <option value="Licensed Physiotherapist (DPT), Orthopedics">Licensed Physiotherapist (DPT), Orthopedics</option>
                      <option value="Certified Phlebotomist & Diagnostic Tech">Certified Phlebotomist & Diagnostic Tech</option>
                      <option value="Mother & Newborn Clinical Care Specialist">Mother & Newborn Clinical Care Specialist</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">License Number</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="RN-948210"
                        className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Years Experience</label>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 mb-1 block">Hourly Rate ($)</label>
                      <input
                        type="number"
                        min="25"
                        max="300"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ROLE SPECIFIC: ADMIN FIELDS */}
              {selectedRole === 'admin' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Medical Board Governance Authorization
                  </span>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Health Authority Verification Passcode
                    </label>
                    <input
                      type="text"
                      value={adminOrgCode}
                      onChange={(e) => setAdminOrgCode(e.target.value)}
                      placeholder="MAP2MEDIC-BOARD-2026"
                      className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={isSubmittingSignup}
                className="w-full py-3 bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 active:scale-98 transition-all disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isSubmittingSignup 
                    ? 'Saving to Database...' 
                    : selectedRole === 'patient' 
                      ? 'Create Free Patient Account' 
                      : selectedRole === 'provider' 
                        ? 'Submit Provider Application' 
                        : 'Register Administrator Account'}
                </span>
              </button>

              {/* Bottom toggle to Switch back to Log In */}
              <div className="pt-2 text-center">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginStep('input');
                    }}
                    className="text-teal-700 font-bold hover:underline"
                  >
                    Log in here →
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
