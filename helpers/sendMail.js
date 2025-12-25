import { Resend } from 'resend';

export const sendMail = async (UserEmail, Subject, html) => {
  console.log("=== BẮT ĐẦU GỬI EMAIL ===");
  console.log("API Key tồn tại:", !!process.env.RESEND_API_KEY);
  console.log("Key preview:", process.env.RESEND_API_KEY?.substring(0, 15) + "...");

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY không tồn tại! Kiểm tra .env và dotenv.config()");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'Distenda <onboarding@resend.dev>', // Dùng tạm cái này để test
      to: [UserEmail],
      subject: Subject,
      html: html,
    });

    if (error) {
      console.error("Resend trả về lỗi:", error);
      throw error;
    }

    console.log("GỬI EMAIL THÀNH CÔNG! ID:", data.id);
    return data;
  } catch (error) {
    console.error("LỖI CHI TIẾT KHI GỬI EMAIL:", error.message || error);
    throw error;
  }
};