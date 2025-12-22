// @ts-ignore - zeptomail doesn't have type definitions
import { SendMailClient } from 'zeptomail';

const APP_NAME = 'CoopManager';
const SUPPORT_EMAIL = 'support@coopmanager.com';
const PRIMARY_COLOR = '#16a34a'; // Green
const SECONDARY_COLOR = '#15803d';

// Get credentials from environment variables
const ZEPTO_URL = process.env.ZEPTO_URL || 'api.zeptomail.com/';
const ZEPTO_TOKEN = process.env.ZEPTO_TOKEN || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@greenbii.com';

export const sendMailWithZoho = async function (data: {
  sender?: string;
  recipient: string;
  subject: string;
  htmlContent: string;
}) {
  if (!ZEPTO_TOKEN) {
    console.error('ZEPTO_TOKEN is not configured');
    return false;
  }

  const client = new SendMailClient({ url: ZEPTO_URL, token: ZEPTO_TOKEN });

  return client
    .sendMail({
      from: {
        address: data.sender || SENDER_EMAIL,
        name: APP_NAME,
      },
      to: [
        {
          email_address: {
            address: data.recipient,
            name: 'User',
          },
        },
      ],
      subject: data.subject,
      htmlbody: data.htmlContent,
    })
    .then((resp: unknown) => {
      console.log('Email sent successfully:', data.recipient);
      return true;
    })
    .catch((error: unknown) => {
      console.error('Failed to send email:', error);
      return false;
    });
};

// ==================== BASE TEMPLATE ====================

function getBaseTemplate(content: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7f6;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #333;
          margin-bottom: 20px;
        }
        .message {
          font-size: 15px;
          color: #555;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .highlight-box {
          background-color: #f0fdf4;
          border: 1px solid ${PRIMARY_COLOR};
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .warning-box {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
        }
        .info-box {
          background-color: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #1e40af;
        }
        .error-box {
          background-color: #fef2f2;
          border: 1px solid #ef4444;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #991b1b;
        }
        .success-box {
          background-color: #f0fdf4;
          border: 1px solid #22c55e;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #166534;
        }
        .amount {
          font-size: 28px;
          font-weight: bold;
          color: ${PRIMARY_COLOR};
          text-align: center;
          margin: 15px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: ${PRIMARY_COLOR};
          text-align: center;
          letter-spacing: 8px;
          margin: 20px 0;
          padding: 15px;
          background-color: #f0fdf4;
          border-radius: 8px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%);
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .details-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .details-table td:first-child {
          color: #6b7280;
          width: 40%;
        }
        .details-table td:last-child {
          color: #111827;
          font-weight: 500;
        }
        .footer {
          background-color: #f9fafb;
          padding: 25px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }
        .footer a {
          color: ${PRIMARY_COLOR};
          text-decoration: none;
        }
        .logo-text {
          font-weight: bold;
          color: ${PRIMARY_COLOR};
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p><strong class="logo-text">${APP_NAME}</strong></p>
          <p>Manage your cooperative finances with ease</p>
          <p style="margin-top: 15px; font-size: 12px;">
            This is an automated message. Please do not reply to this email.<br>
            If you need help, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== AUTHENTICATION EMAILS ====================

export function generateWelcomeEmailTemplate(
  userName: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">🎉</div>
      <h1>Welcome to ${APP_NAME}!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Welcome to ${APP_NAME}! We're excited to have you on board. Your account has been created successfully.
      </p>
      <div class="highlight-box">
        <h3 style="margin: 0 0 15px 0; color: ${PRIMARY_COLOR};">🚀 Get Started</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li>Join or create a cooperative</li>
          <li>Set up your contribution plans</li>
          <li>Track your savings and loans</li>
          <li>Participate in group purchases</li>
        </ul>
      </div>
      <p class="message">
        If you have any questions, our support team is always here to help.
      </p>
      <p style="text-align: center;">
        <a href="#" class="button">Open ${APP_NAME}</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content, `Welcome to ${APP_NAME}`);
}

export function generatePasswordResetEmailTemplate(
  userName: string,
  otpCode: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">🔐</div>
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        We received a request to reset your password. Use the OTP below to proceed:
      </p>
      <div class="otp-code">${otpCode}</div>
      <p class="message" style="text-align: center;">
        This OTP is valid for the next <strong>15 minutes</strong>.
      </p>
      <div class="warning-box">
        ⚠️ If you didn't request this password reset, please ignore this email and ensure your account is secure.
      </div>
    </div>
  `;
  return getBaseTemplate(content, 'Password Reset');
}

export function generatePasswordResetSuccessEmailTemplate(
  userName: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">✅</div>
      <h1>Password Reset Successful</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <div class="success-box">
        <strong>Your password has been successfully reset!</strong>
      </div>
      <p class="message">
        You can now log in to your ${APP_NAME} account using your new password.
      </p>
      <p class="message">
        Password reset completed on ${new Date().toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'short',
        })}
      </p>
      <div class="warning-box">
        ⚠️ <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately or reset your password again to secure your account.
      </div>
    </div>
  `;
  return getBaseTemplate(content, 'Password Reset Successful');
}

// ==================== COOPERATIVE EMAILS ====================

export function generateCooperativeInviteEmailTemplate(
  recipientName: string,
  inviterName: string,
  cooperativeName: string,
  cooperativeCode: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">📨</div>
      <h1>You're Invited!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${recipientName},</p>
      <p class="message">
        <strong>${inviterName}</strong> has invited you to join <strong>${cooperativeName}</strong> on ${APP_NAME}.
      </p>
      <div class="highlight-box">
        <h3 style="margin: 0 0 15px 0; color: ${PRIMARY_COLOR};">📋 Cooperative Details</h3>
        <table class="details-table">
          <tr>
            <td>Cooperative Name</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Invited By</td>
            <td>${inviterName}</td>
          </tr>
          <tr>
            <td>Join Code</td>
            <td><strong style="color: ${PRIMARY_COLOR};">${cooperativeCode}</strong></td>
          </tr>
        </table>
      </div>
      <p class="message">
        Use the code above to join the cooperative in the ${APP_NAME} app.
      </p>
      <p style="text-align: center;">
        <a href="#" class="button">Join Cooperative</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content, `Join ${cooperativeName}`);
}

