package com.rentalhousing.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private final JavaMailSender mailSender;

    public MailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendResetPasswordMail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Rental Housing Network - Đặt lại mật khẩu");
        message.setText(
                "Xin chào,\n\n"
                        + "Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.\n\n"
                        + "Nhấn vào liên kết bên dưới để đặt lại mật khẩu:\n"
                        + resetLink
                        + "\n\n"
                        + "Liên kết có hiệu lực trong 30 phút và chỉ được sử dụng một lần.\n\n"
                        + "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này."
        );
        mailSender.send(message);
    }

    public void sendVerificationOtpMail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Rental Housing Network - Xác minh email");
        message.setText(
                "Xin chào,\n\n"
                        + "Mã OTP xác minh email của bạn là:\n\n"
                        + otp
                        + "\n\n"
                        + "Mã có hiệu lực trong 5 phút.\n"
                        + "Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này."
        );
        mailSender.send(message);
    }

    public void sendInvoiceMail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }
}
