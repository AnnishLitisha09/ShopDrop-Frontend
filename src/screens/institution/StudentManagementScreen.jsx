import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import institutionAdminService from '../../services/institutionAdminService';

export const StudentManagementScreen = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [activeYearFilter, setActiveYearFilter] = useState('all');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [detailsStudent, setDetailsStudent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState(null); // { password, count, message }

  // Manual Add Form state
  const [formRegNo, setFormRegNo] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formYear, setFormYear] = useState('1');
  const [formPassOutYear, setFormPassOutYear] = useState(String(new Date().getFullYear() + 4));
  const [formStatus, setFormStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Import Flow state
  const [importStep, setImportStep] = useState('upload'); // 'upload' | 'preview'
  const [importFile, setImportFile] = useState(null);
  const [validatingImport, setValidatingImport] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [importReport, setImportReport] = useState(null); // { totalRows, validCount, invalidCount, validRows, invalidRows, commonTemporaryPassword }

  const currentYear = new Date().getFullYear();

  const fetchStudents = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await institutionAdminService.getStudents({
        search: searchQuery,
        status: activeStatusTab,
        year: activeYearFilter,
      });
      if (res.success && res.data) {
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error('Error fetching students list:', err);
      const msg = err.response?.data?.message || 'Failed to load student directory.';
      setError(msg);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeStatusTab, activeYearFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const openAddModal = () => {
    setFormRegNo('');
    setFormName('');
    setFormEmail('');
    setFormYear('1');
    setFormPassOutYear(String(currentYear + 4));
    setFormError(null);
    setAddModalOpen(true);
  };

  const openImportModal = () => {
    setImportStep('upload');
    setImportFile(null);
    setImportReport(null);
    setImportModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setFormRegNo(student.registerNumber || '');
    setFormName(student.name);
    setFormEmail(student.email);
    setFormYear(String(student.year || 1));
    setFormPassOutYear(String(student.passOutYear || currentYear + 3));
    setFormStatus(student.status || 'active');
    setFormError(null);
  };

  const openDetailsModal = async (studentId) => {
    setDetailsLoading(true);
    setDetailsStudent(null);
    try {
      const res = await institutionAdminService.getStudentDetails(studentId);
      if (res.success && res.data) {
        setDetailsStudent(res.data.student);
      }
    } catch (err) {
      toast.error('Failed to load student details.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formRegNo.trim()) {
      setFormError('Please enter Student Register / Roll Number.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Please enter student full name.');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Please enter college email address.');
      return;
    }

    const passOutInt = parseInt(formPassOutYear);
    if (isNaN(passOutInt) || passOutInt <= currentYear) {
      setFormError(`Pass-out year must be in the future (greater than ${currentYear}) for currently pursuing students.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await institutionAdminService.createStudent({
        registerNumber: formRegNo.trim(),
        name: formName.trim(),
        email: formEmail.trim(),
        year: parseInt(formYear),
        passOutYear: passOutInt,
      });

      if (res.success) {
        setAddModalOpen(false);
        fetchStudents(true);

        // Display Common Temporary Password Modal ONCE
        setTempPasswordModal({
          password: res.data.temporaryPassword,
          count: 1,
          message: `Student account created for ${formName.trim()}!`,
        });
      }
    } catch (err) {
      console.error('Error creating student:', err);
      const msg = err.response?.data?.message || 'Failed to create student account.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await institutionAdminService.downloadStudentTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ShopDrop_Student_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Excel Template Downloaded!', { icon: '📥' });
    } catch (err) {
      toast.error('Failed to download Excel template.');
    }
  };

  const handleValidateImportFile = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select an Excel file to validate.');
      return;
    }

    setValidatingImport(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await institutionAdminService.validateStudentImport(formData);
      if (res.success && res.data) {
        setImportReport(res.data);
        setImportStep('preview');
        toast.success(`Validated ${res.data.totalRows} rows: ${res.data.validCount} Valid, ${res.data.invalidCount} Invalid`);
      }
    } catch (err) {
      console.error('Error validating import file:', err);
      const msg = err.response?.data?.message || 'Failed to parse and validate Excel file.';
      toast.error(msg);
    } finally {
      setValidatingImport(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importReport || !importReport.validRows || importReport.validRows.length === 0) {
      toast.error('No valid rows available to import.');
      return;
    }

    setImportingData(true);
    try {
      const res = await institutionAdminService.importStudents(importReport.validRows);
      if (res.success) {
        setImportModalOpen(false);
        fetchStudents(true);

        // Display Common Temporary Password Modal ONCE
        setTempPasswordModal({
          password: res.data.temporaryPassword,
          count: res.data.importedCount,
          message: `Successfully imported ${res.data.importedCount} student accounts into campus directory!`,
        });
      }
    } catch (err) {
      console.error('Error importing valid students:', err);
      const msg = err.response?.data?.message || 'Bulk import failed.';
      toast.error(msg);
    } finally {
      setImportingData(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Please enter full name.');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Please enter college email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await institutionAdminService.updateStudent(editStudent.id, {
        name: formName.trim(),
        email: formEmail.trim(),
        status: formStatus,
      });

      if (res.success) {
        toast.success(`Student ${formName} updated!`, { icon: '✏️' });
        setEditStudent(null);
        fetchStudents(true);
      }
    } catch (err) {
      console.error('Error updating student:', err);
      const msg = err.response?.data?.message || 'Failed to update student.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const targetStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await institutionAdminService.updateStudentStatus(student.id, targetStatus);
      if (res.success) {
        toast.success(`Student set to ${targetStatus.toUpperCase()}`);
        fetchStudents(true);
      }
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Temporary password copied to clipboard!', { icon: '📋' });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'active';
    switch (s) {
      case 'active':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg border border-emerald-300">● Active</span>;
      case 'inactive':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-300">○ Inactive</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-lg border border-rose-300">✕ Suspended</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-lg">{status?.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SCREEN HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-lg border border-indigo-100">
            <span>🎓</span> Controlled Campus Student Directory
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Student Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Onboard pursuing campus students manually or via bulk Excel import with pre-validation reports & batch passwords.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openImportModal}
            className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-2xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>📊</span> Bulk Import Excel
          </button>
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>+</span> Add Student
          </button>
        </div>
      </div>

      {/* SEARCH BAR & FILTERS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
          {[
            { id: 'all', label: 'All Students' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusTab(tab.id)}
              className={`flex-1 lg:flex-none px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeStatusTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year Filter Dropdown & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            value={activeYearFilter}
            onChange={(e) => setActiveYearFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-extrabold rounded-2xl focus:outline-none focus:bg-white"
          >
            <option value="all">All Academic Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-72">
            <input
              type="text"
              placeholder="Search name, email, register #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* STUDENT DATA DISPLAY */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-4 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
          <div className="h-12 bg-slate-200 rounded-xl"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            onClick={() => fetchStudents()}
            className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Retry Loading
          </button>
        </div>
      ) : students.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-500 text-3xl shadow-inner">
            🎓
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">No students found</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              No campus student records match the active filter or search criteria.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={openImportModal}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-xl shadow-xs"
            >
              📊 Import Excel
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs"
            >
              + Add Student
            </button>
          </div>
        </div>
      ) : (
        /* DESKTOP TABLE & MOBILE CARDS */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="p-4">Reg Number</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">College Email</th>
                  <th className="p-4">Year / Passout</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Register Number */}
                    <td className="p-4">
                      <span className="font-mono font-black text-indigo-700 px-2.5 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                        {student.registerNumber || 'N/A'}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs shrink-0">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">{student.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {student.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 font-bold text-slate-800">
                      {student.email}
                    </td>

                    {/* Year & Passout */}
                    <td className="p-4">
                      <span className="font-extrabold text-slate-800 block">Year {student.year || 1}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Graduation: {student.passOutYear || 2027}</span>
                    </td>

                    {/* Total Spent */}
                    <td className="p-4 font-black text-indigo-600">
                      ₹{(student.totalSpent || 0).toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">{getStatusBadge(student.status)}</td>

                    {/* Actions */}
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openDetailsModal(student.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openEditModal(student)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(student)}
                        className={`px-3 py-1.5 font-extrabold text-xs rounded-xl transition-colors ${
                          student.status === 'active'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {student.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STUDENT (CONTROLLED ONBOARDING) */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Onboard Pursuing Student</h3>
                <p className="text-xs text-slate-500">Auto-generates temporary batch password for student.</p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs font-bold text-rose-800">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Register / Roll Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 22IT001"
                  value={formRegNo}
                  onChange={(e) => setFormRegNo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold text-indigo-700 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">College Email *</label>
                <input
                  type="email"
                  placeholder="alex.rivera@stanford.edu"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Current Year *</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold focus:bg-white"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Pass-out Year *</label>
                  <input
                    type="number"
                    min={currentYear + 1}
                    max={currentYear + 8}
                    value={formPassOutYear}
                    onChange={(e) => setFormPassOutYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 font-medium space-y-1">
                <p className="font-extrabold">🔒 Password Security Note:</p>
                <p>Passwords are automatically generated for onboarding security. The temporary batch password will be shown ONCE after account creation.</p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Onboarding...' : 'Onboard Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK IMPORT STUDENTS VIA EXCEL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Bulk Import Students (.xlsx)</h3>
                <p className="text-xs text-slate-500">Upload campus Excel directory file with pre-validation checks.</p>
              </div>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {/* Step 1: Upload & Download Template */}
            {importStep === 'upload' && (
              <div className="space-y-6">
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-indigo-900">Need standard Excel structure?</h4>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      Download the official template with columns: Register Number, Name, Email, Year, Pass-out Year.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-2"
                  >
                    <span>📥</span> Download Excel Template
                  </button>
                </div>

                <form onSubmit={handleValidateImportFile} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 p-8 rounded-3xl text-center space-y-3 bg-slate-50/50 transition-colors">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                      📁
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {importFile ? importFile.name : 'Select Excel spreadsheet (.xlsx, .xls)'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Max size: 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={validatingImport || !importFile}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                      {validatingImport ? 'Parsing & Validating...' : 'Validate File & Preview'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Pre-Import Validation Report */}
            {importStep === 'preview' && importReport && (
              <div className="space-y-6">
                
                {/* Summary Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Rows</span>
                    <span className="text-xl font-black text-slate-900">{importReport.totalRows}</span>
                  </div>
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-600 font-bold block uppercase">Valid Rows</span>
                    <span className="text-xl font-black text-emerald-800">{importReport.validCount}</span>
                  </div>
                  <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 text-center">
                    <span className="text-[10px] text-rose-600 font-bold block uppercase">Invalid Rows</span>
                    <span className="text-xl font-black text-rose-800">{importReport.invalidCount}</span>
                  </div>
                </div>

                {/* Invalid Rows Table (If Any Errors Found) */}
                {importReport.invalidCount > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                      <span>⚠️</span> Invalid Rows Skipped ({importReport.invalidCount})
                    </h4>
                    <div className="max-h-44 overflow-y-auto border border-rose-200 rounded-2xl bg-rose-50/30">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-rose-100/60 text-rose-900 font-extrabold uppercase text-[9px] sticky top-0">
                          <tr>
                            <th className="p-2.5">Row #</th>
                            <th className="p-2.5">Reg Number</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Validation Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100 font-medium">
                          {importReport.invalidRows.map((inv, i) => (
                            <tr key={i} className="hover:bg-rose-100/40">
                              <td className="p-2.5 font-bold text-slate-700">Row {inv.rowIndex}</td>
                              <td className="p-2.5 font-mono">{inv.registerNumber || '-'}</td>
                              <td className="p-2.5 font-bold text-slate-800">{inv.name || '-'}</td>
                              <td className="p-2.5">{inv.email || '-'}</td>
                              <td className="p-2.5 text-rose-700 font-bold">
                                {inv.errors.join(', ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Valid Rows Preview Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                    <span>✅</span> Valid Rows Ready For Database Transaction ({importReport.validCount})
                  </h4>
                  {importReport.validCount === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500 font-bold">
                      No valid rows found in file. Please fix errors and re-upload.
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto border border-emerald-200 rounded-2xl bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-emerald-50 text-emerald-900 font-extrabold uppercase text-[9px] sticky top-0">
                          <tr>
                            <th className="p-2.5">Row #</th>
                            <th className="p-2.5">Reg Number</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">Email</th>
                            <th className="p-2.5">Year</th>
                            <th className="p-2.5">Passout</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100 font-medium">
                          {importReport.validRows.map((v, i) => (
                            <tr key={i} className="hover:bg-emerald-50/40">
                              <td className="p-2.5 font-bold text-slate-700">Row {v.rowIndex}</td>
                              <td className="p-2.5 font-mono font-bold text-indigo-700">{v.registerNumber}</td>
                              <td className="p-2.5 font-bold text-slate-900">{v.name}</td>
                              <td className="p-2.5 text-slate-700">{v.email}</td>
                              <td className="p-2.5 font-bold">Year {v.year}</td>
                              <td className="p-2.5">{v.passOutYear}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setImportStep('upload')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    ← Re-upload File
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importingData || importReport.validCount === 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {importingData ? 'Executing DB Transaction...' : `Confirm & Import ${importReport.validCount} Students`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: TEMPORARY PASSWORD DISPLAY MODAL (DISPLAYED ONCE) */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
              🔑
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Common Temporary Password</h3>
              <p className="text-xs text-slate-500 font-medium">
                {tempPasswordModal.message}
              </p>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Batch Password (Shown Once)
              </span>
              <p className="font-mono text-lg font-black text-amber-400 select-all tracking-wider">
                {tempPasswordModal.password}
              </p>
              <button
                onClick={() => copyToClipboard(tempPasswordModal.password)}
                className="mt-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>📋</span> Copy Password
              </button>
            </div>

            <div className="p-3 bg-indigo-50 text-indigo-900 rounded-2xl text-[11px] font-medium text-left space-y-1">
              <p className="font-extrabold">📌 Admin Instructions:</p>
              <p>Share this temporary password with newly onboarded students. Students will use their college email and this temporary password for first login.</p>
            </div>

            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md"
            >
              I Have Saved This Password — Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT STUDENT */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Student Info</h3>
                <p className="text-xs text-slate-500">Update name, email or status.</p>
              </div>
              <button onClick={() => setEditStudent(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs font-bold text-rose-800">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Register Number</label>
                <input
                  type="text"
                  value={formRegNo}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-extrabold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">College Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Account Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-extrabold focus:bg-white focus:border-indigo-600 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: STUDENT DETAILS & DB ORDER METRICS */}
      {(detailsStudent || detailsLoading) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Student Profile Details</h3>
                <p className="text-xs text-slate-500">Database purchase metrics & account record.</p>
              </div>
              <button onClick={() => setDetailsStudent(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            {detailsLoading ? (
              <div className="py-8 text-center space-y-3 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
              </div>
            ) : detailsStudent && (
              <div className="space-y-6">
                
                {/* Profile Card Header */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                    {detailsStudent.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">{detailsStudent.name}</h4>
                    <p className="text-xs font-bold text-indigo-600">{detailsStudent.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-200 rounded">
                        Reg: {detailsStudent.registerNumber || 'N/A'}
                      </span>
                      {getStatusBadge(detailsStudent.status)}
                    </div>
                  </div>
                </div>

                {/* Academic Year Info */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 text-indigo-950 font-medium">
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase">Academic Year</span>
                    <span className="font-extrabold text-sm">Year {detailsStudent.year || 1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-600 font-bold block uppercase">Expected Pass-out</span>
                    <span className="font-extrabold text-sm">{detailsStudent.passOutYear || 2027}</span>
                  </div>
                </div>

                {/* Database Calculated Statistics */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Database Purchase Statistics
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Orders</span>
                      <span className="text-lg font-black text-slate-900">{detailsStudent.stats?.totalOrders || 0}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Completed</span>
                      <span className="text-lg font-black text-emerald-600">{detailsStudent.stats?.completedOrders || 0}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Spent</span>
                      <span className="text-lg font-black text-indigo-600">₹{(detailsStudent.stats?.totalSpent || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <p><strong>Institution ID:</strong> {detailsStudent.institutionId}</p>
                  <p><strong>Account Created:</strong> {new Date(detailsStudent.createdAt).toLocaleString()}</p>
                </div>

                <button
                  onClick={() => setDetailsStudent(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Close View
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentManagementScreen;
