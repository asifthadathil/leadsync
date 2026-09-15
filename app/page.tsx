'use client';

import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';

interface FormData {
  fullName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  inquiryCategory: string;
  productName: string;
  qty: string;
  customerQuery: string;
  nextStep: string;
}

interface StatusMessage {
  type: 'success' | 'error' | 'loading' | null;
  text: string;
}

export default function Home() {
  const [eventName, setEventName] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    companyName: '',
    email: '',
    mobileNumber: '',
    inquiryCategory: '',
    productName: '',
    qty: '',
    customerQuery: '',
    nextStep: '',
  });

  const [status, setStatus] = useState<StatusMessage>({ type: null, text: '' });
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [timestamp, setTimestamp] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

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
            fullName: '',
            companyName: '',
            email: '',
            mobileNumber: '',
            inquiryCategory: '',
            productName: '',
            qty: '',
            customerQuery: '',
            nextStep: '',
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
          <img src="/logo.png" alt="iDTRONIC" className="brand-logo-img" />
          <h1 className="app-title">LeadSync</h1>
          <p className="help-text">Event Lead Capture</p>
        </div>

        <div className="form-group">
          <label className="field-label">
            Event Name <span className="required-mark">*</span>
          </label>
          <input
            type="text"
            className="event-name-input"
            placeholder="Enter event name (stored locally)"
            value={eventName}
            onChange={handleEventNameChange}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <p className="form-section-title">Customer Contact Information</p>

          <div className="two-column">
            <div className="form-group">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="field-label">Company</label>
              <input
                type="text"
                name="companyName"
                placeholder="Company Name"
                value={formData.companyName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="two-column">
            <div className="form-group">
              <label className="field-label">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="field-label">Mobile</label>
              <input
                type="tel"
                name="mobileNumber"
                placeholder="Mobile Number"
                value={formData.mobileNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <p className="form-section-title">Inquiry</p>

          <div className="form-group">
            <label className="field-label">
              Category <span className="required-mark">*</span>
            </label>
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

          <div className="two-column">
            <div className="form-group">
              <label className="field-label">Product Name</label>
              <input
                type="text"
                name="productName"
                placeholder="Product Name"
                value={formData.productName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="field-label">Qty</label>
              <input
                type="number"
                min="0"
                name="qty"
                placeholder="Quantity"
                value={formData.qty}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">Customer Query</label>
            <textarea
              name="customerQuery"
              placeholder="Describe the customer's question or request"
              rows={4}
              value={formData.customerQuery}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="field-label">Next Step</label>
            <input
              type="text"
              name="nextStep"
              placeholder="e.g. Send quote, schedule follow-up call"
              value={formData.nextStep}
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

        <p className="footer-note">iDTRONIC GmbH &middot; Event Lead Capture System</p>

        {/* Off-screen letterhead used to render the branded PDF (html2canvas cannot render display:none elements) */}
        <div
          ref={formRef}
          className="pdf-page"
          style={{
            position: 'absolute',
            top: 0,
            left: '-9999px',
            width: '780px',
          }}
        >
          <div className="pdf-header">
            <img src="/logo.png" alt="iDTRONIC" className="pdf-logo-img" />
            <div className="pdf-header-text">
              <div className="pdf-doc-title">LEAD CAPTURE REPORT</div>
              <div className="pdf-doc-sub">
                {eventName || 'Event'} &middot; {timestamp}
              </div>
            </div>
          </div>

          <div className="pdf-section-title">Customer Contact Information</div>
          <table className="pdf-table">
            <tbody>
              <tr>
                <td className="pdf-label">Full Name</td>
                <td>{formData.fullName || '—'}</td>
              </tr>
              <tr>
                <td className="pdf-label">Company</td>
                <td>{formData.companyName || '—'}</td>
              </tr>
              <tr>
                <td className="pdf-label">Email</td>
                <td>{formData.email || '—'}</td>
              </tr>
              <tr>
                <td className="pdf-label">Mobile</td>
                <td>{formData.mobileNumber || '—'}</td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-section-title">Inquiry</div>
          <table className="pdf-table">
            <tbody>
              <tr>
                <td className="pdf-label">Category</td>
                <td>{formData.inquiryCategory || '—'}</td>
              </tr>
              <tr>
                <td className="pdf-label">Product Name</td>
                <td>{formData.productName || '—'}</td>
              </tr>
              <tr>
                <td className="pdf-label">Qty</td>
                <td>{formData.qty || '—'}</td>
              </tr>
              <tr>
                <td className="pdf-label" style={{ verticalAlign: 'top' }}>
                  Customer Query
                </td>
                <td style={{ whiteSpace: 'pre-wrap' }}>{formData.customerQuery || '—'}</td>
              </tr>
              <tr>
                <td className="pdf-label">Next Step</td>
                <td>{formData.nextStep || '—'}</td>
              </tr>
            </tbody>
          </table>

          <div className="pdf-footer">
            <div className="pdf-footer-bar" />
            <p>
              iDTRONIC GmbH &middot; Automatically generated by LeadSync &middot; {timestamp}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
