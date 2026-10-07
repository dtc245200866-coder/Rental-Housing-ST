package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Invoice;
import com.rentalhousing.backend.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByInvoiceOrderByCreatedAtDesc(Invoice invoice);

    List<Payment> findByInvoice(Invoice invoice);
}
