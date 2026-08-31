import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, Users, KeyRound, Copy, Check, Plus, Sparkles } from 'lucide-react';

export default function OrganizationView({ onOpenTaskModal }) {
  const { user, token, joinOrganization, createOrganization } = useAuth();

  const [members, setMembers] = useState([]);
  const [copied, setCopied] = useState(false);

  const [newOrgName, setNewOrgName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.organization_id && token) {
      fetch('/api/organizations/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setMembers(data.members || []))
        .catch(err => console.error('Error fetching org members:', err));
    }
  }, [user, token]);

  const handleCopyCode = () => {
    if (user?.organization?.join_code) {
      navigator.clipboard.writeText(user.organization.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await createOrganization(newOrgName);
      setMsg({ type: 'success', text: 'Organization created successfully!' });
      setNewOrgName('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error creating organization.' });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      await joinOrganization(joinCodeInput);
      setMsg({ type: 'success', text: 'Successfully joined organization!' });
      setJoinCodeInput('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error joining organization.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user?.organization_id) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto animate-slide-up">
        <div className="bg-white dark:bg-edu-darkCard p-8 rounded-3xl border border-gray-200 dark:border-edu-darkBorder shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-edu-sec dark:bg-edu-darkBorder flex items-center justify-center text-edu-dark dark:text-edu-sky mx-auto shadow">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-edu-dark dark:text-white">Student Organization Management</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            You are currently not part of a student organization. Create a new organization as an Admin or join an existing one using a Join Code.
          </p>
        </div>

        {msg.text && (
          <div className={`p-4 rounded-2xl text-xs font-bold ${
            msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200' : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200'
          }`}>
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-edu-darkCard p-6 rounded-3xl border border-gray-200 dark:border-edu-darkBorder shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-edu-dark dark:text-edu-accent" />
              <h3 className="text-base font-bold text-edu-dark dark:text-white">Create Organization</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Become an Org Admin, generate a unique join code, and start assigning tasks to your team.
            </p>
            <form onSubmit={handleCreateOrg} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. Computer Science Student Society"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-edu-darkBorder dark:bg-edu-darkBg dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-edu-accent"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-edu-dark dark:bg-edu-accent hover:bg-opacity-90 text-white dark:text-edu-dark font-bold text-xs rounded-xl shadow transition transform active:scale-95"
              >
                {loading ? 'Creating...' : 'Create & Generate Join Code'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-edu-darkCard p-6 rounded-3xl border border-gray-200 dark:border-edu-darkBorder shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-edu-dark dark:text-edu-accent" />
              <h3 className="text-base font-bold text-edu-dark dark:text-white">Join Organization</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter the 6-character join code provided by your organization administrator.
            </p>
            <form onSubmit={handleJoinOrg} className="space-y-3">
              <input
                type="text"
                required
                placeholder="e.g. X7K9P2"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2 text-xs font-mono uppercase border border-gray-200 dark:border-edu-darkBorder dark:bg-edu-darkBg dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-edu-accent"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-edu-sec dark:bg-edu-darkBorder hover:bg-edu-sky text-edu-dark dark:text-white font-bold text-xs rounded-xl border border-edu-sky dark:border-edu-darkBorder shadow-sm transition transform active:scale-95"
              >
                {loading ? 'Joining...' : 'Join Organization'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Org Header Card */}
      <div className="bg-gradient-to-r from-edu-card via-edu-accent/40 to-edu-sec dark:from-edu-darkCard dark:via-edu-darkBorder dark:to-edu-darkBg p-8 rounded-3xl border border-edu-card/60 dark:border-edu-darkBorder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-edu-dark dark:bg-edu-accent text-white dark:text-edu-dark flex items-center justify-center shadow-lg">
            <Building className="w-7 h-7 text-edu-accent dark:text-edu-dark" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-edu-dark dark:text-white">{user.organization?.name}</h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-edu-dark dark:bg-edu-accent text-white dark:text-edu-dark">
                {user.account_type === 'ORG_ADMIN' ? 'Admin View' : 'Member View'}
              </span>
            </div>
            <p className="text-xs text-edu-dark/80 dark:text-gray-300 font-medium mt-1">
              Centralized organization task assignment and member tracking.
            </p>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-edu-darkCard/90 backdrop-blur p-4 rounded-2xl border border-white/60 dark:border-edu-darkBorder shadow-sm flex items-center space-x-4">
          <div>
            <span className="block text-[10px] font-extrabold uppercase text-gray-400">Organization Join Code</span>
            <span className="text-xl font-black font-mono tracking-wider text-edu-dark dark:text-edu-accent">
              {user.organization?.join_code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2.5 bg-edu-dark dark:bg-edu-accent hover:bg-opacity-90 text-white dark:text-edu-dark rounded-xl shadow transition transform active:scale-95"
            title="Copy Join Code"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-700" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {user.account_type === 'ORG_ADMIN' && (
        <div className="bg-white dark:bg-edu-darkCard p-5 rounded-2xl border border-gray-200 dark:border-edu-darkBorder shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-edu-dark dark:text-white">Assign Task to Member</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Create a task and assign it directly to a member's dashboard.
            </p>
          </div>
          <button
            onClick={onOpenTaskModal}
            className="px-4 py-2 bg-edu-dark dark:bg-edu-accent text-white dark:text-edu-dark font-bold text-xs rounded-xl shadow hover:bg-opacity-90 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-edu-accent dark:text-edu-dark" />
            <span>Assign Org Task</span>
          </button>
        </div>
      )}

      {/* Member Roster */}
      <div className="bg-white dark:bg-edu-darkCard p-6 rounded-3xl border border-gray-200 dark:border-edu-darkBorder shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-edu-dark dark:text-edu-accent" />
          <h3 className="text-base font-bold text-edu-dark dark:text-white">Organization Roster ({members.length})</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div
              key={m.id}
              className="p-4 rounded-2xl border border-gray-100 dark:border-edu-darkBorder bg-gray-50/50 dark:bg-edu-darkBg/50 hover:bg-white dark:hover:bg-edu-darkBg transition flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-full bg-edu-card dark:bg-edu-darkBorder text-edu-dark dark:text-white font-extrabold text-sm flex items-center justify-center border border-white dark:border-edu-darkBorder shadow-sm">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-edu-dark dark:text-white truncate">{m.name}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{m.email}</div>
                <span className={`inline-block mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded ${
                  m.account_type === 'ORG_ADMIN' ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}>
                  {m.account_type === 'ORG_ADMIN' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
