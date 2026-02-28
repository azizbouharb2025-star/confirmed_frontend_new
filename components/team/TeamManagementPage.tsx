'use client'

import { useState, useEffect } from 'react'
import { UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage } from '@/hooks/useLanguage'
import { TeamMember, Operator, TeamMemberRole } from '@/types/team'
import { getMockTeamMembers, filterOperators } from '@/services/teamService'
import { SkeletonCard, SkeletonList } from '@/components/ui/SkeletonLoader'
import TeamMemberCard from './TeamMemberCard'
import OperatorCard from './OperatorCard'
import InviteTeamMemberModal from './InviteTeamMemberModal'

type TabType = 'team' | 'operators'

export default function TeamManagementPage() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

  const [activeTab, setActiveTab] = useState<TabType>('team')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      setIsLoading(true)
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/team/members')
        // const data = await response.json()
        
        // Using mock data for now
        const mockMembers = getMockTeamMembers('shop_1')
        setTeamMembers(mockMembers)
        setOperators(filterOperators(mockMembers))
      } catch (error) {
        console.error('Failed to load team members:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeamMembers()
  }, [])

  const handleInvite = async (email: string, role: string) => {
    // TODO: Implement actual API call
    console.log('Inviting:', email, role)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Add new pending member to the list
    const newMember: TeamMember = {
      _id: `member_${Date.now()}`,
      shopId: 'shop_1',
      email,
      role: role as TeamMemberRole,
      status: 'pending',
      invitedAt: new Date().toISOString(),
      invitedBy: 'current_user',
    }
    
    setTeamMembers(prev => [...prev, newMember])
  }

  const handleResendInvite = async (memberId: string) => {
    // TODO: Implement actual API call
    console.log('Resending invite for:', memberId)
  }

  const handleCancelInvite = async (memberId: string) => {
    // TODO: Implement actual API call
    console.log('Canceling invite for:', memberId)
    setTeamMembers(prev => prev.filter(m => m._id !== memberId))
  }

  const handleRemove = async (memberId: string) => {
    // TODO: Implement actual API call
    console.log('Removing member:', memberId)
    setTeamMembers(prev => prev.filter(m => m._id !== memberId))
    setOperators(prev => prev.filter(o => o._id !== memberId))
  }

  const confirmedCount = teamMembers.filter(m => m.status === 'confirmed').length
  const pendingCount = teamMembers.filter(m => m.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('team.title')}
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            {t('team.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label={t('team.inviteMember')}
        >
          <UserPlusIcon className="w-5 h-5" />
          {t('team.inviteMember')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('team.totalMembers')}
              </p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {teamMembers.length}
              </p>
            </div>
            <UserGroupIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('team.confirmed')}
              </p>
              <p className="text-3xl font-bold mt-1 text-green-500">
                {confirmedCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('team.pending')}
              </p>
              <p className="text-3xl font-bold mt-1 text-blue-500">
                {pendingCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-4 px-2 font-medium transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded ${
              activeTab === 'team'
                ? `${isDark ? 'text-blue-400' : 'text-blue-600'}`
                : `${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-600 hover:text-gray-900'}`
            }`}
            role="tab"
            aria-selected={activeTab === 'team'}
            aria-controls="team-panel"
          >
            {t('team.myTeam')}
            {activeTab === 'team' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('operators')}
            className={`pb-4 px-2 font-medium transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded ${
              activeTab === 'operators'
                ? `${isDark ? 'text-blue-400' : 'text-blue-600'}`
                : `${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-gray-600 hover:text-gray-900'}`
            }`}
            role="tab"
            aria-selected={activeTab === 'operators'}
            aria-controls="operators-panel"
          >
            {t('team.operators')}
            {activeTab === 'operators' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonList items={4} />
        </div>
      ) : (
        <>
          {/* Mon équipe Tab */}
          {activeTab === 'team' && (
            <div className="space-y-4" role="tabpanel" id="team-panel" aria-labelledby="team-tab">
              {teamMembers.length === 0 ? (
                <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  <UserGroupIcon className="w-16 h-16 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>{t('team.noMembers')}</p>
                  <p className="text-sm mt-2">{t('team.inviteFirst')}</p>
                </div>
              ) : (
                teamMembers.map(member => (
                  <TeamMemberCard
                    key={member._id}
                    member={member}
                    onResendInvite={handleResendInvite}
                    onCancelInvite={handleCancelInvite}
                    onRemove={handleRemove}
                  />
                ))
              )}
            </div>
          )}

          {/* Opérateurs Tab */}
          {activeTab === 'operators' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="tabpanel" id="operators-panel" aria-labelledby="operators-tab">
              {operators.length === 0 ? (
                <div className={`col-span-2 text-center py-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  <UserGroupIcon className="w-16 h-16 mx-auto mb-4 opacity-50" aria-hidden="true" />
                  <p>{t('team.noOperators')}</p>
                  <p className="text-sm mt-2">{t('team.inviteOperators')}</p>
                </div>
              ) : (
                operators.map(operator => (
                  <OperatorCard
                    key={operator._id}
                    operator={operator}
                    showPerformanceMetrics={true}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Invite Modal */}
      <InviteTeamMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
      />
    </div>
  )
}
