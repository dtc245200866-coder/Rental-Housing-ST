package com.rentalhousing.backend.repository;

import com.rentalhousing.backend.entity.Room;
import com.rentalhousing.backend.entity.RoomImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomImageRepository extends JpaRepository<RoomImage, Long> {

    List<RoomImage> findByRoomOrderBySortOrderAsc(Room room);

    void deleteByRoom(Room room);
}
