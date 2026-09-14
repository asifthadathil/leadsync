'use client';

import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import Image from 'next/image';

interface FormData {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  country: string;
  location: string;
  inquiryCategory: string;
  customerQuery: string;
}

interface StatusMessage {
  type: 'success' | 'error' | 'loading' | null;
  text: string;
}

export default function Home() {
  const [eventName, setEventName] = useState('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    mobileNumber: '',
    country: '',
    location: '',
    inquiryCategory: '',
    customerQuery: '',
  });

  const [status, setStatus] = useState<StatusMessage>({ type: null, text: '' });
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [timestamp, setTimestamp] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  // Load event name from localStorage
  useEffect(() => {
    const savedEventName = localStorage.getItem('leadsync_eventName');
    if (savedEventName) {
      setEventName(savedEventName);
    }
    // Set current timestamp
    const now = new Date();
    setTimestamp(
      now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })
    );
  }, []);

  // Save event name to localStorage
  const handleEventNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEventName(value);
    localStorage.setItem('leadsync_eventName', value);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generatePDF = async (): Promise<Blob | null> => {
    if (!formRef.current) return null;

    try {
      const canvas = await html2canvas(formRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `LeadSync_${eventName || 'Event'}_${new Date().toISOString().split('T')[0]}.pdf`;
      const blob = pdf.output('blob');
      return blob;
    } catch (error) {
      console.error('PDF generation error:', error);
      return null;
    }
  };

  const downloadPDF = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LeadSync_${eventName || 'Event'}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventName) {
      setStatus({
        type: 'error',
        text: 'Event name required. Enter event name to proceed.',
      });
      return;
    }

    setStatus({ type: 'loading', text: 'Generating PDF...' });

    // Generate PDF
    const pdfBlob = await generatePDF();
    if (!pdfBlob) {
      setStatus({
        type: 'error',
        text: 'Failed to generate PDF. Try again.',
      });
      return;
    }

    setPdfBlob(pdfBlob);
    setStatus({ type: 'loading', text: 'Sending email...' });

    try {
      // Send email via API
      const response = await axios.post('/api/send-email', {
        formData,
        eventName,
        timestamp,
      });

      if (response.data.success) {
        setStatus({
          type: 'success',
          text: '✓ Email sent successfully!',
        });
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            firstName: '',
            lastName: '',
            companyName: '',
            email: '',
            mobileNumber: '',
            country: '',
            location: '',
            inquiryCategory: '',
            customerQuery: '',
          });
          setStatus({ type: null, text: '' });
          setShowPdfDownload(false);
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Email send failed');
      }
    } catch (error: any) {
      console.error('Email send error:', error);
      setStatus({
        type: 'error',
        text: 'Email send failed. Please download PDF manually.',
      });
      setShowPdfDownload(true);
    }
  };

  return (
    <main>
      <div className="container">
        <div className="header">
          <svg
            className="logo"
            viewBox="0 0 420 100"
            role="img"
            aria-label="iDTRONIC Logo"
          >
            <rect
              x="3"
              y="3"
              width="414"
              height="94"
              rx="22"
              fill="none"
              stroke="#1e3a6f"
              strokeWidth="6"
            />
            <rect x="36" y="22" width="18" height="18" rx="3" fill="#f39200" />
            <rect x="36" y="48" width="18" height="32" rx="3" fill="#f39200" />
            <text
              x="62"
              y="76"
              fontSize="62"
              fontWeight={800}
              fontFamily="Arial, Helvetica, sans-serif"
              fill="#f39200"
            >
              D
            </text>
            <text
              x="134"
              y="72"
              fontSize="50"
              fontWeight={800}
              letterSpacing="1"
              fontFamily="Arial, Helvetica, sans-serif"
              fill="#1e3a6f"
            >
              TRONIC
            </text>
          </svg>
          <h1 className="app-title">iDTRONIC LeadSync</h1>
          <p className="help-text">Event Lead Capture System</p>
        </div>

        <div className="form-group">
          <label className="event-label">Event Name</label>
          <input
            type="text"
            className="event-name-input"
            placeholder="Enter event name (stored locally)"
            value={eventName}
            onChange={handleEventNameChange}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="two-column">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleInputChange}
            />
          </div>

          <div className="two-column">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="two-column">
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                placeholder="Country"
                value={formData.country}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Inquiry Category *</label>
            <select
              name="inquiryCategory"
              value={formData.inquiryCategory}
              onChange={handleInputChange}
            >
              <option value="">-- Select Category --</option>
              <option value="Smart">Smart</option>
              <option value="Professional">Professional</option>
              <option value="IoT">IoT</option>
              <option value="RFID Tag/Labels">RFID Tag / Labels</option>
            </select>
          </div>

          <div className="form-group">
            <label>Customer Query</label>
            <textarea
              name="customerQuery"
              placeholder="Describe the customer's question or request"
              rows={4}
              value={formData.customerQuery}
              onChange={handleInputChange}
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="btn-submit"
              disabled={status.type === 'loading'}
            >
              {status.type === 'loading' ? 'Processing...' : 'Submit & Send Email'}
            </button>
          </div>

          {status.type && (
            <div className={`status-message status-${status.type}`}>
              {status.type === 'loading' && <span className="spinner"></span>}
              {status.text}
            </div>
          )}

          {showPdfDownload && pdfBlob && (
            <div className="pdf-download-section">
              <p>
                Email send failed. Download PDF and try again later.
              </p>
              <button
                type="button"
                className="btn-download btn-secondary"
                onClick={() => downloadPDF(pdfBlob)}
              >
                📥 Download PDF
              </button>
            </div>
          )}

          <div className="timestamp">{timestamp}</div>
        </form>

        {/* Hidden div for PDF generation */}
        <div ref={formRef} style={{ display: 'none', padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <strong>iDTRONIC LeadSync</strong>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Event Name</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{eventName}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>First Name</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.firstName}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Last Name</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.lastName}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Company Name</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.companyName}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Email</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.email}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Mobile Number</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.mobileNumber}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Country</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.country}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Location</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.location}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Inquiry Category</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{formData.inquiryCategory}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Customer Query</td>
                <td style={{ border: '1px solid #ccc', padding: '8px', whiteSpace: 'pre-wrap' }}>{formData.customerQuery}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>Timestamp</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{timestamp}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
