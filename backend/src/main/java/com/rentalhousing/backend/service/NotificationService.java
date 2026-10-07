package com.rentalhousing.backend.service;

import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.Notification;
import com.rentalhousing.backend.entity.User;
import com.rentalhousing.backend.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification create(User user, String title, String content, String type, String link) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setContent(content);
        n.setType(type);
        n.setLink(link);
        n.setRead(false);
        n.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(n);
    }

    public void notifyInvoiceIssued(Invoice invoice) {
        User tenant = invoice.getContract().getTenant();
        create(tenant,
                "Hoá đơn mới kỳ " + invoice.getPeriod(),
                "Hoá đơn " + invoice.getCode() + " đã được phát hành. Tổng tiền: "
                        + String.format("%,d", invoice.getTotalAmount()) + "đ, hạn thanh toán "
                        + invoice.getDueDate() + ".",
                "INVOICE",
                "/invoices/" + invoice.getId());
    }

    public long unreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }
}
