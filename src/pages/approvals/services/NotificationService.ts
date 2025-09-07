import { supabase } from "@/integrations/supabase/client";

export class NotificationService {
  static async createApprovalNotification(
    techLeadId: string,
    employeeName: string,
    skillName: string,
    subskillName?: string
  ) {
    try {
      const skillTitle = subskillName ? `${skillName} - ${subskillName}` : skillName;
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: techLeadId,
          title: 'New Skill Rating Approval Required',
          message: `${employeeName} has submitted a skill rating for ${skillTitle} that requires your approval.`,
          type: 'info'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating approval notification:', error);
    }
  }

  static async createApprovalResultNotification(
    employeeId: string,
    approved: boolean,
    skillName: string,
    subskillName?: string,
    comment?: string
  ) {
    try {
      const skillTitle = subskillName ? `${skillName} - ${subskillName}` : skillName;
      const status = approved ? 'approved' : 'rejected';
      const message = `Your skill rating for ${skillTitle} has been ${status}.${comment ? ` Comment: ${comment}` : ''}`;
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: employeeId,
          title: `Skill Rating ${approved ? 'Approved' : 'Rejected'}`,
          message,
          type: approved ? 'success' : 'warning'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating approval result notification:', error);
    }
  }
}