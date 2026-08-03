'use client';

import useNotifications from '@/hooks/noti/useNotifications';

export default function NotiPollingGate() {
  useNotifications();
  return null;
}
