-- MySQL dump 10.13  Distrib 8.0.27, for Win64 (x86_64)
--
-- Host: localhost    Database: he_thong_ban_hang_ai
-- ------------------------------------------------------
-- Server version	8.0.27

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bien_the_san_pham`
--

DROP TABLE IF EXISTS `bien_the_san_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bien_the_san_pham` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int NOT NULL,
  `ma_sku` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_bien_the` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'VD: Đỏ - Size L',
  `thuoc_tinh` json NOT NULL COMMENT '{"color":"Đỏ","size":"L"}',
  `gia` decimal(15,2) DEFAULT NULL COMMENT 'NULL = dùng giá của product',
  `so_luong_ton` int NOT NULL DEFAULT '0',
  `duong_dan_hinh_anh` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_product_variants_sku` (`ma_sku`),
  KEY `idx_variants_product` (`ma_san_pham`),
  KEY `idx_variants_active` (`dang_hoat_dong`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Biến thể sản phẩm (màu, kích cỡ, ...)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bien_the_san_pham`
--

LOCK TABLES `bien_the_san_pham` WRITE;
/*!40000 ALTER TABLE `bien_the_san_pham` DISABLE KEYS */;
/*!40000 ALTER TABLE `bien_the_san_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cai_dat_he_thong`
--

DROP TABLE IF EXISTS `cai_dat_he_thong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cai_dat_he_thong` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `khoa_cai_dat` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `gia_tri_cai_dat` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `mo_ta` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cap_nhat_boi` int DEFAULT NULL,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_settings_key` (`khoa_cai_dat`),
  KEY `fk_settings_admin` (`cap_nhat_boi`),
  CONSTRAINT `fk_settings_admin` FOREIGN KEY (`cap_nhat_boi`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cài đặt hệ thống (key-value store)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cai_dat_he_thong`
--

LOCK TABLES `cai_dat_he_thong` WRITE;
/*!40000 ALTER TABLE `cai_dat_he_thong` DISABLE KEYS */;
INSERT INTO `cai_dat_he_thong` VALUES (1,'store_name','Sales AI Store','Tên cửa hàng',1,'2026-09-10 18:52:36'),(2,'store_email','contact@salesai.com','Email liên hệ cửa hàng',1,'2026-09-10 18:52:36'),(3,'store_phone','1900 1234','Hotline cửa hàng',1,'2026-09-10 18:52:36'),(4,'store_address','123 Đường Nguyễn Huệ, Q.1, TP.HCM','Địa chỉ cửa hàng',1,'2026-09-10 18:52:36'),(5,'currency','VND','Đơn vị tiền tệ',1,'2026-09-10 18:52:36'),(6,'free_shipping_threshold','500000','Ngưỡng miễn phí ship (VND)',1,'2026-09-10 18:52:36'),(7,'default_shipping_fee','30000','Phí ship mặc định',1,'2026-09-10 18:52:36'),(8,'ai_model','gpt-4o-mini','Model OpenAI sử dụng',1,'2026-09-10 18:52:36'),(9,'ai_max_tokens','1000','Số token tối đa mỗi response',1,'2026-09-10 18:52:36'),(10,'ai_system_prompt','Bạn là trợ lý tư vấn bán hàng thông minh của Sales AI Store. Hãy tư vấn nhiệt tình, trung thực và chuyên nghiệp bằng tiếng Việt.','System prompt cho AI Chatbot',1,'2026-09-10 18:52:36'),(11,'rec_cache_ttl_hours','6','TTL cache gợi ý (giờ)',1,'2026-09-10 18:52:36'),(12,'rec_max_items','10','Số sản phẩm gợi ý tối đa',1,'2026-09-10 18:52:36'),(13,'yolo_confidence','0.6','Ngưỡng confidence YOLOv8',1,'2026-09-10 18:52:36'),(14,'max_upload_size_mb','10','Dung lượng upload tối đa (MB)',1,'2026-09-10 18:52:36'),(15,'low_stock_threshold','5','Ngưỡng cảnh báo tồn kho thấp',1,'2026-09-10 18:52:36');
/*!40000 ALTER TABLE `cai_dat_he_thong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `sender_type` enum('user','ai') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `suggested_products` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_messages_session` (`session_id`),
  CONSTRAINT `fk_cm_chatsessions_id` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,'user','Laptop lập trình dưới 20 triệu',NULL,'2026-09-13 10:31:45'),(2,1,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi: Vượt giới hạn API — vui lòng thử lại sau vài giây)*',NULL,'2026-09-13 10:31:50'),(3,1,'user','tai nghe',NULL,'2026-09-13 10:32:22'),(4,1,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi: Vượt giới hạn API — vui lòng thử lại sau vài giây)*',NULL,'2026-09-13 10:32:25'),(5,1,'user','Laptop lập trình dưới 20 triệu',NULL,'2026-09-13 10:36:01'),(6,1,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 404 - [{\'error\': {\'code\': 404, \'message\': \'models/gemini-1.5-flash is not found for API )*',NULL,'2026-09-13 10:36:02'),(7,1,'user','Tai nghe chống ồn tốt nhất',NULL,'2026-09-13 10:37:49'),(8,1,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 404 - [{\'error\': {\'code\': 404, \'message\': \'models/gemini-1.5-flash is not found for API )*',NULL,'2026-09-13 10:37:50'),(9,1,'user','Tai nghe chống ồn tốt nhất',NULL,'2026-09-13 10:39:47'),(10,1,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 404 - [{\'error\': {\'code\': 404, \'message\': \'models/gemini-1.5-flash is not found for API )*',NULL,'2026-09-13 10:39:48'),(11,1,'user','Tai nghe chống ồn tốt nhất',NULL,'2026-09-13 10:40:17'),(12,1,'ai','Chào bạn! Dựa trên tin nhắn của bạn, tôi hiểu rằng bạn đang quan tâm đến hai nhóm sản phẩm: **Laptop phục vụ nhu cầu lập trình (ngân sách dưới 2',NULL,'2026-09-13 10:40:22'),(13,1,'user','Bạn đang tìm kiếm sản phẩm gì hôm nay?',NULL,'2026-09-13 10:40:32'),(14,1,'ai','Dạ xin chào bạn! \n\nRất tiếc hiện tại **hệ thống kho hàng đang gặp gián đoạn tạm thời nên chưa thể tải được danh sách sản phẩm cụ thể** để giới thiệu chính xác mẫu máy và giá bán theo thời gian thực tới bạn.\n\nTuy nhiên, để giúp bạn có định hướng chọn mua chuẩn xác nhất, tôi xin chia sẻ một số tiêu chuẩn tối ưu cho nhu cầu của bạn:\n\n---\n\n### 1. Tiêu chí chọn Laptop lập trình (Ngân sách dưới 20 triệu)\n* **CPU:** Ưu tiên **Intel Core i5 (Gen 12 trở lên)** hoặc **AMD Ryzen 5 (dòng 5000/6000/7000 series)** để xử lý mã nguồn và biên dịch mượt mà.\n* **RAM:** Tối thiểu **16GB RAM** (hoặc 8GB có sẵn khe nâng cấp) để mở nhiều tab trình duyệt, chạy Docker, máy ảo hay các IDE nặng như Android Studio/VS Code.\n* **Ổ cứng:** Tối thiểu **512GB SSD NVMe** để tốc độ đọc/ghi dữ liệu nhanh chóng.\n* **Màn hình & Bàn phím:** Màn hình từ 14 - 15.6 inch Full HD IPS chống chói (Anti-glare); bàn phím có hành trình phím tốt, gõ êm tay.\n\n### 2. Tiêu chí chọn Tai nghe chống ồn (ANC)\n* **Chống ồn chủ động (ANC):** Khử tạp âm môi trường văn phòng hoặc quán cà phê tốt để giữ tập trung tối đa.\n* **Kiểu dáng:** \n  * *Chụp tai (Over-ear):* Cách âm thụ động tốt nhất, đeo êm, pin trâu (30–40 tiếng).\n  * *Nhét tai (In-ear/TWS):* Gọn nhẹ, tiện bỏ túi di chuyển.\n* **Micro:** Có tính năng lọc gió và tạp âm để họp online/call video rõ ràng.\n\n---\n\n**Gợi ý bước tiếp theo để tôi có thể hỗ trợ bạn tốt hơn:**\n1. *Bạn chủ yếu lập trình mảng nào (Web, Mobile, AI/Data hay Game) và có cần laptop mỏng nhẹ thường xuyên di chuyển không?*\n2. *Với tai nghe chống ồn, bạn thích dạng chụp tai (Over-ear) hay nhét tai không dây (In-ear)?*\n3. *Bạn có ưu tiên thương hiệu cụ thể nào không (ví dụ: Asus, Lenovo, Dell, HP hoặc Sony, Apple, Bose)?*',NULL,'2026-09-13 10:40:45'),(15,1,'user','Tai nghe chống ồn tốt nhất',NULL,'2026-09-18 22:35:15'),(16,1,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-09-18 22:35:15'),(17,1,'user','Tai nghe chống ồn tốt nhất',NULL,'2026-09-18 22:36:53'),(18,1,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-09-18 22:37:28'),(19,1,'user','Thử lại',NULL,'2026-09-18 22:37:46'),(20,1,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-09-18 22:38:21'),(21,1,'user','Thử lại',NULL,'2026-09-18 22:46:46'),(22,1,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-09-18 22:47:21'),(23,1,'user','Tai nghe chống ồn tốt nhất',NULL,'2026-09-18 22:47:34'),(24,1,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-09-18 22:48:09'),(25,1,'user','Laptop lập trình dưới 20 triệu',NULL,'2026-10-04 08:34:04'),(26,1,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-10-04 08:34:39'),(27,1,'user','Laptop lập trình dưới 20 triệu',NULL,'2026-10-04 08:38:39'),(28,1,'ai','Dạ xin chào bạn! \n\nRất tiếc vì sự bất tiện này. Hiện tại **hệ thống dữ liệu kho hàng đang gặp lỗi kết nối (\"Không thể tải danh sách sản phẩm lúc này\")**, do đó tôi chưa thể truy xuất và hiển thị danh sách các model cụ thể cùng giá bán thực tế đang có sẵn tại cửa hàng để tư vấn chi tiết cho bạn ngay lúc này.\n\nĐể tránh đưa ra thông tin không chính xác hoặc giới thiệu sản phẩm đã hết hàng, tôi xin phép không tự ý đưa ra các mã sản phẩm cụ thể. \n\nTuy nhiên, để chuẩn bị tốt nhất ngay khi hệ thống kho hoạt động trở lại, bạn có thể tham khảo nhanh các tiêu chí cốt lõi cho hai nhu cầu của bạn:\n\n---\n\n### 1. Laptop',NULL,'2026-10-04 08:38:52'),(29,1,'user','Laptop từ 32 triệu đến 35 triệu',NULL,'2026-10-04 08:39:22'),(30,1,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 503 - [{\'error\': {\'code\': 503, \'message\': \'This model is currently experiencing high dem)*',NULL,'2026-10-04 08:39:40'),(31,1,'user','Laptop từ 32 triệu đến 35 triệu',NULL,'2026-10-04 08:43:07'),(32,1,'ai','Dạ xin chào bạn! \n\nRất tiếc vì sự cố này, hiện tại **hệ thống dữ liệu kho hàng đang gặp gián đoạn tạm thời nên chưa thể tải danh sách sản phẩm cụ thể** (\"Không thể tải danh sách sản phẩm lúc này\"). \n\nTheo quy định của cửa hàng, tôi **không được phép tự tạo ra mã sản phẩm** để tránh trường hợp báo sai tình trạng tồn kho, giá bán hoặc chính sách bảo hành thực tế tới bạn.\n\n---\n\nTuy nhiên, trong tầm ngân sách **32 - 35 triệu đồng**, đây là phân khúc cận cao cấp và cao cấp. Khi hệ thống kho phục hồi, bạn hoàn toàn có thể sở hữu những chiếc máy có tiêu chuẩn cấu hình vượt trội như sau:\n\n* **Nếu bạn chọn dòng Mỏng nhẹ / Doanh nhân:**\n  * **Thiết kế & Màn hình:** Vỏ kim loại nguyên khối, trọng lượng ~1.2 - 1.4 kg; Màn hình OLED hoặc IPS độ phân giải từ 2.8K trở lên, chuẩn màu 100% sRGB/DCI-P3 sắc nét.\n  * **Cấu hình:** Chip Intel Core Ultra 7 / Core i7 thế hệ mới hoặc AMD Ryzen 7; RAM 16GB - 32GB; Pin dùng tốt từ 8',NULL,'2026-10-04 08:43:20'),(33,1,'user','Hệ thống có những loại tai nghe nào ?',NULL,'2026-10-04 08:44:05'),(34,1,'ai','Dạ chào bạn, cửa hàng hiện đang phân phối đầy đủ các dòng tai nghe phổ biến phục vụ cho nhiều mục đích sử dụng khác nhau:\n\n### 1. Tai nghe True Wireless (Không dây hoàn toàn)\n* **Đặc điểm:** Thiết kế nhỏ gọn, kèm hộp sạc bỏ túi tiện lợi, kết nối Bluetooth nhanh chóng.\n* **Tính năng nổi bật:** Nhiều mẫu tích hợp chống ồn chủ động (ANC), xuyên âm (Transparency mode), chống nước khi tập thể thao.\n* **Phù hợp với:** Người hay di chuyển, tập gym/chạy bộ, học sinh - sinh viên và dân văn phòng cần sự linh hoạt.\n\n### 2. Tai nghe Chụp tai (Over-ear / On-ear)\n* **Đặc điểm:** Đệm tai êm ái trùm kín tai, chất lượng âm thanh chi tiết, âm trầm (bass) sâu và thời lượng pin rất dài (thường từ 30 – 60 tiếng).\n* **Tính năng nổi bật:** Khả năng chống ồn chủ động đỉnh cao, cách âm thụ động tốt.\n* **Phù hợp với:** Người yêu âm nhạc chất lượng cao, dân văn phòng cần không gian yên tĩnh tuyệt đối để tập trung, hoặc người hay đi máy bay/tàu xe.\n\n### 3. Tai nghe Gaming (Chuyên game)\n* **Đặc điểm:** Thường là dạng chụp tai có đệm thoáng khí, microphone thu âm to rõ lọc tạp âm, có thể kèm đèn LED RGB.\n* **',NULL,'2026-10-04 08:44:11'),(35,1,'user','Hệ thống có tai nghe Apple AirPods Pro 3nd Gen không ?',NULL,'2026-10-04 08:50:47'),(36,1,'ai','Dạ xin chào bạn!\n\nRất tiếc, hiện tại hệ thống kho của cửa hàng đang gặp gián đoạn nên **không thể tải danh sách sản phẩm lúc này**, do đó tôi chưa thể kiểm tra chính xác tình trạng tồn kho của sản phẩm **Apple AirPods Pro** để báo cho bạn.\n\nHơn nữa, theo thông tin từ hãng Apple, hiện tại dòng AirPods Pro mới nhất trên thị trường là **AirPods Pro Gen 2** (thế hệ thứ 2), chưa ra mắt phiên bản Gen 3 (3rd Gen).\n\nBạn có muốn tham khảo các dòng tai nghe chống ồn không dây khác đang có sẵn hoặc cần hỗ trợ thêm thông tin gì khác không ạ?',NULL,'2026-10-04 08:50:53'),(37,1,'user','Hệ thống có những dòng điện thoại nào',NULL,'2026-10-04 08:52:37'),(38,1,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi: Vượt giới hạn API — vui lòng thử lại sau vài giây)*',NULL,'2026-10-04 08:52:51'),(39,1,'user','hệ thống có những dòng điện thoại nào',NULL,'2026-10-04 08:56:51'),(40,1,'ai','Dạ xin chào bạn!\n\nRất tiếc vì sự bất tiện này, hiện tại **hệ thống dữ liệu kho hàng đang gặp sự cố và không thể tải danh sách sản phẩm lúc này**. \n\nDo không thể truy xuất dữ liệu tồn kho thực tế, tôi chưa thể liệt kê cụ thể các dòng điện thoại đang có sẵn tại cửa hàng để tư vấn chi tiết cho bạn. Theo quy định, cửa hàng không tự ý đưa ra thông tin sản phẩm ngoài danh mục để tránh sai lệch thông tin đến khách hàng.\n\nBạn vui lòng đợi trong giây lát rồi kiểm tra lại, hoặc bạn có thể cho tôi biết thêm về tầm giá và nhu cầu sử dụng (chụp ảnh, chơi game, pin trâu,...) để tôi hỗ trợ tư vấn tiêu chí phù hợp trước được không ạ?',NULL,'2026-10-04 08:57:21'),(41,1,'user','tư vấn các dòng tai nghe',NULL,'2026-10-04 09:08:43'),(42,1,'ai','Dạ xin chào bạn! ?\n\nRất tiếc vì sự cố này, hiện tại hệ thống kho của SalesAI đang gặp gián đoạn nên **không thể tải danh sách sản phẩm lúc này**. Do đó, mình chưa thể kiểm tra và đưa ra danh sách các mẫu tai nghe cụ thể đang sẵn hàng để tư vấn chi tiết cho bạn được.\n\nBạn vui lòng chờ ít phút rồi nhắn lại giúp mình nhé! Hoặc bạn có muốn tham khảo tiêu chí chọn tai nghe theo tầm giá/nhu cầu sử dụng (tập gym, làm việc văn phòng, chơi game...) trước không ạ? ?',NULL,'2026-10-04 09:08:52'),(43,1,'user','điện thoại',NULL,'2026-10-04 09:09:41'),(44,1,'ai','Dạ xin chào bạn! ?\n\nRất tiếc vì sự bất tiện này, hiện tại hệ thống dữ liệu của SalesAI đang gặp gián đoạn nên **không thể tải danh sách sản phẩm lúc này**. Do đó, mình chưa thể kiểm tra cụ thể các dòng điện thoại đang sẵn hàng trong kho để báo giá và tư vấn chi tiết cho bạn được.\n\nBạn vui lòng đợi một chút rồi kiểm tra lại giúp mình nhé! Trong lúc chờ đợi, bạn đang tìm điện thoại trong tầm ngân sách khoảng bao nhiêu và nhu cầu chính là gì (chụp ảnh, chơi game, dùng tác vụ cơ bản...) để lát nữa mình hỗ trợ bạn nhanh nhất nha? ?',NULL,'2026-10-04 09:10:22'),(45,2,'user','test',NULL,'2026-10-04 08:36:20'),(46,2,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-10-04 08:36:55'),(47,3,'user','Tư vấn giúp tôi tai nghe bluetooth chống ồn',NULL,'2026-10-20 11:15:00'),(48,3,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-10-20 11:15:50'),(49,4,'user','Tư vấn giúp tôi tai nghe bluetooth',NULL,'2026-10-20 11:21:10'),(50,4,'ai','Dạ chào bạn! Dưới đây là các sản phẩm phù hợp nhất trong kho của SalesAI:\n\n1. [ID:67] **Apple AirPods 4 ANC**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 4,310,000 VND (giảm 4.0% từ 4,490,000) ⭐ ĐANG GIẢM GIÁ 4.0%\n   ⭐ Đánh giá: 4.9/5 (203 đánh giá)\n   📦 Đã bán: 137 | Còn hàng\n   📝 Mô tả: ANC, Adaptive Audio\n\n2. [ID:73] **Anker Soundcore Liberty 4 NC**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 2,390,000 VND (giảm 4.0% từ 2,490,000) ⭐ ĐANG GIẢM GIÁ 4.0%\n   ⭐ Đánh giá: 4.9/5 (115 đánh giá)\n   📦 Đã bán: 55 | Còn hàng\n   📝 Mô tả: Adaptive ANC, LDAC\n\n3. [ID:8] **Sony WH-1000XM5 Chống ồn**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 7,490,000 VND (giảm 12% từ 8,490,000) ⭐ ĐANG GIẢM GIÁ 12%\n   ⭐ Đánh giá: 4.9/5 (203 đánh giá)\n   📦 Đã bán: 156 | Còn hàng\n   📝 Mô tả: ANC hàng đầu, 30 giờ pin, LDAC Hi-Res Audio\n\n4. [ID:66] **Apple AirPods Pro 2 USB-C**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 5,106,000 VND (giảm 7.0% từ 5,490,000) ⭐ ĐANG GIẢM GIÁ 7.0%\n   ⭐ Đánh giá: 4.9/5 (186 đánh giá)\n   📦 Đã bán: 124 | Còn hàng\n   📝 Mô tả: ANC, Spatial Audio\n\n5. [ID:72] **Sennheiser Momentum 4**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 7,896,000 VND (giảm 7.0% từ 8,490,000) ⭐ ĐANG GIẢM GIÁ 7.0%\n   ⭐ Đánh giá: 4.8/5 (98 đánh giá)\n   📦 Đã bán: 42 | Còn hàng\n   📝 Mô tả: Audiophile, pin 60 giờ\n\nBạn có muốn xem chi tiết thông số hoặc so sánh sản phẩm nào ở trên không ạ? 😊','[67, 73, 8, 66, 72]','2026-10-20 11:21:14'),(51,5,'user','Mình cần tìm ốp iphone',NULL,'2026-10-20 11:24:01'),(52,5,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-10-20 11:24:51'),(53,5,'user','Tìm sản phẩm theo danh mục',NULL,'2026-10-20 11:25:23'),(54,5,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. 🔧\n\nTuy nhiên, tôi có thể giúp bạn:\n- 🔍 Tìm kiếm sản phẩm theo danh mục\n- 💰 Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.',NULL,'2026-10-20 11:25:25'),(55,5,'user','Tai nghe',NULL,'2026-10-20 11:25:36'),(56,5,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'2026-10-20 11:26:26'),(57,6,'user','Laptop lập trình dưới 20 triệu',NULL,'2026-10-20 11:39:44'),(58,6,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. 🔧\n\nTuy nhiên, tôi có thể giúp bạn:\n- 🔍 Tìm kiếm sản phẩm theo danh mục\n- 💰 Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.',NULL,'2026-10-20 11:39:47'),(59,8,'user','Tôi cần laptop khoảng 20 triệu',NULL,'2026-10-21 17:16:00'),(60,8,'ai','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏',NULL,'2026-10-21 17:16:50'),(61,8,'user','Tôi muốn máy khác',NULL,'2026-10-21 17:16:50'),(62,8,'ai','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. 🔧\n\nTuy nhiên, tôi có thể giúp bạn:\n- 🔍 Tìm kiếm sản phẩm theo danh mục\n- 💰 Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.',NULL,'2026-10-21 17:17:22'),(63,9,'user','Tôi cần laptop khoảng 20 triệu để lập trình',NULL,'2026-10-21 17:28:47'),(64,9,'ai','Dạ chào bạn! Rất tiếc là hiện tại kho của SalesAI chưa có mẫu laptop nào trong tầm giá khoảng 20 triệu phù hợp cho nhu cầu lập trình của bạn mất rồi ạ 💻🥲\n\nBạn có muốn thử điều chỉnh ngân sách một chút, hoặc có nhu cầu tìm kiếm dòng sản phẩm/thiết bị nào khác không để mình kiểm tra kho hỗ trợ bạn ngay nhé?',NULL,'2026-10-21 17:28:54'),(65,9,'user','Tôi muốn máy khác',NULL,'2026-10-21 17:28:54'),(66,9,'ai','Dạ, rất tiếc là hiện tại trong kho của SalesAI vẫn chưa có mẫu máy nào khác phù hợp với yêu cầu của bạn mất rồi ạ 💻🥲\n\nBạn có muốn thử điều chỉnh khoảng ngân sách một chút, hoặc có nhu cầu tìm dòng sản phẩm nào khác không để mình kiểm tra hỗ trợ bạn nhé?',NULL,'2026-10-21 17:29:00'),(67,10,'user','Tôi muốn tìm một cái ốp cho điện thoại',NULL,'2026-10-21 17:32:19'),(68,10,'ai','Dạ chào bạn! Rất tiếc là hiện tại cửa hàng bên mình chưa kinh doanh mặt hàng **ốp lưng điện thoại** rồi ạ. 🥺\n\nHiện tại bên mình chuyên về các dòng **điện thoại thông minh chính hãng** (như iPhone 15, iPhone 16 Series hay Xiaomi) đang có chương trình giảm giá rất tốt. \n\nKhông biết bạn có đang quan tâm hay muốn tham khảo lên đời dòng máy mới nào không, để mình hỗ trợ tư vấn chi tiết cho bạn nhé? 📱✨','[{\"id\": 13, \"name\": \"iPhone 16 128GB\", \"slug\": \"iphone-16-128gb\", \"avg_rating\": 5, \"base_price\": 22990000, \"sale_price\": 22070000, \"total_sold\": 70, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+128gb\", \"total_reviews\": 1, \"stock_quantity\": 45, \"discount_percent\": 4, \"short_description\": \"Chip A18, Camera Fusion 48MP\"}, {\"id\": 16, \"name\": \"iPhone 16 Pro Max 256GB\", \"slug\": \"iphone-16-pro-max-256gb\", \"avg_rating\": 4.89, \"base_price\": 34990000, \"sale_price\": 33590000, \"total_sold\": 109, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+max+256gb\", \"total_reviews\": 159, \"stock_quantity\": 66, \"discount_percent\": 4, \"short_description\": \"Titan, A18 Pro, camera 48MP\"}, {\"id\": 22, \"name\": \"Xiaomi 14T Pro 512GB\", \"slug\": \"xiaomi-14t-pro-512gb\", \"avg_rating\": 4.86, \"base_price\": 16990000, \"sale_price\": 16310000, \"total_sold\": 27, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=xiaomi+14t+pro+512gb\", \"total_reviews\": 71, \"stock_quantity\": 27, \"discount_percent\": 4, \"short_description\": \"Dimensity 9300+, Leica\"}, {\"id\": 1, \"name\": \"iPhone 15 Pro Max 256GB\", \"slug\": \"iphone-15-pro-max-256gb\", \"avg_rating\": 4.85, \"base_price\": 34990000, \"sale_price\": 32990000, \"total_sold\": 89, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"total_reviews\": 127, \"stock_quantity\": 47, \"discount_percent\": 0, \"short_description\": \"Chip A17 Pro, Camera 48MP, Dynamic Island, Titan tự nhiên\"}, {\"id\": 15, \"name\": \"iPhone 16 Pro 128GB\", \"slug\": \"iphone-16-pro-128gb\", \"avg_rating\": 4.82, \"base_price\": 28990000, \"sale_price\": 27830000, \"total_sold\": 96, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+128gb\", \"total_reviews\": 142, \"stock_quantity\": 59, \"discount_percent\": 4, \"short_description\": \"Titan, ProMotion 120Hz, camera 48MP\"}]','2026-10-21 17:32:28'),(69,10,'user','ốp lưng & bao da',NULL,'2026-10-21 17:33:54'),(70,10,'ai','Dạ SalesAI có sẵn các mẫu ốp lưng và phụ kiện bảo vệ cực xịn, đang được giảm giá tốt đây ạ! 📱✨\n\nTùy vào dòng máy bạn đang dùng, bạn tham khảo các mẫu dưới đây nhé:\n\n### 🔹 **Dành cho Samsung Galaxy S24 Ultra:**\n* **Ốp Ultra Hybrid**: **566,000 VND** ~~(590,000 VND)~~\n  * ⭐ Đánh giá: **5.0/5** (Bán chạy nhất - 158 lượt mua)\n  * Thiết kế trong suốt khoe trọn màu máy, có lớp phủ chống ố vàng bền bỉ.\n* **Ốp Armor Chống Sốc**: **642,000 VND** ~~(690,000 VND)~~\n  * Đạt chuẩn chống sốc quân đội, bảo vệ máy tối đa khi va đập, rơi rớt.\n\n### 🔹 **Dành cho iPhone:**\n* **Ốp iPhone 16 Pro Silicone**: **1,142,000 VND** ~~(1,190,000 VND)~~\n  * Chất liệu silicone cao cấp cầm êm tay, hỗ trợ sạc **MagSafe** tiện lợi.\n* *(Gợi ý thêm)* **Kính cường lực iPhone 16 Pro Max**: **336,0','[{\"id\": 103, \"name\": \"Ốp Samsung Galaxy S24 Ultra Ultra Hybrid\", \"slug\": \"op-samsung-galaxy-s24-ultra-ultra-hybrid\", \"avg_rating\": 4.96, \"base_price\": 590000, \"sale_price\": 566000, \"total_sold\": 158, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+samsung+galaxy+s24+ultra+ultra+hybrid\", \"total_reviews\": 46, \"stock_quantity\": 87, \"discount_percent\": 4, \"short_description\": \"Trong suốt, chống ố vàng\"}, {\"id\": 109, \"name\": \"Kính cường lực iPhone 16 Pro Max\", \"slug\": \"kinh-cuong-luc-iphone-16-pro-max\", \"avg_rating\": 4.93, \"base_price\": 350000, \"sale_price\": 336000, \"total_sold\": 76, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=kinh+cuong+luc+iphone+16+pro+max\", \"total_reviews\": 148, \"stock_quantity\": 48, \"discount_percent\": 4, \"short_description\": \"9H, phủ oleophobic\"}, {\"id\": 102, \"name\": \"Ốp Samsung Galaxy S24 Ultra Armor\", \"slug\": \"op-samsung-galaxy-s24-ultra-armor\", \"avg_rating\": 4.89, \"base_price\": 690000, \"sale_price\": 642000, \"total_sold\": 145, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+samsung+galaxy+s24+ultra+armor\", \"total_reviews\": 29, \"stock_quantity\": 80, \"discount_percent\": 7, \"short_description\": \"Chống sốc chuẩn quân đội\"}, {\"id\": 108, \"name\": \"Ốp AirPods Pro 2 Leather\", \"slug\": \"op-airpods-pro-2-leather\", \"avg_rating\": 4.86, \"base_price\": 390000, \"sale_price\": 363000, \"total_sold\": 63, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+airpods+pro+2+leather\", \"total_reviews\": 131, \"stock_quantity\": 41, \"discount_percent\": 7, \"short_description\": \"Da tổng hợp, MagSafe\"}, {\"id\": 101, \"name\": \"Ốp iPhone 16 Pro Silicone\", \"slug\": \"op-iphone-16-pro-silicone\", \"avg_rating\": 4.82, \"base_price\": 1190000, \"sale_price\": 1142000, \"total_sold\": 132, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+silicone\", \"total_reviews\": 202, \"stock_quantity\": 73, \"discount_percent\": 4, \"short_description\": \"Silicone mềm, MagSafe\"}]','2026-10-21 17:34:07'),(71,11,'user','Tôi có 8 triệu, muốn điện thoại chụp ảnh đẹp và chơi game tốt',NULL,'2026-10-21 17:51:12'),(72,11,'ai','Hệ thống AI đang gặp sự cố khi xử lý dữ liệu. Vui lòng thử lại sau.',NULL,'2026-10-21 17:51:12'),(73,12,'user','Tôi có 8 triệu, muốn điện thoại chụp ảnh đẹp và chơi game tốt',NULL,'2026-10-21 17:54:01'),(74,12,'ai','AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.\n\nHiện tại hệ thống chưa tìm thấy sản phẩm nào trong kho khớp với yêu cầu của bạn. Bạn có thể kiểm tra danh mục hoặc tìm kiếm theo từ khóa khác nhé!',NULL,'2026-10-21 17:54:04'),(75,13,'user','Tôi có 8 triệu, muốn điện thoại chụp ảnh đẹp và chơi game tốt',NULL,'2026-10-21 17:56:22'),(76,13,'ai','AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.\n\nTuy nhiên, hệ thống đã tự động lọc các sản phẩm phù hợp nhất trong kho dữ liệu cho bạn:\n\n1. **iPhone 16 128GB** (Apple) - Giá: **22.070.000đ** (Còn hàng)\n2. **Ốp iPhone 16 Pro Max MagSafe Trong Suốt** (Apple) - Giá: **490.000đ** (Còn hàng)\n3. **iPhone 15 Pro Max 256GB** (Apple) - Giá: **32.990.000đ** (Còn hàng)\n\n👉 Bạn có thể click vào danh thiếp sản phẩm bên dưới để xem chi tiết và đặt hàng!','[{\"id\": 13, \"name\": \"iPhone 16 128GB\", \"slug\": \"iphone-16-128gb\", \"price\": 22070000, \"rating\": 5, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+128gb\", \"avg_rating\": 5, \"base_price\": 22990000, \"brand_name\": \"Apple\", \"sale_price\": 22070000, \"total_sold\": 70, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+128gb\", \"total_reviews\": 1, \"original_price\": 22990000, \"stock_quantity\": 45}, {\"id\": 100, \"name\": \"Ốp iPhone 16 Pro Max MagSafe Trong Suốt\", \"slug\": \"op-iphone-16-pro-max-magsafe-trong-suot\", \"price\": 490000, \"rating\": 4.75, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+max+magsafe+trong+suot\", \"avg_rating\": 4.75, \"base_price\": 490000, \"brand_name\": \"Apple\", \"sale_price\": null, \"total_sold\": 119, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+max+magsafe+trong+suot\", \"total_reviews\": 185, \"original_price\": 490000, \"stock_quantity\": 66}, {\"id\": 1, \"name\": \"iPhone 15 Pro Max 256GB\", \"slug\": \"iphone-15-pro-max-256gb\", \"price\": 32990000, \"rating\": 4.85, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"avg_rating\": 4.85, \"base_price\": 34990000, \"brand_name\": \"Apple\", \"sale_price\": 32990000, \"total_sold\": 89, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"total_reviews\": 127, \"original_price\": 34990000, \"stock_quantity\": 47}, {\"id\": 16, \"name\": \"iPhone 16 Pro Max 256GB\", \"slug\": \"iphone-16-pro-max-256gb\", \"price\": 33590000, \"rating\": 4.89, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+max+256gb\", \"avg_rating\": 4.89, \"base_price\": 34990000, \"brand_name\": \"Apple\", \"sale_price\": 33590000, \"total_sold\": 109, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+max+256gb\", \"total_reviews\": 159, \"original_price\": 34990000, \"stock_quantity\": 66}]','2026-10-21 17:56:25'),(77,5,'user','Tôi rất thích thương hiệu Samsung, khoảng 8 triệu và ưu tiên pin trâu',NULL,'2026-10-23 01:38:31'),(78,5,'ai','AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.\n\nTuy nhiên, hệ thống đã tự động lọc các sản phẩm phù hợp nhất trong kho dữ liệu cho bạn:\n\n1. **Samsung Galaxy Buds3 Pro** (Samsung) - Giá: **5.490.000đ** (Còn hàng)\n2. **Ốp Samsung Galaxy S24 Ultra Ultra Hybrid** (Spigen) - Giá: **566.000đ** (Còn hàng)\n3. **Samsung 45W Super Fast Charger** (Samsung) - Giá: **854.000đ** (Còn hàng)\n\n👉 Bạn có thể click vào danh thiếp sản phẩm bên dưới để xem chi tiết và đặt hàng!','[{\"id\": 68, \"name\": \"Samsung Galaxy Buds3 Pro\", \"slug\": \"samsung-galaxy-buds3-pro\", \"price\": 5490000, \"rating\": 4.55, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=samsung+galaxy+buds3+pro\", \"avg_rating\": 4.55, \"base_price\": 5490000, \"brand_name\": \"Samsung\", \"sale_price\": null, \"total_sold\": 150, \"is_in_stock\": true, \"category_name\": \"Tai nghe\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=samsung+galaxy+buds3+pro\", \"total_reviews\": 30, \"original_price\": 5490000, \"stock_quantity\": 85}, {\"id\": 103, \"name\": \"Ốp Samsung Galaxy S24 Ultra Ultra Hybrid\", \"slug\": \"op-samsung-galaxy-s24-ultra-ultra-hybrid\", \"price\": 566000, \"rating\": 4.96, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+samsung+galaxy+s24+ultra+ultra+hybrid\", \"avg_rating\": 4.96, \"base_price\": 590000, \"brand_name\": \"Spigen\", \"sale_price\": 566000, \"total_sold\": 158, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+samsung+galaxy+s24+ultra+ultra+hybrid\", \"total_reviews\": 46, \"original_price\": 590000, \"stock_quantity\": 87}, {\"id\": 91, \"name\": \"Samsung 45W Super Fast Charger\", \"slug\": \"samsung-45w-super-fast-charger\", \"price\": 854000, \"rating\": 4.95, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=samsung+45w+super+fast+charger\", \"avg_rating\": 4.95, \"base_price\": 890000, \"brand_name\": \"Samsung\", \"sale_price\": 854000, \"total_sold\": 151, \"is_in_stock\": true, \"category_name\": \"Sạc & Cáp\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=samsung+45w+super+fast+charger\", \"total_reviews\": 35, \"original_price\": 890000, \"stock_quantity\": 84}, {\"id\": 102, \"name\": \"Ốp Samsung Galaxy S24 Ultra Armor\", \"slug\": \"op-samsung-galaxy-s24-ultra-armor\", \"price\": 642000, \"rating\": 4.89, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+samsung+galaxy+s24+ultra+armor\", \"avg_rating\": 4.89, \"base_price\": 690000, \"brand_name\": \"Spigen\", \"sale_price\": 642000, \"total_sold\": 145, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+samsung+galaxy+s24+ultra+armor\", \"total_reviews\": 29, \"original_price\": 690000, \"stock_quantity\": 80}]','2026-10-23 01:38:38'),(79,14,'user','có mẫu điện thoại nào mới không ?',NULL,'2026-10-23 01:48:02'),(80,14,'ai','Chào bạn! Tôi hiểu bạn đang tìm kiếm một chiếc điện thoại mới, đúng không? Dựa trên sở thích và ngân sách của bạn, tôi sẽ gợi ý một số lựa chọn phù hợp nhất.\n\nTheo hồ sơ lưu trữ của tôi, bạn quan tâm đến thương hiệu Samsung và ưu tiên tính năng pin và camera tốt. Tuy nhiên, hiện tại trong danh sách sản phẩm, không có mẫu điện thoại Samsung mới phù hợp với ngân sách của bạn.\n\nTuy nhiên, tôi có thể gợi ý cho bạn một số mẫu điện thoại khác có thể phù hợp hơn:\n\n1. **iPhone 15 Pro Max 256GB** (ID: 1)\n   - **Thương hiệu:** Apple\n   - **Giá bán hiện tại:** 32.990.000đ\n   - **Thông số kỹ thuật:** \n     - Chip: A17 Pro 3nm\n     - Camera: 48MP + 12MP + 12MP\n     - Pin: 4422 mAh\n     - Màn hình: 6.7 inch Super Retina XDR ProMotion 120Hz\n     - Storage: 256GB\n   - **Mô tả nổi bật:** Chip A17 Pro, Camera 48MP, Dynamic Island, Titan tự nhiên\n\nĐây là một lựa chọn tốt với mức giá phù hợp và cấu hình mạnh mẽ. Bạn có thấy mẫu này phù hợp không? Nếu muốn, tôi có thể giúp bạn so sánh thêm với một số mẫu khác trong danh sách.','[{\"id\": 101, \"name\": \"Ốp iPhone 16 Pro Silicone\", \"slug\": \"op-iphone-16-pro-silicone\", \"price\": 1142000, \"rating\": 4.82, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+silicone\", \"avg_rating\": 4.82, \"base_price\": 1190000, \"brand_name\": \"Apple\", \"sale_price\": 1142000, \"total_sold\": 132, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+silicone\", \"total_reviews\": 202, \"original_price\": 1190000, \"stock_quantity\": 72}, {\"id\": 100, \"name\": \"Ốp iPhone 16 Pro Max MagSafe Trong Suốt\", \"slug\": \"op-iphone-16-pro-max-magsafe-trong-suot\", \"price\": 490000, \"rating\": 4.75, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+max+magsafe+trong+suot\", \"avg_rating\": 4.75, \"base_price\": 490000, \"brand_name\": \"Apple\", \"sale_price\": null, \"total_sold\": 119, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+max+magsafe+trong+suot\", \"total_reviews\": 185, \"original_price\": 490000, \"stock_quantity\": 66}, {\"id\": 109, \"name\": \"Kính cường lực iPhone 16 Pro Max\", \"slug\": \"kinh-cuong-luc-iphone-16-pro-max\", \"price\": 336000, \"rating\": 4.93, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=kinh+cuong+luc+iphone+16+pro+max\", \"avg_rating\": 4.93, \"base_price\": 350000, \"brand_name\": \"Spigen\", \"sale_price\": 336000, \"total_sold\": 76, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=kinh+cuong+luc+iphone+16+pro+max\", \"total_reviews\": 148, \"original_price\": 350000, \"stock_quantity\": 48}, {\"id\": 1, \"name\": \"iPhone 15 Pro Max 256GB\", \"slug\": \"iphone-15-pro-max-256gb\", \"price\": 32990000, \"rating\": 4.85, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"avg_rating\": 4.85, \"base_price\": 34990000, \"brand_name\": \"Apple\", \"sale_price\": 32990000, \"total_sold\": 89, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"total_reviews\": 127, \"original_price\": 34990000, \"stock_quantity\": 47}]','2026-10-23 01:48:10'),(81,15,'user','Có mẫu điện thoại nào mới không',NULL,'2026-10-23 01:54:17'),(82,15,'ai','AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.\n\nTuy nhiên, hệ thống đã tự động lọc các sản phẩm phù hợp nhất trong kho dữ liệu cho bạn:\n\n1. **Ốp iPhone 16 Pro Silicone** (Apple) - Giá: **1.142.000đ** (Còn hàng)\n2. **iPhone 16 128GB** (Apple) - Giá: **22.070.000đ** (Còn hàng)\n3. **iPhone 16 Pro Max 256GB** (Apple) - Giá: **33.590.000đ** (Còn hàng)\n\n👉 Bạn có thể click vào danh thiếp sản phẩm bên dưới để xem chi tiết và đặt hàng!','[{\"id\": 101, \"name\": \"Ốp iPhone 16 Pro Silicone\", \"slug\": \"op-iphone-16-pro-silicone\", \"price\": 1142000, \"rating\": 4.82, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+silicone\", \"avg_rating\": 4.82, \"base_price\": 1190000, \"brand_name\": \"Apple\", \"sale_price\": 1142000, \"total_sold\": 132, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+silicone\", \"total_reviews\": 202, \"original_price\": 1190000, \"stock_quantity\": 72}, {\"id\": 13, \"name\": \"iPhone 16 128GB\", \"slug\": \"iphone-16-128gb\", \"price\": 22070000, \"rating\": 5, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+128gb\", \"avg_rating\": 5, \"base_price\": 22990000, \"brand_name\": \"Apple\", \"sale_price\": 22070000, \"total_sold\": 70, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+128gb\", \"total_reviews\": 1, \"original_price\": 22990000, \"stock_quantity\": 45}, {\"id\": 16, \"name\": \"iPhone 16 Pro Max 256GB\", \"slug\": \"iphone-16-pro-max-256gb\", \"price\": 33590000, \"rating\": 4.89, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+max+256gb\", \"avg_rating\": 4.89, \"base_price\": 34990000, \"brand_name\": \"Apple\", \"sale_price\": 33590000, \"total_sold\": 109, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+max+256gb\", \"total_reviews\": 159, \"original_price\": 34990000, \"stock_quantity\": 66}, {\"id\": 1, \"name\": \"iPhone 15 Pro Max 256GB\", \"slug\": \"iphone-15-pro-max-256gb\", \"price\": 32990000, \"rating\": 4.85, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"avg_rating\": 4.85, \"base_price\": 34990000, \"brand_name\": \"Apple\", \"sale_price\": 32990000, \"total_sold\": 89, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"total_reviews\": 127, \"original_price\": 34990000, \"stock_quantity\": 47}]','2026-10-23 01:54:21'),(83,16,'user','Xin chào, bạn có bán điện thoại iPhone không?',NULL,'2026-10-23 01:54:58'),(84,16,'ai','AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.\n\nTuy nhiên, hệ thống đã tự động lọc các sản phẩm phù hợp nhất trong kho dữ liệu cho bạn:\n\n1. **iPhone 16 128GB** (Apple) - Giá: **22.070.000đ** (Còn hàng)\n2. **iPhone 16 Pro Max 256GB** (Apple) - Giá: **33.590.000đ** (Còn hàng)\n3. **iPhone 15 Pro Max 256GB** (Apple) - Giá: **32.990.000đ** (Còn hàng)\n\n👉 Bạn có thể click vào danh thiếp sản phẩm bên dưới để xem chi tiết và đặt hàng!','[{\"id\": 13, \"name\": \"iPhone 16 128GB\", \"slug\": \"iphone-16-128gb\", \"price\": 22070000, \"rating\": 5, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+128gb\", \"avg_rating\": 5, \"base_price\": 22990000, \"brand_name\": \"Apple\", \"sale_price\": 22070000, \"total_sold\": 70, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+128gb\", \"total_reviews\": 1, \"original_price\": 22990000, \"stock_quantity\": 45}, {\"id\": 16, \"name\": \"iPhone 16 Pro Max 256GB\", \"slug\": \"iphone-16-pro-max-256gb\", \"price\": 33590000, \"rating\": 4.89, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+max+256gb\", \"avg_rating\": 4.89, \"base_price\": 34990000, \"brand_name\": \"Apple\", \"sale_price\": 33590000, \"total_sold\": 109, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iphone+16+pro+max+256gb\", \"total_reviews\": 159, \"original_price\": 34990000, \"stock_quantity\": 66}, {\"id\": 1, \"name\": \"iPhone 15 Pro Max 256GB\", \"slug\": \"iphone-15-pro-max-256gb\", \"price\": 32990000, \"rating\": 4.85, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"avg_rating\": 4.85, \"base_price\": 34990000, \"brand_name\": \"Apple\", \"sale_price\": 32990000, \"total_sold\": 89, \"is_in_stock\": true, \"category_name\": \"Điện thoại thông minh\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=iPhone+15+Pro+Max\", \"total_reviews\": 127, \"original_price\": 34990000, \"stock_quantity\": 47}, {\"id\": 101, \"name\": \"Ốp iPhone 16 Pro Silicone\", \"slug\": \"op-iphone-16-pro-silicone\", \"price\": 1142000, \"rating\": 4.82, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+silicone\", \"avg_rating\": 4.82, \"base_price\": 1190000, \"brand_name\": \"Apple\", \"sale_price\": 1142000, \"total_sold\": 132, \"is_in_stock\": true, \"category_name\": \"Ốp lưng & Bao da\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=op+iphone+16+pro+silicone\", \"total_reviews\": 202, \"original_price\": 1190000, \"stock_quantity\": 72}]','2026-10-23 01:55:02'),(85,17,'user','Tư vấn giúp tôi laptop gaming',NULL,'2026-10-23 02:02:52'),(86,17,'ai','AI local hiện chưa sẵn sàng. Vui lòng khởi động Ollama.\n\nTuy nhiên, hệ thống đã tự động lọc các sản phẩm phù hợp nhất trong kho dữ liệu cho bạn:\n\n1. **Lenovo Legion 5i RTX 4060** (Lenovo) - Giá: **35.990.000đ** (Còn hàng)\n2. **Gigabyte Aorus 15 RTX 4060** (Gigabyte) - Giá: **29.990.000đ** (Còn hàng)\n3. **MacBook Pro M4 14 inch** (Apple) - Giá: **38.390.000đ** (Còn hàng)\n\n👉 Bạn có thể click vào danh thiếp sản phẩm bên dưới để xem chi tiết và đặt hàng!','[{\"id\": 43, \"name\": \"Lenovo Legion 5i RTX 4060\", \"slug\": \"lenovo-legion-5i-rtx-4060\", \"price\": 35990000, \"rating\": 4.98, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=lenovo+legion+5i+rtx+4060\", \"avg_rating\": 4.98, \"base_price\": 35990000, \"brand_name\": \"Lenovo\", \"sale_price\": null, \"total_sold\": 136, \"is_in_stock\": true, \"category_name\": \"Laptop Gaming\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=lenovo+legion+5i+rtx+4060\", \"total_reviews\": 198, \"original_price\": 35990000, \"stock_quantity\": 79}, {\"id\": 49, \"name\": \"Gigabyte Aorus 15 RTX 4060\", \"slug\": \"gigabyte-aorus-15-rtx-4060\", \"price\": 29990000, \"rating\": 4.95, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=gigabyte+aorus+15+rtx+4060\", \"avg_rating\": 4.95, \"base_price\": 29990000, \"brand_name\": \"Gigabyte\", \"sale_price\": null, \"total_sold\": 54, \"is_in_stock\": true, \"category_name\": \"Laptop Gaming\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=gigabyte+aorus+15+rtx+4060\", \"total_reviews\": 110, \"original_price\": 29990000, \"stock_quantity\": 40}, {\"id\": 55, \"name\": \"MacBook Pro M4 14 inch\", \"slug\": \"macbook-pro-m4-14-inch\", \"price\": 38390000, \"rating\": 4.92, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=macbook+pro+m4+14+inch\", \"avg_rating\": 4.92, \"base_price\": 39990000, \"brand_name\": \"Apple\", \"sale_price\": 38390000, \"total_sold\": 130, \"is_in_stock\": true, \"category_name\": \"Laptop Văn phòng\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=macbook+pro+m4+14+inch\", \"total_reviews\": 192, \"original_price\": 39990000, \"stock_quantity\": 75}, {\"id\": 42, \"name\": \"Acer Predator Helios Neo 16\", \"slug\": \"acer-predator-helios-neo-16\", \"price\": 47990000, \"rating\": 4.91, \"image_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=acer+predator+helios+neo+16\", \"avg_rating\": 4.91, \"base_price\": 49990000, \"brand_name\": \"Acer\", \"sale_price\": 47990000, \"total_sold\": 123, \"is_in_stock\": true, \"category_name\": \"Laptop Gaming\", \"thumbnail_url\": \"https://placehold.co/500x500/1a1a2e/ffffff?text=acer+predator+helios+neo+16\", \"total_reviews\": 181, \"original_price\": 49990000, \"stock_quantity\": 72}]','2026-10-23 02:02:56');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_uuid` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `total_messages` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_sessions_uuid` (`session_uuid`),
  KEY `idx_chat_sessions_user` (`user_id`),
  CONSTRAINT `fk_cs_nguoidung_user` FOREIGN KEY (`user_id`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_sessions`
--

LOCK TABLES `chat_sessions` WRITE;
/*!40000 ALTER TABLE `chat_sessions` DISABLE KEYS */;
INSERT INTO `chat_sessions` VALUES (1,'f292f52c-c9a8-45ba-811d-accf099a15da',6,'Laptop lập trình dưới 20 triệu','active',44,'2026-09-13 10:31:45','2026-10-04 09:10:22'),(2,'836de76d-5ceb-47d1-b83b-7fbedbddc488',NULL,'test','active',2,'2026-10-04 08:36:20','2026-10-04 08:36:55'),(3,'dc22e521-398f-40ec-836b-2cc40bd0f8b1',NULL,'Tư vấn giúp tôi tai nghe bluetooth chống ồn','active',2,'2026-10-20 11:15:00','2026-10-20 11:15:50'),(4,'165ec9d2-f12a-4ab1-9204-777d569ec10b',NULL,'Tư vấn giúp tôi tai nghe bluetooth','active',2,'2026-10-20 11:21:10','2026-10-20 11:21:14'),(5,'076a2406-a82a-42ae-8940-7c44603bd74f',6,'Mình cần tìm ốp iphone','active',8,'2026-10-20 11:24:01','2026-10-23 01:38:38'),(6,'9b2848a0-0e79-482a-82f5-6136e8d3c9ec',12,'Laptop lập trình dưới 20 triệu','active',2,'2026-10-20 11:39:44','2026-10-20 11:39:47'),(7,'6fe5d8d3-a315-498c-a046-239c9aad4d25',NULL,'Tư vấn laptop gaming','active',0,'2026-10-21 17:14:57','2026-10-21 17:14:57'),(8,'2dcb840d-0f2c-46c2-bdd5-3f55cd13f2b0',NULL,'Tư vấn laptop gaming','active',4,'2026-10-21 17:16:00','2026-10-21 17:17:22'),(9,'ed108a84-5c5d-4411-901d-50aab58c1308',13,'Tư vấn laptop lập trình 2026','active',4,'2026-10-21 17:28:47','2026-10-21 17:29:00'),(10,'344dd606-a5ff-4047-8183-2254e469d124',12,'Tư vấn sản phẩm mới','active',4,'2026-10-21 17:31:54','2026-10-21 17:34:07'),(11,'2701c8f0-ca7c-4851-acb0-3cb7fd39fbd0',NULL,'Tư vấn điện thoại','active',2,'2026-10-21 17:51:12','2026-10-21 17:51:12'),(12,'c0ca9700-4b07-42d1-aa76-b69984276811',NULL,'Tư vấn điện thoại','active',2,'2026-10-21 17:54:01','2026-10-21 17:54:04'),(13,'125ca32d-517d-46ed-abed-813fba47ed83',NULL,'Tư vấn điện thoại','active',2,'2026-10-21 17:56:22','2026-10-21 17:56:25'),(14,'edd6e153-20f6-4a47-bd6a-e214234ade9c',6,'Tư vấn điện thoại','active',2,'2026-10-23 01:48:02','2026-10-23 01:48:10'),(15,'f44a280e-f03f-4a3f-9e8d-a2717283c3c4',12,'Tư vấn điện thoại','active',2,'2026-10-23 01:54:17','2026-10-23 01:54:21'),(16,'87d4de41-5d92-42ed-aa01-cd4adfc17047',NULL,'Tư vấn điện thoại','active',2,'2026-10-23 01:54:58','2026-10-23 01:55:02'),(17,'974a7f14-3484-415d-9233-2b40f0602f73',NULL,'Tư vấn laptop gaming','active',2,'2026-10-23 02:02:52','2026-10-23 02:02:56');
/*!40000 ALTER TABLE `chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chi_tiet_don_hang`
--

DROP TABLE IF EXISTS `chi_tiet_don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_don_hang` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` int NOT NULL,
  `ma_san_pham` int NOT NULL,
  `ma_bien_the` int DEFAULT NULL,
  `ten_san_pham` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Snapshot tên SP',
  `hinh_anh_san_pham` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot ảnh SP',
  `ten_bien_the` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Snapshot tên biến thể',
  `don_gia` decimal(15,2) NOT NULL COMMENT 'Giá tại thời điểm mua',
  `so_luong` int NOT NULL,
  `tam_tinh` decimal(15,2) NOT NULL COMMENT 'unit_price * quantity',
  PRIMARY KEY (`ma_id`),
  KEY `fk_order_items_variant` (`ma_bien_the`),
  KEY `idx_order_items_order` (`ma_don_hang`),
  KEY `idx_order_items_product` (`ma_san_pham`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`ma_bien_the`) REFERENCES `bien_the_san_pham` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết sản phẩm trong đơn hàng (snapshot giá)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chi_tiet_don_hang`
--

LOCK TABLES `chi_tiet_don_hang` WRITE;
/*!40000 ALTER TABLE `chi_tiet_don_hang` DISABLE KEYS */;
/*!40000 ALTER TABLE `chi_tiet_don_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chi_tiet_gio_hang`
--

DROP TABLE IF EXISTS `chi_tiet_gio_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_gio_hang` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_gio_hang` int NOT NULL,
  `ma_san_pham` int NOT NULL,
  `ma_bien_the` int DEFAULT NULL COMMENT 'NULL nếu không có biến thể',
  `so_luong` int NOT NULL DEFAULT '1',
  `ngay_them` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_cart_product_variant` (`ma_gio_hang`,`ma_san_pham`,`ma_bien_the`),
  KEY `fk_cart_items_variant` (`ma_bien_the`),
  KEY `idx_cart_items_cart` (`ma_gio_hang`),
  KEY `idx_cart_items_product` (`ma_san_pham`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`ma_gio_hang`) REFERENCES `gio_hang` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_items_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`ma_bien_the`) REFERENCES `bien_the_san_pham` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Chi tiết sản phẩm trong giỏ hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chi_tiet_gio_hang`
--

LOCK TABLES `chi_tiet_gio_hang` WRITE;
/*!40000 ALTER TABLE `chi_tiet_gio_hang` DISABLE KEYS */;
/*!40000 ALTER TABLE `chi_tiet_gio_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danh_gia`
--

DROP TABLE IF EXISTS `danh_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int NOT NULL,
  `ma_san_pham` int NOT NULL,
  `ma_don_hang` int DEFAULT NULL COMMENT 'Đơn hàng đã mua sản phẩm này',
  `diem_danh_gia` tinyint NOT NULL COMMENT '1-5 sao',
  `tieu_de` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `binh_luan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `hinh_anh` json DEFAULT NULL COMMENT 'Mảng URL ảnh đính kèm',
  `da_xac_minh` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = đã mua thật, được xác minh',
  `luot_huu_ich` int NOT NULL DEFAULT '0' COMMENT 'Số lượt "hữu ích"',
  `dang_hien_thi` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Admin ẩn/hiện',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_reviews_user_order_product` (`ma_nguoi_dung`,`ma_san_pham`,`ma_don_hang`),
  KEY `fk_reviews_order` (`ma_don_hang`),
  KEY `idx_reviews_product` (`ma_san_pham`),
  KEY `idx_reviews_user` (`ma_nguoi_dung`),
  KEY `idx_reviews_rating` (`diem_danh_gia`),
  KEY `idx_reviews_visible` (`dang_hien_thi`),
  CONSTRAINT `fk_reviews_order` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_reviews_rating` CHECK ((`diem_danh_gia` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đánh giá sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_gia`
--

LOCK TABLES `danh_gia` WRITE;
/*!40000 ALTER TABLE `danh_gia` DISABLE KEYS */;
/*!40000 ALTER TABLE `danh_gia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danh_muc`
--

DROP TABLE IF EXISTS `danh_muc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_muc` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_danh_muc_cha` int DEFAULT NULL COMMENT 'NULL = danh mục gốc',
  `ten` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duong_dan` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `duong_dan_hinh_anh` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu` smallint NOT NULL DEFAULT '0',
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_categories_slug` (`duong_dan`),
  KEY `idx_categories_parent` (`ma_danh_muc_cha`),
  KEY `idx_categories_active` (`dang_hoat_dong`),
  KEY `idx_categories_slug` (`duong_dan`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`ma_danh_muc_cha`) REFERENCES `danh_muc` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục sản phẩm dạng cây phân cấp';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_muc`
--

LOCK TABLES `danh_muc` WRITE;
/*!40000 ALTER TABLE `danh_muc` DISABLE KEYS */;
INSERT INTO `danh_muc` VALUES (1,NULL,'Điện thoại & Tablet','dien-thoai-tablet','Thiết bị di động',NULL,1,0,'2026-09-10 18:52:36','2026-10-23 17:12:45'),(2,NULL,'Laptop & Máy tính','laptop-may-tinh','Máy tính xách tay và để bàn',NULL,2,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(3,NULL,'Âm thanh','am-thanh','Tai nghe, loa, thiết bị âm thanh',NULL,3,0,'2026-09-10 18:52:36','2026-10-23 17:13:53'),(4,NULL,'Phụ kiện công nghệ','phu-kien-cong-nghe','Phụ kiện các loại thiết bị',NULL,4,0,'2026-09-10 18:52:36','2026-10-23 17:13:39'),(5,NULL,'Đồng hồ thông minh','dong-ho-thong-minh','Smartwatch, wearable',NULL,5,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(6,1,'Điện thoại thông minh','dien-thoai-thong-minh','Smartphone các hãng',NULL,1,1,'2026-09-10 18:52:36','2026-10-23 17:16:30'),(7,1,'Máy tính bảng','may-tinh-bang','iPad, Android tablet',NULL,2,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(8,2,'Laptop Gaming','laptop-gaming','Laptop chuyên game',NULL,1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(9,2,'Laptop Văn phòng','laptop-van-phong','Laptop cho học tập và làm việc',NULL,2,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(10,3,'Tai nghe','tai-nghe','Tai nghe có dây và không dây',NULL,1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(11,3,'Loa Bluetooth','loa-bluetooth','Loa di động không dây',NULL,2,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(12,4,'Sạc & Cáp','sac-cap','Adapter sạc và dây cáp',NULL,1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(13,4,'Ốp lưng & Bao da','op-lung-bao-da','Bảo vệ thiết bị',NULL,2,1,'2026-09-10 18:52:36','2026-09-10 18:52:36');
/*!40000 ALTER TABLE `danh_muc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dia_chi_nguoi_dung`
--

DROP TABLE IF EXISTS `dia_chi_nguoi_dung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dia_chi_nguoi_dung` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int NOT NULL,
  `ten_nguoi_nhan` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai_nguoi_nhan` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tinh_thanh` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tỉnh / Thành phố',
  `quan_huyen` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Quận / Huyện',
  `phuong_xa` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Phường / Xã',
  `dia_chi_chi_tiet` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Số nhà, tên đường',
  `mac_dinh` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_addresses_user_id` (`ma_nguoi_dung`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Địa chỉ giao hàng của người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dia_chi_nguoi_dung`
--

LOCK TABLES `dia_chi_nguoi_dung` WRITE;
/*!40000 ALTER TABLE `dia_chi_nguoi_dung` DISABLE KEYS */;
INSERT INTO `dia_chi_nguoi_dung` VALUES (1,3,'Nguyễn Văn A','0987654321','TP. Hồ Chí Minh','Quận 1','Phường Bến Nghé','123 Đường Lê Lợi',1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(2,3,'Nguyễn Văn A','0987654321','TP. Hồ Chí Minh','Quận 3','Phường Võ Thị Sáu','45 Đường Điện Biên Phủ',0,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(3,4,'Trần Thị C','0976543210','Hà Nội','Quận Hoàn Kiếm','Phường Hàng Bông','78 Hàng Gai',1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(4,5,'Lê Văn D','0965432109','Đà Nẵng','Quận Hải Châu','Phường Thạch Thang','12 Trần Phú',1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(5,6,'Thanh','0777498884','Đà Nẵng','Hài Châu','Hoà Cường','Ngô Thị Liễu',1,'2026-09-11 18:59:34','2026-09-11 18:59:34'),(6,8,'Thanh','0777498884','Đà Nẵng','Hài Châu','Hoà Cường','Ngô Thị Liễu',1,'2026-10-11 13:49:37','2026-10-11 13:49:37'),(10,12,'abc','0984724871','dn','dn','dn','dn',1,'2026-10-20 11:38:50','2026-10-20 11:38:50');
/*!40000 ALTER TABLE `dia_chi_nguoi_dung` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `don_hang`
--

DROP TABLE IF EXISTS `don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `don_hang` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã hiển thị: ORD-20260910-0001',
  `ma_nguoi_dung` int NOT NULL,
  `trang_thai` enum('pending','processing','shipped','delivered','cancelled','returned') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `tam_tinh` decimal(15,2) NOT NULL COMMENT 'Tổng trước giảm giá',
  `so_tien_giam` decimal(15,2) NOT NULL DEFAULT '0.00',
  `phi_van_chuyen` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tong_tien` decimal(15,2) NOT NULL COMMENT 'Tổng sau giảm + phí ship',
  `ma_ma_giam_gia` int DEFAULT NULL,
  `phuong_thuc_thanh_toan` enum('COD','VNPAY','MOMO','BANK_TRANSFER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COD',
  `trang_thai_thanh_toan` enum('pending','paid','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `dia_chi_giao_hang` json NOT NULL COMMENT 'Snapshot địa chỉ giao hàng',
  `ghi_chu_khach_hang` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ghi_chu_quan_tri` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `giao_hang_luc` datetime DEFAULT NULL,
  `giao_thanh_cong_luc` datetime DEFAULT NULL,
  `huy_luc` datetime DEFAULT NULL,
  `ly_do_huy` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_orders_code` (`ma_don_hang`),
  KEY `fk_orders_coupon` (`ma_ma_giam_gia`),
  KEY `idx_orders_user` (`ma_nguoi_dung`),
  KEY `idx_orders_status` (`trang_thai`),
  KEY `idx_orders_payment` (`trang_thai_thanh_toan`),
  KEY `idx_orders_created` (`ngay_tao`),
  KEY `idx_orders_code` (`ma_don_hang`),
  CONSTRAINT `fk_orders_coupon` FOREIGN KEY (`ma_ma_giam_gia`) REFERENCES `ma_giam_gia` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `don_hang`
--

LOCK TABLES `don_hang` WRITE;
/*!40000 ALTER TABLE `don_hang` DISABLE KEYS */;
INSERT INTO `don_hang` VALUES (1,'ORD-20260901-0001',3,'delivered',32990000.00,3299000.00,0.00,29691000.00,1,'VNPAY','paid','{\"ward\": \"Phường Bến Nghé\", \"district\": \"Quận 1\", \"province\": \"TP. Hồ Chí Minh\", \"address_detail\": \"123 Đường Lê Lợi\", \"recipient_name\": \"Nguyễn Văn A\", \"recipient_phone\": \"0987654321\"}','Giao giờ hành chính',NULL,NULL,NULL,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(2,'ORD-20260905-0002',3,'delivered',7490000.00,0.00,30000.00,7520000.00,NULL,'COD','paid','{\"ward\": \"Phường Bến Nghé\", \"district\": \"Quận 1\", \"province\": \"TP. Hồ Chí Minh\", \"address_detail\": \"123 Đường Lê Lợi\", \"recipient_name\": \"Nguyễn Văn A\", \"recipient_phone\": \"0987654321\"}',NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(3,'ORD-20260908-0003',4,'shipped',42990000.00,2000000.00,0.00,40990000.00,2,'VNPAY','paid','{\"ward\": \"Phường Hàng Bông\", \"district\": \"Quận Hoàn Kiếm\", \"province\": \"Hà Nội\", \"address_detail\": \"78 Hàng Gai\", \"recipient_name\": \"Trần Thị C\", \"recipient_phone\": \"0976543210\"}',NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(4,'ORD-20260910-0004',5,'pending',11490000.00,1149000.00,30000.00,10371000.00,1,'COD','pending','{\"ward\": \"Phường Thạch Thang\", \"district\": \"Quận Hải Châu\", \"province\": \"Đà Nẵng\", \"address_detail\": \"12 Trần Phú\", \"recipient_name\": \"Lê Văn D\", \"recipient_phone\": \"0965432109\"}','Gọi trước khi giao',NULL,NULL,NULL,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(5,'ORD-20260911-8045',6,'pending',32990000.00,0.00,0.00,32990000.00,NULL,'COD','pending','{\"ward\": \"Hoà Cường\", \"district\": \"Hài Châu\", \"province\": \"Đà Nẵng\", \"address_detail\": \"Ngô Thị Liễu\", \"recipient_name\": \"Thanh\", \"recipient_phone\": \"0777498884\"}',NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-11 18:59:36','2026-09-11 18:59:36'),(6,'ORD-20261011-2705',6,'pending',32990000.00,0.00,0.00,32990000.00,NULL,'COD','pending','{\"ward\": \"Hoà Cường\", \"district\": \"Hài Châu\", \"province\": \"Đà Nẵng\", \"address_detail\": \"Ngô Thị Liễu\", \"recipient_name\": \"Thanh\", \"recipient_phone\": \"0777498884\"}',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-11 13:19:55','2026-10-11 13:19:55'),(7,'ORD-20261011-9717',8,'delivered',32990000.00,0.00,0.00,32990000.00,NULL,'COD','pending','{\"ward\": \"Hoà Cường\", \"district\": \"Hài Châu\", \"province\": \"Đà Nẵng\", \"address_detail\": \"Ngô Thị Liễu\", \"recipient_name\": \"Thanh\", \"recipient_phone\": \"0777498884\"}',NULL,NULL,NULL,'2026-10-20 11:33:39',NULL,NULL,'2026-10-11 13:49:38','2026-10-20 11:33:39'),(11,'ORD-20261020-4961',12,'shipped',15990000.00,0.00,0.00,15990000.00,NULL,'COD','pending','{\"ward\": \"dn\", \"district\": \"dn\", \"province\": \"dn\", \"address_detail\": \"dn\", \"recipient_name\": \"abc\", \"recipient_phone\": \"0984724871\"}',NULL,NULL,'2026-10-20 11:39:17',NULL,NULL,NULL,'2026-10-20 11:38:51','2026-10-20 11:39:17'),(12,'ORD-20261021-3337',12,'pending',1142000.00,0.00,0.00,1142000.00,NULL,'COD','pending','{\"ward\": \"dn\", \"district\": \"dn\", \"province\": \"dn\", \"address_detail\": \"dn\", \"recipient_name\": \"abc\", \"recipient_phone\": \"0984724871\"}',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-21 17:34:35','2026-10-21 17:34:35');
/*!40000 ALTER TABLE `don_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giao_dich_thanh_toan`
--

DROP TABLE IF EXISTS `giao_dich_thanh_toan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giao_dich_thanh_toan` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` int NOT NULL,
  `ma_giao_dich` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã GD từ cổng thanh toán',
  `phuong_thuc_thanh_toan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_tien` decimal(15,2) NOT NULL,
  `trang_thai` enum('pending','success','failed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `phan_hoi_cong_thanh_toan` json DEFAULT NULL COMMENT 'Response raw từ cổng TT',
  `xu_ly_luc` datetime DEFAULT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_payment_tx_order` (`ma_don_hang`),
  KEY `idx_payment_tx_status` (`trang_thai`),
  CONSTRAINT `fk_payment_tx_order` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giao dịch thanh toán';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giao_dich_thanh_toan`
--

LOCK TABLES `giao_dich_thanh_toan` WRITE;
/*!40000 ALTER TABLE `giao_dich_thanh_toan` DISABLE KEYS */;
INSERT INTO `giao_dich_thanh_toan` VALUES (1,1,'VNPAY-20260901-123456789','VNPAY',29691000.00,'success',NULL,'2026-09-01 10:32:00','2026-09-10 18:52:36'),(2,2,NULL,'COD',7520000.00,'success',NULL,'2026-09-06 14:15:00','2026-09-10 18:52:36'),(3,3,'VNPAY-20260908-987654321','VNPAY',40990000.00,'success',NULL,'2026-09-08 09:20:00','2026-09-10 18:52:36'),(4,4,NULL,'COD',10371000.00,'pending',NULL,NULL,'2026-09-10 18:52:36');
/*!40000 ALTER TABLE `giao_dich_thanh_toan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gio_hang`
--

DROP TABLE IF EXISTS `gio_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gio_hang` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int NOT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_carts_user` (`ma_nguoi_dung`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giỏ hàng (mỗi user có 1 giỏ)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gio_hang`
--

LOCK TABLES `gio_hang` WRITE;
/*!40000 ALTER TABLE `gio_hang` DISABLE KEYS */;
INSERT INTO `gio_hang` VALUES (1,3,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(2,4,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(3,5,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(4,6,'2026-09-11 18:58:41','2026-09-11 18:58:41'),(5,8,'2026-10-11 13:49:28','2026-10-11 13:49:28'),(9,12,'2026-10-20 11:38:31','2026-10-20 11:38:31');
/*!40000 ALTER TABLE `gio_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goi_y_san_pham`
--

DROP TABLE IF EXISTS `goi_y_san_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goi_y_san_pham` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL COMMENT 'NULL = gợi ý chung (popularity)',
  `ma_san_pham` int DEFAULT NULL COMMENT 'NULL = gợi ý cho user, không phải SP cụ thể',
  `loai_goi_y` enum('personal','similar','popularity','bought_together','trending') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `danh_sach_ma_san_pham_goi_y` json NOT NULL COMMENT 'Mảng product_id được gợi ý, có kèm score',
  `thuat_toan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'VD: collaborative_filtering, content_based',
  `diem` decimal(6,4) DEFAULT NULL COMMENT 'Điểm tin cậy tổng thể 0-1',
  `tao_luc` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `het_han_luc` datetime NOT NULL COMMENT 'Cache TTL',
  PRIMARY KEY (`ma_id`),
  KEY `idx_rec_user` (`ma_nguoi_dung`),
  KEY `idx_rec_product` (`ma_san_pham`),
  KEY `idx_rec_type` (`loai_goi_y`),
  KEY `idx_rec_expires` (`het_han_luc`),
  CONSTRAINT `fk_rec_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rec_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cache kết quả gợi ý sản phẩm từ Python Recommendation Engine';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goi_y_san_pham`
--

LOCK TABLES `goi_y_san_pham` WRITE;
/*!40000 ALTER TABLE `goi_y_san_pham` DISABLE KEYS */;
/*!40000 ALTER TABLE `goi_y_san_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hanh_vi_nguoi_dung`
--

DROP TABLE IF EXISTS `hanh_vi_nguoi_dung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hanh_vi_nguoi_dung` (
  `ma_id` bigint NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL COMMENT 'NULL = khách vãng lai (guest)',
  `ma_phien` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID session browser',
  `ma_san_pham` int NOT NULL,
  `loai_hanh_dong` enum('view','click','add_to_cart','remove_from_cart','purchase','yeu_thich','like','review','search') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thoi_luong` int DEFAULT NULL COMMENT 'Thời gian xem (giây), chỉ có với action=view',
  `tu_khoa_tim_kiem` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Từ khóa tìm kiếm (chỉ có với action=search)',
  `nguon` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nguồn: homepage, search, chatbot, recommendation',
  `du_lieu_bo_sung` json DEFAULT NULL COMMENT 'Thông tin thêm: query, position, ...',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_behaviors_user` (`ma_nguoi_dung`),
  KEY `idx_behaviors_product` (`ma_san_pham`),
  KEY `idx_behaviors_action` (`loai_hanh_dong`),
  KEY `idx_behaviors_session` (`ma_phien`),
  KEY `idx_behaviors_created` (`ngay_tao`),
  KEY `idx_behaviors_keyword` (`tu_khoa_tim_kiem`(100)),
  KEY `idx_behaviors_user_product` (`ma_nguoi_dung`,`ma_san_pham`),
  KEY `idx_behaviors_action_time` (`loai_hanh_dong`,`ngay_tao`),
  CONSTRAINT `fk_behaviors_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_behaviors_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log hành vi người dùng — đầu vào cho Recommendation Engine';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hanh_vi_nguoi_dung`
--

LOCK TABLES `hanh_vi_nguoi_dung` WRITE;
/*!40000 ALTER TABLE `hanh_vi_nguoi_dung` DISABLE KEYS */;
INSERT INTO `hanh_vi_nguoi_dung` VALUES (1,12,'c4aea5a3-3187-49a7-b078-d4dfd178a26d',1,'view',NULL,NULL,'product_page',NULL,'2026-10-23 17:36:14'),(2,12,'c4aea5a3-3187-49a7-b078-d4dfd178a26d',1,'view',6,NULL,'product_page',NULL,'2026-10-23 17:36:14');
/*!40000 ALTER TABLE `hanh_vi_nguoi_dung` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hinh_anh_san_pham`
--

DROP TABLE IF EXISTS `hinh_anh_san_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hinh_anh_san_pham` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int NOT NULL,
  `duong_dan_hinh_anh` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `van_ban_thay_the` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu` smallint NOT NULL DEFAULT '0',
  `la_anh_chinh` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_images_product` (`ma_san_pham`),
  KEY `idx_images_primary` (`la_anh_chinh`),
  CONSTRAINT `fk_images_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hình ảnh sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hinh_anh_san_pham`
--

LOCK TABLES `hinh_anh_san_pham` WRITE;
/*!40000 ALTER TABLE `hinh_anh_san_pham` DISABLE KEYS */;
/*!40000 ALTER TABLE `hinh_anh_san_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_su_dang_nhap`
--

DROP TABLE IF EXISTS `lich_su_dang_nhap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_dang_nhap` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int DEFAULT NULL COMMENT 'NULL nếu đăng nhập thất bại với email không tồn tại',
  `dia_chi_email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email đăng nhập',
  `dang_nhap_luc` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm đăng nhập',
  `dang_xuat_luc` timestamp NULL DEFAULT NULL COMMENT 'Thời điểm đăng xuất',
  `dia_chi_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Địa chỉ IP',
  `trinh_duyet_thiet_bi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Thông tin trình duyệt/thiết bị',
  `trang_thai_dang_nhap` enum('SUCCESS','FAILED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUCCESS',
  `ly_do_that_bai` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lý do thất bại',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_login_history_user` (`ma_nguoi_dung`),
  KEY `idx_login_history_email` (`dia_chi_email`),
  KEY `idx_login_history_status` (`trang_thai_dang_nhap`),
  KEY `idx_login_history_time` (`dang_nhap_luc`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử đăng nhập / đăng xuất';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_su_dang_nhap`
--

LOCK TABLES `lich_su_dang_nhap` WRITE;
/*!40000 ALTER TABLE `lich_su_dang_nhap` DISABLE KEYS */;
INSERT INTO `lich_su_dang_nhap` VALUES (1,NULL,'customer@example.com','2026-10-11 06:39:51',NULL,'::1','axios/1.20.0','FAILED','Email không tồn tại','2026-10-11 06:39:51'),(2,NULL,'admin@example.com','2026-10-11 06:39:51',NULL,'::1','axios/1.20.0','FAILED','Email không tồn tại','2026-10-11 06:39:51'),(3,1,'admin@salesai.com','2026-10-11 06:40:54',NULL,'::1','axios/1.20.0','FAILED','Mật khẩu không đúng','2026-10-11 06:40:54'),(4,1,'admin@salesai.com','2026-10-11 06:41:39',NULL,'::1','axios/1.20.0','SUCCESS',NULL,'2026-10-11 06:41:39'),(5,8,'inkodota1187@gmail.com','2026-10-11 06:48:37',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','FAILED','Mật khẩu không đúng','2026-10-11 06:48:37'),(6,8,'inkodota1187@gmail.com','2026-10-11 06:48:38',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','FAILED','Mật khẩu không đúng','2026-10-11 06:48:38'),(7,8,'inkodota1187@gmail.com','2026-10-11 06:48:40',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','FAILED','Mật khẩu không đúng','2026-10-11 06:48:40'),(8,8,'inkodota1187@gmail.com','2026-10-11 06:48:41',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','FAILED','Mật khẩu không đúng','2026-10-11 06:48:41'),(9,8,'inkodota1187@gmail.com','2026-10-11 06:48:43',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-11 06:48:43'),(16,6,'inkodota11873@gmail.com','2026-10-20 04:23:17',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-20 04:23:17'),(17,6,'inkodota11873@gmail.com','2026-10-20 04:26:56',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-20 04:26:56'),(18,8,'inkodota1187@gmail.com','2026-10-20 04:27:07',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-20 04:27:07'),(19,6,'inkodota11873@gmail.com','2026-10-20 04:34:09',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-20 04:34:09'),(20,8,'inkodota1187@gmail.com','2026-10-20 04:34:18',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-20 04:34:18'),(21,NULL,'inkodota118@gmail.com','2026-10-20 04:38:23',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','FAILED','Email không tồn tại','2026-10-20 04:38:23'),(22,12,'inkodota11@gmail.com','2026-10-20 04:38:31',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-20 04:38:31'),(23,NULL,'admin@salesai.vn','2026-10-21 10:17:39',NULL,'::1','axios/1.20.0','FAILED','Email không tồn tại','2026-10-21 10:17:39'),(24,1,'admin@salesai.com','2026-10-21 10:17:56',NULL,'::1','axios/1.20.0','SUCCESS',NULL,'2026-10-21 10:17:56'),(25,12,'inkodota11@gmail.com','2026-10-21 10:26:37',NULL,'::1','axios/1.20.0','FAILED','Mật khẩu không đúng','2026-10-21 10:26:37'),(26,13,'customer1_test@salesai.com','2026-10-21 10:28:47',NULL,'::1','axios/1.20.0','SUCCESS',NULL,'2026-10-21 10:28:47'),(27,14,'customer2_test@salesai.com','2026-10-21 10:29:01',NULL,'::1','axios/1.20.0','SUCCESS',NULL,'2026-10-21 10:29:01'),(28,1,'admin@salesai.com','2026-10-21 10:29:02',NULL,'::1','axios/1.20.0','SUCCESS',NULL,'2026-10-21 10:29:02'),(29,NULL,'admin@example.com','2026-10-21 10:32:33',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','FAILED','Email không tồn tại','2026-10-21 10:32:33'),(30,6,'inkodota11873@gmail.com','2026-10-21 10:32:38',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-21 10:32:38'),(31,6,'inkodota11873@gmail.com','2026-10-21 12:33:40',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-21 12:33:40'),(32,6,'inkodota11873@gmail.com','2026-10-22 18:37:49',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-22 18:37:49'),(33,6,'inkodota11873@gmail.com','2026-10-22 18:38:14',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-22 18:38:14'),(34,6,'inkodota11873@gmail.com','2026-10-22 18:47:44',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-22 18:47:44'),(35,12,'inkodota11@gmail.com','2026-10-22 18:54:01',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-22 18:54:01'),(36,6,'inkodota11873@gmail.com','2026-10-23 10:08:21',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','FAILED','Mật khẩu không đúng','2026-10-23 10:08:21'),(37,6,'inkodota11873@gmail.com','2026-10-23 10:08:22',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','FAILED','Mật khẩu không đúng','2026-10-23 10:08:22'),(38,6,'inkodota11873@gmail.com','2026-10-23 10:08:26',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-23 10:08:26'),(39,NULL,'admin@sales.ai','2026-10-23 10:19:40',NULL,'::1','Python-urllib/3.13','FAILED','Email không tồn tại','2026-10-23 10:19:40'),(40,1,'admin@salesai.com','2026-10-23 10:21:00',NULL,'::1','Python-urllib/3.13','FAILED','Mật khẩu không đúng','2026-10-23 10:21:00'),(41,1,'admin@salesai.com','2026-10-23 10:23:19',NULL,'::1','Python-urllib/3.13','SUCCESS',NULL,'2026-10-23 10:23:19'),(42,1,'admin@salesai.com','2026-10-23 10:23:27',NULL,'::1','Python-urllib/3.13','SUCCESS',NULL,'2026-10-23 10:23:27'),(43,6,'inkodota11873@gmail.com','2026-10-23 10:24:25',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-23 10:24:25'),(44,6,'inkodota11873@gmail.com','2026-10-23 11:18:12',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','SUCCESS',NULL,'2026-10-23 11:18:12');
/*!40000 ALTER TABLE `lich_su_dang_nhap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_su_gio_hang`
--

DROP TABLE IF EXISTS `lich_su_gio_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_gio_hang` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int NOT NULL,
  `ma_gio_hang` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `ten_san_pham` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tên sản phẩm tại thời điểm hành động',
  `loai_hanh_dong` enum('ADD_TO_CART','UPDATE_QUANTITY','REMOVE_FROM_CART','CLEAR_CART') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_luong` int DEFAULT '0' COMMENT 'Số lượng sau hành động',
  `so_luong_cu` int DEFAULT '0' COMMENT 'Số lượng trước hành động',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_cart_history_user` (`ma_nguoi_dung`),
  KEY `idx_cart_history_time` (`ngay_tao`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử thao tác giỏ hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_su_gio_hang`
--

LOCK TABLES `lich_su_gio_hang` WRITE;
/*!40000 ALTER TABLE `lich_su_gio_hang` DISABLE KEYS */;
INSERT INTO `lich_su_gio_hang` VALUES (1,8,5,1,'iPhone 15 Pro Max 256GB','ADD_TO_CART',1,0,'2026-10-11 06:49:28'),(11,6,4,20,'Google Pixel 9 128GB','ADD_TO_CART',1,0,'2026-10-20 04:26:40'),(12,12,9,26,'iPad Air M2 11 inch 128GB','ADD_TO_CART',1,0,'2026-10-20 04:38:35'),(13,12,9,101,'Ốp iPhone 16 Pro Silicone','ADD_TO_CART',1,0,'2026-10-21 10:34:29');
/*!40000 ALTER TABLE `lich_su_gio_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_su_trang_thai_don_hang`
--

DROP TABLE IF EXISTS `lich_su_trang_thai_don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_trang_thai_don_hang` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` int NOT NULL,
  `trang_thai` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Trạng thái mới',
  `thay_doi_boi` int DEFAULT NULL COMMENT 'ID người thay đổi (admin/staff)',
  `ghi_chu` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_order_status_history_order` (`ma_don_hang`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử thay đổi trạng thái đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_su_trang_thai_don_hang`
--

LOCK TABLES `lich_su_trang_thai_don_hang` WRITE;
/*!40000 ALTER TABLE `lich_su_trang_thai_don_hang` DISABLE KEYS */;
INSERT INTO `lich_su_trang_thai_don_hang` VALUES (1,7,'pending',8,'Đơn hàng được tạo','2026-10-11 06:49:38'),(8,11,'pending',12,'Đơn hàng được tạo','2026-10-20 04:38:51'),(9,12,'pending',12,'Đơn hàng được tạo','2026-10-21 10:34:35');
/*!40000 ALTER TABLE `lich_su_trang_thai_don_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ma_giam_gia`
--

DROP TABLE IF EXISTS `ma_giam_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ma_giam_gia` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai` enum('percentage','fixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percentage',
  `gia_tri` decimal(10,2) NOT NULL COMMENT '% hoặc số tiền cố định',
  `gia_tri_don_hang_toi_thieu` decimal(15,2) NOT NULL DEFAULT '0.00',
  `muc_giam_toi_da` decimal(15,2) DEFAULT NULL COMMENT 'Giảm tối đa (NULL = không giới hạn)',
  `gioi_han_su_dung` int DEFAULT NULL COMMENT 'NULL = không giới hạn số lần',
  `so_lan_da_dung` int NOT NULL DEFAULT '0',
  `ngay_bat_dau` datetime NOT NULL,
  `ngay_ket_thuc` datetime NOT NULL,
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `tao_boi` int NOT NULL COMMENT 'Admin tạo coupon',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_coupons_code` (`ma`),
  KEY `fk_coupons_admin` (`tao_boi`),
  KEY `idx_coupons_code` (`ma`),
  KEY `idx_coupons_active` (`dang_hoat_dong`),
  KEY `idx_coupons_dates` (`ngay_bat_dau`,`ngay_ket_thuc`),
  CONSTRAINT `fk_coupons_admin` FOREIGN KEY (`tao_boi`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mã giảm giá / voucher';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ma_giam_gia`
--

LOCK TABLES `ma_giam_gia` WRITE;
/*!40000 ALTER TABLE `ma_giam_gia` DISABLE KEYS */;
INSERT INTO `ma_giam_gia` VALUES (1,'WELCOME10','Chào mừng thành viên mới - Giảm 10%','percentage',10.00,500000.00,500000.00,1000,0,'2026-01-01 00:00:00','2026-12-31 23:59:59',1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(2,'SALE20','Flash Sale - Giảm 20%','percentage',20.00,2000000.00,2000000.00,500,0,'2026-09-01 00:00:00','2026-09-30 23:59:59',1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(3,'FREESHIP','Miễn phí vận chuyển','fixed',50000.00,200000.00,NULL,2000,0,'2026-01-01 00:00:00','2026-12-31 23:59:59',1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(4,'TECH500K','Giảm 500.000đ cho đơn từ 5 triệu','fixed',500000.00,5000000.00,NULL,200,0,'2026-09-01 00:00:00','2026-09-30 23:59:59',1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(5,'LOYAL2M','Khách hàng thân thiết - Giảm 2 triệu','fixed',2000000.00,20000000.00,NULL,50,0,'2026-01-01 00:00:00','2026-12-31 23:59:59',1,1,'2026-09-10 18:52:36','2026-09-10 18:52:36');
/*!40000 ALTER TABLE `ma_giam_gia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nguoi_dung` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `dia_chi_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau_ma_hoa` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ho_ten` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duong_dan_anh_dai_dien` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vai_tro` enum('customer','admin','staff') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `email_da_xac_minh` tinyint(1) NOT NULL DEFAULT '0',
  `ma_lam_moi` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dang_nhap_cuoi_luc` datetime DEFAULT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_users_email` (`dia_chi_email`),
  KEY `idx_users_role` (`vai_tro`),
  KEY `idx_users_is_active` (`dang_hoat_dong`),
  KEY `idx_users_created_at` (`ngay_tao`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản người dùng (Customer, Admin, Staff)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nguoi_dung`
--

LOCK TABLES `nguoi_dung` WRITE;
/*!40000 ALTER TABLE `nguoi_dung` DISABLE KEYS */;
INSERT INTO `nguoi_dung` VALUES (1,'admin@salesai.com','$2a$12$yPwrLsVjzAEI3Eh4MG1XY..fVy/fiyrHdv6kwDVDgu.Q8NjKRKf5q','Super Admin','0901234567',NULL,'admin',1,1,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5Ac2FsZXNhaS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTI3NTEwMDcsImV4cCI6MTc5NTM0MzAwN30.hM80QmjPbt_WG178gm1Bz8BMl-3iB4L4ff5MIrSdQMM','2026-10-23 17:23:27','2026-09-10 18:52:36','2026-10-23 17:23:27'),(2,'staff@salesai.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFp8.VFlhczLalvqhS','Nhân viên Trần Thị B','0912345678',NULL,'staff',1,1,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(3,'nguyen.van.a@gmail.com','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC21It6Hxe4EziXUdKiG','Nguyễn Văn A','0987654321',NULL,'customer',1,1,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(4,'tran.thi.c@gmail.com','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC21It6Hxe4EziXUdKiG','Trần Thị C','0976543210',NULL,'customer',1,1,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(5,'le.van.d@gmail.com','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC21It6Hxe4EziXUdKiG','Lê Văn D','0965432109',NULL,'customer',1,0,NULL,NULL,'2026-09-10 18:52:36','2026-09-10 18:52:36'),(6,'inkodota11873@gmail.com','$2a$12$P67jvZTsm5qUr58I8witEe4v86TluRdZr9iedKCXZMqwI50a7duXe','Nguyen Thanh','0777498884',NULL,'admin',1,0,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImVtYWlsIjoiaW5rb2RvdGExMTg3M0BnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTI3NTQyOTIsImV4cCI6MTc5NTM0NjI5Mn0.p9UZZF3FTSLds95Qpg-KpWaCfIl-FQW443xlzp2Gr2o','2026-10-23 18:18:12','2026-09-11 18:58:37','2026-10-23 18:18:12'),(8,'inkodota1187@gmail.com','$2a$12$dZ7LDIX4nvPuutb5qf/GTe3Z1lPTusYLp5gHe/11TPh3BOt2iPj0K','Nguyen Thanh','0777498884',NULL,'admin',1,0,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsImVtYWlsIjoiaW5rb2RvdGExMTg3QGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc5MjQ3MDg1OCwiZXhwIjoxNzk1MDYyODU4fQ.yAcCDI7-TU6HadEdFPNjaTzFgVL4ZORm-ze7mfROySk','2026-10-20 11:34:18','2026-10-11 13:48:30','2026-10-20 11:34:18'),(12,'inkodota11@gmail.com','$2a$12$mOMlzamxcbKxMC8/eAsfVu.PUmT7Zv5i/XPmCxmtZY2TS2aHfyH1G','ABC','0984724871',NULL,'customer',1,0,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyLCJlbWFpbCI6Imlua29kb3RhMTFAZ21haWwuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzkyNjk1MjQxLCJleHAiOjE3OTUyODcyNDF9.7rHjJ-_B3bpWdXFuQIaNGwk-Ok3SUhzsCbQpkiXkxJU','2026-10-23 01:54:01','2026-10-20 11:38:13','2026-10-23 01:54:01'),(13,'customer1_test@salesai.com','$2a$12$EV5V97eH1XiQYU8TVyyMUugMnkf48IKW0nF2DhxM9VkdjKo3ksNZO','Khách Hàng Test 1','0901234567',NULL,'customer',1,0,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJlbWFpbCI6ImN1c3RvbWVyMV90ZXN0QHNhbGVzYWkuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzkyNTc4NTI3LCJleHAiOjE3OTUxNzA1Mjd9.E4RRZBPuCpzlcDmNkPfw_jUxpsM4noi6-ohKd7oYr1k','2026-10-21 17:28:47','2026-10-21 17:28:47','2026-10-21 17:28:47'),(14,'customer2_test@salesai.com','$2a$12$t8eufU/DGPt52z7fE7iy9uRYzcMNwYAbMo75O5aykOkpB937NXTAC','Khách Hàng Test 2','0901234568',NULL,'customer',1,0,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE0LCJlbWFpbCI6ImN1c3RvbWVyMl90ZXN0QHNhbGVzYWkuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzkyNTc4NTQxLCJleHAiOjE3OTUxNzA1NDF9.D1sFNN0UJvlOdwJKcphwQFNzs3ZiaaIQ7OgLVwvImT8','2026-10-21 17:29:01','2026-10-21 17:29:01','2026-10-21 17:29:01');
/*!40000 ALTER TABLE `nguoi_dung` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhat_ky_hoat_dong_nguoi_dung`
--

DROP TABLE IF EXISTS `nhat_ky_hoat_dong_nguoi_dung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhat_ky_hoat_dong_nguoi_dung` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int NOT NULL,
  `loai_hanh_dong` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Loại hành động',
  `mo_ta` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mô tả chi tiết',
  `loai_doi_tuong` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Loại đối tượng (product, order, cart...)',
  `ma_doi_tuong` int DEFAULT NULL COMMENT 'ID đối tượng liên quan',
  `dia_chi_ip` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trinh_duyet_thiet_bi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_activity_user` (`ma_nguoi_dung`),
  KEY `idx_activity_action` (`loai_hanh_dong`),
  KEY `idx_activity_time` (`ngay_tao`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử hoạt động tổng hợp của người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhat_ky_hoat_dong_nguoi_dung`
--

LOCK TABLES `nhat_ky_hoat_dong_nguoi_dung` WRITE;
/*!40000 ALTER TABLE `nhat_ky_hoat_dong_nguoi_dung` DISABLE KEYS */;
INSERT INTO `nhat_ky_hoat_dong_nguoi_dung` VALUES (1,1,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','axios/1.20.0','2026-10-11 06:41:39'),(2,8,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-11 06:48:43'),(3,8,'ADD_TO_CART','Thêm \"iPhone 15 Pro Max 256GB\" vào giỏ hàng (x1)','product',1,NULL,NULL,'2026-10-11 06:49:28'),(4,8,'CREATE_ORDER','Đặt đơn hàng #ORD-20261011-9717','order',7,NULL,NULL,'2026-10-11 06:49:38'),(29,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-20 04:23:17'),(30,6,'ADD_TO_CART','Thêm \"Google Pixel 9 128GB\" vào giỏ hàng (x1)','product',20,NULL,NULL,'2026-10-20 04:26:40'),(31,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-20 04:26:56'),(32,8,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-20 04:27:07'),(33,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-10-20 04:34:09'),(34,8,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-10-20 04:34:18'),(35,12,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-10-20 04:38:31'),(36,12,'ADD_TO_CART','Thêm \"iPad Air M2 11 inch 128GB\" vào giỏ hàng (x1)','product',26,NULL,NULL,'2026-10-20 04:38:35'),(37,12,'CREATE_ORDER','Đặt đơn hàng #ORD-20261020-4961','order',11,NULL,NULL,'2026-10-20 04:38:51'),(38,1,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','axios/1.20.0','2026-10-21 10:17:56'),(39,13,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','axios/1.20.0','2026-10-21 10:28:47'),(40,13,'CHAT_PRODUCT_QUERY','Hỏi Chatbot: Tôi cần laptop khoảng 20 triệu để lập trình','chat_sessions',9,'::1','axios/1.20.0','2026-10-21 10:28:47'),(41,13,'CHAT_PRODUCT_QUERY','Hỏi Chatbot: Tôi muốn máy khác','chat_sessions',9,'::1','axios/1.20.0','2026-10-21 10:28:54'),(42,14,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','axios/1.20.0','2026-10-21 10:29:01'),(43,1,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','axios/1.20.0','2026-10-21 10:29:02'),(44,12,'CHAT_PRODUCT_QUERY','Hỏi Chatbot: Tôi muốn tìm một cái ốp cho điện thoại','chat_sessions',10,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-10-21 10:32:19'),(45,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-21 10:32:38'),(46,12,'CHAT_PRODUCT_QUERY','Hỏi Chatbot: ốp lưng & bao da','chat_sessions',10,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-10-21 10:33:54'),(47,12,'ADD_TO_CART','Thêm \"Ốp iPhone 16 Pro Silicone\" vào giỏ hàng (x1)','product',101,NULL,NULL,'2026-10-21 10:34:29'),(48,12,'CREATE_ORDER','Đặt đơn hàng #ORD-20261021-3337','order',12,NULL,NULL,'2026-10-21 10:34:35'),(49,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-21 12:33:40'),(50,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-22 18:37:49'),(51,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-22 18:38:14'),(52,6,'CHAT_PRODUCT_QUERY','Hỏi Chatbot: Tôi rất thích thương hiệu Samsung, khoảng 8 triệu và ưu tiên pin trâu','chat_sessions',5,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-22 18:38:31'),(53,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-22 18:47:44'),(54,6,'CHAT_PRODUCT_QUERY','Hỏi Chatbot: có mẫu điện thoại nào mới không ?','chat_sessions',14,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-22 18:48:02'),(55,12,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-10-22 18:54:01'),(56,12,'CHAT_PRODUCT_QUERY','Hỏi Chatbot: Có mẫu điện thoại nào mới không','chat_sessions',15,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','2026-10-22 18:54:17'),(57,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-23 10:08:26'),(58,1,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Python-urllib/3.13','2026-10-23 10:23:19'),(59,1,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Python-urllib/3.13','2026-10-23 10:23:27'),(60,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-23 10:24:25'),(61,6,'LOGIN','Đăng nhập tài khoản',NULL,NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','2026-10-23 11:18:12');
/*!40000 ALTER TABLE `nhat_ky_hoat_dong_nguoi_dung` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhat_ky_kho`
--

DROP TABLE IF EXISTS `nhat_ky_kho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhat_ky_kho` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int NOT NULL,
  `ma_bien_the` int DEFAULT NULL,
  `loai_thay_doi` enum('import','export','adjustment','return') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `thay_doi_so_luong` int NOT NULL COMMENT '(+) nhập, (-) xuất',
  `so_luong_truoc` int NOT NULL,
  `so_luong_sau` int NOT NULL,
  `ly_do` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_tham_chieu` int DEFAULT NULL COMMENT 'order_id hoặc ID phiếu nhập',
  `ma_quan_tri` int NOT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `fk_inv_variant` (`ma_bien_the`),
  KEY `fk_inv_admin` (`ma_quan_tri`),
  KEY `idx_inv_product` (`ma_san_pham`),
  KEY `idx_inv_type` (`loai_thay_doi`),
  KEY `idx_inv_date` (`ngay_tao`),
  CONSTRAINT `fk_inv_admin` FOREIGN KEY (`ma_quan_tri`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_inv_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_inv_variant` FOREIGN KEY (`ma_bien_the`) REFERENCES `bien_the_san_pham` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch sử nhập/xuất kho';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhat_ky_kho`
--

LOCK TABLES `nhat_ky_kho` WRITE;
/*!40000 ALTER TABLE `nhat_ky_kho` DISABLE KEYS */;
/*!40000 ALTER TABLE `nhat_ky_kho` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phien_tro_chuyen`
--

DROP TABLE IF EXISTS `phien_tro_chuyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phien_tro_chuyen` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_phien_uuid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID định danh session',
  `ma_nguoi_dung` int DEFAULT NULL COMMENT 'NULL = khách vãng lai',
  `tieu_de` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tiêu đề phiên chat',
  `trang_thai` enum('active','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `tong_tin_nhan` int NOT NULL DEFAULT '0',
  `bat_dau_luc` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tin_nhan_cuoi_luc` datetime DEFAULT NULL,
  `dong_luc` datetime DEFAULT NULL,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_chat_sessions_uuid` (`ma_phien_uuid`),
  KEY `idx_chat_sessions_user` (`ma_nguoi_dung`),
  KEY `idx_chat_sessions_status` (`trang_thai`),
  KEY `idx_chat_sessions_last` (`tin_nhan_cuoi_luc`),
  CONSTRAINT `fk_chat_sessions_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phien_tro_chuyen`
--

LOCK TABLES `phien_tro_chuyen` WRITE;
/*!40000 ALTER TABLE `phien_tro_chuyen` DISABLE KEYS */;
INSERT INTO `phien_tro_chuyen` VALUES (1,'f292f52c-c9a8-45ba-811d-accf099a15da',6,'Laptop lập trình dưới 20 triệu','active',44,'2026-09-13 10:31:45','2026-10-04 09:10:22',NULL),(2,'836de76d-5ceb-47d1-b83b-7fbedbddc488',NULL,'test','active',2,'2026-10-04 08:36:20','2026-10-04 08:36:55',NULL),(6,'dc22e521-398f-40ec-836b-2cc40bd0f8b1',NULL,'Tư vấn giúp tôi tai nghe bluetooth chống ồn','active',2,'2026-10-20 11:15:00','2026-10-20 11:15:50',NULL),(7,'165ec9d2-f12a-4ab1-9204-777d569ec10b',NULL,'Tư vấn giúp tôi tai nghe bluetooth','active',2,'2026-10-20 11:21:10','2026-10-20 11:21:14',NULL),(8,'076a2406-a82a-42ae-8940-7c44603bd74f',6,'Mình cần tìm ốp iphone','active',6,'2026-10-20 11:24:01','2026-10-20 11:26:26',NULL),(9,'9b2848a0-0e79-482a-82f5-6136e8d3c9ec',12,'Laptop lập trình dưới 20 triệu','active',2,'2026-10-20 11:39:44','2026-10-20 11:39:47',NULL);
/*!40000 ALTER TABLE `phien_tro_chuyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `san_pham`
--

DROP TABLE IF EXISTS `san_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `san_pham` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_danh_muc` int NOT NULL,
  `ten` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duong_dan` varchar(350) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã sản phẩm nội bộ',
  `thuong_hieu` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta_ngan` varchar(600) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `thong_so` json DEFAULT NULL COMMENT 'Thông số kỹ thuật dạng JSON',
  `the` json DEFAULT NULL COMMENT 'Mảng tags dạng JSON',
  `gia_goc` decimal(15,2) NOT NULL,
  `gia_ban` decimal(15,2) DEFAULT NULL COMMENT 'Giá sau khi giảm, NULL nếu không giảm',
  `so_luong_ton` int NOT NULL DEFAULT '0',
  `duong_dan_anh_dai_dien` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `diem_danh_gia_trung_binh` decimal(3,2) NOT NULL DEFAULT '0.00',
  `tong_danh_gia` int NOT NULL DEFAULT '0',
  `tong_da_ban` int NOT NULL DEFAULT '0',
  `dang_hoat_dong` tinyint(1) NOT NULL DEFAULT '1',
  `noi_bat` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phan_tram_giam` int DEFAULT '0',
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_products_slug` (`duong_dan`),
  UNIQUE KEY `uq_products_sku` (`ma_sku`),
  KEY `idx_products_category` (`ma_danh_muc`),
  KEY `idx_products_brand` (`thuong_hieu`),
  KEY `idx_products_price` (`gia_goc`),
  KEY `idx_products_sale_price` (`gia_ban`),
  KEY `idx_products_is_active` (`dang_hoat_dong`),
  KEY `idx_products_is_featured` (`noi_bat`),
  KEY `idx_products_avg_rating` (`diem_danh_gia_trung_binh`),
  KEY `idx_products_total_sold` (`tong_da_ban`),
  FULLTEXT KEY `ft_products_search` (`ten`,`mo_ta_ngan`,`thuong_hieu`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`ma_danh_muc`) REFERENCES `danh_muc` (`ma_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông tin sản phẩm chính';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `san_pham`
--

LOCK TABLES `san_pham` WRITE;
/*!40000 ALTER TABLE `san_pham` DISABLE KEYS */;
INSERT INTO `san_pham` VALUES (1,6,'123','123','SP001','Samsung','abc',NULL,NULL,NULL,2000000.00,1600000.00,10,'https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/xiaomi_poco_c81_pro_xanh_5_693aad518b.png',0.00,0,0,0,1,'2026-10-23 17:29:41','2026-10-23 18:12:38',0),(2,6,'iPhone 16 Pro Max 256GB','iphone-16-pro-max-256gb','SP0001','Apple','Sản phẩm iPhone 16 Pro Max 256GB chính hãng từ Apple, bảo hành chính hãng 12 tháng tại hệ thống Thế Giới Di Động. Đầy đủ phụ kiện theo máy.\n',NULL,NULL,NULL,34990000.00,31990000.00,21,'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329149/iphone-16-pro-max-titan-den-5-638638962043284415.jpg',0.00,0,0,1,1,'2026-10-23 18:00:34','2026-10-23 18:12:38',0),(3,6,'iPhone 16 128GB','iphone-16-128gb','SP0002','Apple','Sản phẩm iPhone 16 128GB chính hãng từ Apple, bảo hành chính hãng 12 tháng tại hệ thống Thế Giới Di Động. Đầy đủ phụ kiện theo máy.\n',NULL,NULL,NULL,22990000.00,20990000.00,29,'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329135/iphone-16-trang-5-638639086220790169.jpg',0.00,0,0,1,1,'2026-10-23 18:01:23','2026-10-23 18:12:38',0),(4,6,'iPhone 15 128GB','iphone-15-128gb','SP0003','Apple','Sản phẩm iPhone 15 128GB chính hãng từ Apple, bảo hành chính hãng 12 tháng tại hệ thống Thế Giới Di Động. Đầy đủ phụ kiện theo máy.\n',NULL,NULL,NULL,19990000.00,18490000.00,36,'https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/281570/iphone-15-xanh-duong-6-639175422960356712.jpg',0.00,0,0,1,0,'2026-10-23 18:02:01','2026-10-23 18:12:38',0);
/*!40000 ALTER TABLE `san_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `san_pham_tuong_tu`
--

DROP TABLE IF EXISTS `san_pham_tuong_tu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `san_pham_tuong_tu` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham_a` int NOT NULL,
  `ma_san_pham_b` int NOT NULL,
  `diem_tuong_dong` decimal(6,4) NOT NULL COMMENT 'Điểm tương đồng 0-1',
  `phuong_phap` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cosine' COMMENT 'cosine, jaccard...',
  `ngay_cap_nhat` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_similarities_pair` (`ma_san_pham_a`,`ma_san_pham_b`,`phuong_phap`),
  KEY `idx_sim_product_a` (`ma_san_pham_a`),
  KEY `idx_sim_product_b` (`ma_san_pham_b`),
  KEY `idx_sim_score` (`diem_tuong_dong` DESC),
  CONSTRAINT `fk_sim_product_a` FOREIGN KEY (`ma_san_pham_a`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sim_product_b` FOREIGN KEY (`ma_san_pham_b`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ma trận độ tương đồng giữa các sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `san_pham_tuong_tu`
--

LOCK TABLES `san_pham_tuong_tu` WRITE;
/*!40000 ALTER TABLE `san_pham_tuong_tu` DISABLE KEYS */;
/*!40000 ALTER TABLE `san_pham_tuong_tu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tin_nhan_tro_chuyen`
--

DROP TABLE IF EXISTS `tin_nhan_tro_chuyen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tin_nhan_tro_chuyen` (
  `ma_id` bigint NOT NULL AUTO_INCREMENT,
  `ma_phien` int NOT NULL,
  `vai_tro` enum('user','assistant','system') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `noi_dung` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_token_da_dung` int DEFAULT NULL COMMENT 'Số token OpenAI đã sử dụng',
  `mo_hinh_su_dung` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ví dụ: gpt-4o-mini',
  `san_pham_duoc_goi_y` json DEFAULT NULL COMMENT 'Mảng product_id AI gợi ý',
  `muc_dich` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'product_inquiry, budget_search, comparison...',
  `co_loi` tinyint(1) NOT NULL DEFAULT '0',
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  KEY `idx_chat_messages_session` (`ma_phien`),
  KEY `idx_chat_messages_role` (`vai_tro`),
  KEY `idx_chat_messages_created` (`ngay_tao`),
  CONSTRAINT `fk_chat_messages_session` FOREIGN KEY (`ma_phien`) REFERENCES `phien_tro_chuyen` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tin_nhan_tro_chuyen`
--

LOCK TABLES `tin_nhan_tro_chuyen` WRITE;
/*!40000 ALTER TABLE `tin_nhan_tro_chuyen` DISABLE KEYS */;
INSERT INTO `tin_nhan_tro_chuyen` VALUES (1,1,'user','Laptop lập trình dưới 20 triệu',NULL,NULL,NULL,NULL,0,'2026-09-13 10:31:45'),(2,1,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi: Vượt giới hạn API — vui lòng thử lại sau vài giây)*',NULL,'gpt-4o-mini',NULL,'budget_search',1,'2026-09-13 10:31:50'),(3,1,'user','tai nghe',NULL,NULL,NULL,NULL,0,'2026-09-13 10:32:22'),(4,1,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi: Vượt giới hạn API — vui lòng thử lại sau vài giây)*',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-13 10:32:25'),(5,1,'user','Laptop lập trình dưới 20 triệu',NULL,NULL,NULL,NULL,0,'2026-09-13 10:36:01'),(6,1,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 404 - [{\'error\': {\'code\': 404, \'message\': \'models/gemini-1.5-flash is not found for API )*',NULL,'gpt-4o-mini',NULL,'budget_search',1,'2026-09-13 10:36:02'),(7,1,'user','Tai nghe chống ồn tốt nhất',NULL,NULL,NULL,NULL,0,'2026-09-13 10:37:49'),(8,1,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 404 - [{\'error\': {\'code\': 404, \'message\': \'models/gemini-1.5-flash is not found for API )*',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-13 10:37:50'),(9,1,'user','Tai nghe chống ồn tốt nhất',NULL,NULL,NULL,NULL,0,'2026-09-13 10:39:47'),(10,1,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 404 - [{\'error\': {\'code\': 404, \'message\': \'models/gemini-1.5-flash is not found for API )*',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-13 10:39:48'),(11,1,'user','Tai nghe chống ồn tốt nhất',NULL,NULL,NULL,NULL,0,'2026-09-13 10:40:17'),(12,1,'assistant','Chào bạn! Dựa trên tin nhắn của bạn, tôi hiểu rằng bạn đang quan tâm đến hai nhóm sản phẩm: **Laptop phục vụ nhu cầu lập trình (ngân sách dưới 2',1324,'gpt-4o-mini',NULL,'general',0,'2026-09-13 10:40:22'),(13,1,'user','Bạn đang tìm kiếm sản phẩm gì hôm nay?',NULL,NULL,NULL,NULL,0,'2026-09-13 10:40:32'),(14,1,'assistant','Dạ xin chào bạn! \n\nRất tiếc hiện tại **hệ thống kho hàng đang gặp gián đoạn tạm thời nên chưa thể tải được danh sách sản phẩm cụ thể** để giới thiệu chính xác mẫu máy và giá bán theo thời gian thực tới bạn.\n\nTuy nhiên, để giúp bạn có định hướng chọn mua chuẩn xác nhất, tôi xin chia sẻ một số tiêu chuẩn tối ưu cho nhu cầu của bạn:\n\n---\n\n### 1. Tiêu chí chọn Laptop lập trình (Ngân sách dưới 20 triệu)\n* **CPU:** Ưu tiên **Intel Core i5 (Gen 12 trở lên)** hoặc **AMD Ryzen 5 (dòng 5000/6000/7000 series)** để xử lý mã nguồn và biên dịch mượt mà.\n* **RAM:** Tối thiểu **16GB RAM** (hoặc 8GB có sẵn khe nâng cấp) để mở nhiều tab trình duyệt, chạy Docker, máy ảo hay các IDE nặng như Android Studio/VS Code.\n* **Ổ cứng:** Tối thiểu **512GB SSD NVMe** để tốc độ đọc/ghi dữ liệu nhanh chóng.\n* **Màn hình & Bàn phím:** Màn hình từ 14 - 15.6 inch Full HD IPS chống chói (Anti-glare); bàn phím có hành trình phím tốt, gõ êm tay.\n\n### 2. Tiêu chí chọn Tai nghe chống ồn (ANC)\n* **Chống ồn chủ động (ANC):** Khử tạp âm môi trường văn phòng hoặc quán cà phê tốt để giữ tập trung tối đa.\n* **Kiểu dáng:** \n  * *Chụp tai (Over-ear):* Cách âm thụ động tốt nhất, đeo êm, pin trâu (30–40 tiếng).\n  * *Nhét tai (In-ear/TWS):* Gọn nhẹ, tiện bỏ túi di chuyển.\n* **Micro:** Có tính năng lọc gió và tạp âm để họp online/call video rõ ràng.\n\n---\n\n**Gợi ý bước tiếp theo để tôi có thể hỗ trợ bạn tốt hơn:**\n1. *Bạn chủ yếu lập trình mảng nào (Web, Mobile, AI/Data hay Game) và có cần laptop mỏng nhẹ thường xuyên di chuyển không?*\n2. *Với tai nghe chống ồn, bạn thích dạng chụp tai (Over-ear) hay nhét tai không dây (In-ear)?*\n3. *Bạn có ưu tiên thương hiệu cụ thể nào không (ví dụ: Asus, Lenovo, Dell, HP hoặc Sony, Apple, Bose)?*',2042,'gpt-4o-mini',NULL,'recommendation',0,'2026-09-13 10:40:45'),(15,1,'user','Tai nghe chống ồn tốt nhất',NULL,NULL,NULL,NULL,0,'2026-09-18 22:35:15'),(16,1,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-18 22:35:15'),(17,1,'user','Tai nghe chống ồn tốt nhất',NULL,NULL,NULL,NULL,0,'2026-09-18 22:36:53'),(18,1,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-18 22:37:28'),(19,1,'user','Thử lại',NULL,NULL,NULL,NULL,0,'2026-09-18 22:37:46'),(20,1,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-18 22:38:21'),(21,1,'user','Thử lại',NULL,NULL,NULL,NULL,0,'2026-09-18 22:46:46'),(22,1,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-18 22:47:21'),(23,1,'user','Tai nghe chống ồn tốt nhất',NULL,NULL,NULL,NULL,0,'2026-09-18 22:47:34'),(24,1,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-09-18 22:48:09'),(25,1,'user','Laptop lập trình dưới 20 triệu',NULL,NULL,NULL,NULL,0,'2026-10-04 08:34:04'),(26,1,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-10-04 08:34:39'),(27,2,'user','test',NULL,NULL,NULL,NULL,0,'2026-10-04 08:36:20'),(28,2,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! ?\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-10-04 08:36:55'),(29,1,'user','Laptop lập trình dưới 20 triệu',NULL,NULL,NULL,NULL,0,'2026-10-04 08:38:39'),(30,1,'assistant','Dạ xin chào bạn! \n\nRất tiếc vì sự bất tiện này. Hiện tại **hệ thống dữ liệu kho hàng đang gặp lỗi kết nối (\"Không thể tải danh sách sản phẩm lúc này\")**, do đó tôi chưa thể truy xuất và hiển thị danh sách các model cụ thể cùng giá bán thực tế đang có sẵn tại cửa hàng để tư vấn chi tiết cho bạn ngay lúc này.\n\nĐể tránh đưa ra thông tin không chính xác hoặc giới thiệu sản phẩm đã hết hàng, tôi xin phép không tự ý đưa ra các mã sản phẩm cụ thể. \n\nTuy nhiên, để chuẩn bị tốt nhất ngay khi hệ thống kho hoạt động trở lại, bạn có thể tham khảo nhanh các tiêu chí cốt lõi cho hai nhu cầu của bạn:\n\n---\n\n### 1. Laptop',2005,'gpt-4o-mini',NULL,'budget_search',0,'2026-10-04 08:38:52'),(31,1,'user','Laptop từ 32 triệu đến 35 triệu',NULL,NULL,NULL,NULL,0,'2026-10-04 08:39:22'),(32,1,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi API: Error code: 503 - [{\'error\': {\'code\': 503, \'message\': \'This model is currently experiencing high dem)*',NULL,'gpt-4o-mini',NULL,'budget_search',1,'2026-10-04 08:39:40'),(33,1,'user','Laptop từ 32 triệu đến 35 triệu',NULL,NULL,NULL,NULL,0,'2026-10-04 08:43:07'),(34,1,'assistant','Dạ xin chào bạn! \n\nRất tiếc vì sự cố này, hiện tại **hệ thống dữ liệu kho hàng đang gặp gián đoạn tạm thời nên chưa thể tải danh sách sản phẩm cụ thể** (\"Không thể tải danh sách sản phẩm lúc này\"). \n\nTheo quy định của cửa hàng, tôi **không được phép tự tạo ra mã sản phẩm** để tránh trường hợp báo sai tình trạng tồn kho, giá bán hoặc chính sách bảo hành thực tế tới bạn.\n\n---\n\nTuy nhiên, trong tầm ngân sách **32 - 35 triệu đồng**, đây là phân khúc cận cao cấp và cao cấp. Khi hệ thống kho phục hồi, bạn hoàn toàn có thể sở hữu những chiếc máy có tiêu chuẩn cấu hình vượt trội như sau:\n\n* **Nếu bạn chọn dòng Mỏng nhẹ / Doanh nhân:**\n  * **Thiết kế & Màn hình:** Vỏ kim loại nguyên khối, trọng lượng ~1.2 - 1.4 kg; Màn hình OLED hoặc IPS độ phân giải từ 2.8K trở lên, chuẩn màu 100% sRGB/DCI-P3 sắc nét.\n  * **Cấu hình:** Chip Intel Core Ultra 7 / Core i7 thế hệ mới hoặc AMD Ryzen 7; RAM 16GB - 32GB; Pin dùng tốt từ 8',2135,'gpt-4o-mini',NULL,'budget_search',0,'2026-10-04 08:43:20'),(35,1,'user','Hệ thống có những loại tai nghe nào ?',NULL,NULL,NULL,NULL,0,'2026-10-04 08:44:05'),(36,1,'assistant','Dạ chào bạn, cửa hàng hiện đang phân phối đầy đủ các dòng tai nghe phổ biến phục vụ cho nhiều mục đích sử dụng khác nhau:\n\n### 1. Tai nghe True Wireless (Không dây hoàn toàn)\n* **Đặc điểm:** Thiết kế nhỏ gọn, kèm hộp sạc bỏ túi tiện lợi, kết nối Bluetooth nhanh chóng.\n* **Tính năng nổi bật:** Nhiều mẫu tích hợp chống ồn chủ động (ANC), xuyên âm (Transparency mode), chống nước khi tập thể thao.\n* **Phù hợp với:** Người hay di chuyển, tập gym/chạy bộ, học sinh - sinh viên và dân văn phòng cần sự linh hoạt.\n\n### 2. Tai nghe Chụp tai (Over-ear / On-ear)\n* **Đặc điểm:** Đệm tai êm ái trùm kín tai, chất lượng âm thanh chi tiết, âm trầm (bass) sâu và thời lượng pin rất dài (thường từ 30 – 60 tiếng).\n* **Tính năng nổi bật:** Khả năng chống ồn chủ động đỉnh cao, cách âm thụ động tốt.\n* **Phù hợp với:** Người yêu âm nhạc chất lượng cao, dân văn phòng cần không gian yên tĩnh tuyệt đối để tập trung, hoặc người hay đi máy bay/tàu xe.\n\n### 3. Tai nghe Gaming (Chuyên game)\n* **Đặc điểm:** Thường là dạng chụp tai có đệm thoáng khí, microphone thu âm to rõ lọc tạp âm, có thể kèm đèn LED RGB.\n* **',1807,'gpt-4o-mini',NULL,'general',0,'2026-10-04 08:44:11'),(37,1,'user','Hệ thống có tai nghe Apple AirPods Pro 3nd Gen không ?',NULL,NULL,NULL,NULL,0,'2026-10-04 08:50:47'),(38,1,'assistant','Dạ xin chào bạn!\n\nRất tiếc, hiện tại hệ thống kho của cửa hàng đang gặp gián đoạn nên **không thể tải danh sách sản phẩm lúc này**, do đó tôi chưa thể kiểm tra chính xác tình trạng tồn kho của sản phẩm **Apple AirPods Pro** để báo cho bạn.\n\nHơn nữa, theo thông tin từ hãng Apple, hiện tại dòng AirPods Pro mới nhất trên thị trường là **AirPods Pro Gen 2** (thế hệ thứ 2), chưa ra mắt phiên bản Gen 3 (3rd Gen).\n\nBạn có muốn tham khảo các dòng tai nghe chống ồn không dây khác đang có sẵn hoặc cần hỗ trợ thêm thông tin gì khác không ạ?',1817,'gpt-4o-mini',NULL,'general',0,'2026-10-04 08:50:53'),(39,1,'user','Hệ thống có những dòng điện thoại nào',NULL,NULL,NULL,NULL,0,'2026-10-04 08:52:37'),(40,1,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. ?\n\nTuy nhiên, tôi có thể giúp bạn:\n- ? Tìm kiếm sản phẩm theo danh mục\n- ? Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.\n\n*(Lỗi: Vượt giới hạn API — vui lòng thử lại sau vài giây)*',NULL,'gpt-4o-mini',NULL,'general',1,'2026-10-04 08:52:51'),(41,1,'user','hệ thống có những dòng điện thoại nào',NULL,NULL,NULL,NULL,0,'2026-10-04 08:56:51'),(42,1,'assistant','Dạ xin chào bạn!\n\nRất tiếc vì sự bất tiện này, hiện tại **hệ thống dữ liệu kho hàng đang gặp sự cố và không thể tải danh sách sản phẩm lúc này**. \n\nDo không thể truy xuất dữ liệu tồn kho thực tế, tôi chưa thể liệt kê cụ thể các dòng điện thoại đang có sẵn tại cửa hàng để tư vấn chi tiết cho bạn. Theo quy định, cửa hàng không tự ý đưa ra thông tin sản phẩm ngoài danh mục để tránh sai lệch thông tin đến khách hàng.\n\nBạn vui lòng đợi trong giây lát rồi kiểm tra lại, hoặc bạn có thể cho tôi biết thêm về tầm giá và nhu cầu sử dụng (chụp ảnh, chơi game, pin trâu,...) để tôi hỗ trợ tư vấn tiêu chí phù hợp trước được không ạ?',2127,'gpt-4o-mini',NULL,'general',0,'2026-10-04 08:57:21'),(43,1,'user','tư vấn các dòng tai nghe',NULL,NULL,NULL,NULL,0,'2026-10-04 09:08:43'),(44,1,'assistant','Dạ xin chào bạn! ?\n\nRất tiếc vì sự cố này, hiện tại hệ thống kho của SalesAI đang gặp gián đoạn nên **không thể tải danh sách sản phẩm lúc này**. Do đó, mình chưa thể kiểm tra và đưa ra danh sách các mẫu tai nghe cụ thể đang sẵn hàng để tư vấn chi tiết cho bạn được.\n\nBạn vui lòng chờ ít phút rồi nhắn lại giúp mình nhé! Hoặc bạn có muốn tham khảo tiêu chí chọn tai nghe theo tầm giá/nhu cầu sử dụng (tập gym, làm việc văn phòng, chơi game...) trước không ạ? ?',2369,'gpt-4o-mini',NULL,'recommendation',0,'2026-10-04 09:08:52'),(45,1,'user','điện thoại',NULL,NULL,NULL,NULL,0,'2026-10-04 09:09:41'),(46,1,'assistant','Dạ xin chào bạn! ?\n\nRất tiếc vì sự bất tiện này, hiện tại hệ thống dữ liệu của SalesAI đang gặp gián đoạn nên **không thể tải danh sách sản phẩm lúc này**. Do đó, mình chưa thể kiểm tra cụ thể các dòng điện thoại đang sẵn hàng trong kho để báo giá và tư vấn chi tiết cho bạn được.\n\nBạn vui lòng đợi một chút rồi kiểm tra lại giúp mình nhé! Trong lúc chờ đợi, bạn đang tìm điện thoại trong tầm ngân sách khoảng bao nhiêu và nhu cầu chính là gì (chụp ảnh, chơi game, dùng tác vụ cơ bản...) để lát nữa mình hỗ trợ bạn nhanh nhất nha? ?',2415,'gpt-4o-mini',NULL,'recommendation',0,'2026-10-04 09:10:22'),(53,6,'user','Tư vấn giúp tôi tai nghe bluetooth chống ồn',NULL,NULL,NULL,NULL,0,'2026-10-20 11:15:00'),(54,6,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-10-20 11:15:50'),(55,7,'user','Tư vấn giúp tôi tai nghe bluetooth',NULL,NULL,NULL,NULL,0,'2026-10-20 11:21:10'),(56,7,'assistant','Dạ chào bạn! Dưới đây là các sản phẩm phù hợp nhất trong kho của SalesAI:\n\n1. [ID:67] **Apple AirPods 4 ANC**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 4,310,000 VND (giảm 4.0% từ 4,490,000) ⭐ ĐANG GIẢM GIÁ 4.0%\n   ⭐ Đánh giá: 4.9/5 (203 đánh giá)\n   📦 Đã bán: 137 | Còn hàng\n   📝 Mô tả: ANC, Adaptive Audio\n\n2. [ID:73] **Anker Soundcore Liberty 4 NC**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 2,390,000 VND (giảm 4.0% từ 2,490,000) ⭐ ĐANG GIẢM GIÁ 4.0%\n   ⭐ Đánh giá: 4.9/5 (115 đánh giá)\n   📦 Đã bán: 55 | Còn hàng\n   📝 Mô tả: Adaptive ANC, LDAC\n\n3. [ID:8] **Sony WH-1000XM5 Chống ồn**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 7,490,000 VND (giảm 12% từ 8,490,000) ⭐ ĐANG GIẢM GIÁ 12%\n   ⭐ Đánh giá: 4.9/5 (203 đánh giá)\n   📦 Đã bán: 156 | Còn hàng\n   📝 Mô tả: ANC hàng đầu, 30 giờ pin, LDAC Hi-Res Audio\n\n4. [ID:66] **Apple AirPods Pro 2 USB-C**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 5,106,000 VND (giảm 7.0% từ 5,490,000) ⭐ ĐANG GIẢM GIÁ 7.0%\n   ⭐ Đánh giá: 4.9/5 (186 đánh giá)\n   📦 Đã bán: 124 | Còn hàng\n   📝 Mô tả: ANC, Spatial Audio\n\n5. [ID:72] **Sennheiser Momentum 4**\n   📂 Danh mục: Tai nghe\n   💰 Giá: 7,896,000 VND (giảm 7.0% từ 8,490,000) ⭐ ĐANG GIẢM GIÁ 7.0%\n   ⭐ Đánh giá: 4.8/5 (98 đánh giá)\n   📦 Đã bán: 42 | Còn hàng\n   📝 Mô tả: Audiophile, pin 60 giờ\n\nBạn có muốn xem chi tiết thông số hoặc so sánh sản phẩm nào ở trên không ạ? 😊',NULL,'gpt-4o-mini','[67, 73, 8, 66, 72]','recommendation',0,'2026-10-20 11:21:14'),(57,8,'user','Mình cần tìm ốp iphone',NULL,NULL,NULL,NULL,0,'2026-10-20 11:24:01'),(58,8,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-10-20 11:24:51'),(59,8,'user','Tìm sản phẩm theo danh mục',NULL,NULL,NULL,NULL,0,'2026-10-20 11:25:23'),(60,8,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. 🔧\n\nTuy nhiên, tôi có thể giúp bạn:\n- 🔍 Tìm kiếm sản phẩm theo danh mục\n- 💰 Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.',NULL,'gpt-4o-mini',NULL,'general',0,'2026-10-20 11:25:25'),(61,8,'user','Tai nghe',NULL,NULL,NULL,NULL,0,'2026-10-20 11:25:36'),(62,8,'assistant','Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau ít phút! 🙏\n\nBạn có thể tìm kiếm sản phẩm trực tiếp hoặc liên hệ nhân viên hỗ trợ.',NULL,'gpt-4o-mini',NULL,'general',1,'2026-10-20 11:26:26'),(63,9,'user','Laptop lập trình dưới 20 triệu',NULL,NULL,NULL,NULL,0,'2026-10-20 11:39:44'),(64,9,'assistant','Xin lỗi, tôi đang gặp sự cố kết nối với hệ thống AI. 🔧\n\nTuy nhiên, tôi có thể giúp bạn:\n- 🔍 Tìm kiếm sản phẩm theo danh mục\n- 💰 Lọc theo ngân sách\n- ⭐ Xem sản phẩm bán chạy nhất\n\nVui lòng thử lại sau ít phút hoặc liên hệ hỗ trợ trực tiếp.',NULL,'gpt-4o-mini',NULL,'budget_search',0,'2026-10-20 11:39:47');
/*!40000 ALTER TABLE `tin_nhan_tro_chuyen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_memories`
--

DROP TABLE IF EXISTS `user_memories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_memories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `memory_type` enum('preference','budget','brand','category','feature','dislike','purchase','behavior') COLLATE utf8mb4_unicode_ci NOT NULL,
  `memory_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `memory_value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `confidence` float NOT NULL DEFAULT '0.5',
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chat_extraction',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_memory_key` (`user_id`,`memory_type`,`memory_key`),
  KEY `idx_user_memories_user` (`user_id`),
  KEY `idx_user_memories_type` (`memory_type`),
  CONSTRAINT `fk_um_user` FOREIGN KEY (`user_id`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_memories`
--

LOCK TABLES `user_memories` WRITE;
/*!40000 ALTER TABLE `user_memories` DISABLE KEYS */;
INSERT INTO `user_memories` VALUES (6,6,'brand','preferred_brand','Samsung',0.7,'chat_extraction','2026-10-23 01:38:31','2026-10-23 01:38:31'),(7,6,'budget','preferred_budget_max','8000000',0.6,'chat_extraction','2026-10-23 01:38:32','2026-10-23 01:38:32'),(8,6,'feature','feature_battery','high',0.65,'chat_extraction','2026-10-23 01:38:32','2026-10-23 01:38:32'),(9,1,'budget','preferred_budget_max','10000000',0.9,'chat_extraction','2026-10-23 01:43:29','2026-10-23 01:43:55'),(10,1,'feature','feature_battery','high',0.95,'chat_extraction','2026-10-23 01:43:29','2026-10-23 01:43:55');
/*!40000 ALTER TABLE `user_memories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_preference_summary`
--

DROP TABLE IF EXISTS `user_preference_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preference_summary` (
  `user_id` int NOT NULL,
  `preferred_categories` json DEFAULT NULL,
  `preferred_brands` json DEFAULT NULL,
  `price_min` decimal(15,2) DEFAULT NULL,
  `price_max` decimal(15,2) DEFAULT NULL,
  `preferred_features` json DEFAULT NULL,
  `disliked_features` json DEFAULT NULL,
  `favorite_products` json DEFAULT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_ups_user` FOREIGN KEY (`user_id`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_preference_summary`
--

LOCK TABLES `user_preference_summary` WRITE;
/*!40000 ALTER TABLE `user_preference_summary` DISABLE KEYS */;
INSERT INTO `user_preference_summary` VALUES (1,'[]','[]',NULL,10000000.00,'{\"battery\": \"high\"}','[]','[]','Ngân sách khoảng 10.000.000 VNĐ | Ưu tiên tính năng: pin trâu','2026-10-23 01:43:56'),(6,'[]','[\"Samsung\"]',NULL,8000000.00,'{\"battery\": \"high\"}','[]','[]','Thương hiệu quan tâm: Samsung | Ngân sách khoảng 8.000.000 VNĐ | Ưu tiên tính năng: pin trâu','2026-10-23 01:38:32');
/*!40000 ALTER TABLE `user_preference_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `users`
--

DROP TABLE IF EXISTS `users`;
/*!50001 DROP VIEW IF EXISTS `users`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `users` AS SELECT 
 1 AS `id`,
 1 AS `email`,
 1 AS `full_name`,
 1 AS `phone`,
 1 AS `avatar_url`,
 1 AS `role`,
 1 AS `is_active`,
 1 AS `created_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_doanh_thu_hang_ngay`
--

DROP TABLE IF EXISTS `v_doanh_thu_hang_ngay`;
/*!50001 DROP VIEW IF EXISTS `v_doanh_thu_hang_ngay`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_doanh_thu_hang_ngay` AS SELECT 
 1 AS `ngay`,
 1 AS `tong_don_hang`,
 1 AS `tong_doanh_thu`,
 1 AS `gia_tri_don_hang_trung_binh`,
 1 AS `tong_tien_giam`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_san_pham_ban_chay`
--

DROP TABLE IF EXISTS `v_san_pham_ban_chay`;
/*!50001 DROP VIEW IF EXISTS `v_san_pham_ban_chay`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_san_pham_ban_chay` AS SELECT 
 1 AS `ma_id`,
 1 AS `ten`,
 1 AS `duong_dan_anh_dai_dien`,
 1 AS `ten_danh_muc`,
 1 AS `gia_goc`,
 1 AS `gia_ban`,
 1 AS `tong_da_ban`,
 1 AS `diem_danh_gia_trung_binh`,
 1 AS `tong_danh_gia`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_thong_ke_san_pham`
--

DROP TABLE IF EXISTS `v_thong_ke_san_pham`;
/*!50001 DROP VIEW IF EXISTS `v_thong_ke_san_pham`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_thong_ke_san_pham` AS SELECT 
 1 AS `ma_id`,
 1 AS `ten`,
 1 AS `ma_sku`,
 1 AS `ten_danh_muc`,
 1 AS `gia_goc`,
 1 AS `gia_ban`,
 1 AS `so_luong_ton`,
 1 AS `diem_danh_gia_trung_binh`,
 1 AS `tong_danh_gia`,
 1 AS `tong_da_ban`,
 1 AS `phan_tram_giam`,
 1 AS `dang_hoat_dong`,
 1 AS `noi_bat`,
 1 AS `ngay_tao`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_ton_kho_thap`
--

DROP TABLE IF EXISTS `v_ton_kho_thap`;
/*!50001 DROP VIEW IF EXISTS `v_ton_kho_thap`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_ton_kho_thap` AS SELECT 
 1 AS `ma_id`,
 1 AS `ten`,
 1 AS `ma_sku`,
 1 AS `ten_danh_muc`,
 1 AS `so_luong_ton`,
 1 AS `nguong`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_tong_hop_don_hang`
--

DROP TABLE IF EXISTS `v_tong_hop_don_hang`;
/*!50001 DROP VIEW IF EXISTS `v_tong_hop_don_hang`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_tong_hop_don_hang` AS SELECT 
 1 AS `ma_id`,
 1 AS `ma_don_hang`,
 1 AS `ten_khach_hang`,
 1 AS `email_khach_hang`,
 1 AS `so_dien_thoai_khach_hang`,
 1 AS `trang_thai`,
 1 AS `tong_tien`,
 1 AS `phuong_thuc_thanh_toan`,
 1 AS `trang_thai_thanh_toan`,
 1 AS `ngay_tao`,
 1 AS `tong_mat_hang`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `yeu_thich`
--

DROP TABLE IF EXISTS `yeu_thich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yeu_thich` (
  `ma_id` int NOT NULL AUTO_INCREMENT,
  `ma_nguoi_dung` int NOT NULL,
  `ma_san_pham` int NOT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_wishlist_user_product` (`ma_nguoi_dung`,`ma_san_pham`),
  KEY `idx_wishlist_user` (`ma_nguoi_dung`),
  KEY `idx_wishlist_product` (`ma_san_pham`),
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`ma_nguoi_dung`) REFERENCES `nguoi_dung` (`ma_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sản phẩm yêu thích của người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yeu_thich`
--

LOCK TABLES `yeu_thich` WRITE;
/*!40000 ALTER TABLE `yeu_thich` DISABLE KEYS */;
/*!40000 ALTER TABLE `yeu_thich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'he_thong_ban_hang_ai'
--

--
-- Dumping routines for database 'he_thong_ban_hang_ai'
--

--
-- Final view structure for view `users`
--

/*!50001 DROP VIEW IF EXISTS `users`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `users` AS select `nguoi_dung`.`ma_id` AS `id`,`nguoi_dung`.`dia_chi_email` AS `email`,`nguoi_dung`.`ho_ten` AS `full_name`,`nguoi_dung`.`so_dien_thoai` AS `phone`,`nguoi_dung`.`duong_dan_anh_dai_dien` AS `avatar_url`,`nguoi_dung`.`vai_tro` AS `role`,`nguoi_dung`.`dang_hoat_dong` AS `is_active`,`nguoi_dung`.`ngay_tao` AS `created_at` from `nguoi_dung` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_doanh_thu_hang_ngay`
--

/*!50001 DROP VIEW IF EXISTS `v_doanh_thu_hang_ngay`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_doanh_thu_hang_ngay` AS select cast(`o`.`ngay_tao` as date) AS `ngay`,count(`o`.`ma_id`) AS `tong_don_hang`,sum(`o`.`tong_tien`) AS `tong_doanh_thu`,avg(`o`.`tong_tien`) AS `gia_tri_don_hang_trung_binh`,sum(`o`.`so_tien_giam`) AS `tong_tien_giam` from `don_hang` `o` where (`o`.`trang_thai_thanh_toan` = 'paid') group by cast(`o`.`ngay_tao` as date) order by `ngay` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_san_pham_ban_chay`
--

/*!50001 DROP VIEW IF EXISTS `v_san_pham_ban_chay`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_san_pham_ban_chay` AS select `p`.`ma_id` AS `ma_id`,`p`.`ten` AS `ten`,`p`.`duong_dan_anh_dai_dien` AS `duong_dan_anh_dai_dien`,`c`.`ten` AS `ten_danh_muc`,`p`.`gia_goc` AS `gia_goc`,`p`.`gia_ban` AS `gia_ban`,`p`.`tong_da_ban` AS `tong_da_ban`,`p`.`diem_danh_gia_trung_binh` AS `diem_danh_gia_trung_binh`,`p`.`tong_danh_gia` AS `tong_danh_gia` from (`san_pham` `p` join `danh_muc` `c` on((`p`.`ma_danh_muc` = `c`.`ma_id`))) where (`p`.`dang_hoat_dong` = 1) order by `p`.`tong_da_ban` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_thong_ke_san_pham`
--

/*!50001 DROP VIEW IF EXISTS `v_thong_ke_san_pham`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_thong_ke_san_pham` AS select `p`.`ma_id` AS `ma_id`,`p`.`ten` AS `ten`,`p`.`ma_sku` AS `ma_sku`,`c`.`ten` AS `ten_danh_muc`,`p`.`gia_goc` AS `gia_goc`,`p`.`gia_ban` AS `gia_ban`,`p`.`so_luong_ton` AS `so_luong_ton`,`p`.`diem_danh_gia_trung_binh` AS `diem_danh_gia_trung_binh`,`p`.`tong_danh_gia` AS `tong_danh_gia`,`p`.`tong_da_ban` AS `tong_da_ban`,(case when (`p`.`gia_ban` is not null) then round((((`p`.`gia_goc` - `p`.`gia_ban`) / `p`.`gia_goc`) * 100),1) else 0 end) AS `phan_tram_giam`,`p`.`dang_hoat_dong` AS `dang_hoat_dong`,`p`.`noi_bat` AS `noi_bat`,`p`.`ngay_tao` AS `ngay_tao` from (`san_pham` `p` join `danh_muc` `c` on((`p`.`ma_danh_muc` = `c`.`ma_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_ton_kho_thap`
--

/*!50001 DROP VIEW IF EXISTS `v_ton_kho_thap`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_ton_kho_thap` AS select `p`.`ma_id` AS `ma_id`,`p`.`ten` AS `ten`,`p`.`ma_sku` AS `ma_sku`,`c`.`ten` AS `ten_danh_muc`,`p`.`so_luong_ton` AS `so_luong_ton`,(select `cai_dat_he_thong`.`gia_tri_cai_dat` from `cai_dat_he_thong` where (`cai_dat_he_thong`.`khoa_cai_dat` = 'low_stock_threshold')) AS `nguong` from (`san_pham` `p` join `danh_muc` `c` on((`p`.`ma_danh_muc` = `c`.`ma_id`))) where ((`p`.`dang_hoat_dong` = 1) and (`p`.`so_luong_ton` <= (select coalesce(`cai_dat_he_thong`.`gia_tri_cai_dat`,'5') from `cai_dat_he_thong` where (`cai_dat_he_thong`.`khoa_cai_dat` = 'low_stock_threshold')))) order by `p`.`so_luong_ton` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_tong_hop_don_hang`
--

/*!50001 DROP VIEW IF EXISTS `v_tong_hop_don_hang`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_tong_hop_don_hang` AS select `o`.`ma_id` AS `ma_id`,`o`.`ma_don_hang` AS `ma_don_hang`,`u`.`ho_ten` AS `ten_khach_hang`,`u`.`dia_chi_email` AS `email_khach_hang`,`u`.`so_dien_thoai` AS `so_dien_thoai_khach_hang`,`o`.`trang_thai` AS `trang_thai`,`o`.`tong_tien` AS `tong_tien`,`o`.`phuong_thuc_thanh_toan` AS `phuong_thuc_thanh_toan`,`o`.`trang_thai_thanh_toan` AS `trang_thai_thanh_toan`,`o`.`ngay_tao` AS `ngay_tao`,count(`oi`.`ma_id`) AS `tong_mat_hang` from ((`don_hang` `o` join `nguoi_dung` `u` on((`o`.`ma_nguoi_dung` = `o`.`ma_nguoi_dung`))) join `chi_tiet_don_hang` `oi` on((`o`.`ma_id` = `oi`.`ma_don_hang`))) group by `o`.`ma_id`,`o`.`ma_don_hang`,`u`.`ho_ten`,`u`.`dia_chi_email`,`u`.`so_dien_thoai`,`o`.`trang_thai`,`o`.`tong_tien`,`o`.`phuong_thuc_thanh_toan`,`o`.`trang_thai_thanh_toan`,`o`.`ngay_tao` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-23 18:22:11
