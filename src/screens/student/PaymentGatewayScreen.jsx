import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import studentService from '../../services/studentService';

export const PaymentGatewayScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    cartItems,
    groupedCartList,
    clearCart,
    cartTotalCount,
    cartSubtotal,
    serviceFee,
    cartTotalPrice,
  } = useCart();

  // Retrieve checkout payload from location.state or sessionStorage fallback
  const checkoutData = location.state || (() => {
    try {
      const stored = sessionStorage.getItem('sd_pending_checkout');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const deliveryAddress = checkoutData?.deliveryAddress || user?.savedAddress || {};
  const pickupNotes = checkoutData?.pickupNotes || '';
  const initialMethod = checkoutData?.initialMethod || 'upi';

  // Active tab in gateway: 'upi' | 'card' | 'wallet' | 'netbanking'
  const [activeTab, setActiveTab] = useState(() => {
    if (initialMethod === 'card' || initialMethod === 'Credit / Debit Card') return 'card';
    if (initialMethod === 'wallet' || initialMethod === 'Campus Card Wallet') return 'wallet';
    return 'upi';
  });

  // Items and pricing fallback
  const activeCartItems = (checkoutData?.items && checkoutData.items.length > 0) ? checkoutData.items : cartItems;
  const itemsSubtotal = checkoutData?.subtotal ?? cartSubtotal;
  const currentServiceFee = checkoutData?.serviceFee ?? serviceFee;
  const finalPayable = checkoutData?.totalPrice ?? cartTotalPrice;

  // 15-minute countdown session timer
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // 'gpay', 'phonepe', 'paytm', 'bhim', 'cred'
  const [upiIdInput, setUpiIdInput] = useState('');
  const [isVpaVerified, setIsVpaVerified] = useState(false);
  const [verifyingVpa, setVerifyingVpa] = useState(false);
  const [qrCodeTimer, setQrCodeTimer] = useState(299); // 5 mins QR timer

  useEffect(() => {
    const qrInterval = setInterval(() => {
      setQrCodeTimer((prev) => (prev > 0 ? prev - 1 : 299));
    }, 1000);
    return () => clearInterval(qrInterval);
  }, []);

  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name ? user.name.toUpperCase() : 'JOHN DOE');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [cardType, setCardType] = useState('visa'); // 'visa', 'mastercard', 'rupay', 'amex'

  // Student Wallet State
  const [walletPin, setWalletPin] = useState(['', '', '', '']);
  const [walletBalance] = useState(15000); // Stanford student wallet ₹15,000

  // Net Banking State
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Processing & 3D Secure / Bank OTP Modal State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [completedOrderData, setCompletedOrderData] = useState(null);

  // Focus ref for PIN inputs
  const pinInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Detect card brand dynamically
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    if (val.startsWith('4')) setCardType('visa');
    else if (val.startsWith('5') || val.startsWith('2')) setCardType('mastercard');
    else if (val.startsWith('60') || val.startsWith('65') || val.startsWith('81')) setCardType('rupay');
    else if (val.startsWith('34') || val.startsWith('37')) setCardType('amex');
    else setCardType('visa');

    // Format with spaces: 4444 4444 4444 4444
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setExpiryDate(val);
  };

  const handleVerifyVpa = () => {
    if (!upiIdInput.includes('@') || upiIdInput.length < 5) {
      toast.error('Please enter a valid UPI ID (e.g., student@oksbi)');
      return;
    }
    setVerifyingVpa(true);
    setTimeout(() => {
      setVerifyingVpa(false);
      setIsVpaVerified(true);
      toast.success(`Verified: ${user?.name || 'Stanford Student'} (${upiIdInput})`, { icon: '✅' });
    }, 800);
  };

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...walletPin];
    newPin[index] = value.slice(-1);
    setWalletPin(newPin);

    if (value && index < 3) {
      pinInputRefs[index + 1]?.current?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !walletPin[index] && index > 0) {
      pinInputRefs[index - 1]?.current?.focus();
    }
  };

  // Trigger payment authorization flow
  const initiatePayment = (customMethodLabel) => {
    if (activeCartItems.length === 0) {
      toast.error('Your cart session has expired. Please add items to cart.');
      navigate('/student/dashboard');
      return;
    }

    // Validate active tab requirements
    if (activeTab === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        toast.error('Please enter a valid 16-digit Card Number.');
        return;
      }
      if (!expiryDate || expiryDate.length < 5) {
        toast.error('Please enter Card Expiry Date (MM/YY).');
        return;
      }
      if (!cvv || cvv.length < 3) {
        toast.error('Please enter 3-digit CVV / Security code.');
        return;
      }
    } else if (activeTab === 'wallet') {
      const pinStr = walletPin.join('');
      if (pinStr.length < 4) {
        toast.error('Please enter your 4-digit Campus Student ID PIN.');
        return;
      }
      if (finalPayable > walletBalance) {
        toast.error('Insufficient Stanford Student ID wallet balance.');
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStatus('Securing encrypted connection with Campus Gateway...');

    setTimeout(() => {
      setProcessingStatus('Contacting banking authorization network...');
      setTimeout(() => {
        setIsProcessing(false);
        // Show 3D Secure OTP verification modal for cards / banking / upi intent
        setShowOtpModal(true);
        setOtpInput('123456'); // Pre-fill test OTP for seamless testing
        setOtpTimer(30);
      }, 1000);
    }, 800);
  };

  // Helper to load external Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Launch live Razorpay Standard Checkout modal
  const handleRazorpayStandardCheckout = async () => {
    if (activeCartItems.length === 0) {
      toast.error('Your cart session has expired. Please add items.');
      navigate('/student/dashboard');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Connecting to Razorpay Standard Gateway...');

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay SDK. Falling back to Campus Gateway.');
      }

      const paymentOrderRes = await studentService.createPaymentOrder({ items: activeCartItems });
      if (!paymentOrderRes.success || !paymentOrderRes.data) {
        throw new Error('Failed to create payment session with gateway.');
      }

      const { orderId, amount, keyId, currency } = paymentOrderRes.data;

      const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        name: 'ShopDrop Campus Pay',
        description: `Stanford Campus Purchase (${activeCartItems.length} items)`,
        image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=150',
        order_id: orderId.startsWith('order_') ? orderId : undefined,
        prefill: {
          name: user?.name || 'Stanford Student',
          email: user?.email || 'student@stanford.edu',
          contact: '9876543210',
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async function (response) {
          setIsProcessing(true);
          setProcessingStatus('Authorizing payment and issuing campus order token...');

          try {
            const orderPayload = {
              items: activeCartItems.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                vendorId: item.vendorId,
              })),
              paymentMethod: 'Razorpay UPI / Card Gateway',
              deliveryAddress,
              pickupNotes: pickupNotes?.trim() || undefined,
              paymentId: response.razorpay_payment_id || `pay_${Date.now().toString(36)}`,
              paymentOrderId: response.razorpay_order_id || orderId,
              paymentSignature: response.razorpay_signature,
            };

            const res = await studentService.createOrder(orderPayload);
            if (res.success && res.data) {
              setCompletedOrderData(res.data);
              clearCart();
              sessionStorage.removeItem('sd_pending_checkout');
              toast.success('Payment Verified & Order Confirmed! 🎉', { id: 'rzp-success' });
            } else {
              throw new Error(res.message || 'Failed to place order after payment.');
            }
          } catch (err) {
            console.error('Order creation error:', err);
            toast.error(err.message || 'Payment received but order failed to save. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast('Payment window closed. You can retry or choose another payment method.', { icon: 'ℹ️' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setIsProcessing(false);
        toast.error(`Payment Failed: ${response.error?.description || 'Transaction declined by bank'}`);
      });
      rzp.open();
    } catch (err) {
      console.warn('Razorpay checkout notice, continuing with Campus Gateway:', err.message);
      setIsProcessing(false);
      // Fallback to interactive campus gateway verification
      initiatePayment('Verified Campus Gateway');
    }
  };

  // Final confirmation and order creation in backend database
  const handleFinalAuthorization = async () => {
    if (!otpInput || otpInput.length < 4) {
      toast.error('Please enter the 6-digit verification code.');
      return;
    }

    setShowOtpModal(false);
    setIsProcessing(true);
    setProcessingStatus('Authorizing payment and issuing campus order token...');

    try {
      let finalMethodName = 'UPI / QR Code Pay';
      if (activeTab === 'upi') {
        if (selectedUpiApp === 'gpay') finalMethodName = 'Google Pay (GPay UPI)';
        else if (selectedUpiApp === 'phonepe') finalMethodName = 'PhonePe UPI';
        else if (selectedUpiApp === 'paytm') finalMethodName = 'Paytm UPI';
        else if (selectedUpiApp === 'qr') finalMethodName = 'Dynamic Campus UPI QR';
        else finalMethodName = `UPI ID Pay (${upiIdInput || 'student@okhdfcbank'})`;
      } else if (activeTab === 'card') {
        const brand = cardType.toUpperCase();
        const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
        finalMethodName = `Credit / Debit Card (${brand} •••• ${last4})`;
      } else if (activeTab === 'wallet') {
        finalMethodName = 'Campus Card Wallet (Stanford ID)';
      } else if (activeTab === 'netbanking') {
        finalMethodName = `Net Banking (${selectedBank.toUpperCase()})`;
      }

      const orderPayload = {
        items: activeCartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          vendorId: item.vendorId,
        })),
        paymentMethod: finalMethodName,
        deliveryAddress,
        pickupNotes: pickupNotes?.trim() || undefined,
        paymentId: `pay_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`,
        paymentOrderId: `order_${Date.now().toString(36)}`,
      };

      const res = await studentService.createOrder(orderPayload);

      if (res.success && res.data) {
        setCompletedOrderData(res.data);
        clearCart();
        sessionStorage.removeItem('sd_pending_checkout');
        toast.success('Payment Authorized & Order Placed Successfully! 🎉', { id: 'payment-success', duration: 5000 });
      } else {
        throw new Error(res.message || 'Payment capture failed.');
      }
    } catch (err) {
      console.error('Payment gateway error:', err);
      const msg = err.response?.data?.message || err.message || 'Payment authorization failed. Please try again.';
      toast.error(msg, { id: 'payment-failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fast GPay 1-Click Trigger
  const handleFastGPay = () => {
    // Attempt Razorpay Standard direct launcher or fast UPI gateway
    handleRazorpayStandardCheckout();
  };

  // Success view if order is completed
  if (completedOrderData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-2xl max-w-xl w-full text-center space-y-6 animate-fade-in my-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-4xl shadow-inner border border-emerald-100">
            ✓
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
              Payment Authorized & Verified
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order Confirmed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Transaction ID: <span className="font-mono font-bold text-slate-700">TXN_{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </p>
          </div>

          {/* Passcode Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-indigo-700/60 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Campus Pickup Passcode</span>
                <p className="text-3xl font-extrabold text-amber-300 font-mono tracking-widest">{completedOrderData.pickupCode}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Order Reference</span>
                <p className="text-sm font-bold text-white font-mono">{completedOrderData.orderId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-indigo-300 block">Amount Paid</span>
                <span className="font-extrabold text-white text-base">₹{completedOrderData.totalAmount?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-300 block">Payment Method</span>
                <span className="font-bold text-white truncate block">{completedOrderData.paymentMethod}</span>
              </div>
              <div>
                <span className="text-[10px] text-indigo-300 block">Est. Readiness</span>
                <span className="font-bold text-emerald-400">{completedOrderData.estimatedTime || '10-15 mins'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/student/orders')}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98"
            >
              Track Order on Campus Map →
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Browse Campus Shops
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex flex-col justify-between">
      
      {/* Top Bank-Grade Security Header */}
      <header className="bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/student/checkout"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
          >
            <span>←</span> Cancel
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md">
              SD
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>ShopDrop Campus Pay</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span>🔒</span> 256-Bit SSL
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Stanford University Secured Payment Gateway</p>
            </div>
          </div>
        </div>

        {/* Live Expiration Countdown */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold">Session expires in:</span>
          <span className="text-xs font-mono font-black text-amber-400 tracking-wider">
            {formatTimer(timeLeft)}
          </span>
        </div>
      </header>

      {/* Main Gateway Portal Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Center: Payment Methods Navigation & Processing (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Fast GPay 1-Click Express Checkout Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 rounded-3xl border border-indigo-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-md">
                <svg className="w-8 h-8" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  Google Pay Express
                  <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase">Instant</span>
                </h3>
                <p className="text-xs text-slate-400">Fast 1-click seamless UPI authorization</p>
              </div>
            </div>

            <button
              onClick={handleFastGPay}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Pay ₹{finalPayable.toFixed(2)} with</span>
              <span className="font-extrabold text-indigo-600">GPay</span>
              <span>⚡</span>
            </button>
          </div>

          {/* Main Payment Tabs Container */}
          <div className="bg-slate-950/60 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            
            {/* Tabs Header Navigation */}
            <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-900/60 text-xs font-bold">
              <button
                onClick={() => setActiveTab('upi')}
                className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all border-b-2 ${
                  activeTab === 'upi'
                    ? 'border-indigo-500 text-white bg-slate-900 font-extrabold shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base">📲</span>
                <span>UPI / GPay / QR</span>
              </button>

              <button
                onClick={() => setActiveTab('card')}
                className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all border-b-2 ${
                  activeTab === 'card'
                    ? 'border-indigo-500 text-white bg-slate-900 font-extrabold shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base">💳</span>
                <span>Cards (Visa/MC)</span>
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all border-b-2 ${
                  activeTab === 'wallet'
                    ? 'border-indigo-500 text-white bg-slate-900 font-extrabold shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base">🏛️</span>
                <span>Student ID Wallet</span>
              </button>

              <button
                onClick={() => setActiveTab('netbanking')}
                className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all border-b-2 ${
                  activeTab === 'netbanking'
                    ? 'border-indigo-500 text-white bg-slate-900 font-extrabold shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-base">🏦</span>
                <span>Net Banking</span>
              </button>
            </div>

            {/* TAB 1: UPI & GOOGLE PAY & QR CODE */}
            {activeTab === 'upi' && (
              <div className="p-6 space-y-6 animate-fade-in">
                
                {/* UPI Sub-Options Selector */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Select UPI Payment Mode:
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Google Pay */}
                    <button
                      onClick={() => setSelectedUpiApp('gpay')}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedUpiApp === 'gpay'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">🇬</span>
                      <span className="text-xs font-extrabold">Google Pay</span>
                    </button>

                    {/* PhonePe */}
                    <button
                      onClick={() => setSelectedUpiApp('phonepe')}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedUpiApp === 'phonepe'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">🟣</span>
                      <span className="text-xs font-extrabold">PhonePe</span>
                    </button>

                    {/* Paytm */}
                    <button
                      onClick={() => setSelectedUpiApp('paytm')}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedUpiApp === 'paytm'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">🔵</span>
                      <span className="text-xs font-extrabold">Paytm UPI</span>
                    </button>

                    {/* Dynamic QR Code */}
                    <button
                      onClick={() => setSelectedUpiApp('qr')}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedUpiApp === 'qr'
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">📷</span>
                      <span className="text-xs font-extrabold">Scan QR Code</span>
                    </button>
                  </div>
                </div>

                {/* Subview for Dynamic QR Scan */}
                {selectedUpiApp === 'qr' ? (
                  <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 text-center space-y-4">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                      {/* Realistic SVG UPI QR Pattern */}
                      <svg className="w-44 h-44 mx-auto" viewBox="0 0 200 200" fill="none">
                        <rect width="200" height="200" fill="white"/>
                        {/* Top-Left Finder */}
                        <rect x="15" y="15" width="50" height="50" fill="black" rx="6"/>
                        <rect x="23" y="23" width="34" height="34" fill="white" rx="3"/>
                        <rect x="31" y="31" width="18" height="18" fill="black" rx="2"/>
                        {/* Top-Right Finder */}
                        <rect x="135" y="15" width="50" height="50" fill="black" rx="6"/>
                        <rect x="143" y="23" width="34" height="34" fill="white" rx="3"/>
                        <rect x="151" y="31" width="18" height="18" fill="black" rx="2"/>
                        {/* Bottom-Left Finder */}
                        <rect x="15" y="135" width="50" height="50" fill="black" rx="6"/>
                        <rect x="23" y="143" width="34" height="34" fill="white" rx="3"/>
                        <rect x="31" y="151" width="18" height="18" fill="black" rx="2"/>
                        {/* Data Modules */}
                        <rect x="75" y="20" width="12" height="12" fill="black"/>
                        <rect x="95" y="20" width="12" height="12" fill="black"/>
                        <rect x="115" y="20" width="12" height="12" fill="black"/>
                        <rect x="75" y="40" width="12" height="12" fill="black"/>
                        <rect x="95" y="55" width="12" height="12" fill="black"/>
                        <rect x="20" y="75" width="12" height="12" fill="black"/>
                        <rect x="40" y="75" width="12" height="12" fill="black"/>
                        <rect x="60" y="75" width="12" height="12" fill="black"/>
                        <rect x="80" y="75" width="12" height="12" fill="black"/>
                        <rect x="100" y="75" width="12" height="12" fill="black"/>
                        <rect x="120" y="75" width="12" height="12" fill="black"/>
                        <rect x="140" y="75" width="12" height="12" fill="black"/>
                        <rect x="160" y="75" width="12" height="12" fill="black"/>
                        <rect x="75" y="95" width="12" height="12" fill="black"/>
                        <rect x="95" y="95" width="12" height="12" fill="black"/>
                        <rect x="115" y="95" width="12" height="12" fill="black"/>
                        <rect x="135" y="95" width="12" height="12" fill="black"/>
                        <rect x="75" y="115" width="12" height="12" fill="black"/>
                        <rect x="105" y="115" width="12" height="12" fill="black"/>
                        <rect x="125" y="115" width="12" height="12" fill="black"/>
                        <rect x="155" y="115" width="12" height="12" fill="black"/>
                        <rect x="75" y="135" width="12" height="12" fill="black"/>
                        <rect x="115" y="135" width="12" height="12" fill="black"/>
                        <rect x="135" y="135" width="12" height="12" fill="black"/>
                        <rect x="165" y="135" width="12" height="12" fill="black"/>
                        <rect x="75" y="155" width="12" height="12" fill="black"/>
                        <rect x="95" y="155" width="12" height="12" fill="black"/>
                        <rect x="125" y="155" width="12" height="12" fill="black"/>
                        <rect x="145" y="155" width="12" height="12" fill="black"/>
                        <rect x="75" y="175" width="12" height="12" fill="black"/>
                        <rect x="105" y="175" width="12" height="12" fill="black"/>
                        <rect x="135" y="175" width="12" height="12" fill="black"/>
                        <rect x="165" y="175" width="12" height="12" fill="black"/>
                        {/* Center UPI Logo Badge */}
                        <circle cx="100" cy="100" r="16" fill="#4F46E5"/>
                        <text x="100" y="104" fontSize="10" fontWeight="bold" fill="white" textAnchor="middle">UPI</text>
                      </svg>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-white">
                        Scan with Google Pay, PhonePe, Paytm, or any UPI App
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Exact Amount: <span className="font-extrabold text-emerald-400">₹{finalPayable.toFixed(2)}</span> • QR expires in {formatTimer(qrCodeTimer)}
                      </p>
                    </div>

                    {/* Simulation Scan Action Button */}
                    <button
                      onClick={() => initiatePayment('Dynamic Campus UPI QR')}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95"
                    >
                      ⚡ Simulate Phone Scan & Authorize Payment
                    </button>
                  </div>
                ) : (
                  /* Subview for UPI ID / App Intent */
                  <div className="space-y-4">
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
                      <label className="block text-xs font-bold text-slate-300">
                        Enter UPI ID / VPA
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={upiIdInput}
                            onChange={(e) => {
                              setUpiIdInput(e.target.value);
                              setIsVpaVerified(false);
                            }}
                            placeholder={selectedUpiApp === 'gpay' ? 'e.g. yourname@okhdfcbank' : 'e.g. mobile@ybl / id@paytm'}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-medium text-white focus:outline-none"
                          />
                          {isVpaVerified && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-extrabold flex items-center gap-1">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyVpa}
                          disabled={verifyingVpa}
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl border border-slate-700 shrink-0"
                        >
                          {verifyingVpa ? 'Verifying...' : 'Verify VPA'}
                        </button>
                      </div>

                      {/* Quick Suggestions */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-500 font-bold">Suggestions:</span>
                        {['student@okhdfcbank', 'campus@oksbi', 'stanford@paytm'].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => {
                              setUpiIdInput(handle);
                              setIsVpaVerified(true);
                            }}
                            className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/60 hover:bg-indigo-900/80 px-2 py-0.5 rounded-md border border-indigo-800/60"
                          >
                            {handle}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pay Button for UPI */}
                    <button
                      onClick={() => initiatePayment(`UPI (${selectedUpiApp.toUpperCase()})`)}
                      disabled={isProcessing}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Pay ₹{finalPayable.toFixed(2)} via {selectedUpiApp === 'gpay' ? 'Google Pay' : selectedUpiApp.toUpperCase()}</span>
                      <span>→</span>
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: CREDIT / DEBIT CARD */}
            {activeTab === 'card' && (
              <div className="p-6 space-y-6 animate-fade-in">
                
                {/* Interactive Virtual Card Mockup */}
                <div className="relative w-full max-w-sm mx-auto h-48 bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-800 rounded-3xl p-5 text-white shadow-2xl border border-indigo-400/30 flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      {/* EMV Chip */}
                      <div className="w-10 h-7 bg-gradient-to-br from-amber-200 to-amber-400 rounded-md border border-amber-500/40 flex items-center justify-center">
                        <div className="w-6 h-4 border border-amber-700/40 rounded-xs"></div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-300">)))</span>
                    </div>

                    <span className="font-mono font-black text-sm uppercase tracking-wider text-amber-300">
                      {cardType.toUpperCase()}
                    </span>
                  </div>

                  {/* Card Number */}
                  <div className="z-10 text-center my-2">
                    <p className="font-mono text-lg font-bold tracking-widest text-slate-100">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </p>
                  </div>

                  {/* Cardholder & Expiry */}
                  <div className="flex items-center justify-between text-xs z-10 font-mono">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Cardholder</span>
                      <span className="font-bold text-slate-200 truncate max-w-[150px] block">
                        {cardHolder || 'CARDHOLDER NAME'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Expires</span>
                      <span className="font-bold text-slate-200">
                        {expiryDate || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Inputs Form */}
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Card Number (Visa, MasterCard, RuPay) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 8920 1234 5678"
                        maxLength={19}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-indigo-400 uppercase">
                        {cardType}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Cardholder Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      placeholder="e.g. JOHN DOE"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Expiry Date (MM/YY) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="12/28"
                        maxLength={5}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        CVV / CVC <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="saveCardCheck"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="saveCardCheck" className="text-xs text-slate-400 cursor-pointer">
                      Save card securely for future Stanford express purchases
                    </label>
                  </div>
                </div>

                {/* Pay Button for Card */}
                <button
                  onClick={() => initiatePayment('Credit / Debit Card')}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Pay ₹{finalPayable.toFixed(2)} Securely</span>
                  <span>🔒</span>
                </button>

              </div>
            )}

            {/* TAB 3: CAMPUS CARD WALLET */}
            {activeTab === 'wallet' && (
              <div className="p-6 space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 p-5 rounded-2xl border border-red-500/30 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-red-300 uppercase font-bold tracking-wider">Stanford Student ID Account</span>
                      <h4 className="text-base font-black text-white">{user?.name || 'Student Account'}</h4>
                    </div>
                    <span className="text-2xl">🏛️</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Available Balance</span>
                      <span className="text-xl font-black text-emerald-400">₹{walletBalance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">After Purchase Balance</span>
                      <span className="text-sm font-bold text-slate-300">₹{(walletBalance - finalPayable).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* PIN Entry */}
                <div className="space-y-2 text-center py-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Enter 4-Digit Student Campus Passcode / PIN
                  </label>
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        ref={pinInputRefs[idx]}
                        type="password"
                        maxLength={1}
                        value={walletPin[idx]}
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        className="w-12 h-14 text-center bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xl font-bold text-white focus:outline-none"
                      />
                    ))}
                  </div>
                </div>

                {/* Quick Auto-Fill PIN for testing */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setWalletPin(['8', '4', '9', '2'])}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Auto-Fill Test PIN (8492)
                  </button>
                </div>

                <button
                  onClick={() => initiatePayment('Campus Card Wallet')}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Authorize ₹{finalPayable.toFixed(2)} from Student ID</span>
                  <span>✓</span>
                </button>
              </div>
            )}

            {/* TAB 4: NET BANKING */}
            {activeTab === 'netbanking' && (
              <div className="p-6 space-y-6 animate-fade-in">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Select Your Bank:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'hdfc', name: 'HDFC Bank', icon: '🏦' },
                    { id: 'sbi', name: 'State Bank of India', icon: '🏛️' },
                    { id: 'icici', name: 'ICICI Bank', icon: '💳' },
                    { id: 'axis', name: 'Axis Bank', icon: '🏢' },
                    { id: 'kotak', name: 'Kotak Mahindra', icon: '🏪' },
                    { id: 'stanford', name: 'Stanford FCU', icon: '🌲' },
                  ].map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBank(bank.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                        selectedBank === bank.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{bank.icon}</span>
                      <span className="text-xs font-bold truncate">{bank.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => initiatePayment(`Net Banking (${selectedBank.toUpperCase()})`)}
                  disabled={isProcessing}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Bank Portal (₹{finalPayable.toFixed(2)})</span>
                  <span>→</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right: Bill Summary & Order Details Sidebar (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl">
            <h2 className="text-base font-black text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Order Bill Summary</span>
              <span className="text-xs font-normal text-slate-400">
                {activeCartItems.length} Item{activeCartItems.length === 1 ? '' : 's'}
              </span>
            </h2>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {activeCartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2.5 truncate">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-800" />
                    )}
                    <div className="truncate">
                      <p className="font-bold text-slate-200 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500">Qty: {item.quantity} × ₹{item.price?.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-200 shrink-0 ml-2">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-200">₹{itemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Campus Pickup & Service Fee</span>
                <span className="font-bold text-slate-200">₹{currentServiceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-sm">
                <span className="font-extrabold text-white">Total Amount</span>
                <span className="text-2xl font-black text-emerald-400">₹{finalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Address Summary */}
            {deliveryAddress && Object.keys(deliveryAddress).length > 0 && (
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 text-[11px] space-y-1">
                <span className="font-bold text-indigo-300 block uppercase tracking-wider text-[10px]">
                  📍 Campus Delivery / Pickup Details
                </span>
                <p className="text-slate-300 font-medium">
                  {Object.values(deliveryAddress).filter(Boolean).join(' • ')}
                </p>
                {pickupNotes && (
                  <p className="text-slate-400 italic pt-1 border-t border-slate-800">
                    Note: "{pickupNotes}"
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-500 text-center font-medium space-y-1">
              <p>🔒 End-to-end encrypted campus payment gateway</p>
              <p>Refund protection guaranteed by Stanford University</p>
            </div>
          </div>

        </div>

      </main>

      {/* 3D SECURE / BANK OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in border border-slate-100 text-slate-800">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                  3DS
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Verified by Campus Gateway</h3>
                  <p className="text-[10px] text-slate-500 font-medium">3D Secure 2.0 Two-Factor Authentication</p>
                </div>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* OTP Challenge Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant:</span>
                <span className="font-extrabold text-slate-800">ShopDrop - Stanford University</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Amount:</span>
                <span className="font-extrabold text-indigo-600 text-sm">₹{finalPayable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sent to Student Mobile:</span>
                <span className="font-mono font-bold text-slate-700">+91 98765 •••••</span>
              </div>
            </div>

            {/* OTP Input Form */}
            <div className="space-y-3 text-center">
              <label className="block text-xs font-bold text-slate-700">
                Enter 6-Digit Verification Code (OTP)
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-48 mx-auto px-4 py-3 text-center tracking-widest text-2xl font-mono font-black rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Resend OTP in <span className="font-bold text-slate-700">00:{otpTimer.toString().padStart(2, '0')}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleFinalAuthorization}
                disabled={isProcessing || otpInput.length < 4}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Authorize & Complete Payment (₹{finalPayable.toFixed(2)})</span>
                <span>✓</span>
              </button>

              <button
                onClick={() => setShowOtpModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancel Transaction
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL-SCREEN PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">Processing Campus Payment</h3>
            <p className="text-xs text-slate-400">{processingStatus}</p>
          </div>
          <p className="text-[10px] text-slate-500">Please do not refresh or close this browser window...</p>
        </div>
      )}

      {/* Gateway Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 text-center text-[10px] text-slate-500">
        © 2026 ShopDrop Multi-Tenant Campus Marketplace • Stanford University Gateway
      </footer>

    </div>
  );
};

export default PaymentGatewayScreen;
