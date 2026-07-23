import React from 'react';
import { PhoneCall } from 'lucide-react';
import { leadService } from '../../services/leadService';

interface DirectCallButtonProps {
  phone?: string;
  leadId?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  label?: string;
}

export const DirectCallButton: React.FC<DirectCallButtonProps> = ({
  phone,
  leadId,
  className = '',
  size = 'sm',
  label
}) => {
  if (!phone || phone === 'N/A') return null;

  // Clean phone number for tel: protocol
  const cleanedPhone = phone.replace(/[^\d+]/g, '');
  const telHref = `tel:${cleanedPhone.startsWith('+') ? cleanedPhone : `+91${cleanedPhone}`}`;

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (leadId) {
      leadService.logCallAttempt(leadId).catch(() => {});
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-xs font-bold'
  };

  return (
    <a
      href={telHref}
      onClick={handleCallClick}
      className={`inline-flex items-center space-x-1 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm hover:shadow transition-all shrink-0 select-none active:scale-95 ${sizeClasses[size]} ${className}`}
      title={`Direct Call ${phone} (Opens phone dialer)`}
    >
      <PhoneCall className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label || 'Call'}</span>
    </a>
  );
};
