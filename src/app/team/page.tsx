'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Mail,
  Crown,
  Shield,
  User,
  Trash2,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  Settings,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  status: string;
  joined_at: string;
  users: {
    id: string;
    github_username: string;
    avatar_url: string;
  };
}

interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  team_members: TeamMember[];
}

interface Invite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadTeams();
  }, []);

  async function checkAuthAndLoadTeams() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    await loadTeams();
  }

  async function loadTeams() {
    setLoading(true);
    try {
      const response = await fetch('/api/teams');
      const result = await response.json();

      if (result.success) {
        setTeams(result.data.owned || []);
        if (result.data.owned?.length > 0 && !selectedTeam) {
          setSelectedTeam(result.data.owned[0]);
          loadInvites(result.data.owned[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
    setLoading(false);
  }

  async function loadInvites(teamId: string) {
    try {
      const response = await fetch(`/api/teams/${teamId}/invite`);
      const result = await response.json();
      if (result.success) {
        setInvites(result.data || []);
      }
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  }

  async function createTeam() {
    if (!newTeamName.trim()) return;
    setCreating(true);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      const result = await response.json();
      if (result.success) {
        setNewTeamName('');
        setShowCreateModal(false);
        await loadTeams();
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
    setCreating(false);
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !selectedTeam) return;
    setInviting(true);

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const result = await response.json();
      if (result.success) {
        setInviteEmail('');
        setShowInviteModal(false);
        loadInvites(selectedTeam.id);
      } else {
        alert(result.error || result.message || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    }
    setInviting(false);
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedInvite(token);
    setTimeout(() => setCopiedInvite(null), 2000);
  }

  const roleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-neon-purple" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Team Management</h1>
              <p className="text-gray-400 text-sm">Manage your team members and invitations</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>

        {teams.length === 0 ? (
          /* Empty State */
          <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-neon-purple" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Teams Yet</h2>
            <p className="text-gray-400 mb-6">Create a team to collaborate with others</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Your First Team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Your Teams</h3>
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeam(team);
                    loadInvites(team.id);
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'bg-neon-purple/20 border-neon-purple/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-bold">
                      {team.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-gray-400">
                        {team.team_members?.length || 1} member{(team.team_members?.length || 1) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Team Details */}
            {selectedTeam && (
              <div className="lg:col-span-2 space-y-6">
                {/* Members Section */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Team Members
                    </h3>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-3 py-1.5 bg-neon-purple/20 text-neon-purple rounded-lg text-sm flex items-center gap-1 hover:bg-neon-purple/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Invite
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedTeam.team_members?.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={member.users?.avatar_url || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{member.users?.github_username}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              {roleIcon(member.role)}
                              <span className="capitalize">{member.role}</span>
                            </div>
                          </div>
                        </div>
                        {member.role !== 'owner' && (
                          <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pending Invites */}
                {invites.length > 0 && (
                  <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <Mail className="w-5 h-5" />
                      Pending Invites
                    </h3>

                    <div className="space-y-3">
                      {invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{invite.email}</p>
                            <p className="text-xs text-gray-400 capitalize">
                              Invited as {invite.role}
                            </p>
                          </div>
                          <button
                            onClick={() => copyInviteLink(invite.id)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedInvite === invite.id ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-xl font-bold mb-4">Create Team</h2>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-purple/50 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTeam}
                disabled={creating || !newTeamName.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl font-semibold disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 p-6"
          >
            <h2 className="text-xl font-bold mb-4">Invite Team Member</h2>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-purple/50 mb-4"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-purple/50 mb-4"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={inviteMember}
                disabled={inviting || !inviteEmail.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl font-semibold disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
