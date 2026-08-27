import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import institutionAdminService from '../../services/institutionAdminService';

export const StudentManagementScreen = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusTab, setActiveStatusTab] = useState('all');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [detailsStudent, setDetailsStudent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchStudents = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const res = await institutionAdminService.getStudents({
        search: searchQuery,
        status: activeStatusTab,
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
  }, [activeStatusTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormConfirmPassword('');
    setFormError(null);
    setAddModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setFormName(student.name);
    setFormEmail(student.email);
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

    if (!formName.trim()) {
      setFormError('Please enter full name.');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Please enter college email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formPassword || formPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (formPassword !== formConfirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await institutionAdminService.createStudent({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
      });

      if (res.success) {
        toast.success(`Student ${formName} added successfully!`, { icon: '🎓' });
        setAddModalOpen(false);
        fetchStudents(true);
      }
    } catch (err) {
      console.error('Error creating student:', err);
      const msg = err.response?.data?.message || 'Failed to create student account.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
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
            <span>🎓</span> Campus Student Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Student Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage authenticated campus students, review purchase activity, and control account status.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
        >
          <span>+</span> Add Student
        </button>
      </div>

      {/* SEARCH BAR & STATUS FILTER TABS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Students' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusTab(tab.id)}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeStatusTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            placeholder="Search name or email..."
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
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
          >
            + Add First Student
          </button>
        </div>
      ) : (
        /* DESKTOP TABLE & MOBILE CARDS */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] bg-slate-50/50">
                  <th className="p-4">Student Name</th>
                  <th className="p-4">College Email</th>
                  <th className="p-4">Total Orders</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
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

                    {/* Total Orders */}
                    <td className="p-4 font-bold text-slate-700">
                      {student.totalOrdersCount || 0} orders
                    </td>

                    {/* Total Spent */}
                    <td className="p-4 font-black text-indigo-600">
                      ₹{(student.totalSpent || 0).toFixed(2)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">{getStatusBadge(student.status)}</td>

                    {/* Joined Date */}
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>

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

      {/* MODAL 1: ADD STUDENT */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Campus Student</h3>
                <p className="text-xs text-slate-500">Create a new authenticated student account.</p>
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

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Password *</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Confirm Password *</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={formConfirmPassword}
                  onChange={(e) => setFormConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-indigo-600 focus:outline-none"
                  required
                />
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
                  {submitting ? 'Creating Account...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STUDENT */}
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

      {/* MODAL 3: STUDENT DETAILS & DB ORDER METRICS */}
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
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                    {detailsStudent.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">{detailsStudent.name}</h4>
                    <p className="text-xs font-bold text-indigo-600">{detailsStudent.email}</p>
                    <div className="mt-1">{getStatusBadge(detailsStudent.status)}</div>
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
