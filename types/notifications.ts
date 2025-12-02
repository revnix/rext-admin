export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  status: string;
  is_read: boolean;
  created_at: string;
}