export function generateMemberRoleChangeEmailTemplate(
  userName: string,
  cooperativeName: string,
  newRole: string,
  isPromotion: boolean,
): string {
  const icon = isPromotion ? '👑' : '📝';
  const title = isPromotion ? 'Congratulations!' : 'Role Update';
  const subtitle = isPromotion ? `You've been promoted to ${newRole}` : 'Your role has been updated';
  
  const content = `
    <div class="header">
      <div class="header-icon">${icon}</div>
      <h1>${title}</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        ${isPromotion 
          ? `Great news! You've been promoted to <strong>${newRole}</strong> in <strong>${cooperativeName}</strong>.`
          : `Your role in <strong>${cooperativeName}</strong> has been changed to <strong>${newRole}</strong>.`
        }
      </p>
      ${isPromotion ? `
      <div class="highlight-box">
        <h3 style="margin: 0 0 15px 0; color: ${PRIMARY_COLOR};">🚀 Your New Responsibilities</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li>Manage cooperative members</li>
          <li>Review and approve contributions</li>
          <li>Process loan applications</li>
          <li>Manage group purchases</li>
        </ul>
      </div>
      ` : ''}
      <p class="message">
        If you have any questions about your role, please contact the cooperative admin.
      </p>
    </div>
  `;
  return getBaseTemplate(content, subtitle);
}

// ==================== CONTRIBUTION EMAILS ====================

export function generateContributionRecordedEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  periodName: string,
  paymentDate: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">💰</div>
      <h1>Contribution Recorded</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Your contribution has been recorded and is pending approval.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Period</td>
            <td>${periodName}</td>
          </tr>
          <tr>
            <td>Payment Date</td>
            <td>${paymentDate}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td><span style="color: #f59e0b;">⏳ Pending Approval</span></td>
          </tr>
        </table>
      </div>
      <p class="message">
        You'll receive a notification once your contribution is approved by an admin.
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Contribution Recorded');
}

export function generateContributionApprovedEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  periodName: string,
  newBalance: number,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">✅</div>
      <h1>Contribution Approved</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Great news! Your contribution has been approved.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="success-box">
        ✅ Your contribution has been successfully credited to your account.
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Period</td>
            <td>${periodName}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>New Balance</td>
            <td><strong style="color: ${PRIMARY_COLOR};">₦${newBalance.toLocaleString()}</strong></td>
          </tr>
        </table>
      </div>
      <p class="message">
        Thank you for your contribution. Keep up the great saving habits!
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Contribution Approved');
}

export function generateContributionRejectedEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  periodName: string,
  reason: string,
): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <div class="header-icon">❌</div>
      <h1>Contribution Rejected</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Unfortunately, your contribution has been rejected.
      </p>
      <div class="error-box">
        <strong>Reason:</strong> ${reason || 'No reason provided'}
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Period</td>
            <td>${periodName}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p class="message">
        Please review the reason above and submit a new contribution if needed. Contact your cooperative admin if you have questions.
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Contribution Rejected');
}

// ==================== LOAN EMAILS ====================

export function generateLoanRequestEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  purpose: string,
  duration: number,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">📋</div>
      <h1>Loan Request Submitted</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Your loan request has been submitted and is now pending review.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Loan Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Purpose</td>
            <td>${purpose}</td>
          </tr>
          <tr>
            <td>Duration</td>
            <td>${duration} months</td>
          </tr>
          <tr>
            <td>Status</td>
            <td><span style="color: #f59e0b;">⏳ Pending Review</span></td>
          </tr>
        </table>
      </div>
      <p class="message">
        The cooperative administrators will review your request and you'll be notified of their decision.
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Loan Request Submitted');
}

export function generateLoanApprovedEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  interestRate: number,
  duration: number,
  monthlyPayment: number,
  totalRepayment: number,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">🎉</div>
      <h1>Loan Approved!</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Congratulations! Your loan request has been approved.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="success-box">
        ✅ Your loan has been approved and funds will be disbursed shortly.
      </div>
      <div class="highlight-box">
        <h3 style="margin: 0 0 15px 0; color: ${PRIMARY_COLOR};">📊 Loan Details</h3>
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Principal Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Interest Rate</td>
            <td>${interestRate}%</td>
          </tr>
          <tr>
            <td>Duration</td>
            <td>${duration} months</td>
          </tr>
          <tr>
            <td>Monthly Payment</td>
            <td>₦${monthlyPayment.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Total Repayment</td>
            <td><strong>₦${totalRepayment.toLocaleString()}</strong></td>
          </tr>
        </table>
      </div>
      <p class="message">
        Please ensure timely repayments to maintain your good standing in the cooperative.
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Loan Approved');
}

export function generateLoanRejectedEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  reason: string,
): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <div class="header-icon">❌</div>
      <h1>Loan Request Rejected</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        We regret to inform you that your loan request has been rejected.
      </p>
      <div class="error-box">
        <strong>Reason:</strong> ${reason || 'No reason provided'}
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Requested Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p class="message">
        You may submit a new loan request after addressing the reason above. Contact your cooperative admin for more information.
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Loan Request Rejected');
}

export function generateLoanDisbursedEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  firstPaymentDate: string,
  monthlyPayment: number,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">💸</div>
      <h1>Loan Disbursed</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Your loan has been disbursed! The funds are now available.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="success-box">
        ✅ Funds have been successfully disbursed to your account.
      </div>
      <div class="highlight-box">
        <h3 style="margin: 0 0 15px 0; color: ${PRIMARY_COLOR};">📅 Repayment Schedule</h3>
        <table class="details-table">
          <tr>
            <td>First Payment Due</td>
            <td>${firstPaymentDate}</td>
          </tr>
          <tr>
            <td>Monthly Payment</td>
            <td>₦${monthlyPayment.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p class="message">
        Remember to make your payments on time to avoid penalties.
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Loan Disbursed');
}

export function generateLoanRepaymentReminderEmailTemplate(
  userName: string,
  cooperativeName: string,
  amount: number,
  dueDate: string,
  outstandingBalance: number,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">⏰</div>
      <h1>Payment Reminder</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        This is a friendly reminder that your loan repayment is due soon.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="warning-box">
        ⚠️ Payment due on <strong>${dueDate}</strong>
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Amount Due</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Due Date</td>
            <td>${dueDate}</td>
          </tr>
          <tr>
            <td>Outstanding Balance</td>
            <td>₦${outstandingBalance.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p class="message">
        Please ensure your payment is made on time to avoid late fees.
      </p>
      <p style="text-align: center;">
        <a href="#" class="button">Make Payment</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'Loan Payment Reminder');
}

// ==================== EXPENSE EMAILS ====================

export function generateExpenseSubmittedEmailTemplate(
  userName: string,
  cooperativeName: string,
  title: string,
  amount: number,
  category: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">📝</div>
      <h1>Expense Submitted</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Your expense has been submitted and is pending approval.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Expense Title</td>
            <td>${title}</td>
          </tr>
          <tr>
            <td>Category</td>
            <td>${category}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Status</td>
            <td><span style="color: #f59e0b;">⏳ Pending Approval</span></td>
          </tr>
        </table>
      </div>
    </div>
  `;
  return getBaseTemplate(content, 'Expense Submitted');
}

