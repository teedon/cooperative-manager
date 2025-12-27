import React, { useState } from 'react'
import { Button, Card, Input, useToast } from '../components/ui'
import { Mail, MessageCircle, X, Plus, Trash2, Copy, CheckCircle2 } from 'lucide-react'
import { cooperativeApi } from '../api/cooperativeApi'

interface InviteMembersModalProps {
  cooperativeId: string
  cooperativeName: string
  onClose: () => void
}

export const InviteMembersModal: React.FC<InviteMembersModalProps> = ({
  cooperativeId,
  cooperativeName,
  onClose,
}) => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email')
  const [emails, setEmails] = useState<string[]>([''])
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([''])
  const [customMessage, setCustomMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<any>(null)

  const addEmailField = () => {
    setEmails([...emails, ''])
  }

  const removeEmailField = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index)
    setEmails(newEmails.length === 0 ? [''] : newEmails)
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const addPhoneField = () => {
    setPhoneNumbers([...phoneNumbers, ''])
  }

  const removePhoneField = (index: number) => {
    const newPhones = phoneNumbers.filter((_, i) => i !== index)
    setPhoneNumbers(newPhones.length === 0 ? [''] : newPhones)
  }

  const updatePhone = (index: number, value: string) => {
    const newPhones = [...phoneNumbers]
    newPhones[index] = value
    setPhoneNumbers(newPhones)
  }

  const handleSendEmail = async () => {
    const validEmails = emails.filter((email) => email.trim() && email.includes('@'))
    
    if (validEmails.length === 0) {
      toast.error('Please enter at least one valid email address')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await cooperativeApi.sendEmailInvites(
        cooperativeId,
        validEmails,
        customMessage || undefined
      )

      if (response.success) {
        setResults(response.data)
        setShowResults(true)
        toast.success(`Sent ${validEmails.length} invitation(s)!`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invitations')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateWhatsApp = async () => {
    const validPhones = phoneNumbers.filter((phone) => phone.trim().replace(/\D/g, '').length >= 10)
    
    if (validPhones.length === 0) {
      toast.error('Please enter at least one valid phone number')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await cooperativeApi.sendWhatsAppInvites(
        cooperativeId,
        validPhones,
        customMessage || undefined
      )

      if (response.success) {
        setResults(response.data)
        setShowResults(true)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate WhatsApp links')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const openWhatsApp = (url: string) => {
    window.open(url, '_blank')
  }

  if (showResults && results) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'email' ? 'Email Invitations Sent' : 'WhatsApp Invitations Ready'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {activeTab === 'email' && results.results && (
            <div className="space-y-3 mb-6">
              {results.results.map((result: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.sent
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {result.sent ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold">{result.email}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'whatsapp' && results.whatsappLinks && (
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Message Preview:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {results.whatsappMessage}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => copyToClipboard(results.whatsappMessage)}
                  leftIcon={<Copy className="w-4 h-4" />}
                >
                  Copy Message
                </Button>
              </div>

              <div className="space-y-3">
                <p className="font-semibold text-gray-700">Click to open WhatsApp:</p>
                {results.whatsappLinks.map((link: any, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    fullWidth
                    onClick={() => openWhatsApp(link.whatsappUrl)}
                    leftIcon={<MessageCircle className="w-4 h-4" />}
                    className="justify-start border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {link.originalPhone}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <Button variant="primary" fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Invite Members</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Invite people to join <span className="font-semibold">{cooperativeName}</span>
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 font-semibold transition-colors relative ${
              activeTab === 'email'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </div>
            {activeTab === 'email' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 font-semibold transition-colors relative ${
              activeTab === 'whatsapp'
                ? 'text-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </div>
            {activeTab === 'whatsapp' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
            )}
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {activeTab === 'email' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Addresses
                </label>
                <div className="space-y-2">
                  {emails.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1"
                      />
                      {emails.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeEmailField(index)}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEmailField}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="mt-2"
                >
                  Add Another Email
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Numbers (with country code)
                </label>
                <div className="space-y-2">
                  {phoneNumbers.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => updatePhone(index, e.target.value)}
                        placeholder="+1234567890"
                        className="flex-1"
                      />
                      {phoneNumbers.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePhoneField(index)}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPhoneField}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="mt-2"
                >
                  Add Another Number
                </Button>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 min-h-20 resize-y"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" fullWidth onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={activeTab === 'email' ? handleSendEmail : handleGenerateWhatsApp}
            loading={isSubmitting}
            leftIcon={activeTab === 'email' ? <Mail className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          >
            {activeTab === 'email' ? 'Send Invitations' : 'Generate WhatsApp Links'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
