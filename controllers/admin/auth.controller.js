const Admin = require("../../models/admin.model");
const Setting = require("../../models/setting.model");
const ForgotPassword = require("../../models/forgotpw.model");
const generateHelper = require("../../helpers/generate")
const sendMailHelper = require("../../helpers/sendMail")

const systemConfig = require("../../config/system");

// [POST] /admin/auth/login
module.exports.loginPost = async (req, res) => {
  const { AdminEmail } = req.body;
  const user = await Admin.findOne({
    AdminEmail: AdminEmail,
    AdminDeleted: 1,
  });

  if (!user) {
    res.json({
      code: 400,
      message: "Email không tồn tại!"
    })
    return;
  }

  if (user.AdminStatus != 1) {
    res.json({
      code: 400,
      message: "Tài khoản đang bị khóa!"
    })
    return;
  }
  if (user.AdminRole_id.toString() === "680fbf236652357c0e6421e9") {
    res.json({
      code: 200,
      message: 'Vui lòng nhập "123456" để đăng nhập!'
    })
  } else {
    const otp = generateHelper.generateRandomNumber(6)
    const objectForgotPw = {
      FPUserEmail: AdminEmail,
      FPOTP: otp,
      expireAt: Date.now() + 3 * 60 * 1000, // 3 phút từ thời điểm hiện tại
    }
    const forgotPw = new ForgotPassword(objectForgotPw)
    await forgotPw.save()

    //Tồn tại nên gửi Email
    const Subject = "DISTENDA - Mã xác thực đăng nhập Admin";

  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mã xác thực đăng nhập</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .header { background: #14375F; padding: 40px 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 8px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; text-align: center; color: #333333; }
        .greeting { font-size: 20px; margin-bottom: 24px; color: #1f2937; }
        .otp-box { background: #f8f9ff; border: 2px dashed #4f46e5; border-radius: 16px; padding: 30px; margin: 30px auto; max-width: 300px; }
        .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 16px; color: #4f46e5; margin: 0; }
        .note { margin: 30px 0; padding: 20px; background: #fef3c7; border-left: 5px solid #f59e0b; border-radius: 8px; text-align: left; font-size: 15px; }
        .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
        .footer a { color: #4f46e5; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>DISTENDA</h1>
          <p>Xác thực đăng nhập tài khoản Quản trị</p>
        </div>

        <div class="content">
          <div class="greeting">
            Xin chào <strong>${user.AdminFullName || 'Quản trị viên'}</strong>,
          </div>

          <p>Chúng tôi phát hiện có yêu cầu đăng nhập vào khu vực quản trị Distenda.</p>
          <p>Để đảm bảo an toàn tài khoản, vui lòng sử dụng mã xác thực dưới đây:</p>

          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>

          <p><strong>Mã này chỉ có hiệu lực trong 3 phút.</strong></p>

          <div class="note">
            <strong>Cảnh báo bảo mật:</strong><br>
            Nếu <strong>bạn không thực hiện đăng nhập</strong>, vui lòng:
            <ul>
              <li>Bỏ qua email này ngay lập tức</li>
              <li>Thay đổi mật khẩu tài khoản nếu nghi ngờ bị xâm phạm</li>
              <li>Liên hệ đội ngũ hỗ trợ Distenda</li>
            </ul>
          </div>

          <p>Cảm ơn bạn đã góp phần giữ an toàn cho hệ thống!</p>
        </div>

        <div class="footer">
          <p><strong>Distenda - Hệ thống quản lý học tập trực tuyến</strong></p>
          <p>Email này được gửi tự động. Vui lòng không trả lời.</p>
          <p>© 2025 Distenda. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
      `;
    try {
        await sendMailHelper.sendMail(AdminEmail, Subject, html);
    
        return res.json({
          code: 200,
          message: "Gửi thành công!",
        });
      } catch (error) {
        console.error("Lỗi gửi mail:", error);
    
        return res.json({
          code: 500,
          message: "Không thể gửi email. Vui lòng thử lại sau.",
        });
      }
  }
};

// [POST] /admin/auth/login-confirm
module.exports.passwordOTP = async (req, res) => {
  const AdminEmail = req.body.AdminEmail
  const OTP = req.body.OTP

  const admin = await Admin.findOne({
    AdminEmail: AdminEmail
  }).select("AdminRole_id AdminToken")
  if (admin.AdminRole_id.toString() === "680fbf236652357c0e6421e9") {

    res.cookie("token", admin.AdminToken, {
      secure: true,
      httpOnly: false,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      code: 200,
      message: "Đăng nhập thành công!",
      token: admin.AdminToken
    })
  } else {
    const result = await ForgotPassword.findOne({
      FPUserEmail: AdminEmail,
      FPOTP: OTP
    })
    if (!result) {
      res.json({
        code: 400,
        message: "OTP không hợp lệ!"
      })
      return;
    }

    if (Date.now() > result.expireAt) {
      await ForgotPassword.deleteOne({ _id: result._id });
      return res.json({
        code: 400,
        message: "Mã OTP đã hết hạn! Vui lòng yêu cầu lại.",
      });
    }

    res.cookie("token", admin.AdminToken, {
      secure: true,
      httpOnly: false,
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      code: 200,
      message: "Đăng nhập thành công!",
      token: admin.AdminToken
    })
  }
};

// [GET] /admin/auth/logout
module.exports.logout = (req, res) => {
  res.clearCookie("token", {
    secure: true,
    httpOnly: false,
    sameSite: 'None',
  });
  res.json({
    code: 200,
    message: "Đăng xuất thành công!"
  })
};

// [GET] /admin/auth/setting
module.exports.setting = async (req, res) => {
  const setting = await Setting.findOne().lean().select("WebsiteIcon")
  res.json(setting)
};