export function generateExpenseApprovedEmailTemplate(
  userName: string,
  cooperativeName: string,
  title: string,
  amount: number,
  approvedBy: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">✅</div>
      <h1>Expense Approved</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Your expense has been approved.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="success-box">
        ✅ Expense approved by ${approvedBy}
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Expense Title</td>
            <td>${title}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Approved By</td>
            <td>${approvedBy}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
  return getBaseTemplate(content, 'Expense Approved');
}

export function generateExpenseRejectedEmailTemplate(
  userName: string,
  cooperativeName: string,
  title: string,
  amount: number,
  reason: string,
): string {
  const content = `
    <div class="header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
      <div class="header-icon">❌</div>
      <h1>Expense Rejected</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName},</p>
      <p class="message">
        Your expense has been rejected.
      </p>
      <div class="error-box">
        <strong>Reason:</strong> ${reason || 'No reason provided'}
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Expense Title</td>
            <td>${title}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
  return getBaseTemplate(content, 'Expense Rejected');
}

// ==================== ADMIN NOTIFICATION EMAILS ====================

export function generateNewLoanRequestNotificationEmailTemplate(
  adminName: string,
  cooperativeName: string,
  requesterName: string,
  amount: number,
  purpose: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">🔔</div>
      <h1>New Loan Request</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${adminName},</p>
      <p class="message">
        A new loan request requires your attention.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="info-box">
        📋 A member has submitted a loan request for review
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Requested By</td>
            <td>${requesterName}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Purpose</td>
            <td>${purpose}</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="#" class="button">Review Request</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'New Loan Request');
}

export function generateNewContributionNotificationEmailTemplate(
  adminName: string,
  cooperativeName: string,
  memberName: string,
  amount: number,
  periodName: string,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">🔔</div>
      <h1>New Contribution Pending</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${adminName},</p>
      <p class="message">
        A new contribution requires your approval.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="info-box">
        💰 A member has recorded a contribution payment
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Member</td>
            <td>${memberName}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Period</td>
            <td>${periodName}</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="#" class="button">Review Contribution</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'New Contribution Pending');
}

export function generateNewExpenseNotificationEmailTemplate(
  adminName: string,
  cooperativeName: string,
  submitterName: string,
  title: string,
  amount: number,
): string {
  const content = `
    <div class="header">
      <div class="header-icon">🔔</div>
      <h1>New Expense Pending</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello ${adminName},</p>
      <p class="message">
        A new expense requires your approval.
      </p>
      <div class="amount">₦${amount.toLocaleString()}</div>
      <div class="info-box">
        📝 An expense has been submitted for review
      </div>
      <div class="highlight-box">
        <table class="details-table">
          <tr>
            <td>Cooperative</td>
            <td>${cooperativeName}</td>
          </tr>
          <tr>
            <td>Submitted By</td>
            <td>${submitterName}</td>
          </tr>
          <tr>
            <td>Expense</td>
            <td>${title}</td>
          </tr>
          <tr>
            <td>Amount</td>
            <td>₦${amount.toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="#" class="button">Review Expense</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content, 'New Expense Pending');
}

// ==================== HELPER FUNCTION TO SEND EMAILS ====================

export const sendEmail = async (
  recipient: string,
  subject: string,
  htmlContent: string,
): Promise<boolean> => {
  return sendMailWithZoho({
    recipient,
    subject,
    htmlContent,
  });
};

